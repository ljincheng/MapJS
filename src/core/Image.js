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
        lockKey:1,
        tileKey:null,
        tableKey:null,
    initialize: function(element, options) {
          options || (options = { }); 
          this._setOptions(options);  
         this.setElement(element);
    },
    setElement:function(img){
      this._element=img;
      this._onloadHandle=this.onLoad.bind(this);
      this._element.onload=this._onloadHandle;
    },
    getElement:function(){
      if(!this._element){
        var img=geomap.window.document.createElement('img');
        this.setElement(img);
      }
      return this._element;
    },
    draw:function(ctx){
      ctx.drawImage(this._element,this.x,this.y);
    },
    onLoad:function(img,isOk){
        var e={img:img,target:this};
        this.fire("onload",e);
    },
    setSrc:function(url){ 
      this.getElement().src=url;
    },
    fromURL:function(url){ 
      if(this.getElement().src == url)
      {
        this.onLoad(this._element);
      }else{
        this.setSrc(url);
      }
        
    }
	 
    });

})(typeof exports !== 'undefined' ? exports : this);