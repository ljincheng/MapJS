
(function(global) {

  'use strict';

  var extend = geomap.util.object.extend;
  var Point =geomap.Point;
  var Element=geomap.element;

  if (!global.geomap) {
    global.geomap = { };
  }

  if (global.geomap.TileLayer) {
    geomap.warn('geomap.Map is already defined.');
    return;
  }
 
  geomap.TileLayer = geomap.Class(geomap.Layer, {
      url:null,
      _drawLock:1,
      cache:true,
      _canvas_map_size:new Point(0,0),
      _mapSize:null,
      _tiles:{},
      headers:{},
      useReqModel:false,
     initialize: function( options) {
      this.callSuper('initialize',options);
      this.on("initLayer",this.OnInitLayer.bind(this));
      this.on("draw_tile",this.DrawTile.bind(this));
    }, 
    OnInitLayer:function(){
      this.getCanavsSize();
      this._levels = {};
  this._tiles = {};
    },
     getCanavsSize:function(){
      var map=this._map,size=map.getSize();
      if(!this._canvas_copy_size || !this._mapSize || !size.equals(this._mapSize)){
        this._mapSize=size.clone();
        this._canvas_copy_size=size.multiplyBy(3); 
        // this._canvas_copy_size=size; 
        this.canvas.width=this._canvas_copy_size.x;
        this.canvas.height=this._canvas_copy_size.y;
        this.canvas.style.width=this._canvas_copy_size.x+"px";
        this.canvas.style.height=this._canvas_copy_size.y+"px";
         this._canvas_map_size=size;
         this.transformtion.setOrigin(-size.x,-size.y);
      }
      return this._canvas_copy_size;
     },
     InitLevels:function(){
         var map=this._map;
         var zoom=map.zoom;
         var maxZoom=map.maxZoom;
              var level= this._levels[zoom];
              if(!level){
                  level = this._levels[zoom] = {};
                  level.zoom=zoom;
              }
              this.UpdateLevel(level);
     },
     UpdateLevel:function(level){
          var map=this._map,
          z=level.zoom,
          tsize=map.tileSize,
          bounds=map.getBounds(),
          res=map.resolution(z),
          canvasSize=this.getCanavsSize(),
          offsetSize=this._canvas_map_size;

          var tiles=level.tiles;
          if(!tiles){
              tiles = level["tiles"] ={};
          }
          for(var i in tiles){
              tiles[i]["tag"]=0;
              tiles[i]["cacheTime"]=this.cacheTime;
          }

          var cells=Math.round(offsetSize.x  /tsize)+2;
          var rows=Math.round(offsetSize.y /tsize)+2;
          var startTile=this.OriginTileInfo(res,bounds.min);
          var cell=startTile.cell;
          var row=startTile.row;
          var left=startTile.left;
          var top=startTile.top;
          for(var c=-0,k=cells;c<k;c++){
              for(var r=-0,k2=rows;r<k2;r++){
                  var  x=1*cell + c;
                  var y=1*row + r;
                  var l=Math.floor(left+tsize*c)+offsetSize.x;
                  var t=Math.floor(top+tsize*r)+offsetSize.y;
                  var key="NO"+x+"-"+y;
                  var tile=tiles[key];
                  if(!tile){
                      tile = tiles[key]={};
                      tile.x=x;
                      tile.y=y;
                      tile.z=z;
                      tile.id=key;
                  }
                  tile.left=l;
                  tile.top=t;
                  tile.tag=1;
                  tile.cacheTime=this.cacheTime;
              }
          }
          this.LoadLevel(level);
          
     },
     LoadLevel:function(level){
              var tiles=level.tiles;
              if(tiles){
                  for(var i in tiles){
                      var tile=tiles[i];
                      if(tile.tag==0){
                          this.RemoveTile(tile);
                      }else{
                         this.LoadTile(tile);
                      }
                  }
              }
     },
     LoadTile:function(tile){
         var image=tile.image;
         if(!image){
             image = tile["image"]= Element.create('img');
             tile.status=0;
             var callback=this.OnloadImage;
             var context=this;
             var onLoadCallback=function (){
                  callback && callback.call(context, tile, false);
             }
             image.onload=onLoadCallback;
             image.onerror = function() {
                  geomap.log('Error loading ' + image.src);
                  callback && callback.call(context, tile, true);
            };
             image.tile=tile;
             image.src=this.GetTileUrl(this.url,tile);
         }else{
             var newSrc=this.GetTileUrl(this.url,tile);
             geomap.debug("newSrc="+newSrc);
             if(newSrc != image.src){
                  tile.status=0;
                  image.src=newSrc;
             }
         }
     },
     GetTileUrl:function(url,tile){
      var imgUrl=geomap.util.template(url+ (/\?/.test(url) ? '&' : '?')+"cacheTime={cacheTime}",tile);
      return imgUrl;
    },
     OnloadImage:function(tile,isError){
          if(!isError){
              if(tile.status === 0){
                  tile.status=1;
                  this.fire("draw_tile",tile);
              }
          }
     },
     RemoveTile:function(tile){
          if(tile.image){
              tile.image.remove();
              tile.image=null;
          }
          delete this._levels[tile.z].tiles[tile.id];
     },
     DrawTile:function(){
          var map=this._map,
          z=map.zoom;
          var level= this._levels[z];
          if(!level){
              return;
          }
          var tiles=level.tiles;
          if(tiles){
              for(var i in tiles){
                  var tile=tiles[i];
                  if(tile.tag === 1 && tile.status === 1 && tile.image){
                          // this.canvasCtx.clearRect(0,0,canvasSize.x,canvasSize.y);
                          this.canvasCtx.drawImage(tile.image,tile.left,tile.top);
                  }
              }
          }
          this.fire("drawCanvas");
     },
    ViewReset:function(){ 
      this._canvasScale=1;
      var map=this._map,
          z=map.zoom,
          tsize=map.tileSize,
          bounds=map.getBounds(),
        //   res=map.resolution(z),
          canvasSize=this.getCanavsSize(),
          offsetSize=this._canvas_map_size,
          lock=this._drawLock+1;
      this.canvasCtx.clearRect(0,0,canvasSize.x,canvasSize.y);
      this.InitLevels();
      this.fire("draw_tile",null);
    },
    OriginTileInfo:function(res,min){
    //   var map=this._map,o=map.origin,tsize=map.tileSize;
    //   var x=min.x,y=min.y;
    //   var cell = Math.floor((min.x - o.x) / res.x / tsize);
    //   var row = Math.floor((o.y - min.y) / res.y / tsize);
    //   var left = -(min.x - o.x) / res.x +tsize * cell ;
    //   var top = -(o.y - min.y) / res.y +tsize * row;
    //   return {cell:cell,row:row,left:left,top:top,res:res,tsize:tsize};
      var map=this._map,o=map.origin,tsize=map.tileSize;
      var x=min.x,y=min.y;
      var cell = Math.floor((min.x - o.x) / res.x / tsize);
      var row = Math.floor((min.y-o.y ) / res.y / tsize);
      var left = -(min.x - o.x) / res.x +tsize * cell ;
      var top = -(min.y-o.y ) / res.y +tsize * row;
      return {cell:cell,row:row,left:left,top:top,res:res,tsize:tsize};
    }
     
  } );
  

})(typeof exports !== 'undefined' ? exports : this);