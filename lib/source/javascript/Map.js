
(function(){
MapGIS.extend({
	Map:new Class({
		Implements: [Events, Options],
		extent:null,
		loader:false,
		options:{
			level:0,
			levelMax:9,
			levelMin:0,
			size:[0,0],
			zIndex:1,
			xmin:null,
			ymin:null,
			xmax:null,
			ymax:null,
			activeTool:"$",
			contentMenu: { visible: true, obj: null },
			navigation: { show: true, obj: null },
			queryHandler: null,
			center:null //center value format is [x,y]
		},
		container:null,
		root:null,
		toolsdiv:null,
		layersdiv:null,
		defaultPos:[0,0],
		bgPos:[0,0],
		speed:[0,0],
		isBacking:false,
		isDragging:false,
		mousePosLast:[0,0],
		mousePosNow:[0,0],
		mouseSpeed:[0,0],
		smooth:[[0,0],[0,0],[0,0],[0,0]],
		handles:{timeout:null,interval:null},
		checkLoadTimer:null,
		layers:[],
		baseLayer: null,
		model:null,
		width:0,
		height:0,
		fxtype:0,
		setModel:function(model)
		{
			this.model=model;
			var z=this.options["level"];
			if(this.options["xmin"]!=null)
			{
				var fullExtent=[this.options["xmin"],this.options["ymin"],this.options["xmax"],this.options["ymax"]];
				this.model.setOptions({fullExtent:fullExtent});
			}
			this.model.setOptions({canOver:false,size:this.options.size,level:z,preLevel:z,minLevel:this.options["levelMin"],maxLevel:this.options["levelMax"]});
			this.model.setRestore();
			
		},
		setReposition:function()
		{
			this.model.setRestore();
		},
		initialize:function(container,options,model)
		{
			this.container = ((typeof (container) === "object") ? container : $(container));
			this.setOptions(options);
			this.initMap();
			if(this.options["center"]!=null)
				{
					var c=this.options["center"];
					this.options["xmin"]=c[0]-1;
					this.options["xmax"]=c[0]+1;
					this.options["ymin"]=c[1]-1;
					this.options["ymax"]=c[1]+1;
				}
			this.setModel(model==null?new MapGIS.Model():model);
			
			if(window.map_opinterval!=null)
    		{
    			window.clearInterval(window.map_opinterval);
    			window.map_opinterval=null;
    		}
			this.loader=true;
			window.map_opinterval=setInterval(this.dragAndDragFn.bind(this),10);
			this.checkLoadTimer = this.checkLoadMap.periodical(1000, this);
		},
		checkLoadMap: function () {
            if (this.loader) {
                this.fireEvent("load", true);
                if (this.checkLoadTimer) {
                    $clear(this.checkLoadTimer);
                }
            }
        },
		addLayer:function(layer)
		{
             this.layers.push(layer);
             layer.loadLayer(this.model);
			 this.layersdiv.appendChild(layer.div);
			 if (!layer.div.hasClass("layerContainer")) {
                	layer.div.addClass("layerContainer");
             }
		},
		addLayers:function(layer)
		{
			if(layer!=null && layer.length>0)
				{
				for(var i=0,k=layer.length;i<k;i++)
					{
						this.addLayer(layer[i]);
					}
				}
		},
		addTools:function(tool)
		{
			this.toolsdiv.appendChild(tool);
		},
		dragingLayer:function()
		{
            var layers = this.layers;
            if (layers != null) {
                for (var i = 0, k = layers.length; i < k; i++) {
                    layers[i].dragingLayer(this.model);
                }
            }
		},
		layerEventByMouseOver:function(event)
		{
			var layers = this.layers;
			var pos=this.getPos(event);
			this.model.setMousePos(pos);
            if (layers != null) {
            	
                for (var i = 0, k = layers.length; i < k; i++) {
                    layers[i].eventByMouseOver(event,this.model);
                }
            }
		},
		layerEventByClick:function(event)
		{
			var layers = this.layers;
			var pos=this.getPos(event);
			this.model.setMousePos(pos);
            if (layers != null) {
                for (var i = 0, k = layers.length; i < k; i++) {
                    layers[i].eventByClick(event,this.model);
                }
            }
		},
		layerEventByDblclick:function(event)
		{
			var layers = this.layers;
			var pos=this.getPos(event);
			this.model.setMousePos(pos);
            if (layers != null) {
                for (var i = 0, k = layers.length; i < k; i++) {
                    layers[i].eventByDblclick(event,this.model);
                }
            }
		},
		FireExtentchangeEvent:function()
		{
			var z=this.model.getLevel();
			var extent=this.model.getExtent();
			var c=this.model.getCenterPoint();
			this.fireEvent("extentchange", { level: z, point:c, extent:extent});
        
		},
		moveno:2,
		lastpos:[0,0],
		setPos:function()
		{
			var dx=this.bgPos[0];
        	var dy=this.bgPos[1];
        	var speed=this.speed;
        	if(speed[0]==0 && speed[1]==0)
        		{
//        				if(this.moveno==2){//控制首次加载
//							this.dragingLayer();
//							this.moveno=1;
//        				}else 
        				if(this.moveno>0 || this.isDragging)
        				{
        					return;
        				}else {
        					this.moveno++;
        					this.model.setPos([dx.toInt(),dy.toInt()]);
				        	this.model.setSpeed([speed[0],speed[1]]);
							this.layersdiv.setStyles({ left: dx, top: dy });
        					this.model.setRunStatus(false);
							this.dragingLayer();
							this.FireExtentchangeEvent();
        				}
        		}else{
        			this.moveno=0;
        			this.model.setPos([dx.toInt(),dy.toInt()]);
					this.model.setSpeed([speed[0],speed[1]]);
					//console.log("left:="+dx+",top:="+dy);
					this.layersdiv.setStyles({ left: dx, top: dy });
					this.model.setRunStatus(true);
//					if(Math.abs(dx-this.lastpos[0])>5 && Math.abs(dy-this.lastpos[1])>5){//大小2PX情况才通知
						this.dragingLayer();
						this.lastpos=[dx,dy];
//					}
        		}
        	
		},
		getPos:function(event)
		{
			var scroll =this.container.getScroll();
			  var pos = this.root.getPosition();
              var x = event.page.x - pos.x;
              var y = event.page.y - pos.y;
              return [x,y];
		},
		dragAndDragFn:function()
		{
				if(this.isBacking){
                	var bPos=this.bgPos;
                	var dPos=this.defaultPos;
                    if(Math.abs(bPos[0]-dPos[0])<5 && Math.abs(bPos[1]-dPos[1])<5 ){
                        this.isBacking=false;
                        this.speed[0]=0;
                    	this.speed[1]=0;
                    	this.FXFn(dPos);
                        return;
                    }
                    var s=this.speed;
                    s[0]=(dPos[0]-bPos[0])*0.0485;
                    s[1]=(dPos[1]-bPos[1])*0.0485;
                    this.bgPos[0]+=s[0];
                    this.bgPos[1]+=s[1];
                    this.setPos();
                    return;
                }
                if(this.isDragging){
                	var nPos=this.mousePosNow;
                	var lPos=this.mousePosLast;
                  var  mouseSpeed =[nPos[0]-lPos[0],nPos[1]-lPos[1]];
                    this.smooth.push(mouseSpeed);
                    this.smooth.shift();
                    var mouseSpeed2=[0,0];
                    var s=this.smooth;
                    var k=s.length;
                    for(var i=0;i<k;i++){
                        mouseSpeed2[0]+=s[i][0];
                        mouseSpeed2[1]+=s[i][1];
                    }
                    mouseSpeed2[0]=mouseSpeed2[0]/k;
                    mouseSpeed2[1]=mouseSpeed2[1]/k;
                    this.speed[0]=mouseSpeed2[0]*1;
                    this.speed[1]=mouseSpeed2[1]*1;
                    this.bgPos[0]+=this.speed[0];
					this.bgPos[1]+=this.speed[1];
					console.log("speed:left:="+this.speed[0]+",top:="+this.speed[1]);
                    this.setPos();
                    this.mousePosLast[0]=nPos[0];
                    this.mousePosLast[1]=nPos[1];
                    return;
                }
                var s=this.speed;
                if(Math.abs(s[0])<0.004 )
                	{
                	 	this.speed[0]=0;
		                 
                	}
                if(Math.abs(s[1])<0.004)
                	{
                	  
		                this.speed[1]=0;
                	}
                this.speed[0]=s[0]*0.97;
                this.speed[1]=s[1]*0.97;
                this.bgPos[0]+=this.speed[0];
                this.bgPos[1]+=this.speed[1];
                this.setPos();
		},
		initMap:function()
		{
			
			var op=this.options;
			this.container.setStyles({position:"absolute",zIndex:op.zIndex});
			var w=op.size[0];
			var h=op.size[1];
			if(w==0|| h==0)
				{
					var csize=this.container.getSize();
					var borderLWidth = Element.getComputedStyle(this.container, 'border-left-width').toInt() || 0;
		            var borderRWidth = Element.getComputedStyle(this.container, 'border-right-width').toInt() || 0;
		            var borderTWidth = Element.getComputedStyle(this.container, 'border-top-width').toInt() || 0;
		            var borderBWidth = Element.getComputedStyle(this.container, 'border-bottom-width').toInt() || 0;
					w=csize.x- borderLWidth - borderRWidth;
					h=csize.y - borderTWidth - borderBWidth;
					this.options["size"]=[w,h];
					
				} 
			this.width=w;
			this.height=h;
			
			this.root=new Element("div", { unselectable: "on", styles: {width:w, height: h, left: 0, top: 0, position: "absolute", margin: "0px", padding: "0px", zIndex: 3, visibility: "visible", overflow:"hidden",  border: "0px solid blue" } });
//			this.root.set("html","sdfsdfs");
			this.root.inject(this.container);
			this.toolsdiv=new Element("div", {unselectable: "on", styles: {left: 0, top: 0, position: "absolute", margin: "0px", padding: "0px", zIndex: 2, visibility: "visible", border: "0px" } });
			this.toolsdiv.inject(this.root);
			this.container.addEvent("contextmenu", function () { return false; });
			this.layersdiv=new Element("div", {unselectable: "on", styles: {left: 0, top: 0, position: "absolute", margin: "0px", padding: "0px", zIndex: 1, visibility: "visible", border: "0px" } });
			this.layersdiv.inject(this.root);
			this.root.addEvent("mousedown",this.mouseDownEvent.bindWithEvent(this));
			this.root.addEvent("mousemove",this.mouseMoveEvent.bindWithEvent(this));
			this.root.addEvent("mouseup",this.mouseUpEvent.bindWithEvent(this));
			this.root.addEvent("mouseleave",this.mouseLeaveEvent.bindWithEvent(this));
			this.root.addEvent("mousewheel", this.mapEventWheel.bindWithEvent(this));	
			this.root.addEvent("dblclick", this.mouseEventDblclick.bindWithEvent(this));	
			this.root.addEvent("click", this.mouseEventClick.bindWithEvent(this));	
			this.root.addEvent("touchend", this.touchendEvent.bindWithEvent(this));
			this.root.addEvent("touchmove",this.touchmoveEvent.bindWithEvent(this));
			this.root.addEvent("touchstart",this.touchstartEvent.bindWithEvent(this));
			this.root.addEvent("gesturechange",this.ongesturechangeEvent.bindWithEvent(this));
			this.root.addEvent("gestureend",this.ongestureendEvent.bindWithEvent(this));
 
			 if (this.options.contentMenu.obj == null) {
                this.options.contentMenu.obj = new MapGIS.MapContentMenu(this);
                this.options.contentMenu.obj.div.inject(this.toolsdiv);
            }
			 if (this.options.navigation.obj == null) {
                this.options.navigation.obj = new MapGIS.MapNavigation(this);
                this.options.navigation.obj.div.inject(this.toolsdiv);
                this.options.navigation.show ? this.options.navigation.obj.show() : this.options.navigation.obj.hide();
            }
		},
		resize: function (){
        	var csize=this.container.getSize();
			var borderLWidth = Element.getComputedStyle(this.container, 'border-left-width').toInt() || 0;
            var borderRWidth = Element.getComputedStyle(this.container, 'border-right-width').toInt() || 0;
            var borderTWidth = Element.getComputedStyle(this.container, 'border-top-width').toInt() || 0;
            var borderBWidth = Element.getComputedStyle(this.container, 'border-bottom-width').toInt() || 0;
			var	w=csize.x- borderLWidth - borderRWidth;;
			var	h=csize.y - borderTWidth - borderBWidth;
			this.options["size"]=[w,h];
			this.model.setViewSize([w,h]);
			this.width=w;
			this.height=h;
            this.root.setStyles({ "width": w, "height": h });
        },
		zoomEffect:function(point,inOrOut)
		{
			 window.clearInterval(window.zoomflashtimeout);
			 var size=this.model.getViewSize();
			 this.geometryObj.init(this.toolsdiv,size);
            var obj = this;
            var x = point[0];
            var y = point[1];
            var r = (inOrOut == 1 ? 15 : 26);
            var w0 = 5, w1 = 7;

            function zoomFlash(x, y, r, w0, w1, inOrOut) {
                var point0 = { x: x - r, y: y - r };
                var point1 = { x: x + r, y: y - r };
                var point2 = { x: x - r, y: y + r };
                var point3 = { x: x + r, y: y + r };
                var line0 = [], line1 = [], line2 = [], line3 = [];
                if (inOrOut) {
                    line0 = [[point0.x, (point0.y + w0)], [point0.x, point0.y], [(point0.x + w1), point0.y]];
                    line1 = [[(point1.x - w1), point1.y], [point1.x, point1.y], [point1.x, (point1.y + w0)]];
                    line2 = [[point2.x, (point2.y - w0)], [point2.x, point2.y], [(point2.x + w1), point2.y]];
                    line3 = [[(point3.x - w1), point3.y], [point3.x, point3.y], [point3.x, (point3.y - w0)]];
                } else {
                    line0 = [[(point0.x - w0), point0.y], [point0.x, point0.y], [point0.x, (point0.y - w1)]];
                    line1 = [[(point1.x + w0), point1.y], [point1.x, point1.y], [point1.x, (point1.y - w1)]];
                    line2 = [[point2.x, (point2.y + w1)], [point2.x, point2.y], [(point2.x - w0), point2.y]];
                    line3 = [[(point3.x + w0), point3.y], [point3.x, point3.y], [point3.x, (point3.y + w1)]];
                }

                obj.geometryObj.obj.drawLineString(obj.geometryObj.node0, line0, false, { stroke: { color: "#ff0000", width: 2 } });
                obj.geometryObj.obj.drawLineString(obj.geometryObj.node1, line1, false, { stroke: { color: "#ff0000", width: 2 } });
                obj.geometryObj.obj.drawLineString(obj.geometryObj.node2, line2, false, { stroke: { color: "#ff0000", width: 2 } });
                obj.geometryObj.obj.drawLineString(obj.geometryObj.node3, line3, false, { stroke: { color: "#ff0000", width: 2 } });
                //obj.graphicContainer.geometry.root.resize(1,1);
            }
            window.zoomflashtimeout = window.setInterval(function () {if (r < 31 && inOrOut == 1) { zoomFlash(x, y, r, w0, w1, inOrOut); r += 15; } else if (r > 0 && inOrOut == 0) { zoomFlash(x, y, r, w0, w1, inOrOut); r -= 15; } else { window.clearInterval(window.zoomflashtimeout); obj.geometryObj.clear(); } }, 220);
        
		},
		geometryObj:{
			obj:null,
			node:null,
			node0: null, node1: null, node2: null, node3:null, node4:null,node5:null,clear: function () {
                this.node0.draw("M0,0");
                this.node1.draw("M0,0");
                this.node2.draw("M0,0");
                this.node3.draw("M0,0");
                this.node4.draw("M0,0");
                this.node5.draw("M0,0");
                this.node.draw("M0,0");
                this.obj.root.resize(1,1);
            },
            init:function(div,size)
            {
        		if(this.obj==null)
					{
						this.obj=new MapGIS.Geometry(div,{width:size[0],height:size[1]});
					}
	            	this.obj.root.resize(size[0],size[1]);
                    if (this.node == null) {
                        this.node = this.obj.nodeFactory("shape");
                        this.node.inject( this.obj.root);
                    }
                    if (this.node0 == null) {
                        this.node0 = this.obj.nodeFactory("shape");
                        this.node0.inject( this.obj.root);
                    }
                    if (this.node1 == null) {
                        this.node1 = this.obj.nodeFactory("shape");
                        this.node1.inject( this.obj.root);
                    }
                    if (this.node2 == null) {
                        this.node2 = this.obj.nodeFactory("shape");
                        this.node2.inject( this.obj.root);
                    }
                    if (this.node3 == null) {
                        this.node3 = this.obj.nodeFactory("shape");
                        this.node3.inject( this.obj.root);
                    }
                    if (this.node4 == null) {
                        this.node4 = this.obj.nodeFactory("shape");
                        this.node4.inject( this.obj.root);
                    }
                    if (this.node5 == null) {
                        this.node5 = this.obj.nodeFactory("shape");
                        this.node5.inject( this.obj.root);
                    }
            }
		},
		referenceLine:function(op){
			var size=op.options["size"];
        	var w=size[0];
        	var h=size[1];
        	var wdiv=new Element("div", { unselectable: 'on', styles: { position: "absolute", left: 0, top: h/2, zIndex: 999,borderTop:"1px solid blue",width:w,height:1} });
        	var hdiv=new Element("div", { unselectable: 'on', styles: { position: "absolute", left: w/2, top:0, zIndex: 999,borderLeft:"1px solid blue",width:1,height:h} });
         	wdiv.inject(this.root);
         	hdiv.inject(this.root);
		},
		zoomLayer:function()
		{
			if(window.map_opinterval!=null)
    		{
    			window.clearInterval(window.map_opinterval);
    			window.map_opinterval=null;
    		}
            var layers = this.layers;
            if (layers != null) {
                for (var i = 0, k = layers.length; i < k; i++) {
                    layers[i].zoomLayer(this.model);
                }
            }
            var p=this.model.getWheelPos();
            var point={x:p[0],y:p[1]};
            var extent=this.getExtent();
            var arg= { event:  window.event, level: this.getLevel(), point: point, extent: extent };
            this.fireEvent("zoom", arg);
            this.fireEvent("mousewheel", arg);
            this.fireEvent("zoomend",arg);
            this.FireExtentchangeEvent();
		},
		wheelTimer_:null,
		mapEventWheel: function (event) {
            if (this.loader !== true) {
                return false;
            }
            if (this.wheelTimer_ === null) {
                this.wheelTimer_ = window.setTimeout(function () { window.clearTimeout(this.wheelTimer_); $clear(this.wheelTimer_); this.wheelTimer_ = null; }.bind(this), 450);
            } else { return false; }
            event = event || window.event;
            var a = event.wheel || 0;
            var b = event.wheelDelta || 0;
            var c = event.detail || 0;
            d = a ? a : (!b ? (!c ? 0 : -c) : b);
            var zoomIn = (d > 0 ? true : false);
            var isvail=this.model.setZoom(zoomIn);
            if(isvail)
            {
	            var p=this.getPos(event);
	            this.zoomEffect(p,zoomIn);
	            this.model.setWheelPos(p[0],p[1]);
	            this.zoomLayer();
            }
            
        },
		mouseEvent:{eventtype:0,startpoint:[0,0],endpoint:[0,0],getPointList:function(){
        	return [this.startpoint,this.endpoint];}, getdx: function () { return this.endpoint[0] - this.startpoint[0]; },
            getdy: function () { return this.endpoint[1] - this.startpoint[1]; },
            getCenter: function (){ return  [(this.endpoint[0] + this.startpoint[0]) / 2,   (this.endpoint[1] + this.startpoint[1]) / 2 ];}
        },
		mouseDownEvent:function(event)
		{
			event = event || window.event;
            event.stop();
            var p=this.getPos(event);
	        this.mouseEvent.startpoint=p;
            if(this.loader){ 
            	switch(this.mouseEvent.eventtype)
            	{
            		case 0://拖曳
//            			if(window.map_opinterval!=null)
//		        		{
//		        			window.clearInterval(window.map_opinterval);
//		        			window.map_opinterval=null;
//		        		}
            			if(window.map_opinterval==null){
//            				this.dragAndDragFn.bind(this);
			            	window.map_opinterval=setInterval(this.dragAndDragFn.bind(this),10);
			            }
            			this.isDragging=true;
            			this.mousePosLast[0]=this.mousePosNow[0];
		                this.mousePosLast[1]=this.mousePosNow[1];
		                this.speed=[0,0];
	                    var p0= [0,0];
		            	this.smooth=[p0,p0,p0,p0];
		            	this.mouseEvent.eventtype=1;
		            	break;
		            case 2://画框
		            	var op=this.model;
		            	var size=op.getViewSize();
		            	this.geometryObj.init(this.toolsdiv,size);
	                    this.mouseEvent.eventtype=3;
	                    this.mouseEvent.endpoint=p;
	                    this.geometryObj.obj.drawRectangle(this.geometryObj.node, this.mouseEvent.getPointList());
		            	break;
		            case 4://画框
		            	var op=this.model;
		            	var size=op.getViewSize();
		            	this.geometryObj.init(this.toolsdiv,size);
	                    this.mouseEvent.eventtype=5;
	                    this.mouseEvent.endpoint=p;
	                    this.geometryObj.obj.drawRectangle(this.geometryObj.node, this.mouseEvent.getPointList());
		            	break;
		            default:
		            	break;
            			
            	}
            	if (this.options.contentMenu.obj != null && this.options.contentMenu.visible) {
                                this.options.contentMenu.obj.hide();
                  }
            }
           this.fireEvent("mousedown", { event: event });
            event.stopPropagation();
		},
		mouseMoveEvent:function(event)
		{
			event = event || window.event;
            event.stop();
            this.mousePosNow[0]=event.client.x;
            this.mousePosNow[1]=event.client.y;
            var p=this.getPos(event);
            var endpoint=this.mouseEvent.endpoint;
            if(Math.abs(p[0]-endpoint[0])<1 && Math.abs(p[1]-endpoint[1])<1)
            	{
            		return ;
            	}
	        this.mouseEvent.endpoint=p;
            if(this.loader){
            	switch(this.mouseEvent.eventtype)
            	{
            		case 1://拖曳
            			 this.root.setStyle("cursor", "move");
            			break;
            		case 3:
            		case 5:
//            			var p=this.getPos(event);
//	                    this.mouseEvent.endpoint=p;
	                    this.geometryObj.obj.drawRectangle(this.geometryObj.node, this.mouseEvent.getPointList());
            			break;
            		default:
            			break;
            	}
            }
            this.layerEventByMouseOver(event);
            this.fireEvent("mousemove", { event: event });
            event.stopPropagation();
		},
		mouseUpEvent:function(event)
		{
			event = event || window.event;
            event.stop();
             if(this.loader){
	            //this.handles.interval=setInterval(this.dragAndDragFn.bind(this),10);
            	switch(this.mouseEvent.eventtype)
            	{
            		case 1://拖曳
            			 this.root.setStyle("cursor", "");
            			 this.isDragging=false;
            			 this.mouseEvent.eventtype=0;
            			 break;
            		case 3:
            			 if (this.mouseEvent.getdx() > 5 || this.mouseEvent.getdy() >5) 
            				 {
		                      var isvail=this.model.setZoom((this.options.activeTool == "+")?true:false);
					            if(isvail)
					            {
						            var p= this.mouseEvent.getCenter();
						            this.model.setWheelPos(p[0],p[1]);
						            this.zoomLayer();
					            }
				            }
				            this.geometryObj.clear();
	                    	this.mouseEvent.eventtype = 2;
            			break;
            		case 5:
            			 if (this.mouseEvent.getdx() > 5 || this.mouseEvent.getdy() >5) 
            				 {
            				 	var scpt=this.mouseEvent.startpoint;
            				 	var ecpt=this.mouseEvent.endpoint;
		                       	var spt=this.model.toMap(scpt[0],scpt[1]);
		                       	var ept=this.model.toMap(ecpt[0],ecpt[1]);
		                       	var xmin=Math.min(spt[0],ept[0]);
		                       	var xmax=Math.max(spt[0],ept[0]);
		                       	var ymin=Math.min(spt[1],ept[1]);
		                       	var ymax=Math.max(spt[1],ept[1]);
		                       	var data={ event: event, min: [xmin,ymin], max: [xmax, ymax] };
		                       	this.mouseEvent.eventtype = 4;
		                       	if (this.options.queryHandler != null) {
			                        this.options.queryHandler(data);
			                    		}
		                        this.fireEvent('areaselect', data);
				            }else{
				            	this.mouseEvent.eventtype = 4;
				            	}
				            this.geometryObj.clear();
	                    	
            			break;
            		default:
            			this.root.setStyle("cursor", "");
            			this.isDragging=false;
            			break;
            	}
            	 if (this.mouseEvent.getdx() < 5 && this.mouseEvent.getdy() <5) {
                        if (((event.event.which) && (event.event.which == 3)) || ((event.event.button) && (event.event.button == 2))) {
                            if (this.options.contentMenu.obj != null && this.options.contentMenu.visible) {
                            	var p=this.getPos(event);
                            	var point={x:p[0],y:p[1]};
                            	var xy=this.model.toMap(p[0],p[1]);
                            	this.options.contentMenu.obj.latLng={x:xy[0],y:xy[1]};
                                this.options.contentMenu.obj.toggle(point);
                            }
                        }
                        this.fireEvent("mouseup", { event: event });
                    }
            }
             this.fireEvent("mouseup", { event: event });
            event.stopPropagation();
		},
		mouseLeaveEvent:function(event)
		{
			 event = event || window.event;
            event.stop();
            if (this.loader) {
            	 
            	switch(this.mouseEvent.eventtype)
            	{
            		case 1://拖曳
            			this.root.setStyle("cursor", "");
            			 this.isDragging=false;
            			 this.mouseEvent.eventtype=0;
            			 break;
            		case 3:
	                      var isvail=this.model.setZoom((this.options.activeTool == "+")?true:false);
				            if(isvail)
				            {
					            var p= this.mouseEvent.getCenter();
					            this.model.setWheelPos(p[0],p[1]);
					            this.zoomLayer();
				            }
				            this.geometryObj.clear();
	                    	this.mouseEvent.eventtype = 2;
            			break;
            		default:
            			 this.root.setStyle("cursor", "");
            			 this.isDragging=false;
            			break;
            	}
            }
		},
		touchmoveEvent:function(e){
			var touch=e.touches[0];
			e.preventDefault();
			var x=touch.pageX;
			var y=touch.pageY;
			this.mousePosNow[0]=x;
			this.mousePosNow[1]=y;
		},
		touchPos:[],
		touchstartEvent: function (e) {
           e.preventDefault();
          
            if(this.loader){ 
            	if (e.touches.length <2) {
	            	if(this.mouseEvent.eventtype==0)
	            	{
	            		if(window.map_opinterval==null){
				            	window.map_opinterval=setInterval(this.dragAndDragFn.bind(this),10);
				            }
	            			this.isDragging=true;
	            			var touch = e.touches[0];
	            			var x=touch.pageX;
							var y=touch.pageY;
							this.mousePosNow[0]=x;
							this.mousePosNow[1]=y;
	            			this.mousePosLast[0]=this.mousePosNow[0];
			                this.mousePosLast[1]=this.mousePosNow[1];
			                this.speed=[0,0];
		                    var p0= [0,0];
			            	this.smooth=[p0,p0,p0,p0];
			            	this.mouseEvent.eventtype=1;
			         }
            	 }else{
            		 if(e.touches.length>1)
            			 {
			            	if (this.mouseEvent.eventtype == 1) {
			                     this.isDragging=false;
			        			 this.mouseEvent.eventtype=0;
			                }
            			 	this.touchPos=[];
            			 	for(var i=0,k=e.touches.length;i<k;i++)
            			 		{
            			 		this.touchPos.push([e.touches[i].pageX,e.touches[i].pageY]);
            			 		}
            			 }
            		 
            	 }
            	
            }
        },
         touchendEvent: function (e) {
            e.preventDefault();
          
//            if (e.touches.length > 1) {
//                return;
//            }
            if (this.loader) {
                if (this.mouseEvent.eventtype == 1) {
                     this.isDragging=false;
        			 this.mouseEvent.eventtype=0;
                }
            }
        },
        ongestureendEvent:function(e){
        		e.preventDefault();
  				if(window.map_opinterval==null){
					   window.map_opinterval=setInterval(this.dragAndDragFn.bind(this),10);
				}
        },
         ongesturechangeEvent: function (e) {
        	e.preventDefault();
            if (this.loader != true) {
                return false;
            }
            if (this.wheelTimer_ == null) {
                this.wheelTimer_ = window.setTimeout(function () { window.clearTimeout(this.wheelTimer_); $clear(this.wheelTimer_); this.wheelTimer_ = null; }.bind(this), 450);
            } else { return false; }
           var zoomIn = (e.scale > 1 ? true : false);
           if(this.touchPos.length>1)
            {
	            var isvail=this.model.setZoom(zoomIn);
	            if(isvail)
	            {
	            		var pos=this.touchPos;
	            		var x0=(pos[0][0]+pos[1][0])/2;
	            		var y0=(pos[0][1]+pos[1][1])/2;
			            this.model.setWheelPos(x0,y0);
			            this.zoomLayer();
	            }
           }
        },
		mouseEventDblclick:function(event)
		{
			 event = event || window.event;
			 if (window.TIMERCLICK_) {
                clearTimeout(window.TIMERCLICK_);
            }
			 
			if (this.mouseEvent.getdx() == 0 || this.mouseEvent.getdy() == 0) {
                var xy = this.getPos(event);
                var LatLng=this.model.toMap(xy[0],xy[1]);
                this.fireEvent("dblclick", [event, {x:LatLng[0],y:LatLng[1]}]);
                this.layerEventByDblclick(event);
            }
			event.stopPropagation();
		},
		mouseEventClick:function(event)
		{
			 event = event || window.event;
			  if (this.mouseEvent.getdx() == 0 || this.mouseEvent.getdy() == 0) {
                  var xy = this.getPos(event);
                 var LatLng=this.model.toMap(xy[0],xy[1]);
                if (window.TIMERCLICK_) {
                    clearTimeout(window.TIMERCLICK_);
                }
                window.TIMERCLICK_ = setTimeout(this.FireMapClickEvent.bind({ classObj: this, arg: [event,{x:LatLng[0],y:LatLng[1]}] }), 220);
            }
			 event.stopPropagation();
		},
		FireMapClickEvent: function () {
            this.classObj.fireEvent("click", this.arg);
            this.classObj.layerEventByClick(this.arg[0]);
        },
        stopEvent:function()
        {
        	this.root.removeEvents("mousewheel");
            this.root.removeEvents("mousedown");
            this.root.removeEvents("mousemove");
            this.root.removeEvents("mouseup");
            this.root.removeEvents("mouseleave");
            this.root.removeEvents("dblclick");
            this.root.removeEvents("click");
        },
        startEvent:function()
        {
        	this.stopEvent();
            this.root.addEvent("mousedown",this.mouseDownEvent.bindWithEvent(this));
			this.root.addEvent("mousemove",this.mouseMoveEvent.bindWithEvent(this));
			this.root.addEvent("mouseup",this.mouseUpEvent.bindWithEvent(this));
			this.root.addEvent("mouseleave",this.mouseLeaveEvent.bindWithEvent(this));
			this.root.addEvent("mousewheel", this.mapEventWheel.bindWithEvent(this));	
			this.root.addEvent("dblclick", this.mouseEventDblclick.bindWithEvent(this));	
			this.root.addEvent("click", this.mouseEventClick.bindWithEvent(this));	
        },
		refresh:function()
		{
			 var layers = this.layers;
            if (layers != null) {
                for (var i = 0, k = layers.length; i < k; i++) {
                    layers[i].refresh(this.model);
                }
            }
		},
		getCurrentExtent:function()
		{
			var op=this.model;
			var p0=op.toMap(0,0);
			var size=op.getViewSize();
			var p1=op.toMap(size[0],size[1]);
			return {xmin:p0[0],ymin:p1[1],xmax:p1[0],ymax:p0[1]};
		},
		 setActiveTool: function (activetype) {
            this.options.activeTool = activetype;
            if (this.options.activeTool == "$") {
                this.mouseEvent.eventtype = 0;
            } else if (this.options.activeTool == "+" || this.options.activeTool == "-") {
                this.mouseEvent.eventtype = 2;
            } else if (this.options.activeTool == "*") {
                this.mouseEvent.eventtype = 4;
            }
        },
        reposition:function()//待完善
        { 
        	this.model.restore();
        	this.layersdiv.setStyles({ left: 0, top: 0 });
        	this.mousePosLast=[0,0];
			this.mousePosNow=[0,0];
			this.bgPos=[0,0];
			this.zoomLayer();
        },
        getLevel:function()
        {
        	return this.model.getLevel();
        },
        getExtent:function()
        {
        	return this.model.getExtent();
        },
        getResolution: function () {
        	return this.model.getRes();
        },
        setLevel:function(z,refreshmap)//待完善
        {
        	this.model.setLevel(z);
        	if(refreshmap)
        		{ 
		            this.zoomLayer();
        		}
        	else{
        		 var p=this.model.getWheelPos();
	            var point={x:p[0],y:p[1]};
	            var extent=this.getExtent();
	            var arg= { event:  window.event, level: this.getLevel(), point: point, extent: extent };
	            this.fireEvent("zoom", arg);
	            this.fireEvent("mousewheel", arg);
	            this.fireEvent("zoomend",arg);
        	}
        	
        },
        upLevel:function()
        {
        	var isvail=this.model.setZoom(true);
            if(isvail)
            {
            	var p=this.model.getCenterPos();
	            this.model.setWheelPos(p[0],p[1]);
	            this.zoomLayer();
            }
        },
        downLevel:function()
        {
        	var isvail=this.model.setZoom(false);
            if(isvail)
            {
            	var p=this.model.getCenterPos();
	            this.model.setWheelPos(p[0],p[1]);
	            this.zoomLayer();
            }
        },
        setCenter:function(point,level)
        {
        	var px=0,py=0;
        	if(point==null)
        		{
        			return;
        		}else{
	        		var t=$type(point);
		        	if(t=="object")
		        		{
			        		px=point.x.toFloat();
			        		py=point.y.toFloat();
		        		}else{
			        		px=point[0].toFloat();
			        		py=point[1].toFloat();
		        		}
		        	 if(isNaN(px) ||isNaN( py))
		        		 {
		        		 	return;
		        		 }
	        	 }
        	if(window.map_opinterval==null)
        		{
	        		window.map_opinterval=setInterval(this.dragAndDragFn.bind(this),10);
        		}
        	if(level!=null)
        		{
        			this.setLevel(level);
        		}
        	var size=this.model.getViewSize();
	        	var p=this.model.toScreen(px,py);
	        	var x=p[0]-size[0]/2;
	        	var y=p[1]-size[1]/2;
	        	var pos=this.model.getPos();
	        	var x0=pos[0]-x;
	        	var y0=pos[1]-y;
	        	this.defaultPos=[x0,y0];
	        	var bgpos=this.bgPos;
	        	var w=this.width;
	        	var h=this.height;
	        	var bgx=this.bgPos[0];
	        	var bgy=this.bgPos[1];
	        	if(Math.abs(bgpos[0]-x0)>w)
	        		{
	        			var f=(bgpos[0]-x0)>0?1:-1;
	        			bgx=x0+f*w;
	        		}
	        	if(Math.abs(bgpos[1]-y0)>h)
	        		{
	        			var f=(bgpos[1]-y0)>0?1:-1;
	        			bgy=y0+f*h;
	        		}
	        	this.bgPos=[bgx,bgy];
	        	this.isBacking=true;
	        	this.fxtype=1;
	        	this.locatePos=[px,py];
        	
        },
        getCenter:function(){
			var cen=this.model. getCenterPoint();
        	return {x:cen[0],y:cen[1]};
        },
        panMove:function(x,y)
        {
        	if(window.map_opinterval==null)
        		{
	        		window.map_opinterval=setInterval(this.dragAndDragFn.bind(this),10);
        		}
        	var pos=this.model.getPos();
        	this.defaultPos=[pos[0]+x,pos[1]+y];
        	this.isBacking=true;
        },
        locatePos:[0,0]
        ,FXFn:function(pos2)
        {
        	if(this.fxtype==1)
        		{
        				var op=this.model;
		            	var size=op.getViewSize();
		            	var xy=this.locatePos;
		            	var p=op.toScreen(xy[0],xy[1]);
		            	this.zoomEffect2(p,0);
		            	 
        		}
        	this.fxtype=0;
        },
        zoomEffect2:function(point,inOrOut)
		{
			 window.clearInterval(window.zoomflashtimeout);
			 var size=this.model.getViewSize();
			 this.geometryObj.init(this.toolsdiv,size);
            var obj = this;
            var x = point[0];
            var y = point[1];
            var r = (inOrOut == 1 ? 15 : 56);
            var w0 = 5, w1 = 7;

            function zoomFlash(x, y, r, w0, w1, inOrOut) {
                var point0 = { x: x - r, y: y - r };
                var point1 = { x: x + r, y: y - r };
                var point2 = { x: x - r, y: y + r };
                var point3 = { x: x + r, y: y + r };
                var line0 = [], line1 = [], line2 = [], line3 = [];
                if (!inOrOut) {
                    line0 = [[point0.x, (point0.y + w0)], [point0.x, point0.y], [(point0.x + w1), point0.y]];
                    line1 = [[(point1.x - w1), point1.y], [point1.x, point1.y], [point1.x, (point1.y + w0)]];
                    line2 = [[point2.x, (point2.y - w0)], [point2.x, point2.y], [(point2.x + w1), point2.y]];
                    line3 = [[(point3.x - w1), point3.y], [point3.x, point3.y], [point3.x, (point3.y - w0)]];
                } else {
                    line0 = [[(point0.x - w0), point0.y], [point0.x, point0.y], [point0.x, (point0.y - w1)]];
                    line1 = [[(point1.x + w0), point1.y], [point1.x, point1.y], [point1.x, (point1.y - w1)]];
                    line2 = [[point2.x, (point2.y + w1)], [point2.x, point2.y], [(point2.x - w0), point2.y]];
                    line3 = [[(point3.x + w0), point3.y], [point3.x, point3.y], [point3.x, (point3.y + w1)]];
                }
                var r0=2*r;
                var p0=[[x,y-r0],[x,y+r0]];
                var p1=[[x-r0,y],[x+r0,y]];
//                var p2=[[x-r0,y-r0],[x+r0,y-r0],[x+r0,y+r0],[x-r0,y+r0]];
 				obj.geometryObj.obj.drawLineString(obj.geometryObj.node4, p0, false, { stroke: { color: "#511E03", width: 2 } });
 				obj.geometryObj.obj.drawLineString(obj.geometryObj.node5, p1, false, { stroke: { color: "#511E03", width: 2 } });
// 				obj.geometryObj.obj.drawPolygon(obj.geometryObj.node5, p2, {fillColor:[27,68,57, 0.8], stroke: { color: "#000000", width: 0 } });
                obj.geometryObj.obj.drawLineString(obj.geometryObj.node0, line0, false, { stroke: { color: "#62211E", width: 2 } });
                obj.geometryObj.obj.drawLineString(obj.geometryObj.node1, line1, false, { stroke: { color: "#62211E", width: 2 } });
                obj.geometryObj.obj.drawLineString(obj.geometryObj.node2, line2, false, { stroke: { color: "#62211E", width: 2 } });
                obj.geometryObj.obj.drawLineString(obj.geometryObj.node3, line3, false, { stroke: { color: "#62211E", width: 2 } });
            }
            window.zoomflashtimeout = window.setInterval(function () {if (r < 31 && inOrOut == 1) { zoomFlash(x, y, r, w0, w1, inOrOut); r += 15; } else if (r > 0 && inOrOut == 0) { zoomFlash(x, y, r, w0, w1, inOrOut); r -= 15; } else { window.clearInterval(window.zoomflashtimeout); obj.geometryObj.clear(); } }, 220);
        
		}
	})
	
});
})();