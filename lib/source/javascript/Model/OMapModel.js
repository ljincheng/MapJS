/**
 * 都市圈三维地图深圳模型。
 *6个级数。
 *坐标转换为：x,y=x,-y;
 * @return {TypeName} 
 */
(function(){
MapGIS.extend({
    OMapModel: new Class({
    	  Extends: MapGIS.Model,
	        Implements: [Events, Options],
	         options:{
	     	 	maxLevel:5,
	     	 	minLevel:0,
	     	 	origin: {x:  0, y: 0},
          fullExtent:[1082959,-1117551,1082961, -1117553],  
          tileSize:256
	     	 },
	     	 resolution:function(level)
	        {
	     		 	var x=(Math.pow(2,(6-level)-1));
	     		 	var y=(Math.pow(2,(6-level)-1)); 
		         return { x: x, y: y };
	      } 
	        
     	})
});
})();