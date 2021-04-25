

var CCWMAP = CCWMAP || { version: '1.0.0' };
if (typeof exports !== 'undefined') {
  exports.CCWMAP = CCWMAP;
} 

else if (typeof define === 'function' && define.amd) {
  define([], function() { return CCWMAP; });
}

(function(global) {

   var MAP_SERVER="http://master.cn/apps",
//    var MAP_SERVER="http://master.cn/ccw",
       REQ_HEADER={token:"test001"}, Request=geomap.request, Extend =geomap.util.object.extend,Template=geomap.util.template;
    //    var config={
    //         mapId:"example",
    //        project:"http://master.cn/apps/wms/map/project/{mapId}",
    //        tile:"http://master.cn/apps/wms/map/image/{mapId}/{z}/{x}/{y}.png",
    //        code:{ok:1,fail:0},
    //    };

    function ProjectMap(map,conf){
        this._map=map;
        this.conf=conf;
        this.mapId=map.mapId;
        this.codeOk=conf.code.ok;
        this._initMap=false;
    } ;

    ProjectMap.prototype={
        loadProject:function(){
            var url=Template(this.conf.project,{mapId:this.mapId});
            var callback=this.loadProjectComplete.bind(this);
            Request(url,{method:"POST",header:REQ_HEADER,onComplete:callback});
        },
        loadProjectComplete:function(xhr){
            var body=xhr.response,status=xhr.status; 
                console.log("[status="+status+"]data:"+body);
                if(status==200){ 
                    var result=JSON.parse(body);
                    if(result.code == this.codeOk){
                        // loadProjectMap(this,result);
                        var  rdata=result.data;
                        if(!rdata.mapInfo){
                            return;
                        }
                        var mapInfo=rdata.mapInfo,
                         projectMap=rdata.projectMap;
                        this.mapInfo=mapInfo;
                        this.projectMap=projectMap;
                        this.loadMapInfo(mapInfo);
                    }
                }else{
                    throw new Error(body);
                }
        },
        getTileUrl:function(mapId){
            return  Template(this.conf.tile,{mapId:mapId}); 
        },
        getParkingAddUrl:function(mapId){
            return Template(this.conf.parkingAdd,{mapId:mapId}); 
        },
        getParkingQueryUrl:function(mapId){
            return Template(this.conf.parkingQuery,{mapId:mapId}); 
        },
        getUrlByMapId:function(url,mapId){
            return Template(url,{mapId:mapId});
        },
        projectMapChange:function(index){
           
            if( this.projectMap &&  this.projectMap.length > index){
                var mapInfo=  this.projectMap[index];
                this.loadMapInfo(mapInfo);
                this._map.fire("map_chage",mapInfo);
            } 
        },
        loadMapInfo: function(mapInfo){
            this.mapId=mapInfo.mapId;
            if(this._initMap){
                var tileUrl=this.getTileUrl(mapInfo.mapId);
                this.parkingLayer.url=tileUrl;
                this._map.fire("drawmap");
            }else{
                this._initMap=true;
                var center,centerStr=mapInfo.center,zoom=mapInfo.zoom || 1,maxZoom=mapInfo.maxZoom||5,minZoom=mapInfo.minZoom||0;
                if(centerStr && centerStr.indexOf(",")>0){
                    var p=centerStr.split(",");
                    center=new geomap.Point(p[0],p[1]);
                }else{
                    center=new geomap.Point(0,0);
                } 
                var tileUrl=this.getTileUrl(mapInfo.mapId);
                var parkingLayer=new geomap.TileLayer({url:tileUrl});
                this.parkingLayer=parkingLayer;
                var vectorLayer=new geomap.VectorLayer();
                this.vectorLayer=vectorLayer;
                // var paletteLayer=new geomap.PaletteLayer({drawType:"Polygon"});
                var paletteLayer=new geomap.PaletteLayer({drawType:"Rect"});
                this.paletteLayer=paletteLayer;
                var drawCallback=this.drawParkingPolygon.bind(this);
                paletteLayer.on("geometry_change",drawCallback);
                var queryCallback=this.queryParkingPoint.bind(this);
                this._map.on("pointcoord",function(e){
                    var p=e.coord.x+","+e.coord.y;
                    queryCallback(p);});
                this._map.on("rectcoord",function(e){
                    var p=e.minx+","+e.miny+","+e.maxx+","+e.maxy;
                    queryCallback(p);
                   // console.log("[ccwmap.js]rectcoord="+e.minx+","+e.miny+","+e.maxx+","+e.maxy);
                });
                // paletteLayer.setType("Line",false);
                this._map.maxZoom=maxZoom;
                this._map.minZoom=minZoom;
                this._map.setCenter(center,zoom);
                this._map.addLayer(parkingLayer);
                this._map.addLayer(vectorLayer);
                this._map.addLayer(paletteLayer);
                this._map.fire("map_complete",this._map);
                 //=== 测试区===
                // var marker=new geomap.Marker(map,{width:200,height:120,style:{lineWidth:0}});
                // map.addGeometry(marker);
            }
        },
        queryParkingPoint:function(p){
            var mapId=this.mapId;
            var url=this.getParkingQueryUrl(mapId);
            var bodyData=Template("p={p}",{p:p});
            Request(url,{method:"POST",body:bodyData,header:REQ_HEADER,onComplete:function(xhr){
                var res=xhr.response,status=xhr.status; 
                geomap.debug("url="+url+",body="+res);
                this.vectorLayer.clearData();
                if( status==200 && res.length>0 && res.indexOf("{")==0){ 
                    var featureCollection=JSON.parse(res);
                   if(featureCollection.type="FeatureCollection"){
                    this.vectorLayer.addData(featureCollection,{style:{fillStyle:"rgba(0,0,200,0.5)",strokeStyle:"#fff",lineWidth:2},_fill:true,lineDash:[4,2]});
                    this._map.fire("drawmap");
                   }
                   this._map.fire("coord_query_change",featureCollection);

                //    setEditContent(featureCollection);
                //    editContentPane_show();
                   
                }else{
                    geomap.debug("["+url+",status="+status+"]data:"+res);
                }
            }.bind(this)});
        },
        deleteFeature:function(fid){
            var mapId=this.mapId;
            var url=this.getUrlByMapId(this.conf.parkingDelete,mapId);
            var bodyValue={featureId:fid};
            var map=this._map;
            Request(url,{method:"JSON",body:bodyValue,header:REQ_HEADER,onComplete:function(xhr){
                var body=xhr.response,status=xhr.status; 
                geomap.debug("url="+url+",body="+body);
                if(status==200){ 
                    var result=JSON.parse(body);
                    if(result.code == this.codeOk){
                        this.vectorLayer.clearData();
                        this.parkingLayer.refreshCache();
                    }
                }
            }.bind(this)});
        },
        drawParkingPolygon:function(geometry){//画车位图形
            console.log(geometry._coordinates.length);
            var myself=this;
            if(geometry._coordinates.length<1){
                return;
            }
            var mapId=myself.mapId;
             
            var formTemplate=myself.conf.forms;
             var tplObj=geomap.element.tplToFormHtml(formTemplate,"车位");
             var formId= ""+ new Date();
             var closeFrameCallback=function(event,self) {
                 this.paletteLayer.clearGeometry();
             }.bind(this);
             var parkingAddUrl=this.getParkingAddUrl(mapId);
             var okFrameCallback=function(event,self) {
                var obj=geomap.element.formToJson(document.getElementById(this.formId));
                var geomText=this.geometry;
                this.other.parkingRequestCallback.call(this.other,geomText,obj,self);
             }.bind({other:myself,geometry:geometry.getText(),formId:formId,url:parkingAddUrl});
             var body="<form id='"+formId+"'>"+tplObj.html;
            //  body+="<br><span style='min-width:100px;display: inline-block;text-align: right;padding: 4px;'>&nbsp;</span><input  type='button' class='btn' value='确定' onclick='addParkingGeom(\""+formId+"\")' /></form>"
             var frameObj=map.frameLayer.open({title:tplObj.form.name,body:body,offset:"rb",closeCallback:closeFrameCallback,okBtn:true,okCallback:okFrameCallback});
         //    window._addParkingGeometry.push({formId:formId,geometry:geometry.getText(),frameObj:frameObj});

        },
        parkingRequestCallback:function(geomText,properties,self){
            var url=this.getParkingAddUrl(this.mapId);
            Request(url,{method:"JSON",body:{geometry:geomText,properties:properties},header:REQ_HEADER,onComplete:function(xhr){
                var body=xhr.response,status=xhr.status; 
                geomap.debug("body="+body);
                if(status==200){ 
                    var result=JSON.parse(body);
                    
                    if(result.code == this.codeOk){
                        // this.paletteLayer.clearGeometry();
                        this.parkingLayer.refreshCache();
                       // editGeom.frameObj.fire("close");
                       self.closeFn();
                        // geomap.closeFrame(editGeom.frameObj);
                    }
                }
            }.bind(this)});
        
        }
    
    };

   function createMap(container,conf,mapId){ 
       var mapContainer;
       if(typeof container === 'string'){
            mapContainer=document.getElementById(container)
       }else{
            mapContainer=container;
       }
        var map=new geomap.Map(mapContainer,{maxZoom:5,zoom:1});
        map.mapId=mapId;
       var ccwProject= new ProjectMap(map,conf);
       map.project=ccwProject;
       ccwProject.loadProject();
        // loadMapId(map);
        return map;
    }; 

    CCWMAP.CONFIG={mapServer:MAP_SERVER};
    CCWMAP.Map={create:createMap};
     

})(typeof exports !== 'undefined' ? exports : this);