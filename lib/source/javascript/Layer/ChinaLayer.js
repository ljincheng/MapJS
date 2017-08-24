/**
 * 深圳市地图。
 * @return {TypeName} 
 */
(function(){
MapGIS.Layers.extend({
    ChinaLayer: new Class({
        Extends: MapGIS.Layers.TileLayer,
        Implements: [Events, Options],
         options:{
     	 	url:"http://cache1.arcgisonline.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{x}/{y}.png"
     	 },
     	loadImage:function(serverURL,z,cell,row,left,top,tsize,tag,id,isreload)
        {
        	var argObj = { z: z+4, y: cell, x: row };
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