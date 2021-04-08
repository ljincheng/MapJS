

var CCWMAP = CCWMAP || { version: '1.0.0' };
if (typeof exports !== 'undefined') {
  exports.CCWMAP = CCWMAP;
} 

else if (typeof define === 'function' && define.amd) {
  define([], function() { return CCWMAP; });
}

(function(global) {

   var MAP_SERVER="http://master.cn/apps",
       REQ_HEADER={token:"test001"}, Request=geomap.request;
     
   function createMap(container,mapId){ 
       var mapContainer;
       if(typeof container === 'string'){
            mapContainer=document.getElementById(container)
       }else{
            mapContainer=container;
       }
        var map=new geomap.Map(mapContainer,{maxZoom:5,zoom:1});
        map.mapId=mapId;
        loadMapId(map);
        return map;
    };

    function loadMapId(map){
        var mapId=map.mapId;
        var url=MAP_SERVER+"/geo/map/map/"+mapId;
        Request(url,{method:"POST",header:REQ_HEADER,onComplete:function(xhr){
            var body=xhr.response,status=xhr.status; 
            console.log("["+url+",status="+status+"]data:"+body);
            if(status==200){ 
                var result=JSON.parse(body);
                if(result.code == 1){
                    // var center,rdata=result.data,centerStr=rdata.center,zoom=rdata.zoom,maxZoom=rdata.maxZoom||5,minZoom=rdata.minZoom||0;
                    
                    // if(centerStr && centerStr.indexOf(",")>0){
                    //     var p=centerStr.split(",");
                    //     center=new geomap.Point(p[0],p[1]);
                    // }else{
                    //     center=new geomap.Point(0,0);
                    // }
                    // if(zoom === undefined){
                    //     zoom=1;
                    // }
                    // this.maxZoom=maxZoom;
                    // this.minZoom=minZoom;
                    // this.setCenter(center,zoom);
                    // var parkingLayer=new geomap.TileLayer({url:rdata.mapUrl});
                    //  this.addLayer(parkingLayer);
                    //this.fire("drawmap");
                    initMap(this,result);
                }
            }
            
        }.bind(map)});
    };

    function initMap(map,result){
        var center,rdata=result.data,centerStr=rdata.center,zoom=rdata.zoom,maxZoom=rdata.maxZoom||5,minZoom=rdata.minZoom||0;
                    
        if(centerStr && centerStr.indexOf(",")>0){
            var p=centerStr.split(",");
            center=new geomap.Point(p[0],p[1]);
        }else{
            center=new geomap.Point(0,0);
        }
        if(zoom === undefined){
            zoom=1;
        }
        map.maxZoom=maxZoom;
        map.minZoom=minZoom;
        map.setCenter(center,zoom);
        var parkingLayer=new geomap.TileLayer({url:rdata.mapUrl});
        map.addLayer(parkingLayer);
        var paletteLayer=new geomap.PaletteLayer();
        paletteLayer.setType("Line",false);
        map.addLayer(paletteLayer);
        var clickPolygon=new geomap.Polygon(map,{style:{fillStyle:"rgba(0, 0, 200, 0.5)",strokeStyle:"white",lineWidth:2},_fill:true,lineDash:[4,2]});
        paletteLayer.addGeometry(clickPolygon);
        map.on("click",clickParingInfoEvent.bind(map));
        map.fire("drawmap");

        //=== 测试区===

       var marker=new geomap.Marker(map,{width:200,height:120,style:{lineWidth:0}});
       map.addGeometry(marker);
        map.ccw={paletteLayer:paletteLayer,clickPolygon:clickPolygon,marker:marker};
    }

    function clickParingInfoEvent(e){
        // var url="http://master.cn/apps/geo/map/query";
        // var geomtry="POLYGON((0 0,0 90,90 90,90 0,0 0))";
        var url=MAP_SERVER+"/geo/map/query";
        var point=e.coord.toString();
        var mapId=this.mapId;
        var bodyData="mapId="+mapId+"&type=query&layerName=geo_parking_polygon&geometry=&filter=CONTAINS(geom, "+point+")";
        var map=this,ClickPolygon=map.ccw.ClickPolygon;
        Request(url,{method:"POST",body:bodyData,header:REQ_HEADER,onComplete:function(xhr){
            var res=xhr.response,status=xhr.status; 
            if( status==200 && res.length>0 && res.indexOf("Polygon")>0){ 
                var dataObj=JSON.parse(res);
                geomap.debug("["+url+",status="+status+"]data:type="+dataObj.type);
                map.ccw.clickPolygon.setData(dataObj.geometry); 
                map.ccw.marker.setData(dataObj);
                map.fire("drawmap");
            }else{
                geomap.debug("["+url+",status="+status+"]data:"+res);
            }
        }});
    }
     

    CCWMAP.CONFIG={mapServer:MAP_SERVER};
    CCWMAP.Map={create:createMap};
     

})(typeof exports !== 'undefined' ? exports : this);