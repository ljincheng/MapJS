const { geomap } = require("../HEADER");

(function(global) {

    'use strict';
  
    var extend = geomap.util.object.extend;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Map) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }
   
    geomap.Map = geomap.util.createClass(geomap.CommonMethods,  {
      type: 'object',
      width:100,
      height:100,
      originX:0,
      originY:0,
      rootEl:null,
      initialize: function(element, options) {
        options || (options = { }); 
        this._setOptions(options);
        this._element = element;
        this._initElement();
      },
      _initElement:function(){ 
        this.rootEl=geomap.util.element.createElement("div",{style:{border:"1px solid red",position:"absolute",width:this.width+"px",height:this.height+"px"}});
        this._element.appendChild( this.rootEl);
      }
     
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  