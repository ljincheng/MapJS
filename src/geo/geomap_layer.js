
(function(global) {

    'use strict';
  
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
  
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
      map:undefined,
      initialize: function( options) {
        options || (options = { }); 
        this._setOptions(options); 
      }, 
      initLayer:function(canvas,map){
        this._canvas=canvas;
        this.width=map.width;
        this.height=map.height;
        this.map=map;
        var el_offscreen_canvas=geomap.util.element.create("canvas",{width:this.width,height:this.height},{zIndex:2,border:"1px solid blue",backgroundColor:"#e4e4e4",position:"absolute",width:this.width+"px",height:this.height+"px",top:"0px"});
        const offscreen_ctx=el_offscreen_canvas.getContext("2d");
        this._layerCanvas=el_offscreen_canvas;
        this._layerCtx=offscreen_ctx;
        map.on("viewreset",this.viewReset.bind(this));
        map.on("dragstart",this.dragStart.bind(this));
        map.on("drag",this.drag.bind(this));
        map.on("dragend",this.dragEnd.bind(this));
        map.on("zoomstart",this.touchZoomStart.bind(this));
        map.on("zoom",this.touchZoom.bind(this));
        map.on("zoomend",this.touchZoomEnd.bind(this));
      },
      touchZoomStart:function(arg){
        var event=arg.event,cpos=arg.center;
        // var p0=new Point(self.touches[0].x,self.touches[0].y);
        // var p1=new Point(self.touches[1].x,self.touches[1].y);
        // var cpos=p0.add(p1)._divideBy(2);
        this._drawStart=cpos;
      },
      touchZoom:function(arg){
        var event=arg.event,scale=arg.scale;
        this._canvasScale=geomap.util.formatNum(scale,4);
        this.map._canrender=true;
      }, 
      touchZoomEnd:function(arg){
        var event=arg.event,scale=arg.scale;
        this._canvasScale=geomap.util.formatNum(scale,4);
        this.map._canrender=true;
        this._draw();
      },
      dragStart:function(arg){
        var event=arg.event,self=arg.self;
        this._dragStartPos=new Point(self.x,self.y);
      },
      drag:function(arg){
        var event=arg.event,self=arg.self;
        var pos=new Point(self.x,self.y);
        this._drawStart=pos._subtract(this._dragStartPos);
        this.map._canrender=true;
      },
      dragEnd:function(arg){
        var event=arg.event,self=arg.self; 
       this._draw();
      },
      _draw:function(){ 
        this._drawStart && this._drawStart.zero();
        this._canvasScale=1;
        var z=this.map.model.zoom,bounds=this.map.model.getBounds(),res=this.map.model.resolution(z);
        this.drawlayer(z,res,bounds.min);
      },
      time_event:function(){

      },
      draw:function(ctx,options){
        var p0 = (this._drawStart || new Point(0,0)).round();
        var scale=this._canvasScale || 1;
        var size=this.map.getSize();
        var box=size._multiplyBy(scale).round();
        var p1=this.map.model.transformtion.transform(p0,1-scale).round();//._subtract(p0);
        ctx.drawImage(this._layerCanvas,p1.x,p1.y,box.x,box.y);
      },
      viewReset:function(){

        var z=this.map.zoom,bounds=this.map.model.getBounds(),res=this.map.model.resolution(z);
        this.drawlayer(z,res,bounds.min);

      },
      getTileInfo:function(res,point){
        // var res=this.resolution(level);
        var x=point.x,y=point.y;
        var o=this.origin;
        var tsize=this.tileSize;
        var cell=Math.floor((x-o.x)/res.x/tsize);
        var row=Math.floor((y-o.y)/res.y/tsize);
        var left=-(x-o.x)/res.x + tsize*(cell);
        var top = -(y-o.y)/res.y +tsize*(row);
        return {cell:cell,row:row,left:left,top:top,res:res,tsize:tsize};
      },
      // getTileInfo:function(res,pos){
      //   // var res=this.resolution(level);
      //   var x=pos[0],y=pos[1];
      //   var o=this.origin;
      //   var tsize=this.tileSize;
      //   var cell=Math.floor((x-o.x)/res.x/tsize);
      //   var row=Math.floor((o.y-y)/res.y/tsize);
      //   var left=-(x-o.x)/res.x +tsize*cell;
      //   var top= -(o.y-y)/res.y +tsize*row;
      //   var minx=x+ left*res.x;
      //   var miny=y+ top*res.y;
      //   return {cell:cell,row:row,left:left,top:top,res:res,minx:minx,miny:miny,tsize:tsize};
      // },
      drawlayer:function(z,res,point){
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

       var startTile=this.getTileInfo(res,point);
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
          //console.log("Error loading "+img.src);
          img = img.onload = img.onerror = null;
          //callback && callback.call(context,null,true);
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
  