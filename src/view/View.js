
(function(global) {

    if (!global.geomap) {
        global.geomap = { };
      }
    
      if (global.geomap.view) {
        geomap.warn('geomap.Map is already defined.');
        return;
      }
    
      geomap.view ={};

  })(typeof exports !== 'undefined' ? exports : this);