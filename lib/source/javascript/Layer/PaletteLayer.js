(function(){
MapGIS.Layers.extend({
    PaletteLayer: new Class({
        Extends: MapGIS.Layers.BaseLayer,
        Implements: [Events, Options], 
        options:{
    		stopEvent:null
        },
        graphics:null,
        initLayer: function () {
//    		var w=this.options.width;
//        	var h=this.options.height;
//        	this.div.id="mappalettediv";
//        	var pdiv=new Element("div",{id:"mapalettegeomdiv",styles:{width:w,height:h, pointerEvents: "none", position: "absolute",top:0,left:0}});
//			pdiv.inject(this.div);
//        	this.graphics = new MapGIS.Palette(pdiv, {width: w, height: h });
//			this.graphics.eventNode=document;
//            this.loader = true; 
        },
        pdiv:null,
        loadLayer:function(op)
        {
        	this.parent(op);
        	var size=op.getViewSize();
        	var w=size[0];
        	var h=size[1];
        	this.div.id="mappalettediv";
        	this.pdiv=new Element("div",{id:"mapalettegeomdiv",styles:{width:w,height:h, pointerEvents: "none", position: "absolute",top:0,left:0}});
			this.pdiv.inject(this.div);
        	this.graphics = new MapGIS.Palette(this.pdiv, {width: w, height: h });
			this.graphics.eventNode=document;
            this.loader = true; 
        },
        dragingLayer: function (op,draw) {
    	if(this.parent(op))
    		{
    			if(!op.isMoving())
    				{
    					var pos=op.getPos();
    					this.pdiv.setStyles({left:-pos[0],top:-pos[1]});
    					this.draw(op);
    				}
    		}
        },
        zoomLayer:function(op)
        {
        	if(this.parent(op))
    		{
        		var pos=op.getPos();
    			this.pdiv.setStyles({left:-pos[0],top:-pos[1]});
    			this.draw(op);
    		}
        },
     	draw:function(op)
        {
//        	this.parent(op);
        	if(this.graphics)
        		{
        		 	this.graphics.resetResolution(op.getRes().x,op.getExtent());
        		}
        },
        loadData:function(data)
        {
        	this.graphics.loadData(data);
        },
        paintInit:function()
        {
        	if(this.options.stopEvent)
        	{
        		this.options.stopEvent();
        	 }
        	 var res=this.mapoptions.getRes().x;
        	 var extent=this.mapoptions.getExtent();
        	 this.graphics.setResolution(res,extent);
             this.graphics.startPaint();
        },
        paintLine: function (isClose) {
        	this.paintInit();
            this.graphics.paintLine(isClose);
        },
        paintCircle: function (isFill) {
        	this.paintInit();
            this.graphics.paintCircle(isFill);
        },
        paintPolygon: function () {
        	this.paintInit();
            this.graphics.paintPolygon();
        },
        paintRectangle: function () {
            this.paintInit();
            this.graphics.paintRectangle();
        },
        getData:function()
        {
        	return this.graphics.getData();
        },
        edit:function(tf)
        {
        	if(this.options.stopEvent)
        	{
        		this.options.stopEvent();
        	 }
        	this.stopEvent();
        	this.graphics.edit(tf);
        },
        startEvent:function()
        {
        	this.graphics.startPaint();
        },
        stopEvent:function()
        {
        	this.graphics.stopPaint();
        },
        clear:function()
        {
        	this.graphics.clear();
        },
        backup:function()
        {
        	this.graphics.repaint();
        },
        addEvent:function(ftype,fn)
        {
        	this.graphics.addEvent(ftype,fn);
        },
        removeEvents:function(ftype)
        {
        	this.graphics.removeEvents(ftype);
        },
        removeEvent:function(ftype,fn)
        {
        	this.graphics.removeEvent(ftype,fn);
        }
        
    
    })
}); 
})();