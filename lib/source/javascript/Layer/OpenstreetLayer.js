/**
 * 深圳市地图。
 * @return {TypeName} 
 */
(function(){
MapGIS.Layers.extend({
	OpenstreetLayer: new Class({
        Extends: MapGIS.Layers.TileLayer,
        Implements: [Events, Options],
         options:{
//     	 	url:"http://webst0{s}.is.autonavi.com/appmaptile?style=7&x={y}&y={x}&z={z}"
//     	 		url:"http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={y}&y={x}&z={z}"
     	 			url:"http://mt{s}.google.cn/vt/x={y}&y={x}&z={z}"
     	 			
     	 },
     	servernum:["1","2","3"],
     	serverindex:0,
     	loadImage:function(serverURL,z,cell,row,left,top,tsize,tag,id,isreload)
        {
     		var t=this.serverindex++;
     		var len=3;
     		var s=this.servernum[t%len];
        	var argObj = { z: z, y: cell, x: row ,s:s};
            var url = serverURL.substitute(argObj);
    			var img=this.div.getElementById(id);
				if(img)
					{
					  img.src=url;
					}else{
					   	img = new Element("img", { 'unselectable': 'on','src': url,'id':id,'class':tag,'loaded':"false", 'styles': { 'position': "absolute", 'left': left, 'top': top, 'width': tsize, 'height': tsize, 'border': "0px", 'margin': "0px", 'padding': "0px",'z-index':2} });
					   	img.setStyle("-webkit-user-select", "none");
					   	img.setStyle("-moz-user-select", "none");
					   	img.inject(this.div);
					   	img.onselectstart=function(){return false;}
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