
(function(global) {
    geomap.coord = {
      setPoint: function(objcoord,p){
        objcoord["x"]=p.x;
        objcoord["y"]=p.y;
        return objcoord;
      },
      size:function(startP,endP){
          var w=endP.x - startP.x;
          var h=endP.y - startP.y;
          return [w,h];
      }
    };
  })(typeof exports !== 'undefined' ? exports : this);
  