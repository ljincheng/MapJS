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
   
    geomap.Map = geomap.util.createClass(geomap.CommonMethods, geomap.Observable, {
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
      _move_start:null,
      _pos:null,
      _move_type:-1,
      _global_interval:null,
      _canrender:true,
      _container:undefined,
      model:undefined,
      initialize: function(element, options) {
        options || (options = { });  
        this._setOptions(options);  
        if(options.debug){
          geomap.debug=options.debug;
        }
        if(this.center === undefined){
          this.center=new Point(0,0);
        }else{
          this.center=geomap.util.toPoint(this.center);
        }
        this._element = element;
        this._pos={x:0,y:0};
        this._move_start={x:0,y:0}; 
        this._initElement();
        this._initModel();
        this._initEvent();
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
        var el_canvas=geomap.util.element.create("canvas",{id:"_map_canvas",width:this.width,height:this.height},{zIndex:2,border:"0px solid red",backgroundColor:"#e4e4e4",position:"absolute",width:this.width+"px",height:this.height+"px"});
        this._element.appendChild(el_canvas);
        this.canvas=el_canvas;
        const ctx=el_canvas.getContext("2d");
        this.canvasCtx=ctx;
        this._container=el_canvas;
      },
    _touchZoomEvent:function(){

    },
      _initEvent:function(){
        //调试
        // eventjs.add(this.canvas,"mousemove",function(event,self){ 
          
        //   var coord=this.getCoord(new Point(event.offsetY,event.offsetY));
        //   var bounds=this.model.getBounds();
        //   geomap.log("point coord:"+coord.x+","+coord.y+",bounds:"+bounds.toString());
        // }.bind(this));
        
        eventjs.add(this.canvas,"gesture",function(event,self){ 
          //eventjs.prevent();
          eventjs.cancel(event);
         // if(self.fingers>1){
            var rotation=self.rotation,scale=self.scale,state=self.state,fingers=self.fingers;
            
            if(self.state == "start"){
              this._event_type=10;
              this._zoomScaleV=scale;
              geomap.debug("gesture:state="+state+",rotation="+rotation+",scale="+scale);
            }else if(self.state == "stop")
            {
              this._event_type=0;
              this._zoomScaleV=1;
              geomap.debug("gesture:state="+state+",rotation="+rotation+",scale="+scale+",fingers="+fingers);
            }else{
              var touches=event.touches;
              var move0=touches[0].clientX+","+touches[0].clientY;
              var move1=touches[1].clientX+","+touches[1].clientY;

              var left=Math.floor((touches[0].clientX + touches[1].clientX)/2);
              var top=Math.floor((touches[0].clientY + touches[1].clientY)/2);
              var _scaleV=Math.round(scale)-this._zoomScaleV;
              var z=this.zoom+_scaleV;
              this.fire("zoom",{z:z,x:left,y:top});
              this.fire("drawmap");

             geomap.debug("gesture:state="+state+",rotation="+rotation+",scale="+scale+",fingers="+fingers+"m0="+move0+",m1="+move1);
            }
            
          //}
          
        }.bind(this));


          eventjs.add(this.canvas,"drag",function(event,self){ 
            eventjs.cancel(event);
            geomap.coord.setPoint(this._pos,self);
            geomap.util.event.moving(self.x,self.y); 
            if(self.state=="down"){
                this._move_type=1;
                geomap.coord.setPoint(this._move_start,self);
                geomap.util.event.speedStart(self.x,self.y);
            }else if(self.state =="move"){ 
                
            }else{
              this._move_type=-1; 
              geomap.util.event.speedEnd();       
            }

            if( this._move_type==1 && !event.ctrlKey){
            var left=self.x;
            var top=self.y;
            var opts={left:left,top:top,wheelDelta:0,gesture:self.gesture,state:self.state};
            geomap.debug("##testMove: left="+opts.left+",top="+opts.top);
            this._handleEvent.call(this,opts);
            }
          }.bind(this));
 
          eventjs.add(this.canvas,"wheel",function(event,self){ 
            geomap.debug("wheel Event:state="+self.state+",wheelDelta="+self.wheelDelta+",gesture="+self.gesture+",pos"+event.clientX+","+event.clientY);
            var opts={left:event.offsetX,top:event.offsetY,wheelDelta:self.wheelDelta,gesture:self.gesture,state:self.state};
            this._handleEvent.call(this,opts);
          }.bind(this));
      },
      _handleEvent:function(opts){
        if(opts.gesture =="wheel"){
          if(opts.wheelDelta>0){
           if(this.maxZoom>this.zoom){

             var z=this.zoom+1;
             this.zoom=z; 
             this.fire("zoom",{z:z,x:opts.left,y:opts.top});
             this.fire("drawmap");
           }
           
          }else if(opts.wheelDelta<0){
            if(this.minZoom<this.zoom){
              var z=this.zoom-1;
              this.zoom=z;
              this.fire("zoom",{z:z,x:opts.left,y:opts.top});
              this.fire("drawmap");
            }
            
          }
          
        }else if(opts.gesture=="drag"){
              var z=this.zoom;
              var scaleOpts={left:Math.floor(opts.left-this._move_start.x),top:Math.floor(opts.top-this._move_start.y),z:z};
              if(Math.abs(scaleOpts.left)>2 && Math.abs(scaleOpts.top )>2 ){ 
              this.fire("move",{z:z,x:-scaleOpts.left,y:-scaleOpts.top});
              this._move_start.x=opts.left;
              this._move_start.y=opts.top;
              this.fire("drawmap");
              }
        }
      },
      _initModel:function(){
        if(this.model=== undefined){
          this.model=new Model(this,{center:this.center,zoom:this.zoom});
        }
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
      _draw:function(){
        if(this._canrender==true || this._move_type==1){
          this._canrender=false;
          const ctx=this.canvasCtx;
          var wh=geomap.coord.size(this._move_start,this._pos);
          this.canvasCtx.clearRect(0,0,this.width,this.height);
          for(var i=0,k=this.layers.length;i<k;i++){
                var layer=this.layers[i];
                layer.draw(ctx);
          }
            ctx.strokeRect(this._move_start.x,this._move_start.y,wh[0],wh[1]);
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
        layer.on("draw",function(){this._canrender=true;}.bind(this));
        layer.initLayer(this.canvas,this);
        
        this.fire("drawmap");
      }
     
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  