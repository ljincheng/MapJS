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
   
    geomap.Map = geomap.Class(geomap.CommonMethods, geomap.Observable, geomap.Model,
      geomap.MapEvent, geomap.Caliper,geomap.MapRectSelect, {
      type: 'object',
      width:100,
      height:1000,
      viewOrigin:{x:0,y:0},
      center:undefined,
      canvas:undefined,
      canvasCtx:undefined,
      bgCanvas:undefined,
      bgCanvasCtx:undefined,
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
      canvasRatio:1,
      frameLayer:null,
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
        this.InitFrameLayer();
       // this._drawlayer();
        this.on("drawmap",this.OnDrawMap.bind(this));
        this.on("drawCanvas",this.RedrawingCanvasTag.bind(this));
        this.on("clear_geometry",this.clearGeometry.bind(this));
        this.LoopTime();
      },
      _dispose:function(){
        geomap.util.cancelAnimFrame(this._global_interval);
        this._global_interval=null;
        
        // if(this._global_interval!=null){
        //   clearInterval(this._global_interval);
        //   this._global_interval=null;
        // } 
      },
      _initElement:function(){
        this._container.style.position="absolute";
        this._container.style.overflow="hidden";
        // this._container.style.width=this.width+"px";
        // this._container.style.height=this.height+"px";
        var size=this.getSize();
        var width=size.x,height=size.y;
        var el_canvas=geomap.util.element.create("canvas",{id:"_map_canvas",width:width,height:height},{zIndex:2,border:"0px solid red",backgroundColor:"#e4e4e4",position:"absolute",width:width+"px",height:height+"px"});
        geomap.util.element.createHiDPICanvas(el_canvas,width,height,this.canvasRatio);
        var bgCanvas=geomap.util.element.create("canvas",{width:width,height:height},{backgroundColor:"#e4e4e4",position:"absolute",width:width+"px",height:height+"px"});
        this.bgCanvas=bgCanvas;
        this.bgCanvasCtx=bgCanvas.getContext("2d");
        this._container.appendChild(el_canvas);
        this.canvas=el_canvas;
        const ctx=el_canvas.getContext("2d");
        this.canvasCtx=ctx;
        this._eventDrag=new geomap.Event.Drag(this);
        this._eventTouchZoom=new geomap.Event.TouchZoom(this);
        this._eventWheelZoom=new geomap.Event.ScrollWheelZoom(this);
        this._eventDrag.addEvent(this.canvas);
        // geomap.debug("==============new event|||2222=============");
        this._eventTouchZoom.addEvent(this.canvas);
        this._eventWheelZoom.addEvent(this.canvas);
        this.RectSelectBindEvent(this);
        eventjs.add(this.canvas,"contextmenu",eventjs.cancel);
        eventjs.add(this.canvas,"click touch",function(event,self){
          // geomap.debug("[click touch] point="+self.x+","+self.y);
          var point=new Point(event.offsetX || self.x ,event.offsetY || self.y);
          var coord=this.screenToCoord(point);
          var e=extend({},{target: this,coord:coord ,point:point,event:event});
          this.fire("click",e);
          // if(event.altKey){
          //   this.fire("pointcoord",e);
          // }
        }.bind(this));
        eventjs.add(this.canvas,"mousedown",function(event,self){
          var point=new Point(event.offsetX,event.offsetY);
          var arg={event:event,point:point};
          this.fire("mousedown",arg);

        }.bind(this));
        eventjs.add(this.canvas,"mousemove",function(event,self){

          var point=new Point(event.offsetX,event.offsetY);
          var arg={event:event,point:point};
          this.fire("mousemove",{event:event,point:point});

        }.bind(this));
        eventjs.add(this.canvas,"mouseup",function(event,self){
          var point=new Point(event.offsetX,event.offsetY);
          var arg={event:event,point:point};
          this.fire("mouseup",arg);
        }.bind(this));
      },
      InitFrameLayer:function(){
        var frameRoot=document.createElement("div");
        var size=this.getSize();
        var styles={position:"absolute",zIndex:1000,left:"0px",top:"0px"};
        for(var item in styles){
          frameRoot.style[item]=styles[item];
        } 
        this.frameLayer=new geomap.FrameLayer(frameRoot,{map:this});
        this._container.appendChild(frameRoot);
      },
      _limitZoom:function(z){
        if(this.maxZoom<z){
          return this.maxZoom;
        }else if (this.minZoom>z){
          return this.minZoom;
        }
        return z;
      },
      LoopTime:function(){
        this.fire("looptime");
        for(var i=0,k=this.layers.length;i<k;i++){
          var layer=this.layers[i];
              layer.OnLoopTime();
        }
        this._redrawingCanvas.call(this);
        // geomap.util.cancelAnimFrame(this._global_interval);
        // this._global_interval=geomap.util.requestAnimFrame(this.LoopTime,this,this.loopTime);
        geomap.util.requestAnimFrame(this.LoopTime,this);
      },
      _redrawingCanvas:function(){
        if(this._redrawing==true || this._move_type==1){
          this._redrawing=false;
          const ctx=this.canvasCtx;
          var size=this.getSize();
           ctx.clearRect(0,0,size.x,size.y);
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
          this.caliperDraw(ctx);
          this.fire("drawingCanvas",ctx);
        
        }
      }, 
      OnDrawMap:function(){
          this.fire("viewreset");
          this._redrawing=true;
      },
      RedrawingCanvasTag:function(){
        this._redrawing=true;
      },
      _loadLayer:function(layer){
        layer.on("drawCanvas",this.RedrawingCanvasTag.bind(this));
        layer.initLayer(this.canvas,this);
      },
      addLayer:function(layer){ 
        this._loadLayer(layer);
        this.layers.push(layer);
        this.fire("drawmap");
      },
      setCenter:function(coord,zoom){
        coord=toPoint(coord);
        this.center=coord;
        this._boundsChanged=true;
        if(zoom != undefined && typeof zoom == "number"){
          this.setZoom(zoom);
        }
       },
       animMove:function(coord){
          coord=toPoint(coord);
          var startCoord,size=this.getSize(),
            pos1=this.coordToScreen(coord).round(); 
          var cpos=size.divideBy(2).round();
          var offsetR=Math.round( pos1.distanceTo(cpos));
          var sizeR=Math.round( Math.sqrt(size.x* size.x + size.y* size.y));
          if(offsetR > sizeR){
            // geomap.debug("offsetR 1");
            var scale=offsetR/sizeR;
            var startCoordX,startCoordY; 
            startCoordX = pos1.x - (pos1.x-cpos.x) * scale;
            startCoordY = pos1.y + (cpos.y - pos1.y) * scale;
            pos1=this.modelCoord(new Point(startCoordX,startCoordY).round());
            startCoord=this.screenToCoord(pos1);
          }else{
            // geomap.debug("offsetR 2");
            startCoord=this.center;
            // geomap.debug("2 startCoord="+startCoord.toString()+",center="+this.center.toString());
          }
          if(!coord.equals(this.center)){
              if(this._animMoveFn){
                this._animMoveFn.stop();
              }else{
                this._animMoveFn=new geomap.PosAnimation();
              }
            
              this._animMoveFn.run(this,function(pos){
              // this.moveTo(pos); 
             // geomap.debug("pos="+pos.toString());
              this.setCenter(pos);
              this.fire("drawmap");
            },[startCoord,coord],1,this);
          }

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
        //  this.canvas.width=size.x;
        //  this.canvas.height=size.y;
        //  this.canvas.style.width=size.x+"px";
        //  this.canvas.style.height=size.y+"px";
         geomap.util.element.createHiDPICanvas(this.canvas,size.x,size.y,this.canvasRatio);
         geomap.util.element.createHiDPICanvas(this.bgCanvas,size.x,size.y,this.canvasRatio);
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
      },
      clearGeometry:function(){
        this._geometrys=[];
        this._redrawing=true;
      }
      
     
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  