
(function(global) {

    'use strict';
  
    var extend = geomap.util.object.extend;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Layer) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }
   
    geomap.Layer = geomap.util.createClass(geomap.CommonMethods, geomap.Observable,  {
      type: 'object',
      width:100,
      height:100,
      originX:0,
      originY:0, 
      tileSize:256,
      cache:true,
      origin:{x:-180,y:-90},
      _canvas:null,
      _layerCanvas:null,
      _layerCtx:null,
      _drawLock:1,
      initialize: function( options) {
        options || (options = { }); 
        this._setOptions(options);
      }, 
      initLayer:function(canvas,map){
        this._canvas=canvas;
        this.width=map.width;
        this.height=map.height;
        var el_offscreen_canvas=geomap.util.element.create("canvas",{width:this.width,height:this.height},{zIndex:2,border:"1px solid blue",backgroundColor:"#e4e4e4",position:"absolute",width:this.width+"px",height:this.height+"px",top:"0px"});
        const offscreen_ctx=el_offscreen_canvas.getContext("2d");
        this._layerCanvas=el_offscreen_canvas;
        this._layerCtx=offscreen_ctx;
      },
      time_event:function(){

      },
      draw:function(ctx,options){
        ctx.drawImage(this._layerCanvas,0,0);
      },
      getTileInfo:function(res,pos){
        // var res=this.resolution(level);
        var x=pos[0],y=pos[1];
        var o=this.origin;
        var tsize=this.tileSize;
        var cell=Math.floor((x-o.x)/res.x/tsize);
        var row=Math.floor((y-o.y)/res.y/tsize);
        var left=-(x-o.x)/res.x +tsize*cell;
        var top = -(y-o.y)/res.y +tsize*row;
        var minx=x+ left*res.x;
        var miny=y+ top*res.y;
        return {cell:cell,row:row,left:left,top:top,res:res,minx:minx,miny:miny,tsize:tsize};
      },
      getTileInfo2:function(res,pos){
        // var res=this.resolution(level);
        var x=pos[0],y=pos[1];
        var o=this.origin;
        var tsize=this.tileSize;
        var cell=Math.floor((x-o.x)/res.x/tsize);
        var row=Math.floor((o.y-y)/res.y/tsize);
        var left=-(x-o.x)/res.x +tsize*cell;
        var top= -(o.y-y)/res.y +tsize*row;
        var minx=x+ left*res.x;
        var miny=y+ top*res.y;
        return {cell:cell,row:row,left:left,top:top,res:res,minx:minx,miny:miny,tsize:tsize};
      },
      drawlayer:function(z,res,startPos){
        var lock=this._drawLock+1;
        this._drawLock=lock;
        this._layerCtx.clearRect(0,0,this.width,this.height);
        //TODO draw Tile
        var tsize=this.tileSize;
        var cells=Math.round( this.width/tsize)+2;
        var rows=Math.round(this.height/tsize)+2;
        // var z=1;
        // var res=this.resolution(z);
        // var cx= this.center.x- Math.floor((this.width * res.x)/2);
        // var cy=this.center.y + Math.floor((this.height * res.y)/2);
        // var startPos=[cx,cy];

       var startTile=this.getTileInfo(res,startPos);
       console.log("cells="+cells+",rows="+rows+",left="+startTile.left+",top="+startTile.top);
    //  var url="http://fabricjs.com/article_assets/9.png";
    var cell=startTile.cell;
    var row=startTile.row;
    var left=startTile.left;
    var top=startTile.top;
     for(var c=0;c<cells;c++){
       for(var r=0;r<rows;r++){
        var  x=1*cell + c;
         var y=1*row + r;
         var l=Math.floor(left+tsize*c);
         var t=Math.floor(top+tsize*r);
         if( x>=0 && y>=0 ){
            // var imgUrl="http://mt1.google.cn/vt/x="+x+"&y="+y+"&z="+z;
            var imgUrl="https://c.tile.openstreetmap.org/"+z+"/"+x+"/"+y+".png";
            // var imgUrl="https://maponline0.bdimg.com/tile/?qt=vtile&x="+x+"&y="+y+"&z="+z+"&styles=pl&udt=20210318&scaler=1&showtext=1";
            // var imgUrl="https://maponline3.bdimg.com/tile/?qt=vtile&x="+x+"&y="+y+"&z="+z+"&styles=pl&udt=20210318&scaler=1&showtext=1";
            this.fromURL(imgUrl,{left:l,top:t,lock:lock});  
         }
       }
     }
     
  },
      loadImage:function(url,callback,context){

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
          console.log("Error loading "+img.src);
          img = img.onload = img.onerror = null;
          callback && callback.call(context,null,true);
        };
        img.src=url;
      },
      fromURL:function(url,opts){
        var cacheImg=this.getCacheImage(url);
        var doDraw=false;
        if(cacheImg==null){
          doDraw=true;
        }else{
          if(opts.lock == this._drawLock){
            this._layerCtx.drawImage(cacheImg,opts.left,opts.top);
            this.fire("draw");
          }
        } 
        if(!this.cache || doDraw){
          this.loadImage(url,function(img,isError){
            if(isError){
              console.log("load img fail:"+url);
              return ;
            }
            console.log("load img:"+url+",left="+this.opts.left+",top="+this.opts.top);
            if(this.opts.lock == this.obj._drawLock){
              this.obj._layerCtx.drawImage(img,this.opts.left,this.opts.top);
            
              this.obj.fire("draw");
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
     
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  