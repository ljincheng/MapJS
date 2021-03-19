(function() {
    function extend(destination, source, deep) {
      if (deep) {
        if (!geomap.isLikelyNode && source instanceof Element) {
          destination = source;
        }
        else if (source instanceof Array) {
          destination = [];
          for (var i = 0, len = source.length; i < len; i++) {
            destination[i] = extend({ }, source[i], deep);
          }
        }
        else if (source && typeof source === 'object') {
          for (var property in source) {
            if (property === 'canvas' || property === 'group') {
              destination[property] = null;
            }
            else if (source.hasOwnProperty(property)) {
              destination[property] = extend({ }, source[property], deep);
            }
          }
        }
        else {
          destination = source;
        }
      }
      else {
        for (var property in source) {
          destination[property] = source[property];
        }
      }
      return destination;
    }
  
    function clone(object, deep) {
      return extend({ }, object, deep);
    }
  
    geomap.util.object = {
      extend: extend,
      clone: clone
    };
    geomap.util.object.extend(geomap.util, geomap.Observable);
  })();