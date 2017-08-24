(function(){
MapGIS.Layers.extend({
    PaletteLayer: new Class({
        Extends: MapGIS.Layers.BaseLayer,
        Implements: [Events, Options], 
        options:{
    		stopEvent:null,
    		map:null
        },
        graphics:null,
        initLayer: function () {
        },
        pdiv:null,
        geomDIV:null,
        lineRoot:null,
        geomRoot:null,
        geometry:null,
        isPaint:false,
        
        loadLayer:function(op)
        {
        	this.parent(op);
        	var size=op.getViewSize();
        	var w=size[0];
        	var h=size[1];
        	this.div.id="mappalettediv";
        	this.pdiv=new Element("div",{id:"mapalettegeomdiv",styles:{display: "block",width:w,height:h, pointerEvents: "none",border:"0px", position: "absolute",top:0,left:0,zIndex:1}});
			this.pdiv.inject(this.div);
            this.geometry = new MapGIS.Geometry(this.pdiv, { width: w, height: h});
            this.geomRoot = this.geometry.creatGroup();
            this.lineRoot = this.geometry.creatGroup();
            this.loader = true; 
            if(!$chk(window.MAP_FN_PALETTEKEYDOWNFUN))
            	{
            		window.MAP_FN_PALETTEKEYDOWNFUN=this.keydownFun.bind(this);
            		window.document.addEvent("keydown",window.MAP_FN_PALETTEKEYDOWNFUN);
            	}
        },
        data:[],
        tmpdata:[],
        drawingType:"polygon",//circle,linestring,linearring,rectangle
        movingPoint:[],
        paintingSTYLE: {
            stroke: { color: "#22a1c5", width: 2 },
            fillColor: [32, 202, 172, 0.4]
        },
        paintingPosSTYLE: {
            stroke: { color: "#ff6600", width: 2 },
            fillColor: [255, 102, 0, 0.4]
        },
        paintedSTYLE: {
            stroke: { color: "#ff9700", width: 2 },
            fillColor: [255, 173, 50, 0.5]
        },
        paintingStyle: function (style) {
            if (style != null) {
                this.paintingSTYLE = new Hash(this.paintingSTYLE);
                this.paintingSTYLE.extend(style);
                this.paintingSTYLE = this.paintingSTYLE.getClean();
            }
        },
        paintedStyle: function (style) {
            if (style != null) {
                this.paintedSTYLE = new Hash(this.paintedSTYLE);
                this.paintedSTYLE.extend(style);
                this.paintedSTYLE = this.paintedSTYLE.getClean();
            }
        },
        keydownFun: function (event) {
            event = event || window.event;
            event = new Event(event);
            if(this.isPaint)
            {
	            switch(event.key)
	            {
	            	case "delete":
	            		if(this.tmpdata.length>0)
	                		{
	                			this.tmpdata.pop();
	                		}
	            		break;
	            	case "esc":
	            		 this.tmpdata=[];
	            		 this.clearLines();
	            		break;
	            		default:
	            			break;
	            }
            }
                
        },
        getData:function()
        {
        	return this.data;
        },
        getTmpData:function()
        {
        	var data=this.tmpdata;
        	if(data.length>0)
        		{
        			var cdata=null;
        			switch(this.drawingType)
        			{
        				case "circle":
        					cdata={x:0,y:0,r:0};
        					if(data.length>0 && this.isPaint)
        						{
        								var cpos= data[0];
	        							cdata.x=cpos[0];
	        							cdata.y=cpos[1];
	        							var cpos2=data[(data.length-1)];
	        							var w = Math.pow(Math.abs(cpos2[0] -cpos[0]), 2) + Math.pow(Math.abs(cpos2[1] - cpos[1]), 2);
                   						cdata.r = Math.sqrt(w);
        						}
        					break;
        				case "rectangle":
        					cdata=[];
	        				 	if(data.length>1)
	        				 	{
		        					cdata=[data[0],data[(data.length-1)]];
	        					}
        					break;
        				default:
        					cdata=data;
        					break;
        			}
        			 return {gtype:this.drawingType,data:cdata};
        		}
        		return {gtype:this.drawingType,data:[]};
        },
        getLayerPos:function()
        {
        	var pos=this.mapoptions.getPos();
        	var left =this.pdiv.style.left.toInt()+pos[0];
        	var top=this.pdiv.style.top.toInt()+pos[1];
        	
//        	var coor=this.pdiv.getCoordinates(this.div);
//        	alert(JSON.encode(left));
//        	return [coor.left,coor.top];
        	return [left,top];
        },
        tmpDrawing:function(op)
        {
        	var data=this.tmpdata;
        	this.clearLines();
        	if(data.length>0)
        		{
        			var cdata=null;
        			var lpos=this.getLayerPos();
        			var mp=this.movingPoint;
        			var cpos2=[mp[0]-lpos[0],mp[1]-lpos[1]];
        			switch(this.drawingType)
        			{
        				case "circle":
        						cdata={x:0,y:0,r:0};
	        					if(data.length>0 && this.isPaint)
	        						{
	        								var cp= data[0];
		        							var cpos=op.toScreen(cp[0],cp[1]);
		        							cdata.x=cpos[0]-lpos[0];
		        							cdata.y=cpos[1]-lpos[1];
//		        							var cpos2=this.movingPoint;
		        							var w = Math.pow(Math.abs(cpos2[0] -cdata.x), 2) + Math.pow(Math.abs(cpos2[1] - cdata.y), 2);
                       						cdata.r = Math.sqrt(w);
	        						}
        					break;
        				case "rectangle":
        					cdata=[];
	        				 	if(data.length>0)
	        				 	{
	        				 		var cp=data[0];
	        				 		var cpos=op.toScreen(cp[0],cp[1]);
		        					cdata=[[(cpos[0]-lpos[0]),(cpos[1]-lpos[1])],cpos2];
	        					}
        					break;
        				default:
        					cdata=[];
		        				for(var i=0,k=data.length;i<k;i++)
		        				{
		        					var cp= data[i];
		        					var cpos=op.toScreen(cp[0],cp[1]);
		        					cdata.push([(cpos[0]-lpos[0]),(cpos[1]-lpos[1])]);
		        				}
		        				if(this.isPaint)
			       				{
			        				cdata.push(cpos2);
			        			}
        					break;
        			}
        			var node = this.geometry.nodeFactory("shape");
        			var gstyle=this.paintingSTYLE;
        			switch(this.drawingType)
        			{
        				case "circle":
        					this.geometry.drawCircle(node, cdata,gstyle,true);
        					var cenpos=this.geometry.nodeFactory("shape");
		                    this.geometry.drawCircle(cenpos, { x: cdata.x, y: cdata.y, r: 2 }, this.paintingSTYLE, true);
		        			cenpos.inject(this.lineRoot);
        					var linenode=this.geometry.nodeFactory("shape");
		                    this.geometry.drawLineString(linenode,[[ cdata.x,cdata.y],cpos2],false, this.paintingSTYLE);
		        			linenode.inject(this.lineRoot);
        					break;
        				case "linestring":
        					this.geometry.drawLineString(node, cdata, false, gstyle);
        					break;
        				case "linearring":
        					this.geometry.drawLineString(node, cdata, true, gstyle);
        					break;
        				case "rectangle":
        					this.geometry.drawRectangle(node, cdata,  gstyle);
        					break;
        				default:
        					this.geometry.drawPolygon(node, cdata,  gstyle);
        						break;
        			}
                    node.inject(this.lineRoot);
                    var leadnode=this.geometry.nodeFactory("shape");
                    this.geometry.drawCircle(leadnode, { x: cpos2[0], y: cpos2[1], r: 7 }, this.paintingSTYLE, true);
        			leadnode.inject(this.lineRoot);
        		}
        },
        loadDataToGeom:function(op)
        {
        	var d=this.data;
        	this.clearGeoms();
        	if(d!=null && d.length>0)
        		{
//        		this.clearGeoms();
        			for(var r=0,kr=d.length;r<kr;r++)
        				{
		        			var cdata=null;
		        			if(d[r].gtype.toLowerCase()=="circle")
		        				{
		        					cdata={x:0,y:0,r:0};
									var x= d[r].data.x;
									var y= d[r].data.y;
	    							var cpos=op.toScreen(x,y);
	    							cdata.x=cpos[0];
	    							cdata.y=cpos[1];
	    							cdata.r=d[r].data.r/(op.getRes().x);
	    							 
		        				}else{
		        					cdata=[];
			        				for(var i=0,k=d[r].data.length;i<k;i++)
			        				{
			        					var cp= d[r].data[i];
			        					var cpos=op.toScreen(cp[0],cp[1]);
			        					cdata.push(cpos);
			        				}
		        			}
		        			var node = this.geometry.nodeFactory("shape");
		        			var gstyle=d[r].gstyle||this.paintedSTYLE;
		        			 switch(d[r].gtype.toLowerCase())
		        			{
		        				case "circle":
		        					this.geometry.drawCircle(node, cdata,gstyle,true);
		        					break;
		        				case "linestring":
		        					this.geometry.drawLineString(node, cdata, false, gstyle);
		        					break;
		        				case "linearring":
		        					this.geometry.drawLineString(node, cdata, true, gstyle);
		        					break;
		        				case "rectangle":
		        					this.geometry.drawRectangle(node, cdata,  gstyle);
		        					break;
		        				default:
		        					this.geometry.drawPolygon(node, cdata,  gstyle );
		        						break;
		        			}
		                    node.inject(this.geomRoot);
                    }
        		}
        },
         clearGeoms:function(){
        	if(this.geomRoot!=null){
	        	var children = this.geomRoot.children;
	            if (children && children.length > 0) {
	                var i = ((children && children.length > 0) ? children.length : 0);
	                while (children && children.length > 0 && i > 0) {
	                    if (children[0].ignore) {
	                        children[0].ignore("click", null);
	                        children[0].ignore("mouseover", null);
	                        children[0].ignore("mouseout", null);
	                        children[0].ignore("mouseup", null);
	                        children[0].ignore("mousedown", null);
	                        children[0].ignore("dblclick", null);
	                    }
	                    if (children[0].data) {
	                        children[0].data = null;
	                    }
	                    if (children[0].resetResolution) {
	                        children[0].resetResolution = null;
	                    }
	                    if (children[0]._geotype) {
	                        children[0]._geotype = null;
	                    }
	                    if (children[0]._style) {
	                        children[0]._style = null;
	                    }
	                    if (children[0]._options) {
	                        children[0]._options = null;
	                    }
	                    children[0].eject();
	                    i--;
	                }
	            }
            }
        },
         clearLines:function(){
        	if(this.lineRoot!=null){
	        	var children = this.lineRoot.children;
	            if (children && children.length > 0) {
	                var i = ((children && children.length > 0) ? children.length : 0);
	                while (children && children.length > 0 && i > 0) {
	                    if (children[0].ignore) {
	                        children[0].ignore("click", null);
	                        children[0].ignore("mouseover", null);
	                        children[0].ignore("mouseout", null);
	                        children[0].ignore("mouseup", null);
	                        children[0].ignore("mousedown", null);
	                        children[0].ignore("dblclick", null);
	                    }
	                    if (children[0].data) {
	                        children[0].data = null;
	                    }
	                    if (children[0].resetResolution) {
	                        children[0].resetResolution = null;
	                    }
	                    if (children[0]._geotype) {
	                        children[0]._geotype = null;
	                    }
	                    if (children[0]._style) {
	                        children[0]._style = null;
	                    }
	                    if (children[0]._options) {
	                        children[0]._options = null;
	                    }
	                    children[0].eject();
	                    i--;
	                }
	            }
            }
        },
        dragingLayer: function (op,draw) {
        	if(this.parent(op))
        	{
	        	var t=op.isMoving();
	        	if(!t )
	        	{
  					var pos=this.mapoptions.getPos();
			        var sop={left:-pos[0],top:-pos[1]};
			        this.pdiv.setStyles(sop); 
	        		this.loadDataToGeom(op);
	        		this.tmpDrawing(op);
	        	} 
        	} 
        },
        zoomLayer:function(op)
        {
        	if(this.parent(op))
        	{
        		this.loadDataToGeom(op);
        		var pos=this.mapoptions.getPos();
	        	var sop={left:-pos[0],top:-pos[1]};
	        	this.pdiv.setStyles(sop); 
        	}
        },
    	eventByMouseOver:function(event,op)
       	{
        	 
        	if(this.isPaint)
       		{
	        	var p=op.getMousePos();
	//        	var lpos=op.getPos();
	//        	var lpos=this.getLayerPos();
	        	this.movingPoint=p; //[(p[0]-lpos[0]),(p[1]-lpos[1])];
	        	this.tmpDrawing(op);
        	}
       	},
       	eventByClick:function(event,op)
       	{
       		if(this.isPaint)
       		{
	       		var pos=op.getMousePos();
	       		var xy=op.toMap(pos[0],pos[1]);
	       		this.tmpdata.push(xy);
       		}
       	},
       	eventByDblclick:function(event,op){
       		if(this.isPaint)
       			{
	       			var pos=op.getMousePos();
		       		var xy=op.toMap(pos[0],pos[1]);
		       		this.tmpdata.push(xy);
		       		this.data.push(this.getTmpData());
		       		
		       		this.loadDataToGeom(op);
		       		this.tmpdata=[];
		       		this.clearLines();
		       		this.fireEvent("change", { options: this.options, data: this.getData() });
       			}
       	},
       	pop:function()
       	{
       		if(this.data!=null && this.data.length>0)
       			{
       				this.data.pop();
       				this.loadDataToGeom(this.mapoptions);
       				this.fireEvent("change", { options: this.options, data: this.getData() });
       			}
       	},
       	shift:function()
       	{
       		if(this.data!=null && this.data.length>0)
       			{
       				this.data.shift();
       				this.loadDataToGeom(this.mapoptions);
       				this.fireEvent("change", { options: this.options, data: this.getData() });
       			}
       	},
        loadData:function(data)
        {
       		this.data=data;
       		if(this.data!=null &&  this.mapoptions!=null)
       			{
       				this.loadDataToGeom(this.mapoptions);
       				this.fireEvent("change", { options: this.options, data: this.getData() });
       			}
        	
        },
        paintTools:function(op)
        {
        	this.start();
        	switch(op)
        	{
        		case 1:
        			this.drawingType="linestring";
        			break;
        		case 2:
        			this.drawingType="linearring";
        			break;
        		case 3:
        			this.drawingType="rectangle";
        			break;
        		case 4:
        			this.drawingType="circle";
        			break;
        		case 5:
        			this.drawingType="polygon";
        			break;
        		default:
        			this.drawingType="polygon";
        			break;
        	}
        },
        initPaint:function(){
        	if(this.options["map"]!=null)
        		{
        			var map=this.options["map"];
        			if(typeof(map.setActiveTool)!="undefined")
        				{
        					map.setActiveTool("$");
        				}
        		
        		}
        },
        stop:function()
        {
//        	this.initPaint();
        	this.isPaint=false;
        },
        start:function()
        {
        	this.initPaint();
        	this.isPaint=true;
        },
        paintLine: function (isClose) {
			this.paintTools(isClose?2:1);
        },
        paintCircle: function (isFill) {
			this.paintTools(4);
        },
        paintPolygon: function () {
			this.paintTools(5);
        },
        paintRectangle: function () {
			this.paintTools(3);
        },
        startEvent:function()
        {
        	
        },
        stopEvent:function()
        {
        },
        clear:function()
        {	
        	this.data=[];
        	this.tmpdata=[];
        	this.clearGeoms();
        	this.clearLines();
        },
        backup:function()
        {
			this.pop();
        } 
        
    
    })
}); 
})();