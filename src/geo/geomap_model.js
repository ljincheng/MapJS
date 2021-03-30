(function() {

    var Point =geomap.Point;
    var Bounds =geomap.Bounds;
    var toPoint=geomap.util.toPoint;
    geomap.Model={origin:new Point(-180,-90),
        tileSize:256,
        res:undefined,
        bounds:undefined,
        center:new Point(0,0),
        viewSize:undefined,
        zoom:0,
        map:undefined,
        transformtion:new geomap.Transformtion(1,0,1,0),
        resolution:function(zoom)
        {
            var x = (360 / (Math.pow(2, zoom)) / this.tileSize);
            var y = (180 / (Math.pow(2, zoom)) / this.tileSize);
           return new Point(x,y);
        },
        getScale:function(zoom){
            return this.tileSize * Math.pow(2,zoom);
        },
        getZoomScale:function(toZoom,fromZoom){
            fromZoom = fromZoom === undefined ? this.zoom:fromZoom;
            return this.getScale(toZoom) / this.getScale(fromZoom);
         },
        getBounds:function(){
            return this._getBounds().clone();
        },
        _getBounds:function(){
            if(!this._bounds || this._boundsChanged){
                var r1,s1,p1,cp1,min,max;
                cp1=this.center;
                r1=this.resolution(this.zoom);
                s1=this.getSize().divideBy(2);
                p1=r1._scaleBy(s1);
                min=cp1.subtract(p1);
                max=cp1.add(p1);
                this._bounds= new Bounds(min,max);
                this._boundsChanged=false;
            }
            return this._bounds;
        },
        setZoom:function(zoom){
            if(this.zoom!=zoom){
                this._boundsChanged=true;
            }
            this.zoom=zoom;
            return this;
        },
        setZoomCoord:function(coord,zoom){ 
            if(this.zoom==zoom){
                return this;
            }
            var sc1=this.coordToScreen(coord);
            var r1=this.resolution(zoom);
            var min= coord.subtract(sc1._scaleBy(r1));
            this.center=this.getSize()._unscaleBy(2)._scaleBy(r1).add(min);
            this.zoom=zoom;
            this._boundsChanged=true;
            return this;
        },
        setZoomScreen:function(point,zoom){ 
            var p1=point; 
               r1=this.resolution(zoom),
              coord=this.screenToCoord(p1),
              viewHalf=this.getSize().divideBy(2),
              centerOffset=viewHalf.subtract(p1);
              this.center=coord.add(centerOffset.scaleBy(r1));
            this.zoom=zoom;
            this._boundsChanged=true;
            return this;
        },
        panScreen:function(opts){
            var p1=new Point(opts.x,opts.y);
            var zoom=opts.z || this.zoom;
            var  r1=this.resolution(zoom);
            this.center._add(p1.scaleBy(r1));
            this._boundsChanged=true;
        },
        screenToCoord:function(p0){
            var bounds=this.getBounds();
            var r1=this.resolution(this.zoom);
            var  p1=r1._scaleBy(p0);
          return bounds.min._add(p1);
        },
        coordToScreen:function(p0){
            var bounds=this.getBounds();
            var r1=this.resolution(this.zoom);
            var p1=p0.subtract(bounds.min);
            return p1._unscaleBy(r1);
        }

    }; 
     
  })();
  