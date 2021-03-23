
(function(global) {

    'use strict';
  
    var extend = geomap.util.object.extend;
  
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
      origin:{x:-180,y:90},
      viewOrigin:{x:0,y:0},
      tileSize:256,
      center:{x:0,y:0},
      canvas:null,
      canvasCtx:null,
      _z:2,
      _maxz:11,
      _minz:0,
      _layers:[],
      _move_start:null,
      _pos:null,
      _move_type:-1,
      _global_interval:null,
      _canrender:true,
      initialize: function(element, options) {
        options || (options = { }); 
        this._setOptions(options);  
        this._element = element;
        this._pos={x:0,y:0};
        this._move_start={x:0,y:0};
        this.setCenterCoord(this.center);
        this._initModel();
        this._initElement();
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
      },
      _initEvent:function(){
        eventjs.add(this.canvas,"click",function(event,self){ 
          var coord=this.getCoord({left:self.x,top:self.y});
          geomap.log("click coord:"+coord.x+","+coord.y);
        }.bind(this));
          eventjs.add(this.canvas,"drag",function(event,self){ 
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
            console.log("##testMove: left="+opts.left+",top="+opts.top);
            this._handleEvent.call(this,opts);
            }
          }.bind(this));
 
          eventjs.add(this.canvas,"wheel",function(event,self){ 
            geomap.log("wheel Event:state="+self.state+",wheelDelta="+self.wheelDelta+",gesture="+self.gesture+",pos"+event.clientX+","+event.clientY);
            var opts={left:event.offsetX,top:event.offsetY,wheelDelta:self.wheelDelta,gesture:self.gesture,state:self.state};
            this._handleEvent.call(this,opts);
          }.bind(this));
      },
      _handleEvent:function(opts){
        if(opts.gesture =="wheel"){
          if(opts.wheelDelta>0){
           if(this._maxz>this._z){
             var z=this._z+1;
             var scaleOpts={left:opts.left,top:opts.top,z:z};
             var coord=this.getCoord(scaleOpts);
             scaleOpts.x=coord.x;
             scaleOpts.y=coord.y;
             this.scalePoint(scaleOpts);
             this.fire("drawmap");
           }
           
          }else if(opts.wheelDelta<0){
            if(this._minz<this._z){
              var z=this._z-1;
              var scaleOpts={left:opts.left,top:opts.top,z:z};
              var coord=this.getCoord(scaleOpts);
              scaleOpts.x=coord.x;
              scaleOpts.y=coord.y;
              this.scalePoint.call(this,scaleOpts);
              this.fire("drawmap");
            }
            
          }
          
        }else if(opts.gesture=="drag"){
              var z=this._z;
              // var speed=geomap.util.event.speeding();
              // var scaleOpts={left:Math.floor(opts.left+speed[0]-this._move_start.x),top:Math.floor(opts.top+speed[1]-this._move_start.y),z:z};
              var scaleOpts={left:Math.floor(opts.left-this._move_start.x),top:Math.floor(opts.top-this._move_start.y),z:z};
              this._move_start.x=opts.left;
              this._move_start.y=opts.top;
              this.translation.call(this,scaleOpts);
              this.fire("drawmap");
        }
      },
      _initModel:function(){
        extend(this.origin,{x:-180.00,y:90.00});
      },
      time_event:function(){
        for(var i=0,k=this._layers.length;i<k;i++){
          var layer=this._layers[i];
              layer.time_event();
        }
        this._draw.call(this);
      },
      _draw:function(){
        if(this._canrender==true || this._move_type==1){
          this._canrender=false;
          const ctx=this.canvasCtx;
          var wh=geomap.coord.size(this._move_start,this._pos);
         // console.log("drawMap:x="+this._move_start.x+",y="+this._move_start.y+",w="+wh[0]+",h="+wh[1]+",pos="+this._pos.x+","+this._pos.y);
          this._clearCanvas();
          var z=this._z;
          var opt={z:z,viewOrigin:this.viewOrigin};
            for(var i=0,k=this._layers.length;i<k;i++){
                  var layer=this._layers[i];
                  layer.draw(ctx,opt);
            }
            ctx.strokeRect(this._move_start.x,this._move_start.y,wh[0],wh[1]);
           
        }
      },
      getCoord:function(opts){
        var left=opts.left,top=opts.top;
        var z=this._z;
        var vx=this.viewOrigin.x,vy=this.viewOrigin.y;
        var res=this.resolution(z);
        var p={x:res.x*left+vx,y:vy-res.y*top};
        return p;
      },
      scalePoint:function(opts){
        var left=opts.left,top=opts.top,x=opts.x,y=opts.y,z=opts.z;
        var res=this.resolution(z);
        this.viewOrigin.x=x-res.x*left;
        this.viewOrigin.y=y+res.y*top;
        this._z=z;
      },
      translation:function(opts){
        var left=opts.left,top=opts.top;
        var res=this.resolution(this._z);
        this.viewOrigin.x -=res.x*left;
        this.viewOrigin.y +=res.y*top;
      },
      setCenterCoord:function(cxy){
        geomap.coord.setPoint(this.center,cxy);
        var z=this._z;
        var res=this.resolution(z);
        var cx= this.center.x- Math.floor((this.width * res.x)/2);
        var cy=this.center.y + Math.floor((this.height * res.y)/2);
        geomap.coord.setPoint(this.viewOrigin,{x:cx,y:cy});
      },
      _drawlayer:function(){
            var z=this._z;
            var res=this.resolution(z);
            var startPos=[this.viewOrigin.x,this.viewOrigin.y];
           for(var i=0,k=this._layers.length;i<k;i++){
            var layer=this._layers[i];
            layer.drawlayer(z,res,startPos);
          }
         
      },
      _clearCanvas:function(){
        this.canvasCtx.clearRect(0,0,this.width,this.height);
      },
      resolution:function(level)
      {
          var x = (360 / (Math.pow(2, level)) / this.tileSize);
          var y = (180 / (Math.pow(2, level)) / this.tileSize);
         return { x: x, y: y };
      },
      addLayer:function(layer){
        this._layers.push(layer);
        this._loadLayer(layer);
      },
      _loadLayer:function(layer){
        layer.on("draw",function(){this._canrender=true;}.bind(this));
        layer.initLayer(this.canvas,this);
        
        this.fire("drawmap");
      }
     
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  