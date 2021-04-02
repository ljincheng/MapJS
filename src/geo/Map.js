//const { geomap } = require("../HEADER");

(function(global) {

    'use strict';
  
    
    var Util=geomap.util;
    var extend = Util.object.extend;
    var Point=geomap.Point;
    var toPoint=geomap.util.toPoint;
  
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
      height:1000,
      viewOrigin:{x:0,y:0},
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
      _geometrys:[],
      model:undefined,
      loopTime:40,
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
          this.center=toPoint(this.center);
        }
        // this._element = element;
        this._container=container;
        this._initElement();
       // this._drawlayer();
        this.on("drawmap",this._onDrawMap.bind(this));
        this.on("drawCanvas",this._redrawingCanvasTag.bind(this));
        this._global_interval=setInterval(this._loopTime.bind(this),this.loopTime);
      },
      _dispose:function(){
        if(this._global_interval!=null){
          clearInterval(this._global_interval);
          this._global_interval=null;
        } 
      },
      _initElement:function(){
        this._container.style.position="absolute";
        // this._container.style.width=this.width+"px";
        // this._container.style.height=this.height+"px";
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
        eventjs.add(this._container,"click touch",function(event,self){
          geomap.debug("[click touch] point="+self.x+","+self.y);
          var point=new Point(event.offsetX || self.x ,event.offsetY || self.y);
          var coord=this.screenToCoord(point);
          var e=extend({},{target: this,coord:coord ,point:point,event:event});
          this.fire("click",e);
        }.bind(this));
        eventjs.add(this._container,"mousedown",function(event,self){

          var point=new Point(event.offsetX,event.offsetY);
          if(event.ctrlKey){
            var coord=this.screenToCoord(point);
            geomap.debug("mousedown|coord="+coord.toString());
          }
          this.fire("mousedown",{event:event,point:point});

        }.bind(this));
        eventjs.add(this._container,"mousemove",function(event,self){

          var point=new Point(event.offsetX,event.offsetY);
          // if(event.ctrlKey){
          //   var coord=this.screenToCoord(point);
          //   geomap.debug("mousemove|coord="+coord.toString());
          // }
          this.fire("mousemove",{event:event,point:point});

        }.bind(this));
        eventjs.add(this._container,"mouseup",function(event,self){
          var point=new Point(event.offsetX,event.offsetY);
          this.fire("mouseup",{event:event,point:point});
        }.bind(this));
      },
      _limitZoom:function(z){
        if(this.maxZoom<z){
          return this.maxZoom;
        }else if (this.minZoom>z){
          return this.minZoom;
        }
        return z;
      },
      _loopTime:function(){
        for(var i=0,k=this.layers.length;i<k;i++){
          var layer=this.layers[i];
              layer.OnLoopTime();
        }
        this._redrawingCanvas.call(this);
      },
      _redrawingCanvas:function(){
        if(this._redrawing==true || this._move_type==1){
          this._redrawing=false;
          const ctx=this.canvasCtx;
          var size=this.getSize();
         // var wh=geomap.coord.size(this._move_start,this._pos);
          this.canvasCtx.clearRect(0,0,size.x,size.y);
          for(var i=0,k=this.layers.length;i<k;i++){
                var layer=this.layers[i];
                layer.drawingCanvas(ctx);
          } 
          var geomNum=this._geometrys.length;
          if(geomNum>0){
            for(var i=0;i<geomNum;i++){
              var geomObj=this._geometrys[i];
              
                 geomObj.render(ctx);
                 if(geomObj.loopRender){
                   this._redrawing=true;
                 }
            }
          }
          //  ctx.strokeRect(this._move_start.x,this._move_start.y,wh[0],wh[1]);
        }
      }, 
      _onDrawMap:function(){
          this.fire("viewreset");
          this._redrawing=true;
      },
      _redrawingCanvasTag:function(){
        this._redrawing=true;
      },
      _loadLayer:function(layer){
        layer.on("drawCanvas",this._redrawingCanvasTag.bind(this));
        layer.initLayer(this.canvas,this);
        this.fire("drawmap");
      },
      addLayer:function(layer){ 
        this._loadLayer(layer);
        this.layers.push(layer);
      },
      setCenter:function(coord){
        this.center=toPoint(coord);
        this._boundsChanged=true;
       },
      moveTo:function(coord,zoom,data){
        this.setCenter(toPoint(coord))
        if(zoom === undefined){

        }else{
          if(typeof zoom =='string'){
            zoom=Number(zoom);
          }
          this.setZoom(zoom);
        }
         this.fire("drawmap");
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
      getCoord:function(p0){
        return this.model.screenToCoord(Util.toPoint(p0));
      },
      addGeometry:function(geomtry){
        this._geometrys.push(geomtry);
        this._redrawing=true;
      }
      
     
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  