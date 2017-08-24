/**
 * 深圳市地图。
 * @return {TypeName} 
 */
(function(){
MapGIS.Layers.extend({
    MaskLayer: new Class({
        Extends: MapGIS.Layers.TileLayer,
        Implements: [Events, Options],
        options:{
        maskdir:"",
        hostpath:"",
        allowRefresh:true,
        startShowLevel:4,
     	 url:""
     	 },
     	 	changeMask:function(dir)
     	 	{
     	 		this.options.maskdir=dir;
     	 		var gisserver=MapConfig.gisserver;
     	 		this.options.url=gisserver+"GISDATA/MASK/"+this.options.maskdir+"/{z}/{x}/{y}.png";
//     	 		alert(this.options.url);
     	 		this.refresh();
     	 	}
     	 })
});
})();