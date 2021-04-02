
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
      type: 'Layer',
      width:100,
      height:100, 
      _canvas:null,
      _layerCanvas:null,
      _layerCtx:null, 
      _map:undefined,
      initLayer:function(canvas,map){
        this._canvas=canvas; 
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
        map.on("zoom",this.OnScrollZoom.bind(this));
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
        this._drawStart=cpos;
      },
      OnTouchZoom:function(arg){
        var event=arg.event,scale=arg.scale;
        this._canvasScale=geomap.util.formatNum(scale,4);
        this.fire("drawCanvas");
      }, 
      OnTouchZoomEnd:function(arg){
        var event=arg.event,scale=arg.scale;
        this.ViewReset();
      },
      scrollZoomEnd:function(arg){
        this._canvasScale=1;
        this.ViewReset();
      },
      OnScrollZoom:function(arg){
         this.ViewReset();
      },
      OnDragStart:function(arg){
        this._dragStartPos=arg.point;
      },
      OnDrag:function(arg){
        if(arg.boundsChanged){
          this._drawStart=arg.point.subtract(this._dragStartPos);
          this.fire("drawCanvas");
        }
      },
      OnDragEnd:function(arg){
       this.ViewReset();
      },
      ViewReset:function(){ 
        this.fire("drawCanvas");
      },
      time_event:function(){

      },
      drawingCanvas:function(ctx,options){
        var map=this._map,
          p0 = (this._drawStart || new Point(0,0)).round(),
         scale=(this._canvasScale || 1),
          size=map.getSize(),
         box=size._multiplyBy(scale).round(),
         p1=map.toTransformScreen(p0,1-scale).round();
        ctx.drawImage(this._layerCanvas,p1.x,p1.y,box.x,box.y);
      } 
     
    };
   
     

  geomap.Layer=Layer;
  
  })(typeof exports !== 'undefined' ? exports : this);
  