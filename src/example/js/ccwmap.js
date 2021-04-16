

var CCWMAP = CCWMAP || { version: '1.0.0' };
if (typeof exports !== 'undefined') {
  exports.CCWMAP = CCWMAP;
} 

else if (typeof define === 'function' && define.amd) {
  define([], function() { return CCWMAP; });
}

(function(global) {

   var MAP_SERVER="http://master.cn/apps",
       REQ_HEADER={token:"test001"}, Request=geomap.request, Extend =geomap.util.object.extend;
     
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
        var url=MAP_SERVER+"/geo/wms/map/"+mapId;
        Request(url,{method:"POST",header:REQ_HEADER,onComplete:function(xhr){
            var body=xhr.response,status=xhr.status; 
            console.log("["+url+",status="+status+"]data:"+body);
            if(status==200){ 
                var result=JSON.parse(body);
                if(result.code == 1){
                    loadProjectMap(this,result);
                }
            }
            
        }.bind(map)});
    }; 

    function loadProjectMap(map,result){
        var  rdata=result.data;
        if(!rdata.mapInfo){
            return;
        }
        var mapInfo=rdata.mapInfo,
         projectMap=rdata.projectMap;
        map.ccw={projectMap:projectMap,mapInfo:mapInfo};
        loadMapInfo(mapInfo);
    }
    function projectMapChange(index){

        if(map.ccw.projectMap && map.ccw.projectMap.length > index){
            var mapInfo= map.ccw.projectMap[index];
            loadMapInfo(mapInfo);
            map.fire("map_chage",mapInfo);
        } 
    }

    function loadMapInfo(mapInfo){
        map.ccw.mapInfo=mapInfo; 
        if(!map.ccw.mapObj){
            var center,centerStr=mapInfo.center,zoom=mapInfo.zoom,maxZoom=mapInfo.maxZoom||5,minZoom=mapInfo.minZoom||0;
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
            var parkingLayer=new geomap.TileLayer({url:mapInfo.mapUrl});
            map.addLayer(parkingLayer);
            var vectorLayer=new geomap.VectorLayer();
            // paletteLayer.setType("Line",false);
            map.addLayer(vectorLayer);
            // var paletteLayer=new geomap.PaletteLayer({drawType:"Polygon"});
            var paletteLayer=new geomap.PaletteLayer({drawType:"Rect"});
            
            paletteLayer.on("geometry_change",function(e){paletteGeometryChangeEvent(map,e)});
            // paletteLayer.setType("Line",false);
            map.addLayer(paletteLayer);
            // var clickPolygon=new geomap.Polygon(map,{style:{fillStyle:"rgba(0, 0, 200, 0.5)",strokeStyle:"white",lineWidth:2},_fill:true,lineDash:[4,2]});
            // paletteLayer.addGeometry(clickPolygon);
            map.on("pointcoord",function(e){
                var p=e.coord.x+","+e.coord.y;
                clickParingInfoEvent(map,p);});
            map.on("rectcoord",function(e){
                var p=e.minx+","+e.miny+","+e.maxx+","+e.maxy;
                clickParingInfoEvent(map,p);
               // console.log("[ccwmap.js]rectcoord="+e.minx+","+e.miny+","+e.maxx+","+e.maxy);
            });
            
            map.fire("drawmap");
           
    
            //=== 测试区===
    
           var marker=new geomap.Marker(map,{width:200,height:120,style:{lineWidth:0}});
           map.addGeometry(marker);
            // map.ccw={paletteLayer:paletteLayer,clickPolygon:clickPolygon};
            map.ccw.mapObj={parkingLayer:parkingLayer,
                paletteLayer:paletteLayer,
                marker:marker,
                vectorLayer:vectorLayer,
                deleteFeature:deleteFeature.bind(map),
                projectMapChange:projectMapChange.bind(map)};
                map.on("map_chage",function(){
                    paletteLayer.clearGeometry();
                    parkingLayer.refreshCache();
                    vectorLayer.clearData();
                });
            map.fire("map_complete",map);
        }else{ 
            map.ccw.mapObj.parkingLayer.url=mapInfo.mapUrl;
            map.fire("drawmap");
        }
    }

    function paletteGeometryChangeEvent(map,geometry){

        console.log(geometry._coordinates.length);
        if(geometry._coordinates.length<1){
            return;
        }
        var mapId=map.ccw.mapInfo.mapId;
        var url=MAP_SERVER+"/geo/wms/addFeature/"+mapId;
        var layerId="PARKING-POLYGON-001";
        var typeName="geo_parking_polygon";
        // var p="";
        // for(var i=0,k=geometry._coordinates.length;i<k;i++){
        //     var point=geometry._coordinates[i];
        //     if(i>0){
        //         p+=",";
        //     }
        //     p+=point.x+","+point.y;
        // }
        // var bodyValue={layerId:layerId,coords:p};
        // var bodyData=geomap.util.template("layerId={layerId}&coords={coords}&building_id=b001&parking_no=车位：XXXX-002",bodyValue);
        var bodyData={layerName:typeName,geometry:geometry.getText(),properties:{building_id:"b001",parking_no:"车位：XXXX-004",sale_status:1,map_id:mapId}};
        Request(url,{method:"JSON",body:bodyData,header:REQ_HEADER,onComplete:function(xhr){
            var body=xhr.response,status=xhr.status; 
            geomap.debug("url="+url+",body="+body);
            if(status==200){ 
                var result=JSON.parse(body);
                if(result.code == 1){
                    map.ccw.mapObj.paletteLayer.clearGeometry();
                    map.ccw.mapObj.parkingLayer.refreshCache();
                }
            }
        }});
    }
    function clickParingInfoEvent(map,p){
        // var geomtry="POLYGON((0 0,0 90,90 90,90 0,0 0))";
        var mapId=map.ccw.mapInfo.mapId;
        var layerId="PARKING-POLYGON-001";
        var url=MAP_SERVER+"/geo/wms/coordQuery/"+mapId;
        // var bodyValue=Extend({layerId:layerId},e.coord);
        var bodyValue={layerId:layerId,p:p};
       
        var bodyData=geomap.util.template("layerId={layerId}&p={p}",bodyValue);
        // var ClickPolygon=map.ccw.ClickPolygon;
        Request(url,{method:"POST",body:bodyData,header:REQ_HEADER,onComplete:function(xhr){
            var res=xhr.response,status=xhr.status; 
            geomap.debug("url="+url+",body="+res);
            map.ccw.mapObj.vectorLayer.clearData();
            if( status==200 && res.length>0 && res.indexOf("{")==0){ 
                var featureCollection=JSON.parse(res);
               if(featureCollection.type="FeatureCollection"){
                map.ccw.mapObj.vectorLayer.addData(featureCollection,{style:{fillStyle:"rgba(0,0,200,0.5)",strokeStyle:"#fff",lineWidth:2},_fill:true,lineDash:[4,2]});
                map.fire("drawmap");
               }
               setEditContent(featureCollection);
               editContentPane_show();
               
            }else{
                geomap.debug("["+url+",status="+status+"]data:"+res);
            }
        }});
    }

    function deleteFeature(fid){
        var mapId=this.ccw.mapInfo.mapId;
        var layerId="PARKING-POLYGON-001";
        var url=MAP_SERVER+"/geo/wms/deleteFeature/"+mapId;
        // var bodyValue=Extend({layerId:layerId},e.coord);
        var bodyValue={layerId:layerId,featureId:fid};
        // var ClickPolygon=map.ccw.ClickPolygon;
        var map=this;
        Request(url,{method:"JSON",body:bodyValue,header:REQ_HEADER,onComplete:function(xhr){
            var body=xhr.response,status=xhr.status; 
            geomap.debug("url="+url+",body="+body);
            if(status==200){ 
                var result=JSON.parse(body);
                if(result.code == 1){
                    map.ccw.mapObj.vectorLayer.clearData();
                    map.ccw.mapObj.parkingLayer.refreshCache();
                }
            }
        }});
    }
     

    CCWMAP.CONFIG={mapServer:MAP_SERVER};
    CCWMAP.Map={create:createMap};
     

})(typeof exports !== 'undefined' ? exports : this);