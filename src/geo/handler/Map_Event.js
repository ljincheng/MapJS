

(function() {

    var Point =geomap.Point;
 
    var MapDrag = geomap.Class(geomap.CommonMethods,geomap.EventDrag,{
        initialize: function(map, options) {
            options || (options = { }); 
            this._setOptions(options); 
            this._map=map;
          }, 
          addEvent:function(element){
            eventjs.add(element,"drag",this.dragEvent.bind(this));
          },
          start:function(event,point){
            this._startPoint=point;
            this._map.fire("dragstart",{event:event,point:point.clone()});
          },
          end:function(event,point){
            geomap.debug("======drag end:point="+point.toString());
            this._map.fire("dragend",{event:event,point:point});
          },
          change:function(event,point){
            // this._startPos=pos;
            var pos=this._startPoint.subtract(point);
            geomap.debug("change:pos="+pos.toString());
            this._map.model.panScreen(pos);
            this._startPos=point;
            this._map.fire("drag",{event:event,point:point});
          }
    });
     
  
    geomap.MapEvent2={Drag:MapDrag};
     
 
  })();
  