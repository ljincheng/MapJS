(function(global) {

    'use strict';
  
    var extend = geomap.util.object.extend;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Image) {
        geomap.warn('geomap.Image is already defined.');
      return;
    }

   var ImageCache={
        cacheImage:function(img){
            if(!this.__cache_imgs){
            this.__cache_imgs={};
            }
            var url=img.src;
            this.__cache_imgs[url]=img;
            return img; 
        },
        getCache:function(url){
            if(!this.__cache_imgs){
              return null;
            }
            if(this.__cache_imgs[url]){
              return this.__cache_imgs[url];
            }
            return null; 
          },
        hasKey:function(url){
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
      }
    };

    // function loadImage(url,callback,context){
    //   if(!url){
    //     callback && callback.call(context,url);
    //     return;
    //   }
    //   var img=geomap.window.document.createElement('img');
    //   var onLoadCallback=function(){
    //     callback && callback.call(context,img,false);
    //     img = img.onload = img.onerror = null;
    //     //img=img.onload=img.onerror=null;
    //   };
    //   img.onload=onLoadCallback;
    //   img.onerror=function(){
    //     //console.log("Error loading "+img.src);
    //     callback && callback.call(context,null,true);
    //     img = img.onload = img.onerror = null;
    //   };
    //   img.src=url;
    // };

    geomap.Image=geomap.Class(geomap.CommonMethods, geomap.Observable,{
        type: 'image',
        x:0,
        y:0,
        z:0,
        left:0,
        top:0,
        cacheTime:0,
        lockKey:1,
        tileKey:null,
        tableKey:null,
        image:null,
        loaded:false,
        ctx:undefined,
        tag:0,
    initialize: function(options) {
          options || (options = { }); 
          this._setOptions(options);  
          this.image=window.document.createElement('img');
          this._onloadHandle=this.onLoad.bind(this);
          this.image.onload=this._onloadHandle;
       //  this.setElement(element);
    },
    isTile:function(tile){
      return (tile.x === this.x && tile.y === this.y && tile.z === this.z && tile.cacheTime == this.cacheTime);
    },
    getTileUrl:function(url,tile){
      var imgUrl=geomap.util.template(url+ (/\?/.test(url) ? '&' : '?')+"cacheTime={cacheTime}",tile);
      return imgUrl;
    },
    loadTile:function(url,tile){
      this._setOptions(tile);  
      var imgSrc=this.getTileUrl(url,tile);
      if(this.getSrc() === imgSrc){
          this.drawCanvas();
        }else{
          this.setSrc(imgSrc);
        }
    },
    drawCanvas:function(){
      if(this.loaded && this.ctx !=undefined){
        this.ctx.drawImage(this.image,this.left,this.top);
        var other=this;
        this.fire("drawend",this);
      }
    },
    // setElement:function(img){
    //   this._element=img;
    //   this._onloadHandle=this.onLoad.bind(this);
    //   this._element.onload=this._onloadHandle;
    // },
    // getElement:function(){
    //   if(!this._element){
    //     var img=geomap.window.document.createElement('img');
    //     this.setElement(img);
    //   }
    //   return this._element;
    // },
    draw:function(ctx){
      if(this.loaded){
        ctx.drawImage(this.image,this.x,this.y);
        if(this.drawCallback){
          var other=this;
          this.drawCallback(other);
        }
      }
    },
    onLoad:function(event){ 
      this.loaded=true;
      this.drawCanvas();
    //   var other=this;
    //   var img=this.image;
    //     var e={img:img,target:other};
        this.fire("onload");
    },
    setSrc:function(url){ 
      // if(this.loaded && this.image.src === url){
      //   this.onLoad(this.image);
      // }else{
        this.loaded=false;
        this.image.src=url;
      // this.loaded=false;
      // }
      //this.getElement().src=url;
    },
    getSrc:function(){
      return this.image.src;
    },
    fromURL:function(url,x,y){
      if(x!=undefined && y != undefined){
        this.x=x;
        this.y=y;
      } 
      if(this.loaded && this.image.src === url){
        this.onLoad(this.image);
      }else{
        // this.loaded=false;
        this.image.src=url;
      }
      // if(this.getElement().src == url)
      // {
      //   this.onLoad(this._element);
      // }else{
      //   this.setSrc(url);
      // }
        
    }
	 
    });

})(typeof exports !== 'undefined' ? exports : this);