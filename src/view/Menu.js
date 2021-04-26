
(function() {
    
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
    function emptyFn() { };

    /**
     *  menu={title:"图层信息",items:[{title:"图层1",clickFn:emptyFn}...]};
     * menus=[{title:"参考线",clickFn:emptyFn},{title:"负一层",clickFn:emptyFn}...];
     */

    geomap.view.MenuItem= geomap.Class(geomap.CommonMethods, geomap.Observable,  {
      type: 'MenuItem',
      title:'',
      enable:true,
      clickFn:emptyFn,
      initialize: function(options) {
        options || (options = { }); 
        this._setOptions(options);
      } 
    });
    geomap.view.Menu= geomap.Class(geomap.CommonMethods, geomap.Observable,  {
      type: 'Menu',
      container:undefined,
      menuItems:[],
      title:'',
      menuEl:undefined,
      initialize: function(container,options) {
        options || (options = { }); 
        this._setOptions(options);
        this.container=container; 
        var menuEl=geomap.element.create("div")
      } 
    });
   
 
  
  })();
  