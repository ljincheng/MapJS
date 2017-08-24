/**
 * 都市圈三维地图深圳地图图层。
 * 
 */
(function(){
MapGIS.Layers.extend({
	OMapLayer: new Class({
        Extends: MapGIS.Layers.TileLayer,
        Implements: [Events, Options],
         options:{
     	 				url:"http://d{s}.map.baidu.com/resource/mappic/sz/14/3/lv{z}/{x},{y}.jpg" 
     	 			
     	 },
     	servernum:["1","2","0"],
     	serverindex:0,
     	loadImage:function(serverURL,z,cell,row,left,top,tsize,tag,id,isreload)
        {
     		var t=this.serverindex++;
     		var len=3;
     		var s=this.servernum[t%len];
        	var argObj = { z:6-z, y:row, x: cell ,s:s};
            var url = serverURL.substitute(argObj);
    			var img=this.div.getElementById(id);
				if(img)
					{
					  img.src=url;
					}else{
					   	img = new Element("img", { 'src': url,'id':id,'class':tag,'loaded':"false", 'styles': { 'position': "absolute", 'left': left, 'top': top, 'width': tsize, 'height': tsize, 'border': "0px", 'margin': "0px", 'padding': "0px",'z-index':2} });
				        img.inject(this.div);
				        img.onload=function()
				        {
				        	this.set("loaded","true");
				        }
					}
// 
        } 
     	 })
});
})();