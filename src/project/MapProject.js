
var MapProject = MapProject || { version: '1.0.0' };
if (typeof exports !== 'undefined') {
  exports.MapProject = MapProject;
} 

else if (typeof define === 'function' && define.amd) {
  define([], function() { return MapProject; });
}

(function(global) {

  'use strict';
   
    if (!global.MapProject) {
      global.MapProject = { };
    }
  
    if (global.MapProject.Map) {
      geomap.warn('MapProject.Map is already defined.');
      return;
    }
   
    
    var Util=geomap.util,Request=geomap.request,Template=Util.template,toPoint=Util.toPoint;
    var extend = Util.object.extend;
    var Point=geomap.Point;
 
    MapProject.Map = geomap.Class(geomap.Map, {
      mapId:undefined,
      server:{project:"",
              mapInfo:"",
              display:"",
              tile:"",
              addLayer:"",
              deleteLayer:"",
              orderChange:"",
              addParking:"",
              queryParking:"",
              deleteParking:"",
              },
      _server:{},
      _server_layers:[],
      codeOk:0,
      reqHead:"",
      _mapInfo:{},
      _projectMap:[],
      _init_map_status:false,
      drawType:"Rect",
      initialize: function(container, options) {
        var mapContainer;
        if(typeof container === 'string'){
             mapContainer=document.getElementById(container)
        }else{
             mapContainer=container;
        }
        this.callSuper('initialize',mapContainer,options); 
        this._init_reqcb();
        this._init_fireEv();
        this._reset_map_conf();
        this.loadProject();
      },
      _init_reqcb:function(){
        this._clearDrawGeometry=this.clearDrawGeometry.bind(this);
        this._drawMapGeom=this.__drawMapGeom.bind(this);
        this._queryCoordData=this.__queryCoordData.bind(this);
        this._reqcb_queryCoordData=this.__reqcb_queryCoordData.bind(this);
        this._reqcb_loadProject=this.__reqcb_loadProject.bind(this);
        this._reqcb_loadServerLayers=this.__reqcb_loadServerLayers.bind(this);
      },
      _init_fireEv:function(){
        this.on("req_project_ok",this._reqcb_loadProject_ok.bind(this));
      },
      loadProject:function(){
        Request(this._server.project,{method:"POST",header:this.reqHead,onComplete:this._reqcb_loadProject});
        this.loadServerLayers();
      },
      __reqcb_loadProject:function(xhr){
        var status=xhr.status;
        if(status==200){ 
          var result=JSON.parse(xhr.response);
          if(result.code === this.codeOk){
            var  rdata=result.data;
              
              if(rdata.projectMap){
                this._projectMap=rdata.projectMap;
              }
              if(rdata.mapInfo){
                this._mapInfo=rdata.mapInfo;
                this.fire("req_project_ok",rdata.mapInfo);
                return ;
              }
          }
          this.fire("req_project_fail");
        }else{
          this.fire("req_error",xhr);
        }
      },
      _reqcb_loadProject_ok:function(){
        this.loadMapInfo(this._mapInfo);
      },
      _reset_server:function(){
        var mapId=this.mapId;
        for(var key in this.server){
          var url=this.server[key];
          this._server[key]=Template(url,{mapId:mapId}); 
       }
      },
      __queryCoordData:function(p){
        this.vectorLayer.clearData();
        if(this.mapQuery){
          var url=Template(this.mapQuery.url,{mapId:this.mapId});
          Request(url,{method:"POST",body:"p="+p,header:this.reqHead,onComplete:this._reqcb_queryCoordData});
        }
      },
      __reqcb_queryCoordData:function(xhr){
        var res=xhr.response,status=xhr.status; 
        this.vectorLayer.clearData();
        if( status==200 && res.length>0 && res.indexOf("{")==0){ 
           
            if(this.mapQuery){

              var featureCollection=JSON.parse(res);
              this.mapQuery.fire("coord_data",featureCollection);
            }
           if(featureCollection.type="FeatureCollection"){
            this.vectorLayer.addData(featureCollection,{style:{fillStyle:"rgba(0,0,200,0.5)",strokeStyle:"#fff",lineWidth:2},_fill:true,lineDash:[4,2]});
            this.fire("drawmap");
           }
        }
      },
      __drawMapGeom:function(geo){
        if(this.mapDraw){
          var myself=this;
          var arg={geometry:geo,layer:this.paletteLayer,clearDraw:this._clearDrawGeometry,map:myself};
          this.mapDraw.fire("geom_data",arg);
        }
      },
      clearDrawGeometry:function(){
        this.paletteLayer.clearGeometry();
      },
      _reset_map_conf:function(){
        this._reset_server();
         if(!this._init_map_status){
           this._init_map_status=true;
           var parkingLayer=new geomap.TileLayer({url:this._server.tile});
           this.parkingLayer=parkingLayer;
           var vectorLayer=new geomap.VectorLayer();
           this.vectorLayer=vectorLayer;
           var paletteLayer=new geomap.PaletteLayer({drawType:this.drawType});
           this.paletteLayer=paletteLayer;
          //  var drawCallbackFn=function(geo){
          //   this.fire("geometry_change",geo);
          //  }.bind(this);
           paletteLayer.on("geometry_change",this._drawMapGeom);;
           this.addLayer(parkingLayer);
           this.addLayer(vectorLayer);
           this.addLayer(paletteLayer);
           var queryCallback=this._queryCoordData;
           this.on("pointcoord",function(e){
               var p=e.coord.x+","+e.coord.y;
               queryCallback(p);});
           this.on("rectcoord",function(e){
               var p=e.minx+","+e.miny+","+e.maxx+","+e.maxy;
               queryCallback(p);
              // console.log("[ccwmap.js]rectcoord="+e.minx+","+e.miny+","+e.maxx+","+e.maxy);
           });
           
         }else{
          this.parkingLayer.url=this._server.tile;
          this.parkingLayer.refreshCache();
          this.vectorLayer.clearData();
          this.fire("drawmap");
         }
         this.fire("map_complete",this);

      },
      loadServerLayers:function(){
        Request(this._server.mapInfo,{method:"POST",header:this.reqHead,onComplete:this._reqcb_loadServerLayers});
      },
      __reqcb_loadServerLayers:function(xhr){
        var status=xhr.status;
        if(status==200){ 
          var result=JSON.parse(xhr.response);
          if(result.code === this.codeOk){
            var  rdata=result.data;
              if(rdata.layers){
                this._server_layers=rdata.layers;
                this.fire("server_layer_ok",this._server_layers);
                return ;
              }
          }
          this.fire("req_project_fail");
        }else{
          this.fire("req_error",xhr);
        }
      },
      loadMapInfo:function(mapInfo){
        if(mapInfo){
          this._mapInfo=mapInfo;
          this.mapId=mapInfo.mapId;
          this._reset_map_conf();
        }
      },
      mapChange:function(index){ 
        if(this._projectMap &&  this._projectMap.length > index){
            var mapInfo=  this._projectMap[index];
            this.loadMapInfo(mapInfo); 
            this.loadProject();
        } 
    },
    orderChangeFn:function (oldIndex,newIndex) {
      var myself=this;
      Request(this._server.orderChange,{method:"JSON",body:{oldIndex:oldIndex,newIndex:newIndex},onComplete:function(xhr){
          var body=xhr.response,status=xhr.status; 
          if(status==200){ 
              myself.refresh();
          }
      }});
  },
    displayServerLayer:function (layerId,display) {
      var myself=this;
      Request(this._server.displayLayer,{method:"JSON",body:{layerId:layerId,display:display},onComplete:function(xhr){
          var body=xhr.response,status=xhr.status; 
          if(status==200){ 
              myself.refresh();
          }
      }}); 
  },
  deleteServerLayer:function (layerId) {
    var myself=this;
    Request(this._server.deleteLayer,{method:"JSON",body:{id:layerId},onComplete:function(xhr){
        var body=xhr.response,status=xhr.status; 
        if(status==200){ 
            myself.refresh();
        }
    }}); 
},
addServerLayer:function (param) {
  var myself=this;
  Request(this._server.addLayer,{method:"JSON",body:param,onComplete:function(xhr){
      var body=xhr.response,status=xhr.status; 
      if(status==200){ 
          myself.refresh();
      }
  }}); 
},
setMapQuery:function(mq){
  this.mapQuery=mq;
},
setMapDraw:function(md){
  this.mapDraw=md;
  this.paletteLayer.setType(this.mapDraw.drawType,this.mapDraw.fill);
},
jsonReq:function(url,data,fn){
  var mapurl=Template(url,{mapId:this.mapId}); 
  Request(mapurl,{method:"JSON",body:data,header:this.reqHead,onComplete:fn}); 
},
      toggleReferenceLine:function(){
        this.paletteLayer.toggleReferenceLine();
      },
      refresh:function(){
        this.loadProject(); 
      }
    });

})(typeof exports !== 'undefined' ? exports : this);