/*
Class: MapGIS.Layers.MapImageLayer
Required :Point.js , Extent.js
*/
(function(){
MapGIS.Layers.extend({

    MapImageLayer: new Class({
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
            visibleWindow: true,
            defaultMarker: null,
            pointClickFn: null,
            simpleDisplay:false,
            graphicsData: []
        },
        geometry: null,
        lineRoot: null,
        graphicsRoot: null,
        geomDIV: null,
        pointList: [],
        linesVisibility: false,
        pointObjLayer: null,
        selectedItem: { index: -1, marker: null },
        loadZoomImgsHandle:null,
        loadLayer: function (op) {
        	var size=op.getViewSize();
        	this.options.width=size[0];
        	this.options.height=size[1];
        	
            this.pointObjLayer = new Element("div", { unselectable: 'on', styles: { position: "absolute", left: 0, top: 0 ,zIndex:2} });
            this.div.appendChild(this.pointObjLayer);
            this.geomDIV = new Element("div", { styles: { display: "none", pointerEvents: "none", position: "absolute", left: 0, top: 0 ,zIndex:1} });
            this.geomDIV.inject(this.div);
            this.geometry = new MapGIS.Geometry(this.geomDIV, { width: this.options.width, height: this.options.height });
//            this.lineRoot = this.geometry.creatGroup();
            this.graphicsRoot = this.geometry.creatGroup();
            this.loader = true;
            this.parent(op);
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
		            var pos=this.mapoptions.getPos();
		        	var sop={left:-pos[0],top:-pos[1]};
		        	this.geomDIV.setStyles(sop); 
	        	} 
        	} 
        },
         reloadLayer:function(op)
        {
        	this.drawGeom();
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
	            var pos=this.mapoptions.getPos();
	        	var sop={left:-pos[0],top:-pos[1]};
	        	this.geomDIV.setStyles(sop); 
        	} 
        },
        eventHandle:{mouseover:null,click:null,dblclick:null},
    	eventByMouseOver:function(op)
       	{
        	if(!op.isMoving())
        		{
        			if(this.eventHandle.mouseover!=null)
        				{
        					window.clearTimeout(this.eventHandle.mouseover);
        				}
        			this.eventHandle.mouseover=window.setTimeout(function(p){
						var rtn=this.searchPoint(p);
						if(rtn!=null)
							{
								this.fireEvent("pointmouseover", rtn);
								this.fireEvent("mouseover", rtn);
							}
        			}.bind(this,[op.getMousePos()]),500);
        		}
       	},
   		eventByClick:function(op)
       	{
       		if(!op.isMoving())
        		{
       			 
        			if(this.eventHandle.click!=null)
        				{
        					window.clearTimeout(this.eventHandle.click);
        				}
        			this.eventHandle.click=window.setTimeout(function(p){
						var rtn=this.searchPoint(p);
						if(rtn!=null)
							{
								this.fireEvent("click", rtn);
								this.fireEvent("pointclick", rtn);
//								rtn.srcElement.title=(rtn.data.x+","+rtn.data.y);
								var id=this.getCardWindowID(rtn.row);//this.id+"_p_"+rtn.row+"_tbl";
								var show=rtn.data.show;
								if($(id) && show)
									{
										$(id).fade("in");
										$(id).setStyle("z-index",++this.cardIndex);
										this.setCardData(rtn.row,rtn.data);
									}
								//this.resetSelectItemStyle(rtn.row);
								
							}
        			}.bind(this,[op.getMousePos()]),500);
        		}
       	},
       	eventByDblclick:function(op){
       		if(!op.isMoving())
        		{
       			
        			if(this.eventHandle.dblclick!=null)
        				{
        					window.clearTimeout(this.eventHandle.dblclick);
        				}
        			this.eventHandle.dblclick=window.setTimeout(function(p){
						var rtn=this.searchPoint(p);
						if(rtn!=null)
							{
								this.fireEvent("dblclick", rtn);
							}
        			}.bind(this,[op.getMousePos()]),500);
        		}
       	},
       	searchPoint:function(p)
       	{
       		var plist= this.pointList;
       		var rtn=null;
        	if(plist!=null && plist.length>0)
        		{
        			var op=this.mapoptions;
        			var nlist=null;
        			var d=0;
        			var nlist_i=0;
        			for(var i=0,k=plist.length;i<k;i++)
        				{
        				if(plist[i].x!=undefined && plist[i].y!=undefined)
        					{
        					var p0=op.toScreen(plist[i].x,plist[i].y);
        					var x=Math.abs(p0[0]-p[0]);
        					var y=(p0[1]-p[1]);
        					if(x<12 && y>0 && y<32 )
        						{
        							if(nlist==null)
        								{
        									nlist=plist[i];
        								    d=Math.pow(x,2)+Math.pow(Math.abs(y),2);
        								    nlist_i=i;
        								}else{
        									var d0=Math.pow(x,2)+Math.pow(Math.abs(y),2);
        									if(d0<d)
        										{
        											nlist=plist[i];
        											d=d0;
        											nlist_i=i;
        										}
        								}
        							
        						}
        					}
        					
        				}
        			
        			if(nlist!=null)
        				{
        					rtn= { srcElement: this.getElementByID(nlist_i), row:nlist_i, data: nlist, layer: this };
        				}
        		}
        	return rtn;
       	},
       	resetSelectItemStyle:function(i)
       	{
       		//img.addClass(layerid+"_pointimg");
       		var marker=this.selectedItem.marker;
       		if(marker!=null && marker.imgClass!=null && i!=null)
       			{
       			
		       		var layerid=this.id;
		       		var imgclass=marker.imgClass;
		       		var els=this.pointObjLayer.getElements("div."+layerid+"_pointimg");
		       		els.each(function(el){
		       			if(el.hasClass(imgclass))
		       				{
		       					el.removeClass(imgclass);
		       				}
		       		});
					var selObj=this.getElementByID(i);
					if(selObj)
						{
							selObj.addClass(imgclass);
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
            this.pointList = data;
            if(this.loader  && this.isContinue())
            	{
            		this.drawPoint();
            	}
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
			                    break;
			                }
			                var content = plist[i].content;
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
			                var html = plist[i].html;
			                var titletxt = plist[i].title;
			                var showcard = plist[i].show;
			                
			                var id=layerid+"_p_"+i;
			                var img = new Element("div", { "id": id, "unselectable": 'on', "class": "pointImages", "styles": { "left": left + "px", "top": top + "px", "position": "absolute", "cursor": "pointer", "display": "block", "fontSize": "12px" } });
			                img.addClass(this.options.imgClass);
			                img.addClass(layerid+"_pointimg");
			                if (html != null) {
			                    img.set("html", html);
			                }
			                if (titletxt != null) {
			                    img.set("title", titletxt);
			                }
			                img.inject(this.pointObjLayer);
			                if(this.options["visibleWindow"])
		                	{
		                		if(showcard==null || showcard)
		                			{
		                				var win=this.cardWindow(i,content,p.x,p.y);
		                				if(win!=null)
		                					{
		                					win.inject(this.pointObjLayer);
		                					}
		                			}
		                	}
        				}
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
        clearGraphics: function () {
            var children = this.graphicsRoot.children;
            this.geomDIV.setStyle("display", "none");
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
        			for(var i=0,k=plist.length;i<k;i++)
        				{
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
			                if (this.selectedItem.index == i) {
			                    this.setMarkerImage(this.selectedItem.marker);
			                }
			                var left = parseInt(p.x) - this.options.imgDeflectX;
			                var top = parseInt(p.y) - this.options.imgDeflectY;
			                var html = plist[i].html;
			                var titletxt = plist[i].title;
			                var showcard = plist[i].show;
			                var id=this.id+"_p_"+i;
			                if($(id))
			                	{
			                		$(id).setStyles({left:left,top:top});
			                	}
			                if(this.options["visibleWindow"])
		                	{
		                		if(showcard)
		                			{
		                				var cwin=$(this.getCardWindowID(i));
		                				if(cwin)
		                					{
		                					var data=this.combosWindowData;
			                					if(this.options["combosWindow"] && data!=null )
								        		{
			                						this.setCardData(i,data);
								        		}else{
		                							this.setCardData(i,plist[i]);
		                						}
		                					}
		                			}
		                	}
        				}
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
        	
        	if($(this.getCardWindowID(id)+"_con"))
        		{
        			$(this.getCardWindowID(id)+"_con").set("html",data.content);
        			if($(this.getCardWindowID(id)))
        				{
        					var xy=this.getLatLngValue(data);
        					var p = null;
			                if (xy == null) {
			                	return;
			                }else{
			                    p = this.toScreen(xy);
			                }
        					$(this.getCardWindowID(id)).setStyles({left:p.x,top:p.y});
        				}
        		}
        	if(this.options["combosWindow"])
        		{
        			this.combosWindowData=data;
        		}
        },
        cardWindow:function(id,content,left,top)
        {
        	this.cardIndex++;
        	if($(this.getCardWindowID(id)))
        		{
        		return null;
        		}
        		
        	  var _ID_Str =this.getCardWindowID(id);// + "_tbl";
                    var imgPath = this.source + "images/window/"; //图片目录
                    var _table = "<div style=\"z-index:1;position:absolute; bottom:68px; left:-38px; min-width:200px; background:#ffffff; border:1px solid #ababab;\">";
                   _table+="<br>";
                   _table += "<img src=\"" + imgPath + "IMCloseButton_Normal.bmp\"   onclick='$(\"" + _ID_Str + "\").fade(\"out\")'  style=\"position:absolute;top:2px; cursor:pointer; right:2px;\"/>";
                     _table += "<div id=\""+_ID_Str+"_con\" style=\"min-width:240px;min-height:100px; margin:10px;\">";
                    _table += (typeof(content)=="undefined"?"":content);
                     _table += "</div>";
                    _table += "<div style=\"width:200px;height:1px; \"></div><div style=\"position:absolute; bottom:-70px; BACKGROUND: url(" + imgPath + "w.png) no-repeat -5px -715px; width:92px; height:70px; margin-top:-64px; margin-left:38px;\"></div>";
                    _table += "</div>";
                    var windiv = new Element("div", { "id": _ID_Str, "unselectable": '',"-webkit-user-select": "", "class": "pointImages", "styles": { "left":(left) + "px", "top": top + "px", "position": "absolute", "cursor": "pointer", "display": "block", "fontSize": "12px","border":"1px solid red" ,"z-index":this.cardIndex} });
                 	windiv.set("html",_table);
                 	windiv.addEvent("mousedown",function(){return false});
                 	 return windiv;
        }

    })

});

})();