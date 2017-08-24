/**
 * 深圳市地图。
 * @return {TypeName} 
 */
(function(){
MapGIS.extend({
    OpenstreetModel: new Class({
	        Extends: MapGIS.Model,
	        Implements: [Events, Options],
	         options:{
	     	 	maxLevel:13,
	     	 	minLevel:0,
	     	 	origin: {x:  -180, y: 90},
	            fullExtent:[-180,-90,180, 90],
	            tileSize:256
	     	 },
	     	 resolution:function(level)
	        {
	        		var x = (360 / (Math.pow(2, level)) / 256);
	            var y = (180 / (Math.pow(2, level)) / 256);
		         return { x: x, y: y };
	      } ,getTiles:function()
       		 {
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
				        var total=Math.pow(2, z);
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
					        			 //row=row%total;
					        			 cell=cell%total;
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
        }
	        
     	})
});
})();