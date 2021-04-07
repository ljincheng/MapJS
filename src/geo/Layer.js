
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
    
    var Layer={
      type:'Layer',
      width:100,
      height:100, 
      _canvas:null,
      _layerCanvas:null,
      _layerCtx:null, 
      _map:undefined,
      transformtion: null,
      wheelZoomChanage:false,
      initLayer:function(canvas,map){
        this.transformtion=new geomap.Transformtion(-1,0,-1, 0);
        this._canvas=canvas; 
        this._drawLock=1;
        this._map=map;
        var el_offscreen_canvas=geomap.util.element.create("canvas",{},{zIndex:2,border:"1px solid blue",backgroundColor:"#e4e4e4",position:"absolute",top:"0px"});
        const offscreen_ctx=el_offscreen_canvas.getContext("2d");
        this._layerCanvas=el_offscreen_canvas;
        this._layerCtx=offscreen_ctx;
        this.OnResize();
        map.on("resize",this.OnResize.bind(this));
        map.on("viewreset",this.ViewReset.bind(this));
        map.on("dragstart",this.OnDragStart.bind(this));
        map.on("drag",this.OnDrag.bind(this));
        map.on("dragend",this.OnDragEnd.bind(this));
        map.on("touchzoomstart",this.OnTouchZoomStart.bind(this));
        map.on("touchzoom",this.OnTouchZoom.bind(this));
        map.on("touchzoomend",this.OnTouchZoomEnd.bind(this));
        map.on("wheelzoom",this.OnScrollZoom.bind(this));
        this.fire("initLayer");
        this.ViewReset();
      },
      OnResize:function(){
        var size=this._map.getSize();
        this.width=size.x;
        this.height=size.y;
        this._layerCanvas.width=size.x;
        this._layerCanvas.height=size.y;
        this._layerCanvas.style.width=size.x+"px";
        this._layerCanvas.style.height=size.y+"px";
      },
      OnTouchZoomStart:function(arg){
        var event=arg.event,cpos=arg.point;
        this._touchZoomStart=cpos;
      },
      OnTouchZoom:function(arg){
        var event=arg.event,scale=arg.scale;
        this._canvasScale=geomap.util.formatNum(scale,4);
        this.fire("drawCanvas");
      }, 
      OnTouchZoomEnd:function(arg){
        // var event=arg.event,scale=arg.scale;
        this._touchZoomStart=null;
        this.ViewReset();
      },
      scrollZoomEnd:function(arg){
        this._canvasScale=1;
        this.ViewReset();
      },
      OnScrollZoom:function(arg){
        if(arg.startZoom ==arg.endZoom){
          return ;
        }
          if(this._animMoveFn){
            this._animMoveFn.stop();
          }else{
            this._animMoveFn=new geomap.PosAnimation({easeLinearity:0.1});
            this._animMoveFn.on("end",function(){this._touchZoomStart=null;this._canvasScale = 1; this.wheelZoomChanage=false;this.ViewReset();}.bind(this));
          }
          this._touchZoomStart=arg.point;
          this._animMoveFn.run(function(pos,e){
           var startRes=this._map.getScale(e.pos[0].x)/256;
           var res=this._map.getScale(pos.x)/256;
           var scale=res/startRes;
            this._canvasScale =scale;
            this.wheelZoomChanage=true;
            this.fire("drawCanvas");
        },[new Point(arg.startZoom,0),new Point(arg.endZoom,0)],0.4,this);
        
      },
      OnDragStart:function(arg){
        this._dragStartPos=arg.point;
      },
      OnDrag:function(arg){
        if(arg.boundsChanged){
          this._dragOffset=arg.point.subtract(this._dragStartPos);
          this.fire("drawCanvas");
        }
      },
      OnDragEnd:function(arg){ 
       this._dragOffset = null;
       this.ViewReset();
      },
      ViewReset:function(){ 
        this.fire("drawCanvas");
      },
      getCanavsSize:function(){
        return this._map.getSize();
      },
      OnLoopTime:function(){ },
      drawingCanvas:function(ctx){
        
        var map=this._map,zeroP=new Point(0,0),
        size=this.getCanavsSize(),
        offsetDrag=this._dragOffset || zeroP,
        p0 = (this._touchZoomStart || zeroP),
        scale=(this._canvasScale || 1),
        box=size.multiplyBy(scale).round();
        var baseP1=this.transformtion.transform(p0.clone(),scale)._add(p0).add(offsetDrag).round();
        ctx.drawImage(this._layerCanvas,baseP1.x,baseP1.y,box.x,box.y);
        // var r=5;
        // ctx.globalAlpha = 1;
        // ctx.fillRect(p0.x-r/2,p0.y-r/2,r,r);
        // ctx.globalAlpha = 1;
      } 
     
    };
   
     

  geomap.Layer=Layer;
  
  })(typeof exports !== 'undefined' ? exports : this);
  