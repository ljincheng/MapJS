   /*
     *需Point.js文件
     * 
    Class: MapGIS.Layers.
    地图图层

    Arguments:
    url - 图层接收服务地址
    options 

    Options:
    
    id -图层id属性
    name -图层name属性.
    errorImg -错误图片地址.
    imgSize -图片大小.

    */
(function(){
MapGIS.extend({
    Layers: new Hash({
        BaseLayer: new Class({
        	Implements: [Events, Options],
            div: null,
            isIe6: false,
            source:MapGIS.path.source, 
            divLatLng:[0,0],
            id:null,
            options: {
        		id:MapGIS.createUniqueID('layer'),
                allowRefresh:false,
                zIndex: 1,
                startShowLevel:0
            },
            mapoptions:null,
            visible: true,
            isvisible:true,
            initialize: function (options) {
                this.isIe6 = Browser.Engine.trident4;
                this.setOptions(options);
                this.id=this.options["id"];
                this.initDiv();
                this.initLayer();
            },
            initDiv: function () {
                this.div = new Element("div", { unselectable: 'on', styles: { position: "absolute",left: 0, top: 0, zIndex: this.options.zIndex} });
                this.div.setStyle("-webkit-user-select", "none");
                this.div.setStyle("-moz-user-select", "none");
			   	this.div.onselectstart=function(){return false;}
            },
            dragingLayer: function (op,draw) {
            	this.mapoptions=op;
            	var z=op.getLevel();
            	var sz=this.options["startShowLevel"];
            	if(z<sz)
        		{ 
        			return false;
        		}
            	return this.visible;
            },
            zoomLayer:function(op)
            {
            	this.mapoptions=op;
            	var z=op.getLevel();
            	var sz=this.options["startShowLevel"];
            	if(z<sz)
        		{
        			return false;
        		}
            	return this.visible;
            },
            reloadLayer:function(op)
            {
            },
            initLayer:function(){
            },
            loadLayer:function(op)
            {
            	this.mapoptions=op;
            	
            	var z=op.getLevel();
            	var sz=this.options["startShowLevel"];
            	if(z<sz)
        		{
        			return false;
        		}
            	this.dragingLayer(op,true);
            	return this.visible;
            },
           	eventByMouseOver:function(event,op)
           	{
            	
           	},
           	eventByClick:function(event,op)
           	{
           	},
           	eventByDblclick:function(op){
           	},
            clear: function () {
            	this.div.empty();
            },
            destory: function () {
                this.clear();
            },
            refresh:function(){
            	if(!this.options["allowRefresh"])
        		{
        			return false;
        		}
            	return true;
            },
            show:function()//待完善
            {
            	this.visible=true;
            	this.div.setStyle("display","block");
            	this.reloadLayer(this.mapoptions);
            },
            hide:function()
            {
            	this.visible=false;
            	this.div.setStyle("display","none");
            },
            isContinue:function()
            {
            	if(this.mapoptions==null)
            		{
            			return false;
            		}
            	var z=this.mapoptions.getLevel();
            	var sz=this.options["startShowLevel"];
            	if(z<sz)
        		{
        			return false;
        		}
            	return (this.visible && this.isvisible);
            },
            setVisibility: function (isvisible) {
            	this.isvisible=isvisible;
            }
            
        })
    })

});
})();

