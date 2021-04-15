
(function(global) {

    'use strict';
  
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
    //var toPoint =geomap.util.toPoint;
  
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
       initialize: function( options) {
        this.callSuper('initialize',options);
        this.on("initLayer",this.OnInitLayer.bind(this));
      }, 
      OnInitLayer:function(){
       
        this.getCanavsSize();
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
      ViewReset:function(){ 
        this._canvasScale=1;
        var map=this._map,
            z=map.zoom,
            tsize=map.tileSize,
            bounds=map.getBounds(),
            res=map.resolution(z),
            canvasSize=this.getCanavsSize(),
            offsetSize=this._canvas_map_size,
            lock=this._drawLock+1;
           
        var cells=Math.round(offsetSize.x  /tsize)+2;
        var rows=Math.round(offsetSize.y /tsize)+2;
  
        var startTile=this.OriginTileInfo(res,bounds.min);
        var cell=startTile.cell;
        var row=startTile.row;
        var left=startTile.left;
        var top=startTile.top;
  
        this._drawLock=lock; 
        this.canvasCtx.clearRect(0,0,canvasSize.x,canvasSize.y);
        // for(var c=-cells,k=cells*2;c<k;c++){
          // for(var r=-rows,k2=rows*2;r<k2;r++){
          for(var c=-0,k=cells;c<k;c++){
            for(var r=-0,k2=rows;r<k2;r++){
                var  x=1*cell + c;
                var y=1*row + r;
                var l=Math.floor(left+tsize*c)+offsetSize.x;
                var t=Math.floor(top+tsize*r)+offsetSize.y;
                if( x>=0 && y>=0 ){
                    // var imgUrl=geomap.util.template(this.url,{z:z,x:x,y:y});
                    // this.FromURL(imgUrl,{left:l,top:t,lock:lock,drawLock:1});  
                    this.loadTile(c,r,l,t,z,x,y);
                }
          }
        }


        this.fire("drawCanvas");
      },
      getTileImage:function(cell,row,z,x,y){
        if(!this._tileImageMap){
          this._tileImageMap={};
        }
        var tableKey=cell+"-"+row;
        var tileKey=z+"-"+x+"-"+y;
        var tileImg=this._tileImageMap[tableKey];
        if(!tileImg){
          tileImg=new geomap.Image(geomap.window.document.createElement("img"));
          tileImg.tileKey=tileKey;
          tileImg.tableKey=tableKey;
          tileImg.on("onload",this._imageLoad.bind(this));
          this._tileImageMap[tableKey]=tileImg;
        }else{
          for(var tkey in this._tileImageMap){
            var tileImgObj=this._tileImageMap[tkey];
            var _tableKey=tileImgObj.tableKey;
            var _tileKey=tileImgObj.tileKey;
            if(_tileKey === tileKey){
              tileImgObj.tableKey=tableKey;
              tileImg.tableKey=_tableKey;
              this._tileImageMap[tableKey]=tileImgObj;
              this._tileImageMap[_tableKey]=tileImg;
              return tileImgObj;
            }
          }
        }
        return tileImg;
      },
      loadTile:function(cell,row,left,top,z,x,y){
        var image=this.getTileImage(cell,row,z,x,y);
        image.tileKey=z+"-"+x+"-"+y;
          image.x=left,image.y=top;
        var imgUrl=geomap.util.template(this.url+ (/\?/.test(this.url) ? '&' : '?')+"cacheTime={cacheTime}",{z:z,x:x,y:y,cacheTime:this.cacheTime});
        image.fromURL(imgUrl);
      },
      _imageLoad:function(e){
        // this.canvasCtx.drawImage(e.img,e.target.x,e.target.y);
        e.target.draw(this.canvasCtx);
        this.fire("drawCanvas");
      },
      OriginTileInfo:function(res,min){
        var map=this._map,o=map.origin,tsize=map.tileSize;
        var x=min.x,y=min.y;
        var cell = Math.floor((min.x - o.x) / res.x / tsize);
        var row = Math.floor((o.y - min.y) / res.y / tsize);
        var left = -(min.x - o.x) / res.x +tsize * cell ;
        var top = -(o.y - min.y) / res.y +tsize * row;
        return {cell:cell,row:row,left:left,top:top,res:res,tsize:tsize};
      }
       
    } );
    
  
  })(typeof exports !== 'undefined' ? exports : this);
  