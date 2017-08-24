
/*
Class: MapGIS.Layers.TileLayer
Required : mootools-core.js,mootools-more.js(Fx.Morph)
*/
(function(){
MapGIS.Layers.extend({

    TileLayer: new Class({
        Extends: MapGIS.Layers.BaseLayer,
        Implements: [Events, Options],
        options: {
            initialExtent: null,
            startShowLevel: 0,
            level:0,
            tileSize:256,
            url:null
        },
//        zoomImageDiv: null,
//        mapImageDiv: null,
        initLayer: function () {
        	this.zoomObj.div=this.div;
        },
        posLast:[0,0,0,0,0,0],
        Point0:{cell:0,row:0,left:0,top:0},
        isFullDraw:true,
        dragingLayer: function (op) {
        	if(this.parent(op))
        	{
        		   this.drawTile(op);
        	}else{
        		this.div.empty();
        	}
           
        },
        reloadLayer:function(op)
        {
        	this.reloadTile();
        },
        getTileNo:function(res,pos)
        {
			var tsize=this.options["tileSize"];
            var origin = this.mapoptions.options["origin"];
            var x=pos[0];
            var y=pos[1];
            var line = Math.floor((x - origin.x) / res.x / tsize);
            var row = Math.floor((origin.y - y) / res.y / tsize);
            var left = -(x - origin.x) / res.x +tsize * line ;
            var top = -(origin.y - y) / res.y +tsize * row;
            return { cell: line, row: row, left: left, top: top };
        },
        getTagName:function(z)
        {
        	var tag=this.options["id"]+"_";
        	return tag+"z_"+z;
        },
        drawTile:function(op)
        {
        	
        	if(!op.isMoving())
        	{
					return;        		
        	}
        	
        	var obj=op.getTiles();
        	if(!op.hasNewTile(this.id))
        		{
        			return;
        		}
        	var tag=this.options["id"]+"_";
        	var z=op.getLevel();
        	var serverURL = this.options.url;
			var	classname=this.getTagName(z);
			var tsize=op.getTileSize();
			var insertImgs=obj.newtiles;
        	//加载图
        	for(var i=0,k=insertImgs.length;i<k;i++)
        		{
        			var tile=insertImgs[i];
        			var id=tag+tile.id;
		            this.loadImage(serverURL,z,tile.c, tile.r, tile.l, tile.t,tsize,classname,id,false);
        		}
        	var oldImgs=obj.deltiles;
        	this.zoomObj.clear();
        	
        	//删除图
        	for(var i=0,k=oldImgs.length;i<k;i++)
        		{
        			var tile=oldImgs[i];
					var img=this.div.getElementById(tag+tile.id);
					if(img)
						{
//						alert(img)
						  img.destroy();
						  
						}
        		}
        },
        redrawTile:function(op)
        {
        	
        	var obj=op.getTiles();
        	 
        	var tag=this.options["id"]+"_";
        	var z=op.getLevel();
        	var serverURL = this.options.url;
			var	classname=this.getTagName(z);
			var tsize=op.getTileSize();
			var insertImgs=obj.alltiles;
        	//加载图
        	for(var i=0,k=insertImgs.length;i<k;i++)
        		{
        			var tile=insertImgs[i];
        			var id=tag+tile.id;
		            this.loadImage(serverURL,z,tile.c, tile.r, tile.l, tile.t,tsize,classname,id,false);
        		}
        	var oldImgs=obj.deltiles;
        	this.zoomObj.clear();
        	//删除图
        	for(var i=0,k=oldImgs.length;i<k;i++)
        		{
        			var tile=oldImgs[i];
					var img=this.div.getElementById(tag+tile.id);
					if(img)
						{
						  img.destroy();
						}
        		}
        },
         zoomLayer:function(op)
        {
        	if(this.parent(op))
        	{
	          	 this.zoomImgsToLayer(op);
		         var oz=op.getPreLevel();
		         var z=op.getLevel();
		         var imgclass=this.getTagName(oz);
		         this.zoomObj.clclass=this.getTagName(z);
		         if(this.loadZoomImgsHandle!=null)
	          		{
	          			window.clearTimeout(this.loadZoomImgsHandle);
	          		}
		          if(this.clearImgsHandle!=null)
			    	{
			    	 	window.clearInterval(this.clearImgsHandle);
			    	}
	          	this.loadZoomImgsHandle=window.setTimeout(function(){
	          		this.reloadTile();
	          		this.clearImgsHandle=window.setInterval(this.loadedImgsEvent.bind(this),10,this.getTagName(z));
	          	}.bind(this),200);
	          	 if(imgclass!=this.zoomObj.imgclass)
		            {
				            var destroyImgs=this.div.getElements("img."+imgclass);
				            if(destroyImgs.length>0)
				            	{
				            		destroyImgs.each(function (image){image.destroy()});
				            	}
		            }
          	 }else{
        		this.div.empty();
        	}
          	
        },
        clearImgsHandle:null,
        loadZoomImgsHandle:null,
        loadImage:function(serverURL,z,cell,row,left,top,tsize,tag,id,isreload)
        {
        	var argObj = { z: z, y: cell, x: row };
            var url = serverURL.substitute(argObj);
//        	if(isreload)
//    		{
    			var img=this.div.getElementById(id);
				if(img)
					{
					  img.src=url;
					}else{
					   	img = new Element("img", { unselectable: 'on', 'src': url,'id':id,'class':tag,'loaded':"false", 'styles': { 'position': "absolute", 'left': left, 'top': top, 'width': tsize, 'height': tsize, 'border': "0px", 'margin': "0px", 'padding': "0px",'z-index':2} });
					 	img.setStyle("-webkit-user-select", "none");
					   	img.setStyle("-moz-user-select", "none");
					   	img.inject(this.div);
					   	img.onselectstart=function(){return false;}
				        img.onload=function()
				        {
				        	this.set("loaded","true");
				        }
					}
//    		}else{
//		        var img = new Element("img", { 'src': url,'id':id,'class':tag,'loaded':"false", 'styles': { 'position': "absolute", 'left': left, 'top': top, 'width': tsize, 'height': tsize, 'border': "0px", 'margin': "0px", 'padding': "0px",'z-index':2} });
//		        img.inject(this.div);
//		        img.onload=function()
//		        {
//		        	this.set("loaded","true");
//		        };
//            }
        },
        loadedImgsEvent:function(imgclass){
  			    var imgs=this.div.getElements("img."+imgclass);
  			    var rtn=true;
	            if(imgs.length>0)
	            	{
		            	for(var i=0,k=imgs.length;i<k;i++)
		            		{
		            			if(imgs[i].get("loaded")!="true")
		            				{
			            				rtn=false;
			            				break;
		            				}
		            		}
	            	}
	            if(rtn)
	            {
	            		this.zoomObj.clear();
	            		window.clearInterval(this.clearImgsHandle);
	            }
	            return rtn;
        },
        zoomObj:{imgclass:null,clclass:null,
        	res:null,
        	imgSize:null,
        	div:null,
        	clear:function(){
        		if(this.clclass!=this.imgclass)
        			{
	        	 	var destroyImgs=this.div.getElements("img."+this.imgclass);
	            	if(destroyImgs.length>0)
	            	{
	            		destroyImgs.each(function (image){image.destroy()});
	            	}
		        	this.imgclass=null;
		        	this.res=null;
		        	this.imgSize=null;
	        	}
        	}
        },
        effects:[],
        zoomImgsToLayer:function(op)
        {
        	if(this.effects!=null && this.effects.length>0)
        		{
        			var ef=this.effects;
        			for(var i=0,k=ef.length;i<k;i++)
        				{
        					ef[i].cancel();
        				}
        			this.effects=[];
        		}
        	var z=op.getPreLevel();
        	if(this.zoomObj.imgclass==null)
        	{
        		var classname=this.getTagName(z);
        		this.zoomObj.imgclass=classname;
        	}
        	if(this.zoomObj.res==null)
    		{
    			this.zoomObj.res=op.resolution(z);
    		}
        	if(this.zoomObj.imgSize==null)
    		{
    			this.zoomObj.imgSize=op.getTileSize();
    		}
        	
            var zoomImgs=this.div.getElements("img."+this.zoomObj.imgclass);
            var pos=op.getPos();
            var wxy=op.getWheelPos();
            var xy=[-pos[0]+wxy[0],-pos[1]+wxy[1]];
            var res0=op.getRes();
            var res1=this.zoomObj.res;
            var tsize=this.zoomObj.imgSize;
            var r=res1.x/res0.x;
            var size=tsize*res1.x/res0.x;
            if(zoomImgs!=null && zoomImgs.length>0)
            	{
//            		var canEff=true;//this.isIe6 || Browser.Engine.trident5;
            		zoomImgs.each(function (img){
            			var left=img.getStyle("left").toInt();
            			var top=img.getStyle("top").toInt();
            			var w=img.getStyle("width").toInt();
            			var h=img.getStyle("height").toInt();
            			var l=(xy[0]-(xy[0]-left)*r);
            			var t=(xy[1]-(xy[1]-top)*r);
//            			if(canEff)
//            				{
            					img.setStyles({"left":l,"top":t,"width":size,"height":size,"z-index":1});	
//            				}
//            			else{
//            				 var myEffect = new Fx.Morph(img, {
//								    duration: 'long', 
//								    cancel:function(){
//            					 alert(0);
//								    },
//								    transition: Fx.Transitions.Sine.easeOut
//								});
//								this.effects.push(myEffect);
//								myEffect.start({
//								    'height': [h, size], 
//								    'width': [w, size], 
//								    'left':[left,l],
//								    'top':[top,t]
//								});
//            			}
            			
            		}.bind(this));
            	}else{
//            		this.zoomObj.clear();
            	}
            this.zoomObj.imgSize=size;
            this.zoomObj.res=res0;
        },
        reloadTile:function()
        {
        	var op=this.mapoptions;
        	var tag=this.options["id"]+"_";
        	var z=op.getLevel();
        	var tiles=op.getTiles().alltiles ;
        	var	classname=this.getTagName(z);
			var tsize=op.getTileSize();
        	var serverURL = this.options.url;
        	var z=op.getLevel();
        		for(var i=0,k=tiles.length;i<k;i++)
        		{
        			var tile=tiles[i];
        			var id=tag+tile.id;
					this.loadImage(serverURL,z,tile.c, tile.r, tile.l, tile.t,tsize,classname,id,true);
        		}
        },
        refresh:function(){
        	var rtn=this.parent();
        	if(rtn)
        		{
	        		var url=this.options.url; 
	        			var ndate=new Date().getTime();
						var murl=url.match(/\?[^\?]*/);
						if(murl!=null)
						{
							if(murl!="?")
							{
								if(url.match(/(DT=T)\d{13}(T)/g)!=null)
								{
								 	 url=url.replace(/(DT=T)\d{13}(T)/g,"DT=T"+ndate+"T");
								}else{
									url=url+"&DT=T"+ndate+"T";
								}
							}else{
								url=url+"DT=T"+ndate+"T";
							}
						}else{
							url=url+"?DT=T"+ndate+"T";
						}
						this.options.url=url;
		        		this.reloadTile();
        		} 
        }

    })

});
})();