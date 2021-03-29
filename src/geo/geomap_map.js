//const { geomap } = require("../HEADER");

(function(global) {

    'use strict';
  
    
    var Util=geomap.util;
    var extend = Util.object.extend;
    var Point=geomap.Point;
    var Model=geomap.Model;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Map) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }
   
    geomap.Map = geomap.Class(geomap.CommonMethods, geomap.Observable, geomap.Model,geomap.MapEvent,{
      type: 'object',
      width:100,
      height:100,
      origin:{x:-180,y:-90},
      viewOrigin:{x:0,y:0},
      tileSize:256,
      center:undefined,
      canvas:undefined,
      canvasCtx:undefined,
      zoom:2,
      maxZoom:11,
      minZoom:0,
      layers:[],
      _global_interval:null,
      _canrender:true,
      _container:undefined,
      model:undefined,
      initialize: function(container, options) {
        options || (options = { });  
        this._setOptions(options);  
        this._sizeChanged=true;
        if(options.debug){
          geomap.debug=options.debug;
        }
        if(this.center === undefined){
          this.center=new Point(0,0);
        }else{
          this.center=geomap.util.toPoint(this.center);
        }
        // this._element = element;
        this._container=container;
        this._initElement();
       // this._drawlayer();
        this.on("drawmap",this._drawlayer.bind(this));
        this._global_interval=setInterval(this.time_event.bind(this),20);
      },
      _dispose:function(){
        if(this._global_interval!=null){
          clearInterval(this._global_interval);
          this._global_interval=null;
        } 
      },
      _initElement:function(){
        this._container.style.position="absolute";
        this._container.style.width=this.width+"px";
        this._container.style.height=this.height+"px";
        var size=this.getSize();
        var width=size.x,height=size.y;
        var el_canvas=geomap.util.element.create("canvas",{id:"_map_canvas",width:width,height:height},{zIndex:2,border:"0px solid red",backgroundColor:"#e4e4e4",position:"absolute",width:width+"px",height:height+"px"});
        this._container.appendChild(el_canvas);
        this.canvas=el_canvas;
        const ctx=el_canvas.getContext("2d");
        this.canvasCtx=ctx;
        this._eventDrag=new geomap.Event.Drag(this);
        this._eventTouchZoom=new geomap.Event.TouchZoom(this);
        this._eventWheelZoom=new geomap.Event.ScrollWheelZoom(this);
        this._eventDrag.addEvent(this._container);
        this._eventTouchZoom.addEvent(this._container);
        this._eventWheelZoom.addEvent(this._container);
      }, 
      _limitZoom:function(z){
        if(this.maxZoom<z){
          return this.maxZoom;
        }else if (this.minZoom>z){
          return this.minZoom;
        }
        return z;
      },
      _moveStart:function(zoomChanged,noMoveStart){
        if(zoomChanged){
          this.fire('zoomstart');
        }
        if(!noMoveStart){
          this.fire('movestart');
        }
        return this;
      },
      _move:function(center,zoom,data){
        if(zoom ===undefined){
          zoom=this.zoom;
        }
        var zoomChanged= this.zoom !== zoom;
        this.zoom=zoom;
        this._lastCenter=center;
        //this._pixelOrigin=this._getNewPixelOrigin(center,zoom);
        if(zoomChanged || (data && data.pinch)){
          this.fire('zoom',data);
        }
        this.fire('move',data);
        return this;
      },
      _moveEnd:function(zoomChanged){
        if(zoomChanged){
          this.fire("zoomend");
        }
        this.fire('moveend');
        return this;
      },
      _getNewPixelOrigin:function(center,zoom){
        //TODO 转换获取origin
        var viewHalf=this.getSize()._divideBy(2);
      },
      time_event:function(){
        for(var i=0,k=this.layers.length;i<k;i++){
          var layer=this.layers[i];
              layer.time_event();
        }
        this._draw.call(this);
      },
      getSize:function(){
        if(!this._size || this._sizeChanged){
          this._size=new Point(this._container.clientWidth||this.width,this._container.clientHeight || this.height);
          this._sizeChanged=false;
        }
        return this._size.clone();
      },
       resize:function(){
         this._sizeChanged=true;
         var size=this.getSize();
         this.canvas.width=size.x;
         this.canvas.height=size.y;
         this.canvas.style.width=size.x+"px";
         this.canvas.style.height=size.y+"px";
         this._boundsChanged=true;
         this._redrawing=true;
         this.fire("resize");
         this.fire("drawmap");
      },
      _draw:function(){
        if(this._redrawing==true || this._move_type==1){
          this._redrawing=false;
          const ctx=this.canvasCtx;
         // var wh=geomap.coord.size(this._move_start,this._pos);
          this.canvasCtx.clearRect(0,0,this.width,this.height);
          for(var i=0,k=this.layers.length;i<k;i++){
                var layer=this.layers[i];
                layer.draw(ctx);
          } 
          //  ctx.strokeRect(this._move_start.x,this._move_start.y,wh[0],wh[1]);
        }
      },
      getCoord:function(p0){
        return this.model.screenToCoord(Util.toPoint(p0));
      }, 
      _drawlayer:function(){
          this.fire("viewreset");
      },
      addLayer:function(layer){
        this.layers.push(layer);
        this._loadLayer(layer);
      },
      _loadLayer:function(layer){
        layer.on("draw",function(){this._redrawing=true;}.bind(this));
        layer.initLayer(this.canvas,this);
        
        this.fire("drawmap");
      }
     
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  