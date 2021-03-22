
(function(global) {

    'use strict';
  
    var extend = geomap.util.object.extend;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Layer) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }
   
    geomap.Layer = geomap.util.createClass(geomap.CommonMethods,  {
      type: 'object',
      width:100,
      height:100,
      originX:0,
      originY:0, 
      _canvas:null,
      initialize: function( options) {
        options || (options = { }); 
        this._setOptions(options);
      }, 
      initLayer:function(canvas){
        this._canvas=canvas;
      },
      draw:function(envelope){
          
      }
     
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  