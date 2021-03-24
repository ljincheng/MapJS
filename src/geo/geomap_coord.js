
(function(global) {
    geomap.coord = {
      setPoint: function(objcoord,p){
        if(typeof objcoord === 'object' && 'x' in objcoord && 'y' in objcoord){
          objcoord.x=p.x;
          objcoord.y=p.y;
        }
        return objcoord;
      },
      size:function(startP,endP){
          var w=endP.x - startP.x;
          var h=endP.y - startP.y;
          return [w,h];
      },
      minus:function(startP,p){
        startP.x=startP.x-p.x;
        startP.y=startP.y-p.y;
        return startP;
      }
    };
  })(typeof exports !== 'undefined' ? exports : this);
  