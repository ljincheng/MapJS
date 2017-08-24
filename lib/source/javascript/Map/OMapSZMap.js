/**
 * 都市圈三维地图
 */

(function(){
MapGIS.extend({
	OMap:new Class({
		Extends:MapGIS.Map,
		Implements:[Events,Options],
		options:{
			fullMode:false,
			maptype: 0, 
			level: 0, 
         levelMax: 5
		},
		paletteLayer:null,
        imageLayer: null,
        markerLayer:null,
        baseLayer:null,
        winTimeout:null,
         setActiveTool:function(activetype)
        {
        	
        	switch(activetype)
        	{
        		case "*1":
        			if(this.paletteActiveFunHand!=null)
        			{
        				this.paletteLayer.removeEvent("change",this.paletteActiveFunHand);
        				this.paletteActiveFunHand=null;
        			}
        			this.paletteActiveFunHand=this.paletteActiveFun.bind(this);
        			this.paletteLayer.addEvent("change",this.paletteActiveFunHand);
        			this.paletteLayer.clear();
        			this.paletteLayer.paintPolygon(true);
        			break;
        		case "*2":
        			if(this.paletteActiveFunHand!=null)
        			{
        				this.paletteLayer.removeEvent("change",this.paletteActiveFunHand);
        				this.paletteActiveFunHand=null;
        			}
        			this.paletteActiveFunHand=this.paletteActiveFun.bind(this);
        			this.paletteLayer.addEvent("change",this.paletteActiveFunHand);
        			this.paletteLayer.clear();
        			this.paletteLayer.paintCircle(true);
					break;
				default:
					break;
        	
        	}
        	this.parent(activetype);
        	if(this.paletteLayer){
        		this.paletteLayer.stop();
        	}
        },
      transformOmapCoor:function(coor)
        {
        	return {x:coor.x,y:-coor.y};
        },
     initialize: function (container, options) {
        	this.options.contentMenu.obj =[];
        	var szmodel=new MapGIS.OMapModel();
        	if(typeof(USEREXTENT)!="undefined")
        		{ 	
        			this.setOptions(USEREXTENT);
        		}
            this.parent(container,options,szmodel);
            var baseMenuList= [{ title: "放大", fn: function () { this.setActiveTool('+'); } .bind(this) }, { title: "缩小", fn: function () { this.setActiveTool('-'); } .bind(this) }, { title: "拖拽", fn: function () { this.setActiveTool('$'); } .bind(this) }, { title: "复原", fn: function () { this.reposition(); } .bind(this) } ];
            this.options.contentMenu.obj = new MapGIS.MapContentMenu(this,{baseMenuList:baseMenuList});
            this.options.contentMenu.obj.div.inject(this.toolsdiv);
            this.customLoading(); 
            this.fireEvent("load", true);
        },
		customLoading:function(){
			 this.baseLayer = new MapGIS.Layers.OMapLayer({id:"LB01",zIndex:1});
           this.addLayer(this.baseLayer);
            this.imageLayer = new MapGIS.Layers.MarkerLayer({ id: "imageLayer01", zIndex:25 });
            this.markerLayer = new MapGIS.Layers.MarkerLayer({ id: "markerLayer01", zIndex:26, effects:true });
            var stopEvent=this.stopEvent.bind(this);
            this.paletteLayer=new MapGIS.Layers.PaletteLayer({id:"mappalettelayer",zIndex:20});
            this.addLayers([ this.markerLayer,this.imageLayer,this.paletteLayer ]);
            if(this._maploading)
            {
            	this._maploading();
            }
		} 
	})	
}
)
})();