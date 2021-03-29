
(function(global) {

    var sqrt = Math.sqrt,
        atan2 = Math.atan2,
        pow = Math.pow,
        PiBy180 = Math.PI / 180,
        PiBy2 = Math.PI / 2;

    var templateRe=/\{ *([\w_ -]+) *\}/g;
    geomap.util = {
 
      formatNum: function(num,digits){

        var pow=Math.pow(10,(digits === undefined ? 6:digits));
        return Math.round(num * pow) / pow;
      },
      isArray: Array.isArray || function(obj){
        return (Object.prototype.toString.call(obj)=== '[object Array]');
      },
      template:function(str,data){
        return str.replace(templateRe,function(str,key){
          var value=data[key];
          if(value === undefined){
            throw new Error("变量值不存在"+key+"|"+str);
          }else if(typeof value === 'function'){
            value=value(data);
          }
          return value;
        });
      }
    

    };
  })(typeof exports !== 'undefined' ? exports : this);
  