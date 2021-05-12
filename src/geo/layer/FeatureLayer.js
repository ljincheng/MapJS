
(function(global) {
    'use strict';
   
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.FeatureLayer) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }

    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
    var Feature =geomap.Feature;
   
    geomap.FeatureLayer = geomap.Class(geomap.Layer,  {
      type: 'FeatureLayer',
      features:[],
      drawType:0,
      fill:true,
      loopRender:false,
      _enabled:true,
      drawOptions:{},
      initialize: function(options) {
        this.callSuper('initialize',options);
        this.on("initLayer",this.OnInitLayer.bind(this));
        
      }, 
      OnInitLayer:function(){ 
        this.transformtion.setOrigin(0,0);
        this._map.on("animated",this.AnimatedTag.bind(this));
      },
      AnimatedTag:function(){
        this.loopRender=true;
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
      setFeatures:function(featureData,options){
        this.clearData();
        this.drawOptions= options||{};

        if( typeof featureData == 'array'){
            for(var i=0,k=featureData.length;i<k;i++){
                this.features.push(new Feature(featureData,this._map));
            }
        }else if(typeof featureData == 'object'){
            if(featureData.type && featureData.type ==='FeatureCollection'){
                 
                var geomNum=featureData.features.length;
                for(var i=0;i<geomNum;i++){
                    this.features.push(new Feature(featureData.features[i],this._map));
                }
            }else{
                this.features.push(new Feature(featureData,this._map));
            } 
        }
         
        this.ViewReset();
      },
      clearData:function(){
        if(this.features){
            this.features.forEach(function (item, index, array) {
                // delete item;
                // array[index]=null;
            });
        }
        this.features=[];
      },
      clear:function(){
          this.clearData();
          this.ViewReset();
      },
      OnLoopTime:function(){ 
        if(this.loopRender && (this._canvasScale==1 || this._canvasScale == undefined )){
          this._dragOffset=null;//实时重绘canvas，不需要拖拽偏移量。
          this.loopRender=false;
           this.ViewReset();
        }
      },
      ViewReset:function(){
        if(!this.wheelZoomChanage && (this._canvasScale==1 || this._canvasScale == undefined )){
          this.canvasCtx.clearRect(0,0,this.width,this.height);
            this._canvasScale=1;
            var z=this._map.zoom,bounds=this._map.getBounds(),res=this._map.resolution(z);
                for(var i=0,k=this.features.length;i<k;i++){
                    var feature=this.features[i];
                    feature.draw(this.canvasCtx,this.drawOptions);
                }
            this.fire("drawCanvas");
           
        }
    //   },
    //   drawingCanvas:function(ctx){
    //       if(this.drawOptions.animated){
    //             for(var i=0,k=this.features.length;i<k;i++){
    //                 var feature=this.features[i];
    //                 feature.draw(ctx,this.drawOptions);
    //             }
    //         }else{
    //             this.callSuper('drawingCanvas',ctx);
    //         }
      }
      
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  