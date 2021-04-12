
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
   
    geomap.PaletteLayer = geomap.Class(geomap.CommonMethods, geomap.Observable, geomap.Layer,  {
      type: 'PaltteLayer',
      paths:[],
      drawType:0,
      fill:true,
      loopRender:false,
      _enabled:true,
      initialize: function(options) {
        options || (options = { }); 
        this._setOptions(options);
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
      ViewReset:function(){ 
        if(!this.wheelZoomChanage && (this._canvasScale==1 || this._canvasScale == undefined )){
          this.canvasCtx.clearRect(0,0,this.width,this.height);
            this._canvasScale=1;
            var z=this._map.zoom,bounds=this._map.getBounds(),res=this._map.resolution(z);
            this.loopRender=false;
            if(this.paths.length>0){
                for(var i=0,k=this.paths.length;i<k;i++){
                    var path=this.paths[i];
                    path.render(this.canvasCtx);
                    if(path.loopRender){
                      this.loopRender=true;
                    }
                }
            }
            if(this._pathing && this._pathing != null){
                this._pathing.render(this.canvasCtx);
            }
            this.fire("drawCanvas");
        }
      }
       
     
       
      
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  