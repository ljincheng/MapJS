
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
   
    geomap.PaletteLayer = geomap.Class( geomap.Layer,  {
      type: 'PaltteLayer',
      paths:[],
      drawType:0,
      fill:true,
      loopRender:false,
      _enabled:true,
      referenceLine:false,
      initialize: function(options) {
        this.callSuper('initialize',options);
        this.on("initLayer",this.OnInitLayer.bind(this));
      }, 
      OnInitLayer:function(){
        this._map.on("mousedown",this.OnMouseDown.bind(this));
        this._map.on("mousemove",this.OnMouseMove.bind(this));
        this._map.on("mouseup",this.OnMouseUp.bind(this));
        this.transformtion.setOrigin(0,0);
      },
      setType:function(gtype,fill){
          this.drawType=gtype;
          if(fill!= undefined){
            this.fill=fill;
          }
        
          if(this._pathing){
              this._pathing.setType(this.drawType,this.fill);
          }
      },
      OnMouseDown:function(e){
        if(!this._enabled){
          return ;
        }
        var event=e.event,p=e.point; 
        if(event.ctrlKey){
            eventjs.cancel(event);
            this._opendraw=true;
            if(this._palette_drawing){
              this.fire("draw_point",e);
            }else{
              this._palette_drawing=true;
              this.fire("draw_start",e);
            }
            
            if(!this._pathing || this._pathing === null){
                this._pathing=new geomap.Path(this._map,{lineDash:[]});
                this._pathing.setType(this.drawType,this.fill);
            }
        }else{
            this._opendraw=false;
        }  
      },
      OnMouseMove:function(e){
        if(!this._enabled){
          return ;
        }
        var event=e.event,p=e.point;
        if(this._opendraw){
          if(!event.ctrlKey){
            if(this._palette_drawing){
              this._palette_drawing=false;
              this.fire("draw_end",e);
            } 
          }else{
              if(this._palette_drawing){
                this.fire("draw_moving",e);
              } 
          }
                
          if( this._pathing){
              if(!event.ctrlKey){
                  this.PathEnd(e,p);
              }else{
                  this._pathing.moveTo(p); 
                  this.ViewReset();
              }
          }
        }
      },
      OnMouseUp:function(e){
        if(!this._enabled){
          return ;
        }
        var event=e.event,p=e.point;
      
        if(!this._opendraw){ 
           this.PathEnd(e,p);
        }else{ 
            if(this._opendraw  && this._pathing){
                var p=e.point;
                this._pathing.push(p); 
                this.ViewReset();
                if(this._pathing.isEnd()){
                    this.PathEnd(e,p);
                }
            }
            
        }
      },
      addGeometry:function(geomtry){
        this.paths.push(geomtry);
        this.ViewReset();
      },
      clearGeometry:function(){
        this.paths=[];
        this.ViewReset();
      },
      PathEnd:function(e,p){
        if(this._pathing && this._pathing!=null){
            this._pathing.end();

            this.fire("geometry_change",this._pathing);
            this.paths.push(this._pathing);
            this._pathing=null;
            this.ViewReset();
        }
      },
      OnLoopTime:function(){ 
        if(this.loopRender && (this._canvasScale==1 || this._canvasScale == undefined )){
          this._dragOffset=null;//实时重绘canvas，不需要拖拽偏移量。
           this.ViewReset();
        }
      },
      drawingCanvas:function(ctx){
        this.callSuper('drawingCanvas',ctx);
        this.drawReferenceLine(ctx);
      },
      // drawingCanvas:function(ctx){
        
      //   var map=this._map,zeroP=new Point(0,0),
      //   size=this.getCanavsSize(),
      //   offsetDrag=this._dragOffset || zeroP,
      //   p0 = (this._touchZoomStart || zeroP),
      //   scale=(this._canvasScale || 1),
      //   box=size.multiplyBy(scale).round();
      //   var baseP1=this.transformtion.transform(p0.clone(),scale)._add(p0).add(offsetDrag).round();
      //   ctx.drawImage(this.canvas,baseP1.x,baseP1.y,box.x,box.y);
      //   this.drawReferenceLine(ctx);
      // } ,
      ViewReset:function(){ 
        var ctx=this.canvasCtx;
        if(!this.wheelZoomChanage && (this._canvasScale==1 || this._canvasScale == undefined )){
          ctx.clearRect(0,0,this.width,this.height);
          ctx.setLineDash([]);
            this._canvasScale=1;
            var z=this._map.zoom,bounds=this._map.getBounds(),res=this._map.resolution(z);
            this.loopRender=false;
            if(this.paths.length>0){
                for(var i=0,k=this.paths.length;i<k;i++){
                    var path=this.paths[i];
                    path.render(ctx);
                    if(path.loopRender){
                      this.loopRender=true;
                    }
                }
            }
            if(this._pathing && this._pathing != null){
                this._pathing.render(ctx);
            }
            this.fire("drawCanvas");
        }
      },
      toggleReferenceLine:function(){
        this.toggle("referenceLine");
        // this.ViewReset();
        this.fire("drawCanvas");
      },
      drawReferenceLine:function(ctx){
        if(!this.referenceLine){
          return;
        }
        var w=this.width,h=this.height,divide=20;
        ctx.strokeStyle = "rgba(66, 66, 66, 0.3)";
        ctx.beginPath();
        for(var i=0;i<w;i++){
          var x=i*divide,y=0;
           ctx.moveTo(x,y);
           ctx.lineTo(x,h);
        }
        for(var i=0;i<h;i++){
          var y=i*divide,x=0;
          ctx.moveTo(x,y);
          ctx.lineTo(w,y);
        }
        ctx.stroke();
        divide=10;
        ctx.strokeStyle = "rgba(224, 224, 224, 0.3)";
        ctx.beginPath();
        for(var i=0;i<w;i++){
          var x=i*divide,y=0;
           ctx.moveTo(x,y);
           ctx.lineTo(x,h);
        }
        for(var i=0;i<h;i++){
          var y=i*divide,x=0;
          ctx.moveTo(x,y);
          ctx.lineTo(w,y);
        }
        ctx.stroke();
      }

       
     
       
      
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  