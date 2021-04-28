
(function(global) {

    'use strict';
         
    if (!global.MapProject) {
    global.MapProject = { };
    }
    
    if (global.MapProject.MapDraw) {
    geomap.warn('MapProject.MapDraw is already defined.');
    return;
    }
         
           
    var Util=geomap.util,Request=geomap.request,Template=Util.template,toPoint=Util.toPoint,Element=geomap.element;
    var extend = Util.object.extend;
    var Point=geomap.Point;
     
    MapProject.MapDraw = geomap.Class(geomap.CommonMethods, geomap.Observable, {
        url:undefined,
        root:undefined,
        title:"结果",
        width:600,
        height:400,
        tbOpt:{},
        tbStyle:{width:"100%"},
        map:undefined,
        table:undefined,
        drawType:"Rect",
        fill:true,
        buttons:[{text:"删除",tag:"a",style:{cursor:"pointer"}}],
        form:{name:"车位",id:"form_edit_parking",properties:[{id:"id",type:"text",title:"车位ID",value:"",required:false}
        ,{id:"building_id",type:"text",title:"楼栋",value:"",required:false}
        ,{id:"parking_no",type:"text",title:"车位编号",value:"",required:false}
        ,{id:"map_id",type:"hidden",title:"地图ID",value:"",required:true}
        ,{id:"sale_status",type:"radio",title:"销售状态",value:"1",option:{"1":"已售","2":"未售"},required:true}
        
    ]},
        initialize: function( options) {
            options || (options = { });  
            this._setOptions(options);
            this._saveGeomEv=this.saveGeomEv.bind(this);
            this._closeFrameEv=this.closeFrameEv.bind(this);
            this.root=Element.create("div");
            this.on("geom_data",this.geomDataCallback.bind(this));
        },
        closeFrameEv:function(event,self){
            this.map.clearDrawGeometry();
        },
        saveGeomEv:function(){
            if(this.form && this.form.id && this._data_geom){
                var properties=Element.formToJson(document.getElementById(this.form.id));
                var geomText=this._data_geom.getText();
                var featureId="";
                for(var key in properties){
                    if(key === 'id'){
                        featureId=properties[key];
                        delete properties[key];
                    }
                }
                var myself=this;
                myself.map.jsonReq(this.url,{geometry:geomText,properties:properties,id:featureId},function(xhr){
                    myself.map.refresh();
                    myself.hideFrame();
                });
                 
            }
        },
        getViewForm:function(){
            var bodyForm=this.form;
            var formId= bodyForm.id;
            bodyForm.buttons=[{id:"ok",type:"button",title:"",value:"确定",click:this._saveGeomEv}];
            var form=Element.parseToForm(bodyForm);
            return form;
        },
        geomDataCallback:function(arg){
            var geometry=arg.geometry,layer=arg.layer,clearDraw=arg.clearDraw;
            var myself=this;
            this._data_geom=geometry;
            if(clearDraw){clearDraw();}
            if(geometry._coordinates.length<1){
                return;
            }
            this.showFrame();
            // var mapId=arg.map.mapId;
             
            // var bodyForm=this.form;
            //  var formId= bodyForm.id;
            // //  if(!bodyForm.buttons){
            // //  var closeFrameCallback=function(event,self) {
            // //      this.paletteLayer.clearGeometry();
            // //  }.bind(this);
            // //  var parkingAddUrl=this.getParkingAddUrl(mapId);
            // //  var okFrameCallback=function(event,self) {
            // //     var obj=geomap.element.formToJson(document.getElementById(this.formId));
            // //     // var geomText=geometry;
            // //     // this.other.parkingRequestCallback.call(this.other,geomText,obj,self);
            // //     // this.other.paletteLayer.clearGeometry();
            // //  }.bind({other:myself,geometry:geometry.getText(),formId:formId,url:parkingAddUrl});

            //  bodyForm.buttons=[{id:"ok",type:"button",title:"",value:"确定",click:this._saveGeomEv}];
            // // }

            //  window.FRAMES = window.FRAMES ||{};
            //  var form=Element.parseToForm(bodyForm);
            // if(window.FRAMES.editGeomFrame){
            //     window.FRAMES.editGeomFrame.setData("表单信息设置",form,{w:400,h:250});
            //     window.FRAMES.editGeomFrame.show();
            // }else{
            //     window.FRAMES.editGeomFrame=new geomap.view.Frame(document.body,{title:"表单信息设置", body:form,w:400,h:250,closeType:2,pos:"rc"});
            //     window.FRAMES.editGeomFrame.on("close",this._closeFrameEv);
            // }

        },
        showFrame:function(){
            if(this.viewFrame){
                this.viewFrame.show();
            }else{
                this.viewFrame=new geomap.view.Frame(document.body,{title:this.title, body:this.getViewForm(),w:this.width,h:this.height,closeType:2});
            }
        },
        hideFrame:function(){
            if(this.viewFrame){
                this.viewFrame.hide();
            }
        }
    
    });
    
       
    
    })(typeof exports !== 'undefined' ? exports : this);