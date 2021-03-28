(function() {

    var Point =geomap.Point;
    var Bounds =geomap.Bounds;
    var toPoint=geomap.util.toPoint;
    geomap.Model = geomap.Class(geomap.CommonMethods, geomap.Observable, {
        type: 'object',
        origin:new Point(-180,-90),
        tileSize:256,
        res:undefined,
        bounds:undefined,
        center:undefined,
        viewSize:undefined,
        zoom:0,
        map:undefined,
        transformtion:new geomap.Transformtion(1,0,1,0),
        initialize: function(map,options) {
            options || (options = { });  
            this._setOptions(options);
            this.map=map;
            if(this.center === undefined){
                this.center=new Point(0,0);
            }
           // this.transformtion=new geomap.Transformtion(1,0,1,0);
            //this.map.on("zoom",this.setZoomScreen.bind(this));
            // this.map.on("move",this.panScreen.bind(this));
            // this.map.on("dragstart",this.dragStart.bind(this));
            // this.map.on("drag",this.drag.bind(this));
        },
        // dragStart:function(arg){
        //     var event=arg.event,self=arg.self;
        //     this._dragStartPos=new Point(self.x,self.y);
        //   },
        // drag:function(arg){
        //     var event=arg.event,self=arg.self;
        //     var pos=new Point(self.x,self.y);
        //     var  r1=this.resolution(this.zoom);
        //     this.center._add(this._dragStartPos.subtract(pos).scaleBy(r1));
        //     this._boundsChanged=true;   
        // },
        resolution:function(zoom)
        {
            var x = (360 / (Math.pow(2, zoom)) / this.tileSize);
            var y = (180 / (Math.pow(2, zoom)) / this.tileSize);
           return new Point(x,y);
        },
        getBounds:function(){
            return this._getBounds().clone();
        },
        _getBounds:function(){
            if(!this._bounds || this._boundsChanged){
                var r1,s1,p1,cp1,min,max;
                cp1=this.center;
                r1=this.resolution(this.zoom);
                s1=this.map.getSize().divideBy(2);
                p1=r1._scaleBy(s1);
                min=cp1.subtract(p1);
                max=cp1.add(p1);
                this._bounds= new Bounds(min,max);
                this._boundsChanged=false;
               
            }
            return this._bounds;
        },
        getZoomScale:function(zoom){
            var r1,r2;
            if(this.zoom==zoom){
                return new Point(1,1);
            }
            r1=this.resolution(this.zoom);
            r2=this.resolution(zoom);
            return r2._unscaleBy(r1);
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
            var sc1=this.coordToScreen(p0);
            var  r1=this.resolution(zoom);
            var min= coord.subtract(sc1._scaleBy(r1));
            this.center=this.map.getSize()._unscaleBy(2)._scaleBy(r1).add(min);
            this.zoom=zoom;
            this._boundsChanged=true;
            return this;
        },
        setZoomScreen:function(opts){ 
            var zoom=opts.z;
            var p1=new Point(opts.x,opts.y);
            var coord=this.screenToCoord(p1); 
            var  r1=this.resolution(zoom);
            var min= coord._subtract(p1.scaleBy(r1));
            this.center=this.map.getSize()._scaleBy(r1)._divideBy(2).add(min);
            
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

    }); 
     
  })();
  