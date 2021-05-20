(function() {

    var Point =geomap.Point;
    var Bounds =geomap.Bounds;
    var toPoint=geomap.util.toPoint;
    var defaultProject=new geomap.Projection({});
    geomap.Model={
        origin:new Point(0,0),
        tileSize:256,
        res:undefined,
        bounds:undefined,
        center:new Point(0,0),
        viewSize:undefined,
        zoom:0,
        projection:defaultProject,
        transformtion:new geomap.Transformtion(1,0,-1,0),
        // transformtion2:new geomap.Transformtion(1,0,1,0),
        // transformtion2:new geomap.Transformtion(1 / 180, 1, 1 / 180, 0.5),
        // transformtion3:new geomap.Transformtion(1 / 180, 1, -1 / 180, 0.5),
        // transformtion3:new geomap.Transformtion(1 / 180, 1, 1 / 180, 0.5),
        resolution:function(zoom)
        {
        //     var w=this.tileSize,h=this.tileSize*0.5;
        //     var x = (w / (Math.pow(2, zoom)) / this.tileSize);
        //     var y = (h / (Math.pow(2, zoom)) / this.tileSize);
        //    return new Point(x,y);
            var r=this.projection.resolution(zoom);
            var p1=this.projection.getTransformtion().transform(new Point(r,r),1);
            return p1;
        },
        getScale:function(zoom){
            // return this.tileSize * Math.pow(2,zoom);
            return Math.pow(2,zoom);
        },
        // getZoomScale:function(toZoom,fromZoom){
        //     fromZoom = fromZoom === undefined ? this.zoom:fromZoom;
        //     return this.getScale(toZoom) / this.getScale(fromZoom);
        //  },
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
                // var rp1=this.transformtion.transform(p1,1);
                var rp1=p1;
                min=cp1.subtract(rp1);
                max=cp1.add(rp1);
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
            // var min= coord.subtract(this.modelCoord(sc1._scaleBy(r1)));
            var min= coord.subtract(sc1._scaleBy(r1));
            this.center=this.getSize().divideBy(2)._scaleBy(r1).add(min);
            this.zoom=zoom;
            this._boundsChanged=true;
            return this;
        },
        setZoomScreen:function(point,zoom){ 
            var p1=toPoint(point); 
               r1=this.resolution(zoom),
              coord=this.screenToCoord(p1),
              viewHalf=this.getSize().divideBy(2),
              centerOffset=viewHalf.subtract(p1);
            //   this.center=coord._add(this.modelCoord(centerOffset._scaleBy(r1)));
              this.center=coord._add(centerOffset._scaleBy(r1));
            this.zoom=zoom;
            this._boundsChanged=true;
            return this;
        },
        panScreen:function(opts){
            var p1=toPoint(opts);
            var zoom=this.zoom;
            var  r1=this.resolution(zoom);
            // this.center._subtract(this.modelCoord(p1.scaleBy(r1)));
            this.center._subtract(p1.scaleBy(r1));
            this._boundsChanged=true;
        },
        screenToCoord:function(p0){
            var bounds=this.getBounds();
            // var r1=this.resolution(this.zoom),p1=this.transformtion.transform(r1._scaleBy(p0),1);
            var r1=this.resolution(this.zoom),p1=r1._scaleBy(p0);
           return bounds.min._add(p1);
        },
        coordToScreen:function(p0){
            var bounds=this.getBounds(); 
            // var r1=this.resolution(this.zoom),p1=this.transformtion.transform(p0.subtract(bounds.min),1);
            var r1=this.resolution(this.zoom),p1=p0.subtract(bounds.min);
             return p1._unscaleBy(r1);
        }
        // modelCoord:function(coord){
        //     return this.transformtion.transform(coord,1);
        // }

    }; 
     
  })();
  