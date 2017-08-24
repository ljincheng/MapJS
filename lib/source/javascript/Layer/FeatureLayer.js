(function(){
MapGIS.Layers.extend({

    FeatureLayer: new Class({
        Extends: MapGIS.Layers.BaseLayer,
        Implements: [Events, Options],
        options: {
            displayModes: 1,
            graphicsData: [],
            tileOrigin: null,
            startShowLevel: 7,
            startShowGraphic: null,
            initialExtent: null,
            imgurl: null,
            jsonurl: null,
            queryparam: { requesttype: { img: "export?F=image&FORMAT=png", json: "0/query?" }, geometryType: "esriGeometryEnvelope", outFields: "", geometry: "", tolerance: 10, mapExtent: "", imageDisplay: "256,256,96", f: "json" },
            layers: []
        },
        loadLayer: function (op) {
            this.parent(op);
        },
        dragingLayer: function (op) {
        	if(this.parent(op))
        	{
        		 
	        	var t=op.isMoving();
	        	if(!t )
	        	{
  				 
	        	} 
        	} 
        },
         reloadLayer:function(op)
        {
        	 
        },
        zoomLayer:function(op)
        {
        	if(this.parent(op))
        	{
	           
        	} 
        },
        draw:function()
        {
        	var url = this.options.url + this.options.queryparam.requesttype.json;
            if (this.options.jsonurl != null) {
                url = this.options.jsonurl + this.options.queryparam.requesttype.json;
            }
            var param = new Hash({ geometryType: "esriGeometryEnvelope", geometry: mapExtents, tolerance: 10, mapExtent: mapExtents, imageDisplay: (wh[0] + "," + wh[1] + ",96"), f: "json" });
            var parStr = param.toQueryString();
            this.JSONPObj = new Request.JSONP({
                url: url,
                data: param.toQueryString(),
                async: true,
                link: "cancel",
                onComplete: function (data) {
                    if (data.features && data.features.length > 0) {
                        var points = data.features;
                        if (points.length > 0) {
                            var polygonList = [];
                            for (var i = 0, k = points.length; i < k; i++) {
                                var rings = points[i].geometry.rings;
                                if (rings.length > 0) {
                                    var gdata = { 'data': rings[0], 'events': { 'mouseover': function () { this.fill([200, 161, 156, 0.7]); }, 'mouseout': function () { this.fill([200, 161, 156, 0.2]); } } };
                                    polygonList.push(gdata);
                                }
                            }
                            this.setGraphicsData(polygonList);
                        }
                    }
                } .bind(this)
            }).send();
        }
    })
});
})();