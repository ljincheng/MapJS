

(function() {

    var Point =geomap.Point;
 
     geomap.MapEvent ={
            wheelZoomStart:function(e,p,delta){
                this.fire("zoomstart",{event:e,point:p,delta:delta,zoom:this.zoom});
            },
            wheelZoom:function(e,p,delta){
                var z=this.zoom+(delta>0?1:-1);
                var zoom=this._limitZoom(z);
                this.setZoomScreen(p,zoom);
                this.fire("zoom",{event:e,point:p,delta:delta,zoom:zoom});
            },
            wheelZoomEnd:function(e,p,delta){
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
                    this.panScreen(this.__startPos.subtract(p)); 
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
                geomap.debug("(Map_Event) newZoom="+newZoom);
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
  