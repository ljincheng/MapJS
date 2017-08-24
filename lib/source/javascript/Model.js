(function(){
	MapGIS.extend({
    Model: new Class({
     	 Implements: [Events, Options],
     	 options:{
     	 	xmin:0,
     	 	ymin:0,
     	 	xmax:0,
     	 	ymax:0,
     	 	level:0,
     	 	preLevel:0,
     	 	maxLevel:0,
     	 	minLevel:0,
     	 	size:[0,0],
     	 	clientPos:[0,0],
     	 	wheelPos:[0,0],
     	 	mousePos:[0,0],
     	 	speed:[0,0],
     	 	canOver:true,
     	 	origin: {x: 0, y:0},//{x: -200, y: 178200.525 },
            fullExtent:[0, 0,0,0],//[42156.9212844557, -34494.8269993417, 212754.432201896,81261.6583298636]
            tileSize:256,
            ismoving:true
     	 },
     	 resolution:$empty,
     	 /*
     	  * resolution:function(level)
		        {
		        	 var resArr = [{"resolution" :105.833545000423,"scale" : 400000}, 
							      {"resolution" : 52.9167725002117, "scale" : 200000}, 
							      {"resolution" : 39.6875793751588, "scale" : 150000}, 
							      {"resolution" : 26.4583862501058, "scale" : 100000}, 
							      {"resolution" : 13.2291931250529, "scale" : 50000}, 
							      {"resolution" : 5.29167725002117, "scale" : 20000}, 
							      {"resolution" : 2.64583862501058, "scale" : 10000}, 
							      {"resolution" : 1.32291931250529, "scale" : 5000}, 
							      {"resolution" : 0.529167725002117, "scale" : 2000}, 
							      {"resolution" : 0.264583862501058, "scale" : 1000}, 
							      {"resolution" : 0.132291931250529, "scale" : 500}];
			            var res = resArr[level].resolution;
			            return { x: res, y: res }
		        }
     	  * @param {Object} op
     	  * @memberOf {TypeName} 
     	  */
         originPoint:null,
         restoration:{level:0,preLevel:0,clientPos:[0,0],wheelPos:[0,0],opoint:null},
    	 initialize: function (op) {
    	 	this.setOptions(op);
        },
        getMousePos:function()
        {
        	return this.options["mousePos"];
        },
        setMousePos:function(arg)
        {
        	this.options["mousePos"]=arg;
        },
        getMousePoint:function()
        {
        	var pos=this.getMousePos();
        	var p=this.toMap(pos[0],pos[1]);
        	return p;
        },
        setRestore:function()
        {
        	var z=this.getLevel();
        	var pz=this.getPreLevel();
        	var pos=this.getPos();
        	var wPos=this.getWheelPos();
        	var opoint=this.getOriginPoint();
        	this.restoration={level:z,preLevel:pz,clientPos:pos,wheelPos:wPos,opoint:opoint};
        },
        restore:function()
        {
        	this.setOptions(this.restoration);
        	this.originPoint=this.restoration.opoint;
        	this.lastpos=this.getPos();
        },
        getMapOptions:function()
        {
        	return this;
        },
        setZoom:function(isIn)
        {
        	
        	var z=this.getLevel();
        	if(isIn)
        		{	
        			if(z<this.options["maxLevel"])
        				{
        					this.options["preLevel"]=this.options["level"];
        					this.options["level"]++;
        					this.lastTile=null;
        					
        					return true;
        				}
        			
        		}else{
        				if(z>this.options["minLevel"])
        					{
        						this.options["preLevel"]=this.options["level"];
        					 	this.options["level"]--;
        					 	this.lastTile=null;
        					 	return true;
        					}
        			
        		}
        	return false;
        },
        setWheelPos:function(x,y)
        {
        	this.options["wheelPos"]=[x,y];
        	if(this.getLevel()!=this.getPreLevel()){
        	var z=this.getPreLevel();
	        var res=this.resolution(z);
	        var olt=this.getPos();
	        var p1=this.originPoint;
	        var dv=(olt[0]-x);
	        var dh=(olt[1]-y);
	        var p0_x= p1[0] -dv*res.x;
	        var p0_y=p1[1]+dh*res.y;
	        var res1=this.resolution(this.getLevel());
	        var p2_x=p0_x+dv*res1.x;
	        var p2_y=p0_y-dh*res1.y;
	        this.originPoint=[p2_x,p2_y];
	        }
        },
        getWheelPos:function()
        {
        	return this.options["wheelPos"];
        },
        getPreLevel:function()
        {
        	return this.options["preLevel"];
        },
        getLevel:function()
        {
        	return this.options["level"];
        },
        setLevel:function(z)
        {
        	if(z==this.getLevel())
        		{
        			return;
        		}
        	this.options["preLevel"]=this.options["level"];
        	var size=this.getViewSize();
        	
        	if(z>this.options["maxLevel"])
        	{
        			this.options["level"]=this.options["maxLevel"];
        					 
        	}else if(z<this.options["minLevel"])
        		{
        			this.options["level"]=this.options["minLevel"];
        		}
        	else{
        		this.options["level"]=z;
        	}
        	if(z!=this.options["preLevel"])
        	{
        		this.setWheelPos(size[0]/2,size[1]/2);
        	}
        	this.lastTile=null;
        	
        },
        getSpeed:function()
        {
        	return this.options["speed"];
        },
        getViewSize:function()
        {
        	return this.options["size"];
        },
        setViewSize:function(xy)
        {
        	this.options["size"]=xy;
        },
        setMapOptions:function(o)
        {
        	if(this.options["canOver"])
        	{
        		if(o.options)
        			{
	        			this.setOptions(o.options);
        			}
        		if(o.resolution){
	        	this.resolution=o.resolution;}
        		if(o.toMap){
	        	this.toMap=o.toMap;}
        		if(o.toScreen){
	        	this.toScreen=o.toScreen;}
        	}
        }
        ,
        setPos:function(pos)
        {
        	this.options["clientPos"]=pos;
        },
        getPos:function()
        {
        	return this.options["clientPos"];
        },
        setSpeed:function(sp)
        {
        	this.options["speed"]=sp;
        },
        getRes:function()
        {
        	return this.resolution(this.getLevel());
        },
        getOrigin:function()
        {
        	return this.options["origin"];
        },
        getExtent:function()
        {
        	var oPos=this.getOriginPoint();
        	var pos=this.getPos();
        	var res=this.getRes();
        	var size=this.getViewSize();
        	var xmin=oPos[0]-pos[0]*res.x;
        	var ymax=oPos[1]+pos[1]*res.y;
        	var xmax=xmin+size[0]*res.x;
        	var ymin=ymax-size[1]*res.y;
        	return {xmin:xmin,ymin:ymin,xmax:xmax,ymax:ymax};
        },
        getOriginPoint:function()
        {
        	if(this.originPoint==null)
    		{
//	        	var res=this.getRes();
	        	var ex=this.options["fullExtent"];
	        	var cet=[(ex[0]+ex[2])/2,(ex[1]+ex[3])/2];
	        	var z=this.getLevel();
	        	var res=this.getRes();
	        	var s=this.getViewSize();
	        	var op=[(cet[0]-res.x*(s[0]/2)),(cet[1]+res.y*(s[1]/2))];
        		this.originPoint=op;
        		return op;
        	}else{
        		return this.originPoint;
        	}
        },
        getLeftTopPoint:function()
        {
        	var oPos=this.getOriginPoint();
        	var pos=this.getPos();
        	var res=this.getRes();
//        	var size=this.getViewSize();
        	var xmin=oPos[0]-pos[0]*res.x;
        	var ymax=oPos[1]+pos[1]*res.y;
        	return [xmin,ymax];
        },
        getCenterPoint:function()
        {
        	var p0=this.getLeftTopPoint();
        	var res=this.getRes();
        	var size=this.getViewSize();
        	var x=size[0];
        	var y=size[1];
        	var p1_x=p0[0]+x*res.x;
        	var p1_y=p0[1]-y*res.y;
        	return [p1_x,p1_y];
        },
        getCenterPos:function()
        {
        	var size=this.getViewSize();
        	return [size[0]/2,size[1]/2];
        },
        toMap:function(x,y)
        {
        	var p0=this.getLeftTopPoint();
        	var res=this.getRes();
        	var p1_x=p0[0]+x*res.x;
        	var p1_y=p0[1]-y*res.y;
        	return [p1_x,p1_y];
        },
        toScreen:function(x,y)
        {
        	var p0=this.getLeftTopPoint();
        	var res=this.getRes();
        	var p1_x=Math.floor((x-p0[0])/res.x);
        	var p1_y=Math.floor((p0[1]-y)/res.y);
        	return [p1_x,p1_y];
        },
        toLayerScreen:function(x,y)
        {
        	var p0=this.getOriginPoint();
        	var res=this.getRes();
        	var p1_x=Math.floor((x-p0[0])/res.x);
        	var p1_y=Math.floor((p0[1]-y)/res.y);
        	return [p1_x,p1_y];
        },
        lastpos:[0,0],
        moveNo:1,
        setRunStatus:function(a)
        {
        	this.options["ismoving"]=a;
        },
        isMoving:function()
        {
        	var rtn=this.options['ismoving'];
        	if(rtn)
    		{
	        	var pos=this.getPos();
	        	if(pos[0]==this.lastpos[0] && pos[1]==this.lastpos[1])
	        		{
	        			if(this.moveNo>0)
	        				{
	        					return (this.options['ismoving'] || false);
	        				}else{
	        					this.moveNo++;
	        				}
	        		}else{
	        				this.moveNo=0;
	        				this.lastpos=[pos[0],pos[1]];
	        		}
    		}
        	return rtn;
        },
        movDistance:function()
        {
        	var pos=this.getPos();
        	var lpos=this.lastpos;
        	var x=pos[0]-lpos[0];
        	var y=pos[1]-lpos[1];
        	var d=Math.pow(x,2)+Math.pow(y,2);
//        	this.lastpos=[pos[0],pos[1]];
        	return Math.sqrt(d);
        },
        posTag:function()
        {
        	var sp=this.lastpos;
        	var z=this.getLevel();
        	return (z+"a"+sp[0]+"a"+sp[1]);
        },
        getTileSize:function()
        {
        	return this.options["tileSize"];
        },
        lastTile:null,
        lastTiles:[],
        layers:{noNewTilelayer:[],newtiles:[],deltiles:[],alltiles:[]},
        currentTileNo:function()
        {
        	var tile=this.getTileNo(this.getRes(),this.getLeftTopPoint());
        	return tile;
        },
        getTiles:function()
        {
//        	var rtn={hasNewTile:false,newtiles:[],deltiles:[],alltiles:this.lastTiles};
        	
        	var tile=this.getTileNo(this.getRes(),this.getLeftTopPoint());
        	if(this.lastTile==null  || Math.abs(this.lastTile.row-tile.row)>0 || Math.abs(this.lastTile.cell-tile.cell)>0)
        		{
	        		try{
	        			
		        		var left0=tile.left;
			        	var top0=tile.top;
			        	var row0=tile.row;
			        	var cell0=tile.cell;
			        	var pos=this.getPos();
			        	var size=this.getViewSize();
			        	var tsize=this.getTileSize();
				        var rows=Math.ceil(size[1]/tsize)+1;
				        var cells=Math.ceil(size[0]/tsize)+1;
				       
				        var z=this.getLevel();
				        var oldTiles=this.lastTiles;
				        var oldLen=oldTiles.length;
				        var tempTiles=[];
				        var tiles=[];
				        for(var r=0;r<rows;r++)
				        	{
				        		var t=top0+tsize*r-pos[1];
				        		var row=row0+r;
					        	for(var c=0;c<cells;c++)
			    				{
					        		 var l=left0+tsize*c-pos[0];
					        		 var cell=cell0+c;
					        		 var id=z+"-"+row+"-"+cell;
					        		 var inOld=false;
					        		 for(var i=0;i<oldLen;i++)
					        			 {
					        			 	var otile=oldTiles[i];
					        			 	if(otile.id==id)
					        			 		{
					        			 			oldTiles[i].v=1;
					        			 			inOld=true;
					        			 			break;
					        			 		}
					        			 }
					        		 if(!inOld)
					        			 {
					        			 	tiles.push({z:z,r:row,c:cell,l:l,t:t,id:id,v:0});
					        			 }
					        		 tempTiles.push({z:z,r:row,c:cell,l:l,t:t,id:id,v:0});
					        	}
				        	}
				        this.lastTile=tile;
				        this.layers.newtiles=tiles;
				        var deltiles=[];
				        for(var i=0,k=oldTiles.length;i<k;i++)
				        	{
			        			if(oldTiles[i].v==0)
			        			{
			        				deltiles.push(oldTiles[i]);
			        			}
				        	}
				        this.layers.deltiles=deltiles;
				        this.layers.hasNewTile=true;
				        this.layers.noNewTilelayer.empty();
				        this.layers.alltiles=tempTiles;
				        this.lastTiles=tempTiles;
			        }catch(ex){
//			        	alert(ex);
			        }
        		}
	        return this.layers;
        },
        hasNewTile:function(layer)
        {
        	var ls=this.layers.noNewTilelayer;
        	for(var i=0,k=ls.length;i<k;i++)
        		{
        			if(ls[i]==layer)
        				{
        					return false;
        				}
        		}
        	this.layers.noNewTilelayer.push(layer);
        	return true;
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
})();