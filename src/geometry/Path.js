(function() { 
    var Point =geomap.Point;

    geomap.Path=geomap.Class(geomap.Geometry, {
      lineDash:null,
       initialize: function(map, options) {
        // this._map=map;
        options || (options = { });
        this.callSuper('initialize',map,options); 
        //  this._setOptions(options); 
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