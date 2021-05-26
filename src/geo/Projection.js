
(function(global) {

    'use strict';
   
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Projection) {
      geomap.warn('geomap.Map is already defined.');
      return;
    } 

    var Point=geomap.Point;
    geomap.Projection = geomap.Class(geomap.CommonMethods, geomap.Observable, {
        transformtion:null,
        bounds:null,
        extent:[-180,-90,180,90],
        resolutions:[],
        initialize: function( options) {
            options || (options = { });
            this.transformtion=new geomap.Transformtion(2,0,-1,0); 
            // this.transformtion=new geomap.Transformtion(1,0,-1,0); 
            this._setOptions(options);
            var p0=new Point(this.extent[0],this.extent[1]);
            var p1=new Point(this.extent[2],this.extent[3]);
            this.bounds=new geomap.Bounds(p0,p1);
        }, 
        getBounds:function(){
            return this.bounds;
        },
        resolution:function(zoom){
            var r0=this.resolutions[zoom];
            if(!r0){
                var r= 1/Math.pow(2,zoom);
                r0= this.resolutions[zoom] =r;
            }
            return r0;
        },
        screenToCoord:function(p,zoom){
            this.transformtion.untransform(p,zoom);
        },
        coordToScreen:function(p,zoom){
            this.transformtion.transform(p,zoom);
        },
        getTransformtion:function(){
            return this.transformtion;
        }
    
    });
    
       
    
    })(typeof exports !== 'undefined' ? exports : this);