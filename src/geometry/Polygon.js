(function() { 
    var Point =geomap.Point;
    var Clone=geomap.util.object.clone;
    // var Extend=geomap.util.object.extend;

    geomap.Polygon=geomap.Class( geomap.Geometry,{
       initialize: function(map, options) {
      
        options || (options = { });
        // Extend(this,geomap.Geometry,true);
        // this._setOptions(options); 
        this.callSuper('initialize',map,options);
        // this._map=map;
        this._type=0;
      },
      setData:function (data){
        // var gtype=data.type;
        var gcoords=data.coordinates;
        this._type=0;
        this._coordinates=[];
        if(gcoords.length>0){
            var gcoord=gcoords[0];
            if(gcoord.length>0){
                for(var i=0,k=gcoord.length;i<k;i++){
                    this._coordinates.push(new Point(gcoord[i][0],gcoord[i][1]));
                }
            }
        }
        this._map.fire("drawmap");
        }
    });
  })();
  