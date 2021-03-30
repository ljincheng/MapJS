
(function(global) {

    'use strict';
  
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Palette) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }
   
    geomap.Palette = geomap.Class(geomap.CommonMethods, geomap.Observable,  {
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
      url:null,
      paths:[],
      initialize: function(options) {
        options || (options = { }); 
        this._setOptions(options); 
      }, 
      initLayer:function(canvas,map){
        this._canvas=canvas; 
        this.map=map;
        var el_offscreen_canvas=geomap.util.element.create("canvas",{},{zIndex:2,border:"1px solid blue",backgroundColor:"#e4e4e4",position:"absolute",top:"0px"});
        const offscreen_ctx=el_offscreen_canvas.getContext("2d");
        this._layerCanvas=el_offscreen_canvas;
        this._layerCtx=offscreen_ctx;
        this.resize();
        map.on("resize",this.resize.bind(this));
        map.on("viewreset",this.viewReset.bind(this));
        map.on("drag",this.drag.bind(this));
        map.on("touchzoomstart",this.touchZoomStart.bind(this));
        map.on("touchzoom",this.touchZoom.bind(this));
        map.on("touchzoomend",this.touchZoomEnd.bind(this));
        map.on("zoom",this.scrollZoom.bind(this));
        map.on("mousedown",this.mouseDown.bind(this));
        map.on("mousemove",this.mouseMove.bind(this));
        map.on("mouseup",this.mouseUp.bind(this));
      },
      resize:function(){
        var size=this.map.getSize();
        this.width=size.x;
        this.height=size.y;
        this._layerCanvas.width=size.x;
        this._layerCanvas.height=size.y;
        this._layerCanvas.style.width=size.x+"px";
        this._layerCanvas.style.height=size.y+"px";
      },
      touchZoomStart:function(arg){
        var event=arg.event,cpos=arg.point;
        this._drawStart=cpos;
      },
      touchZoom:function(arg){
        var event=arg.event,scale=arg.scale;
        this._canvasScale=geomap.util.formatNum(scale,4);
        this.map._redrawing=true;
      }, 
      touchZoomEnd:function(arg){
        var event=arg.event,scale=arg.scale;
        this.map._redrawing=true;
        this._draw();
      },
      scrollZoom:function(arg){
       
        this.map._redrawing=true;
        this._draw();
      },
      drag:function(e){
        this._draw();
    
      },
      mouseDown:function(e){
        var event=e.event,p=e.point;
        if(event.ctrlKey){
            this._opendraw=true;
            if(!this._pathing || this._pathing === null){
                this._pathing=new geomap.Path(this.map,0,true,{fillStyle:"rgba(0,0,0,0.7)"});
            }
        }else{
            this._opendraw=false;
        }  
      },
      mouseMove:function(e){
        var event=e.event,p=e.point;
        if(this._opendraw  && this._pathing){
            if(!event.ctrlKey){
                this.pathEnd(e,p);
            }else{
                this._pathing.moveTo(p); 
                this._draw();
            }
        }
      },
      mouseUp:function(e){
        var event=e.event,p=e.point;
        if(!this._opendraw){
           this.pathEnd(e,p);
        }else{
            if(this._opendraw  && this._pathing){
                var p=e.point;
                this._pathing.push(p); 
                this._draw();
                if(this._pathing.isEnd()){
                    this.pathEnd(e,p);
                }
            }
            
        }
      },
      pathEnd:function(e,p){
        if(this._pathing && this._pathing!=null){
            geomap.debug("dragE(END):"+p.toString()+",ectrKey="+e.event.ctrlKey);
           // this._pathing.push(p);
            this._pathing.end();
            this.paths.push(this._pathing);
            this._pathing=null;
            this._draw();
        }
      },
      _draw:function(){ 
        this._layerCtx.clearRect(0,0,this.width,this.height);
        this._drawStart && this._drawStart.zero();
        this._canvasScale=1;
        var z=this.map.zoom,bounds=this.map.getBounds(),res=this.map.resolution(z);
       
        if(this.paths.length>0){
            for(var i=0,k=this.paths.length;i<k;i++){
                var path=this.paths[i];
                path.render(this._layerCtx);
            }
        }
        if(this._pathing && this._pathing != null){
            this._pathing.render(this._layerCtx);
        }
        this.fire("draw");
      },
      time_event:function(){

      },
      draw:function(ctx,options){
        geomap.debug("(geomap_palette) draw=");
        var p0 = (this._drawStart || new Point(0,0)).round();
        var scale=this._canvasScale || 1;
        var size=this.map.getSize();
        var box=size._multiplyBy(scale).round();
        var p1=this.map.transformtion.transform(p0,1-scale).round();//._subtract(p0);
        ctx.drawImage(this._layerCanvas,p1.x,p1.y,box.x,box.y);
      },
      viewReset:function(){
 
      },
      drawlayer:function(z,res,point){
     
        geomap.debug("(geomap_palette) drawlayer="+z+",p="+point.toString());
     
      }
      
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  