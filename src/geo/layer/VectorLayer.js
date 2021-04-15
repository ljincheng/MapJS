
(function(global) {
    'use strict';
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Palette) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }
   
    geomap.VectorLayer = geomap.Class(geomap.Layer,  {
      type: 'VectorLayer',
      paths:[],
      drawType:0,
      fill:true,
      loopRender:false,
      _enabled:true,
      initialize: function(options) {
        // options || (options = { }); 
        // this._setOptions(options);
        this.callSuper('initialize',options);
        this.on("initLayer",this.OnInitLayer.bind(this));
      }, 
      OnInitLayer:function(){ 
        this.transformtion.setOrigin(0,0);
      },
      setType:function(gtype,fill){
          this.drawType=gtype;
          if(fill!= undefined){
            this.fill=fill;
          }
        
          if(this._pathing){
              this._pathing.setType(this.drawType,this.fill);
          }
      },
      addData:function(featureData,options){

        if(featureData.type=="FeatureCollection"){
            var geomNum=featureData.features.length;
            for(var i=0;i<geomNum;i++){
                var geometry=featureData.features[i].geometry;
                 var path=new geomap.Path(this._map,options);
                 path.setData(geometry);
                this.paths.push(path);
            }
        }else if(featureData.type=="Feature"){
            var geometry=featureData.geometry;
            var path=new geomap.Path(this._map,options);
            path.setData(geometry);
            this.paths.push(path);
        }else{
            this.paths.push(featureData);
        }
        this.ViewReset();
      },
      clearData:function(){
        this.paths=[];
        this.ViewReset();
      },
      OnLoopTime:function(){ 
        if(this.loopRender && (this._canvasScale==1 || this._canvasScale == undefined )){
          this._dragOffset=null;//实时重绘canvas，不需要拖拽偏移量。
           this.ViewReset();
        }
      },
      ViewReset:function(){ 
        if(!this.wheelZoomChanage && (this._canvasScale==1 || this._canvasScale == undefined )){
          this.canvasCtx.clearRect(0,0,this.width,this.height);
            this._canvasScale=1;
            var z=this._map.zoom,bounds=this._map.getBounds(),res=this._map.resolution(z);
            this.loopRender=false;
            if(this.paths.length>0){
                for(var i=0,k=this.paths.length;i<k;i++){
                    var path=this.paths[i];
                    this.canvasCtx.setLineDash([]);
                    path.render(this.canvasCtx);
                    if(path.loopRender){
                      this.loopRender=true;
                    }
                }
            }
            if(this._pathing && this._pathing != null){
                this._pathing.render(this.canvasCtx);
            }
            this.fire("drawCanvas");
        }
      } 
       
      
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  