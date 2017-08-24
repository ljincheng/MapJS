/*
Class: MapGIS.Layers.MapImageLayer
Required :Point.js , Extent.js
*/

(function(){
	MapGIS.Layers.extend({

	    MarkerLayer: new Class({
	        Extends: MapGIS.Layers.BaseLayer,
	        Implements: [Events, Options],
	        options: {
	            isLigature: false,
	            rebuildPoint: true,
	            combosWindow: true,
	            paletteObj: null,
	            mapLayer: null,
	            tabWindow: null,
	            imgDeflectX: 10,
	            imgDeflectY: 34,
	            imgWidth: 20,
	            imgHeight: 34,
	            imgClass: "marker",
	            strokecolor: "#0c68c5",
	            strokeweight: 2,
	            imgSrc: "",
	            visibleWindow: false,
	            defaultMarker: null,
	            pointClickFn: null,
	            simpleDisplay:false,
	            effects:false,
	            selectedPointID:null,
	            graphicsData: []
	        },
	        geometry: null,
	        lineRoot: null,
	        graphicsRoot: null,
	        geomDIV: null,
	        pointList: [],
	        showLines: false,
	        pointObjLayer: null,
	        selectedItem: { index: -1, marker: null },
	        loadZoomImgsHandle:null,
	        loadLayer: function (op) {
	        	var size=op.getViewSize();
	        	this.options.width=size[0];
	        	this.options.height=size[1];
	        	this.div.setStyle("-webkit-user-select", "");
	        	this.div.setStyle("-moz-user-select", "");
	        	this.div.onselectstart=function(){return true;}
	        	this.div.unselectable="";
	            this.pointObjLayer = new Element("div", {   styles: { position: "absolute", left: 0, top: 0 ,zIndex:2} });
	            this.div.appendChild(this.pointObjLayer);
	            this.geomDIV = new Element("div", { styles: { display: "none", pointerEvents: "none", position: "absolute", left: 0, top: 0 ,zIndex:1} });
	            this.geomDIV.inject(this.div);
	            this.geometry = new MapGIS.Geometry(this.geomDIV, { width: this.options.width, height: this.options.height });
	            this.lineRoot = this.geometry.creatGroup();
	            this.graphicsRoot = this.geometry.creatGroup();
	            this.loader = true;
	            this.parent(op);
	        },hexUnescape:function(str) {
	        		if(typeof str != "undefined" && (str!=null))
	        				{
						    str=str.replace(/\\[u,U]/g,"%u");
						    return unescape(str);
	        				}else{
	        					return "";
	        				}
	        	},
	        dragingLayer: function (op) {
	        	if(this.parent(op))
	        	{
	        		if(this.options["simpleDisplay"]){
	        			this.geomDIV.setStyle("display","none");
	        		}
		        	var t=op.isMoving();
		        	if(!t )
		        	{
	  					this.drawGeom();
	  					this.drawLine();
			            var pos=this.mapoptions.getPos();
			        	var sop={left:-pos[0],top:-pos[1]};
			        	this.geomDIV.setStyles(sop);
		        	} 
	        	} 
	        },
	         reloadLayer:function(op)
	        {
	        	this.drawGeom();
	        	this.drawLine();
	            var pos=this.mapoptions.getPos();
	        	var sop={left:-pos[0],top:-pos[1]};
	        	this.geomDIV.setStyles(sop); 
	        },
	        zoomLayer:function(op)
	        {
	        	if(this.parent(op))
	        	{
		            this.transformPointCoord();
		            this.drawGeom();
		            this.drawLine();
		            var pos=this.mapoptions.getPos();
		        	var sop={left:-pos[0],top:-pos[1]};
		        	this.geomDIV.setStyles(sop); 
	        	} 
	        },
	      eventFn_click:function(e,data,row)
	       	{
				 e.stopPropagation();
			  	if(this.options["visibleWindow"])
	        	{
				   var id=this.getCardWindowID(row);
					if($(id))
						{
							$(id).fade("in");
							$(id).setStyle("z-index",++this.cardIndex);
							this.setCardData(row,data);
						}else{
							var win=this.cardWindow(row,data);
	        				if(win!=null)
	        					{
	        						win.inject(this.pointObjLayer);
	        					}
						}
	        		 
	        	}
			  	var id=this.id+"_p_"+(row);
			  	var rtn= { srcElement:$(id), row:row, data: data, layer: this };
				this.fireEvent("click", rtn);
				this.fireEvent("pointclick", rtn);
			  	if(this.options.effects && this.options.selectedPointID!=null)
	   			{
			  		if(this.options.selectedPointID!=id)
			  			{
					  		var srcel=$(this.options.selectedPointID);
			   			var pos=srcel.getStyle("background-position");
			   			var width=srcel.getStyle("width");
			   			var positon=pos.split(" ");
			   				var pos_x=positon[0];
			   				var pos_y=positon[1];
			   				var x=pos_x.toInt();
			   				var w=width.toInt();
			   				srcel.setStyle("background-position",(x+w)+"px "+pos_y);
			   				srcel.removeClass("focusMapPoint");
			  			}
	   			}
			  	this.options.selectedPointID=id;
			  
	       		 
	       	},
	       	eventFn_mouseOver:function(e,data,row){
	       	 e.stopPropagation();
	       		var id=this.id+"_p_"+(row);
	       		var srcel=$(id);
	       		var rtn= { srcElement:srcel, row:row, data: data, layer: this };
	       		this.fireEvent("pointmouseover", rtn);
	       		this.fireEvent("mouseover", rtn);
	       		srcel.addClass("focusMapPoint");
	       		this.effectsStart(row);
			   
	       	},
	       	eventFn_mouseOut:function(e,data,row){
	       	 e.stopPropagation();
	       		var id=this.id+"_p_"+(row);
	       		var srcel=$(id);
	       		var rtn= { srcElement:srcel, row:row, data: data, layer: this };
	       		this.fireEvent("pointmouseout", rtn);
	       		this.fireEvent("mouseout", rtn);
	       		srcel.removeClass("focusMapPoint");
	       		this.effectsEnd(row);
	       	},
	      effectsStart:function(row)
	       	{
	    	  if(this.options.effects)
					{
	    		  		var id=this.id+"_p_"+(row);
	         		var srcel=$(id);
	       			if(this.options.selectedPointID!=id)
		   				{
		       			var pos=srcel.getStyle("background-position");
		       			var width=srcel.getStyle("width");
		       			var positon=pos.split(" ");
		       				var pos_x=positon[0];
		       				var pos_y=positon[1];
		       				var x=pos_x.toInt();
		       				var w=width.toInt();
		       				srcel.setStyle("background-position",(x-w)+"px "+pos_y);
		   				}
					}
	       	},
	       effectsEnd:function(row){
	       	 if(this.options.effects)
				{
			  		var id=this.id+"_p_"+(row);
			  		var srcel=$(id);
					if(this.options.selectedPointID!=id)
					{
		   			var pos=srcel.getStyle("background-position");
		   			var width=srcel.getStyle("width");
		   			var positon=pos.split(" ");
		 				var pos_x=positon[0];
		 				var pos_y=positon[1];
		 				var x=pos_x.toInt();
		 				var w=width.toInt();
		 				srcel.setStyle("background-position",(x+w)+"px "+pos_y);
					
					}else{
				 		srcel.addClass("focusMapPoint");
					 }
				}
	       		
	       	},
	       getElementByID:function(i)
	       	{
	       		return this.pointObjLayer.getElementById(this.id+"_p_"+i);
	       	},
	        toScreen:function(pt)
	        {
	        	var p= this.mapoptions.toLayerScreen(pt[0],pt[1]);
	        	var rtn={x:(p[0]),y:(p[1])};
	        	return rtn;
	        },
	        setData: function (data) {
	        	this.selectedItem.index=-1;
	        	this.options.selectedPointID=null;
	            this.pointList = data;
//	            if(this.loader  && this.isContinue())
//	            if( this.isContinue())
//	            	{
	            		this.drawPoint();
	            		this.drawLine();
//	            	}
	        },
	        setGraphicsData: function (arg) {
	            this.options.graphicsData = arg;
	            if(this.loader  && this.isContinue())
	            {
	            	this.drawGeom();
	            }
	        },
	        getLatLngValue: function (obj) {
	            if (obj != null) {
	                var x = obj["x"] || obj["X"] || obj["xpos"];
	                var y = obj["y"] || obj["Y"] || obj["ypos"];
	                var x_ = typeof (x) == "string" ? x.toFloat() : x;
	                var y_ = typeof (y) == "string" ? y.toFloat() : y;
	                return [ x_, y_];
	            }
	            else {
	                return null;
	            }
	        },
	        setDefaultMarker: function (marker) {
	            this.options.defaultMarker = marker;
	        },
	        setMarkerImage: function (obj) {
	            this.options.imgSrc = this.options.source + "images/transparent.gif";
	            this.options.imgDeflectY = 34;
	            this.options.imgDeflectX = 10;
	            this.options.imgWidth = 20;
	            this.options.imgHeight = 34;
	            this.options.imgClass = "marker";
	            if (obj != null) {
	                for (var item in obj) {
	                    this.options[item] = obj[item];
	                }
	            }
	        },
	       	selectedPoint:function(row,marker)
	       	{
	        	
	        	this.selectedItem.index=row;
	        	if(marker){this.selectedItem.marker=marker; };
	        	var plist=this.pointList;
	        	
	        	if(plist!=null && plist.length>0)
	        		{
	        			var pointid=this.id+"_p_";
	        			this.cardIndex++;
	        			var topIndex=this.cardIndex;
	        			var hasSelMarker=(this.selectedItem.marker!=null?true:false);
	        			var imgclass=null;
	        			 if(hasSelMarker)
		                	{
		                		this.setMarkerImage(this.selectedItem.marker);
		                		imgclass=this.options.imgClass;
		                	}
			        	for(var i=0,k=plist.length;i<k;i++)
	        				{
	        					 var id=pointid+i;
	        					 if($(id))
				                {
	        						var el=$(id);
					                var marker = plist[i].marker;
					                if(hasSelMarker)
					                	{
					                		 el.removeClass(imgclass);
					                	}
					                if (marker) {
					                    this.setMarkerImage(marker);
					                } else {
					                    this.setMarkerImage(this.options.defaultMarker);
					                }
					                el.removeClass(this.options.imgClass);
					                if (this.selectedItem.index == i) {
					                    this.setMarkerImage(this.selectedItem.marker);
					                    el.setStyle("zIndex",topIndex);
					                }
					                var xy=this.getLatLngValue(plist[i]);
		        					var p = null;
					                if (xy != null) {
					                    p = this.toScreen(xy);
					                }
					                else {
					                    break;
					                }
					                 var left = parseInt(p.x) - this.options.imgDeflectX;
				                	 var top = parseInt(p.y) - this.options.imgDeflectY;
				                	 el.setStyles({left:left,top:top});
			                		 if(!el.hasClass(this.options.imgClass))
			                		 {
			                			  el.addClass(this.options.imgClass);
			                		 }
				                		
				                }
	        				}
	        		}
	       	},
	        drawPoint:function(){
	        	var plist=this.pointList;
	        	this.pointObjLayer.empty();
	        	if(plist!=null)
	        		{
	        			var layerid=this.id;
	        			for(var i=0,k=plist.length;i<k;i++)
	        				{
	        					var xy=this.getLatLngValue(plist[i]);
	        					var p = null;
				                if (xy != null) {
				                    p = this.toScreen(xy);
				                }
				                else {
				                    continue;
				                }
//				                var content =this.hexUnescape(plist[i].content);
				                var marker = plist[i].marker;
				                if (marker) {
				                    this.setMarkerImage(marker);
				                } else {
				                    this.setMarkerImage(this.options.defaultMarker);
				                }
				                if (this.selectedItem.index == i) {
				                    this.setMarkerImage(this.selectedItem.marker);
				                }
				                var left = parseInt(p.x) - this.options.imgDeflectX;
				                var top = parseInt(p.y) - this.options.imgDeflectY;
				                var html = this.hexUnescape(plist[i].html);
				                var titletxt =this.hexUnescape(plist[i].title);
				                var showcard = plist[i].show;
				                
				                var id=layerid+"_p_"+i;
				                var img = new Element("div", { 'id': id, 'unselectable': 'on', 'class': 'pointImages', 'styles': {'left': left , 'top': top , 'position': 'absolute', 'cursor': 'pointer', 'display': 'block', 'fontSize': '12px' }, 'events': {
										        'click':this.eventFn_click.bindWithEvent(this,[plist[i],i]),
										        'mouseover': this.eventFn_mouseOver.bindWithEvent(this,[plist[i],i]),
										        'mouseout': this.eventFn_mouseOut.bindWithEvent(this,[plist[i],i])
										    }});
				                img.addClass(this.options.imgClass);
				                img.addClass(layerid+"_pointimg");
				                if (html != null) {
				                    img.set("html", html);
				                	}
				               if (titletxt != null) {
				                    img.set("title", titletxt);
				                	}
				                img.inject(this.pointObjLayer);
//				                alert(i)
				                if(this.options["visibleWindow"])
			                	{
			                		if(showcard)
			                			{
			                				var win=this.cardWindow(i,plist[i]);
			                				if(win!=null)
			                					{
			                						win.inject(this.pointObjLayer);
			                					}
			                			}
			                	}
	        				}
	        		}
	        },
	        drawLine:function()
	        {
	        	this.clearLines();
	        	if(this.showLines)
	        		{
	        	var plist=this.pointList;
	        	if(plist!=null)
	        		{
	        			var layerid=this.id;
	        			var data=[];
	        			for(var i=0,k=plist.length;i<k;i++)
	        				{
	        					var xy=this.getLatLngValue(plist[i]);
	        					var p = null;
				                if (xy != null) {
				                    p =  this.mapoptions.toScreen(xy[0],xy[1]);
				                    
				                    data.push(p);
				                }
				                else {
				                    continue;
				                }
	        				}
	        			this.lineFN(data);
	        		
	        		}
	        	}
	        },
	        dpos:[0,0],
	        ds:[0,0],
	        isRun:false,
	        runIndex:1,
	        mytimeout:null,
	        lineFN:function(data)
	        {
	        	if(this.mytimeout!=null)
	        		{
	        			window.clearInterval(this.mytimeout);
	        		}
	        	this.isRun=true;
	        	this.runIndex=1;
	        	if(data!=null && data.length>0)
	        		{
	        			this.dpos=data[0];
	        		}
	        	
	        	this.mytimeout=window.setInterval(this.gotoLine.bind(this,[data]),120)
	        },
	        gotoLine:function(data)
	        {
	        	if(!this.isRun)
	        		{
	        			window.clearInterval(this.mytimeout);
	        		}else if(data!=null && data.length>this.runIndex){
	        			var pdata=[];
	        			for(var i=0,k=this.runIndex;i<k;i++)
	        				{
	        					pdata.push(data[i]);
	        				}
	        			var edata=data[this.runIndex];
	        			var f=this.runIndex-1;
	        			var sdata=data[f];
	        			this.ds=[(edata[0]-sdata[0])/4,(edata[1]-sdata[1])/4];
	        			this.dpos=[this.dpos[0]+this.ds[0],this.dpos[1]+this.ds[1]];
	        			var dx=Math.abs(this.dpos[0]-sdata[0]);
	        			var dy=Math.abs(this.dpos[1]-sdata[1]);
	        			var d0x=Math.abs(edata[0]-sdata[0]);
	        			var d0y=Math.abs(edata[1]-sdata[1]);
	        			var endPoint=[sdata];
	        			if(dx>=d0x || dy>=d0y)
	        				{
	        					this.runIndex++;
	        					pdata.push(edata);
	        				}else{
	        					endPoint.push(this.dpos);
	        				}
	        			
	        			this.clearLines();
			    		var gstyle= {stroke: { color: "#4A2C48", width: 3}};
						this.geomDIV.setStyle("display", "block");
						if(pdata.length>1)
							{
								var node = this.geometry.nodeFactory("shape");
					            this.geometry.drawLineString(node, pdata, false, gstyle);
					            node.inject(this.lineRoot);
							}
						if(endPoint.length>1)
							{
				            var gstyle2= {stroke: { color: "#BB261F", width: 3}};
				            var node2 = this.geometry.nodeFactory("shape");
				            this.geometry.drawLineString(node2, endPoint, false, gstyle2);
				            node2.inject(this.lineRoot);
			            }
	        			
	        		}else{
	        			this.isRun=false;
	        		}
	        },
	        drawGeom:function(){
	        	 var _data = this.options.graphicsData;
	        	 this.clearGraphics();
	            if (_data != null && _data.length > 0) {
	            	 this.geomDIV.setStyle("display", "block");
	                var grapData = [];
	                for (var i = 0, k = _data.length; i < k; i++) {
	                    var _tmp = _data[i].data;
	                    var data = null;
	                    var gtype = _data[i].gtype;
	                    var gstyle = _data[i].gstyle;
	                    if (gtype == "CIRCLE") {
	                        var pObjSize = this.mapoptions.toScreen(_tmp.x, _tmp.y);
	                        var r_ = _tmp.r / this.mapoptions.resolution(this.mapoptions.getLevel()).x;
	                        data = { x: parseInt(pObjSize[0]), y: parseInt(pObjSize[1]), r: r_ };
	                    }
	                    else {
	                        data = [];
	                        for (var i1 = 0, k1 = _tmp.length; i1 < k1; i1++) {
	                            var point = _tmp[i1];
	                            var pObjSize = this.mapoptions.toScreen(point[0],point[1]);
	                            data.push(pObjSize);
	                        }
	                    }
	                    var node = null;
	                    switch (gtype) {
	                        case "RECTANGLE":
	                            node = this.geometry.nodeFactory("shape");
	                            this.geometry.drawRectangle(node, data, gstyle);
	                            break;
	                        case "CIRCLE":
	                            node = this.geometry.nodeFactory("circle");
	                            this.geometry.drawCircle(node, data, gstyle, true);
	                            break;
	                        case "LINE":
	                            node = this.geometry.nodeFactory("shape");
	                            this.geometry.drawLineString(node, data, false, gstyle);
	                            break;
	                        case "LINEARRING":
	                            node = this.geometry.nodeFactory("shape");
	                            this.geometry.drawLineString(node, data, true, gstyle);
	                            break;
	                        default:
	                            node = this.geometry.nodeFactory("shape");
	                            this.geometry.drawPolygon(node, data, gstyle);
	                            break;
	                    }
	                    node.inject(this.graphicsRoot);
	                }
	            }
	        },
	        clearPoint: function () {
	            this.pointObjLayer.empty();
	        },
	        clearLines:function(){
	        	var children = this.lineRoot.children;
//	            this.geomDIV.setStyle("display", "none");
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
	        },
	        clearGraphics: function () {
	            var children = this.graphicsRoot.children;
//	            this.geomDIV.setStyle("display", "none");
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
	        },
	        clear: function () {
	            this.pointList = null;
	            this.pointList = [];
	            this.options.graphicsData = null;
	            this.options.graphicsData = [];
	            this.clearPoint();
	            this.clearGraphics();
	            this.clearLines();

	        },
	        destory: function () {
	            this.clear();
	            this.removeEvents("pointclick");
	            this.removeEvents("pointmouseover");
	            this.removeEvents("click");
	            this.removeEvents("mouseover");
	            this.removeEvents("dblclick");
	        },
	        transformPointCoord:function()
	        {
	        	var plist=this.pointList;
	        	if(plist!=null)
	        		{
	        			var pointid=this.id+"_p_";
	        			for(var i=0,k=plist.length;i<k;i++)
	        				{
	        					 var id=pointid+i;
	        					 if($(id))
				                {
	        						var el=$(id);
		        					var xy=this.getLatLngValue(plist[i]);
		        					var p = null;
					                if (xy != null) {
					                    p = this.toScreen(xy);
					                }
					                else {
					                    break;
					                }
					                var content = plist[i].content;
					                var marker = plist[i].marker;
					                if (marker) {
					                    this.setMarkerImage(marker);
					                } else {
					                    this.setMarkerImage(this.options.defaultMarker);
					                }
					                el.removeClass(this.options.imgClass);
					                if (this.selectedItem.index == i) {
					                    this.setMarkerImage(this.selectedItem.marker);
					                }
					                var left = parseInt(p.x) - this.options.imgDeflectX;
					                var top = parseInt(p.y) - this.options.imgDeflectY;
					                var html = plist[i].html;
					                var titletxt = plist[i].title;
					                var showcard = plist[i].show;
				                
			                		 el.setStyles({left:left,top:top});
			                		 if(!el.hasClass(this.options.imgClass))
			                		 {
			                			  el.addClass(this.options.imgClass);
			                		 }
				                		
				                }
	        				}
	        			var cardWin=this.pointObjLayer.getElements("div.pointImages_card");
	        			
	        			cardWin.each(function(el){
	        				var pdata=el.retrieve("pdata");
	        				var xy=this.getLatLngValue(pdata);
	        					var p = null;
				                if (xy == null) {
				                	return;
				                }else{
				                    p = this.toScreen(xy);
				                }
	        					el.setStyles({left:p.x,top:p.y});
	        			}.bind(this));
	        		}
	        }, 
	        cardIndex:1,
	        getCardWindowID:function(id)
	        {
	        	if(this.options["combosWindow"])
	        		{
						var lid=this.id;
						return lid+"_tbl";
	        		
	        		}else{
	        			var lid=this.id;
						return lid+"_p_"+id+"_tbl";
	        		}
	        },
	        combosWindowData:null,
	        setCardData:function(id,data){
	        	 var wid=this.getCardWindowID(id);
	        	if($(wid+"_con"))
	        		{
	        			$(wid+"_con").set("html",this.hexUnescape(data.content));
	        			if($(wid))
	        				{
	        					var xy=this.getLatLngValue(data);
	        					var p = null;
				                if (xy == null) {
				                	return;
				                }else{
				                    p = this.toScreen(xy);
				                }
				                $(wid).store('pdata', data);
	        					$(wid).setStyles({left:p.x,top:p.y});
	        				}
	        		}
	        	if(this.options["combosWindow"])
	        		{
	        			this.combosWindowData=data;
	        		}
	        },
	        cardWindow:function(id,data)
	        {
	        	this.cardIndex++;
	        	var content=this.hexUnescape(data.content);
	        	var _ID_Str=this.getCardWindowID(id);
	        	var xy=this.getLatLngValue(data);
				var p = null;
	            if (xy == null){
	            	return;
	            }else{
	                p = this.toScreen(xy);
	            }
	            var left=p.x;
	            var top=p.y;
	        	
	        	if($(_ID_Str))
	        		{
	        			$(this.getCardWindowID(id)).store('pdata', data);
						$(this.getCardWindowID(id)).setStyles({left:left,top:top});
	        			return null;
	        		}
	                    var imgPath = this.source + "images/window/"; //图片目录
	                    var _table = "<div style=\"z-index:1;position:absolute; bottom:68px; left:-38px; min-width:200px;box-shadow: #666 0px 0px 10px; -moz-box-shadow: #666 0px 0px 10px;-webkit-box-shadow: #666 0px 0px 10px; background:#ffffff; border:1px solid #ababab;\">";
	                   _table+="<br>";
	                   _table += "<img src=\"" + imgPath + "IMCloseButton_Normal.png\"   onclick='MapGIS.closeTabWindow(\"" + _ID_Str + "\",event)'  style=\"position:absolute;top:5px; cursor:pointer; right:5px;\"/>";
	                     _table += "<div id=\""+_ID_Str+"_con\" style=\"min-width:240px;min-height:100px; margin:10px;\" onclick=\"MapGIS.stopPropagation(event)\">";
	                    _table += (typeof(content)=="undefined"?"":content);
	                     _table += "</div>";
	                    _table += "<div style=\"width:200px;height:1px; \"></div><div style=\"position:absolute; bottom:-70px; BACKGROUND: url(" + imgPath + "w.png) no-repeat -5px -715px; width:92px; height:70px; margin-top:-64px; margin-left:38px;\"></div>";
	                    _table += "</div>";
	                    var windiv = new Element("div", { "id": _ID_Str, "class": "pointImages_card", "styles": { "left":(left) + "px", "top": top + "px", "position": "absolute", "cursor": "pointer", "display": "block", "fontSize": "12px","border":"0px solid black" ,"z-index":this.cardIndex}});
	                 	windiv.set("html",_table);
	                 	windiv.store('pdata', data);
	                 	
	                 	windiv.addEvent('mousedown', function (event) {
	                        event.stopPropagation();
	                        return true;
	                    });
	                 	windiv.addEvent('mouseup', function (event) {
	                        event.stopPropagation();
	                        return true;
	                    });
	                 	windiv.addEvent('mousemove', function (event) {
	                 		event.stopPropagation();
	                 		return true;
	                 	});
//	                 	windiv.onselectstart=function(event){event.cancelBubble=true;return true;}
	                 	
	                 	return windiv;
	        }

	    })

	});

	})();