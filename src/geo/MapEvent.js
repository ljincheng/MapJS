

(function() {

    var Point =geomap.Point;
 
     geomap.MapEvent ={
        wheelDebounceTime:40,
        wheelPxPerZoomLevel:60,
        _preformWheelZoom:function(event,point){
            var delta=this._wheel_delta,startZoom=this.zoom,
                zoom=this.zoom,snap=0,
            d2=delta / (this.wheelPxPerZoomLevel * 4),
            d3= 4 * Math.log(2/(1 + Math.exp(-Math.abs(d2)))) / Math.LN2,
            d4 = snap ? Math.ceil(d3/snap) * snap : d3,
            zoomDelta=this._limitZoom(zoom+(this._wheel_delta > 0 ? d4 : -d4)) - zoom;

             geomap.debug("_wheel_delta="+this._wheel_delta+",d0="+ this._wheel_d0);

             if(this._wheel_delta>0){
                 if(this._wheel_d0>=0){ 
                    if(this._wheel_d0<this._wheel_delta){
                        this._wheel_d0=this._wheel_delta;
                    }else{
                        if(this._wheel_d1==0){
                            this._wheel_d1=1;
                            //TODO fire
                            geomap.debug("fire zoom +");
                            var zoom=this._limitZoom(this.zoom+1);
                             this.setZoomScreen(point,zoom);
                            this.fire("zoom",{event:event,point:point,delta:this._wheel_delta});
                        } 
                    }
                    
                 }
             }else{
                 if(this._wheel_d2<=0){
                    if(this._wheel_d2<=this._wheel_delta){
                        this._wheel_d2=this._wheel_delta;
                    }else{
                        if(this._wheel_d1==0){
                            this._wheel_d1=1;
                            //TODO fire
                            geomap.debug("fire zoom -");
                            var zoom=this._limitZoom(this.zoom-1);
                             this.setZoomScreen(point,zoom);
                            this.fire("zoom",{event:event,point:point,delta:this._wheel_delta});
                        }  
                    }
                 } 

             }
             
            this._wheel_delta=0;
            this.__wheel_startTime=null;
            if(!zoomDelta){
                return ;
            }
             var endZoom=Math.ceil(zoom+zoomDelta);
            //  geomap.debug("(Map_Event)endZoom="+endZoom+"|"+zoom+",d4="+d4+",zoomDelta="+zoomDelta+",delta="+delta);
            // this.setZoomScreen(point,endZoom);
            // this.fire("zoom",{event:event,point:point,delta:zoomDelta,startZoom:startZoom,endZoom:endZoom});
        },
            wheelZoomStart:function(e,p,delta){
                this._wheel_delta=0;
                this._wheel_d0=0;
                this._wheel_d1=0;
                this._wheel_d2=0;
                this.fire("zoomstart",{event:e,point:p,delta:delta,zoom:this.zoom});
            },
            wheelZoom:function(e,p,delta){

                
                this._wheel_delta +=delta;
              //  geomap.debug("delta="+delta+",w="+this._wheel_delta);

                if(!this.__wheel_startTime){
                    this.__wheel_startTime= +new Date(); 
                }
                var left=Math.max(this.wheelDebounceTime - (+new Date() - this.__wheel_startTime),0);
               // geomap.debug("left="+left);
                if(this.__wheeltimer){
                    clearTimeout(this.__wheeltimer);
                    this.__wheeltimer=null;
                }
                 
                this.__wheeltimer=setTimeout(this._preformWheelZoom.bind(this,e,p),left);

                // var z=this.zoom+(delta>0?1:-1);
                // var zoom=this._limitZoom(z);
                // this.setZoomScreen(p,zoom);
                // this.fire("zoom",{event:e,point:p,delta:delta,zoom:zoom});
            },
            wheelZoomEnd:function(e,p,delta){
                this._wheel_d0=0;
                this._wheel_d1=0;
                this._wheel_d2=0;
                geomap.debug("_wheel_delta(END)="+this._wheel_delta);
                this.fire("zoomend",{event:e,point:p,delta:delta});
            },
            dragStart:function(e,p){
                this.__startPos=p;
                
                this.__bounds_changed= !e.ctrlKey;
                
                this.fire("dragstart",{event:e,point:p,boundsChanged:this.__bounds_changed});
            },
            dragChange:function(e,p){
                this.__bounds_changed= !e.ctrlKey;
                if(this.__bounds_changed){
                    // this.panScreen(this.__startPos.subtract(p)); 
                    this.panScreen(p.subtract(this.__startPos)); 
                }
                this.fire("drag",{event:e,point:p,boundsChanged:this.__bounds_changed});
                this.__startPos=p;
            },
            dragEnd:function(e,p){
                //this.__bounds_changed= !e.ctrlKey;
                this.fire("dragend",{event:e,point:p,boundsChanged:this.__bounds_changed});
                this.__bounds_changed=true;
            },
            touchZoomStart:function(e,p){
                    this.__touch_point=p;
                    this.__touch_zoom=this.zoom;
                this.fire("touchzoomstart",{event:e,point:p});
            },
        touchZoom:function(e,p,scale){
                geomap.debug("(Map_Event) scale="+scale);
                    var r0=this.getScale(this.__touch_zoom);
                    var s1=r0 * scale;
                var newZoom=Math.round(Math.log(s1/256) / Math.LN2);
                // var z=geomap.util.formatNum(scale,1)-1+this.__touch_zoom;
                var z=newZoom;
                this.setZoomScreen(this.__touch_point,z);
                this.zoom=z;
                this.fire("touchzoom",{event:e,scale:scale,point:this.__touch_point});
            },
            touchZoomEnd:function(e,p,scale){
                var r0=this.getScale(this.__touch_zoom);
                var s1=r0 * scale;
                var newZoom=Math.round(Math.log(s1/256) / Math.LN2);
                var z=newZoom;
                geomap.debug("(Map_Event) newZoom="+newZoom);
                // var z=geomap.util.formatNum(scale,1)-1+this.__touch_zoom;
                this.setZoomScreen(this.__touch_point,z);
                this.zoom=z;
                this.fire("touchzoomend",{event:e,scale:scale,point:this.__touch_point});
                }
            
        };
     
  
   // geomap.MapEvent2=MapEvent;
     
 
  })();
  