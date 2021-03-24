
(function(global) {

    var sqrt = Math.sqrt,
        atan2 = Math.atan2,
        pow = Math.pow,
        PiBy180 = Math.PI / 180,
        PiBy2 = Math.PI / 2;

    geomap.util = {
 
      formatNum: function(num,digits){

        var pow=Math.pow(10,(digits === undefined ? 6:digits));
        return Math.round(num * pow) / pow;
      },
      isArray: Array.isArray || function(obj){
        return (Object.prototype.toString.call(obj)=== '[object Array]');
      },
      cos: function(angle) {
        if (angle === 0) { return 1; }
        if (angle < 0) {
          // cos(a) = cos(-a)
          angle = -angle;
        }
        var angleSlice = angle / PiBy2;
        switch (angleSlice) {
          case 1: case 3: return 0;
          case 2: return -1;
        }
        return Math.cos(angle);
      },
  
      sin: function(angle) {
        if (angle === 0) { return 0; }
        var angleSlice = angle / PiBy2, sign = 1;
        if (angle < 0) {
          // sin(-a) = -sin(a)
          sign = -1;
        }
        switch (angleSlice) {
          case 1: return sign;
          case 2: return 0;
          case 3: return -sign;
        }
        return Math.sin(angle);
      },
      matrixAdd: function(m1,m2){
        return [m1[0]+m2[0],m1[1]+m2[1]];
      },
      matrixSubtract: function(m1,m2){
        return [m1[0]-m2[0],m1[1]-m2[1]];

      },
      matrixMultiply:function(m1,m2){
        return [m1[0]*m2[0],m1[1]*m2[1]];
      },
      posFloor:function(p){
          p[0]=p[0]>0?Math.floor(p[0]):Math.ceil(p[0]);
          p[1]=p[1]>0?Math.floor(p[1]):Math.ceil(p[1]);
        return p;
      }
    

    };
  })(typeof exports !== 'undefined' ? exports : this);
  