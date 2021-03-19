
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
        this.rootEl=geomap.util.element.create("div",{id:"_map_root"},{border:"1px solid red",backgroundColor:"#e4e4e4",position:"absolute",width:this.width+"px",height:this.height+"px"});
        var boxdiv=geomap.util.element.create("div",{id:"_map_layer"},{border:"1px solid black",backgroundColor:"black",position:"absolute",width:"20px",height:"20px"});
        this._element.appendChild( this.rootEl);
        this._element.appendChild( boxdiv);
      }
     
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  