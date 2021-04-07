
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
   
    geomap.TileLayer = geomap.Class(geomap.CommonMethods, geomap.Observable,geomap.Layer, {
        url:null,
        _drawLock:1,
        cache:true,
        _canvas_map_size:new Point(0,0),
        _mapSize:null,
        transformtion:null,
       initialize: function( options) {
        options || (options = { }); 
        this._setOptions(options); 
        this.on("initLayer",this.OnInitLayer.bind(this));
      }, 
      OnInitLayer:function(){
        // this._drawLock2=1;
        // var canvas_copy=geomap.util.element.create("canvas",{},{zIndex:2,position:"absolute",top:"0px"});
        // const ctx_copy=canvas_copy.getContext("2d");
        // this._canvas_copy=canvas_copy;
        // this._ctx_copy=ctx_copy;
        this.getCanavsSize();
        // var size=this._map.getSize();
        // this._canvas_copy_size=toPoint([size.x,size.y]);
        // this._canvas_copy.width=this._canvas_copy_size.x;
        // this._canvas_copy.height=this._canvas_copy_size.y;
        // this._layerCanvas.width=this._canvas_copy_size.x;
        // this._layerCanvas.height=this._canvas_copy_size.y;
        // this._canvas_copy.style.width=size.x+"px";
        // this._canvas_copy.style.height=size.y+"px";
      },
       getCanavsSize:function(){
        var map=this._map,size=map.getSize();
        if(!this._canvas_copy_size || !this._mapSize || !size.equals(this._mapSize)){
          this._mapSize=size.clone();
          this._canvas_copy_size=size.multiplyBy(3); 
          // this._canvas_copy.width=this._canvas_copy_size.x;
          // this._canvas_copy.height=this._canvas_copy_size.y;
          this._layerCanvas.width=this._canvas_copy_size.x;
          this._layerCanvas.height=this._canvas_copy_size.y;
          // this._canvas_copy.style.width=this._canvas_copy_size.x+"px";
          // this._canvas_copy.style.height=this._canvas_copy_size.y+"px";
          this._layerCanvas.style.width=this._canvas_copy_size.x+"px";
          this._layerCanvas.style.height=this._canvas_copy_size.y+"px";
           this._canvas_map_size=size;
           this.transformtion=new geomap.Transformtion(1,-(size.x),1, -(size.y));
        }
        return this._canvas_copy_size;
       },
       OnTouchZoomStart:function(arg){
        var event=arg.event,cpos=arg.point;
        var size=this._mapSize;
        // this._drawStart=cpos;
        this._drawStart=this.transformtion.untransform(cpos,1).round();
        geomap.debug("okkkk7,_drawStart="+this._drawStart.toString());
      },
      //  OnDrag:function(arg){
      //   if(arg.boundsChanged){
      //     var size=this.getCanavsSize(), 
      //     offsetSize=this._canvas_map_size;
      //     this._drawStart=arg.point.subtract(this._dragStartPos);
      //     // this._drawStart=this._dragStartPos.subtract(arg.point);
         
      //     this._canvasScale=1;
      //     this.fire("drawCanvas");
      //   }
      // },
      drawingCanvas:function(ctx,options){
        var map=this._map,
          size=this.getCanavsSize(),
          // mapSize=map.getSize(),
          offsetSize=this._canvas_map_size,
          p0 = (this._drawStart || new Point(0,0)),
         scale=(this._canvasScale || 1),
        //  box1=mapSize.multiplyBy(scale).round(),
         box=size.multiplyBy(scale).round();
        
        //  var p1=map.toTransformScreen(p0.clone(),1-scale).round();
        //  var baseP0=map.toTransformScreen(offsetSize.clone(),1-scale).round();
      
        //  var baseP1=map.toTransformScreen(p0.subtract(offsetSize),1-scale).round();
        // var p1=this.transformtion.untransform(p0).round();
         var baseP1=this.transformtion.transform(p0.clone(),1-scale).round();
         geomap.debug("okkkk8");
         
        //  var baseP2=map.toTransformScreen(p0.add(offsetSize),1-scale).round();
        // var box1=size.multiplyBy(scale).round(); 
        //  var p20=(new Point(0,0))._subtract(p0);
        //  var p2=map.toTransformScreen(p20,1-scale).round();
        //  ctx.drawImage(this._layerCanvas,p1.x,p1.y,box1.x,box1.y,0,0,box1.x,box1.y);
        //  ctx.drawImage(this._layerCanvas,p1.x,p1.y,box.x,box.y,-baseP0.x,-baseP0.y,box.x,box.y);
        //  ctx.drawImage(this._layerCanvas,baseP0.x,baseP0.y,box.x,box.y,p1.x,p1.y,box.x,box.y);
        ctx.drawImage(this._layerCanvas,baseP1.x,baseP1.y,box.x,box.y);
      } ,
      ViewReset:function(){ 
        //  this._drawStart && this._drawStart.zero();
         this._drawStart && this._drawStart.zero();
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
        this._layerCtx.clearRect(0,0,canvasSize.x,canvasSize.y);
        for(var c=-cells,k=cells*2;c<k;c++){
          for(var r=-rows,k2=rows*2;r<k2;r++){
                var  x=1*cell + c;
                var y=1*row + r;
                var l=Math.floor(left+tsize*c)+offsetSize.x;
                var t=Math.floor(top+tsize*r)+offsetSize.y;
                if( x>=0 && y>=0 ){
                    var imgUrl=geomap.util.template(this.url,{z:z,x:x,y:y});
                    this.FromURL(imgUrl,{left:l,top:t,lock:lock,drawLock:1});  
                }
          }
        }


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
      },
      LoadImage:function(url,callback,context){
  
        if(!url){
          callback && callback.call(context,url);
          return;
        }
        var img=geomap.util.element.create("img");
        var onLoadCallback=function(){
          callback && callback.call(context,img,false);
          //img=img.onload=img.onerror=null;
        };
        img.onload=onLoadCallback;
        img.onerror=function(){
          //console.log("Error loading "+img.src);
          img = img.onload = img.onerror = null;
          //callback && callback.call(context,null,true);
        };
        img.src=url;
      },
      FromURL:function(url,opts){
        var cacheImg=this.getCacheImage(url);
        var doDraw=false;
        if(cacheImg==null){
          doDraw=true;
        }else{
         // if(opts.lock == this._drawLock){
            this._layerCtx.drawImage(cacheImg,opts.left,opts.top);
            this.fire("drawCanvas");
         // }
        } 
        if(!this.cache || doDraw){
          if(!this.hasImageKey(url)){

          this.LoadImage(url,function(img,isError){
            if(isError){
              console.log("load img fail:"+url);
              return ;
            }
            
            if(this.opts.lock == this.obj._drawLock){
              this.obj._layerCtx.drawImage(img,this.opts.left,this.opts.top);
              this.obj.fire("drawCanvas");
            }else{
              this.obj.ViewReset();
            }
          
        
  
              var cacheImg=this.obj.getCacheImage.call(this.obj,url);
              if(cacheImg!=null){
                cacheImg.onload=null;
                cacheImg.onerror=null;
                cacheImg=null;
              }
              this.obj.cacheImage.call(this.obj,img);
            
          },{obj:this,opts:opts,doDraw:doDraw});
        }
      }
       
      },
      getCacheImage:function(url){
        if(!this.__cache_imgs){
          return null;
        }
        if(this.__cache_imgs[url]){
          return this.__cache_imgs[url];
        }
        return null; 
      },
      cacheImage:function(img){
        if(!this.__cache_imgs){
          this.__cache_imgs={};
        }
        var url=img.src;
           this.__cache_imgs[url]=img;
        return img; 
      },
      hasImageKey:function(url){
        if(!this.__load_img_key){
          this.__load_img_key={};
          this.__load_img_key[url]=1;
          return false;
        }
        if(this.__load_img_key[url]){
          this.__load_img_key[url]=this.__load_img_key[url]+1;
          return true;
        }else{
          this.__load_img_key[url]=1;
          return false;
        } 
      },
      removeImageKey:function(url){
        if(!this.__load_img_key){
          return ;
        }
        if(this.__load_img_key[url]){
          this.__load_img_key[url]=0;
        }
      }
    } );
    
  
  })(typeof exports !== 'undefined' ? exports : this);
  