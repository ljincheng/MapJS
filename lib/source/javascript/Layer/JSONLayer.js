
MapGIS.Layers.extend({

    JSONLayer: new Class({
        Extends: MapGIS.Layers.BaseLayer,
        Implements: [Events, Options],
        options: {
	    	width:0,
	    	height:0,
           url:null,
           tileSize:512,
           origin:{x:0,y:0}
        },
        dataLayer:null,
        loadLayer: function (op) {
        	var size=op.getViewSize();
        	this.options.width=size[0];
        	this.options.height=size[1];
            this.dataLayer = new Element("div", { unselectable: 'off', styles: { position: "absolute", left: 0, top: 0 ,zIndex:2} });
            this.div.appendChild(this.dataLayer);
            this.loader = true;
            this.parent(op);
            this.options["origin"]=op.getOrigin();
        },
        dragingLayer: function (op) {
        	if(this.parent(op))
        	{
	        	var t=op.isMoving();
	        	if(!t )
	        	{
  				 	this.getTiles(op);
	        	}
        	} 
        },
        reloadLayer:function(op)
        {
         	 this.getTiles(op);
        },
        zoomLayer:function(op)
        {
        	if(this.parent(op))
        	{
        		 this.getTiles(op);
        	} 
        },
        getTiles:function(op)
        {
        	var w=this.options["tileSize"],h=w;
        	var res=op.getRes();
        	var extent=op.getExtent();
        	var pos=[extent.xmin,extent.ymax];
        	var tile=this.getTileNo(res,pos);

        	var size=op.getViewSize();
        	var cells=Math.ceil(size[0]/w)+1;
        	var rows=Math.ceil(size[1]/h)+1;
        	this.dataLayer.empty();
        	var p0=op.getPos();
        	var left=tile.left-p0[0];
        	var top=tile.top-p0[1];
        	var cell=tile.cell;
        	var row=tile.row;
        	for(var c=0;c<cells;c++)
        		{
        		var l=left+c*w;
        		var x=cell+c;
        		for(var r=0;r<rows;r++)
        			{
        				var t=top+r*h;
        				var y=row+r;
        				var tdiv=new Element("div",{"styles":{"position":"absolute","left":l,"top":t,"width":w,"height":h,"border":"1px solid red"}})
		        		tdiv.set("html","left:"+l+",top:"+t+",w:"+w+",<br>pos:"+JSON.encode(pos)+",<br>x:"+x+",y:"+y);
		        		tdiv.inject(this.dataLayer);
        			}
        		}
        	
        },
         getTileNo:function(res,pos)
        {
			var tsize=this.options["tileSize"];
            var origin = this.options["origin"];
            var x=pos[0];
            var y=pos[1];
            var line = Math.floor((x - origin.x) / res.x / tsize);
            var row = Math.floor((origin.y - y) / res.y / tsize);
            var left = -(x - origin.x) / res.x +tsize * line ;
            var top = -(origin.y - y) / res.y +tsize * row;
            return { cell: line, row: row, left: left, top: top };
        }
        
       
    })
});
        