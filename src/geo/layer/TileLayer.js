
(function(global) {

    'use strict';
  
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
  
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
       initialize: function( options) {
        options || (options = { }); 
        this._setOptions(options); 
      },
      ViewReset:function(){ 
        this._drawStart && this._drawStart.zero();
        this._canvasScale=1;
        var map=this._map,
            z=map.zoom,
            tsize=map.tileSize,
            bounds=map.getBounds(),
            res=map.resolution(z),
            lock=this._drawLock+1;
           
        var cells=Math.round(this.width/tsize)+2;
        var rows=Math.round(this.height/tsize)+2;
  
        var startTile=this.OriginTileInfo(res,bounds.min);
        var cell=startTile.cell;
        var row=startTile.row;
        var left=startTile.left;
        var top=startTile.top;
  
        this._drawLock=lock;
        this._layerCtx.clearRect(0,0,this.width,this.height);
        for(var c=0;c<cells;c++){
          for(var r=0;r<rows;r++){
            var  x=1*cell + c;
            var y=1*row + r;
            var l=Math.floor(left+tsize*c);
            var t=Math.floor(top+tsize*r);
            if( x>=0 && y>=0 ){
                var imgUrl=geomap.util.template(this.url,{z:z,x:x,y:y});
                this.FromURL(imgUrl,{left:l,top:t,lock:lock});  
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
          if(opts.lock == this._drawLock){
            this._layerCtx.drawImage(cacheImg,opts.left,opts.top);
            this.fire("drawCanvas");
          }
        } 
        if(!this.cache || doDraw){
          this.LoadImage(url,function(img,isError){
            if(isError){
              console.log("load img fail:"+url);
              return ;
            }
            console.log("load img:"+url+",left="+this.opts.left+",top="+this.opts.top);
            if(this.opts.lock == this.obj._drawLock){
              this.obj._layerCtx.drawImage(img,this.opts.left,this.opts.top);
            
              this.obj.fire("drawCanvas");
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
      getImageKey:function(url){
        if(!this.__load_img_key){
          this.__load_img_key={};
        }
        if(this.__load_img_key[url]){
          return this.__load_img_key[url];
        }else{
          this.__load_img_key[url]=1;
          return 0;
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
  