
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
        type:"MapDraw",
        id:0,
        title:"绘图",
        icon:null,
        onlyIcon:false,
        url:undefined,
        root:undefined,
        toolEl:undefined,
        formEl:undefined,
        width:600,
        height:400,
        tbOpt:{},
        tbStyle:{width:"100%"},
        map:undefined,
        table:undefined,
        drawType:"Rect",
        fill:true,
        buttons:[{text:"删除",tag:"a",style:{cursor:"pointer"}}],
        form:{},
        menu:undefined,
        initialize: function( options) {
            options || (options = { });  
            this.set("id",+new Date());
            this._setOptions(options);
            this._saveGeomEv=this.saveGeomEv.bind(this);
            this._closeFrameEv=this.closeFrameEv.bind(this);
            this.root=Element.create("div");
            this.on("geom_data",this.geomDataCallback.bind(this));
            var toolEl=Element.create("div");
            this.toolEl=toolEl;
            this.formEl=Element.create("div");
            this.root.appendChild(this.toolEl);
            this.root.appendChild(this.formEl);
            this.creatTools();
        },
        creatTools:function(){
           var xnumEl=Element.create("input",{type:"text" ,id:"tool_xnum"});
           var btn=Element.create("input",{type:"button",value:"确定" ,id:"tool_xnum"});
          
           this._xnumEl=xnumEl;

           this.toolEl.appendChild(xnumEl);
           this.toolEl.appendChild(btn);
           eventjs.add(btn,"click",this.editGeometry.bind(this));
        },
        editGeometry:function(){
            if(this._group){
                var value=this._xnumEl.value;
                this._group.split(Number(value));
            }
        },
        addToMenu:function(menu){
            this.menu=menu;
            this.menu.on("menu_click",this.menuClick.bind(this));
            this.menu.addMenu({mapMenu:true,type:this.type,text:this.title,icon:this.icon,onlyIcon:this.onlyIcon,id:this.id});
        },
        menuClick:function(arg){
            var menu=arg.menu,menuItem=menu.data;
            if(menuItem.mapMenu && menuItem.type=== this.type && menuItem.id && menuItem.id === this.id){
               this.map.setMapDraw(this);
            }
        },
        closeFrameEv:function(event,self){
            this.map.clearDrawGeometry();
        },
        saveGeomEv:function(){
            if(this.form && this.form.id && this._group){
                var properties=Element.formToJson(document.getElementById(this.form.id));
                // var geomText=this._data_geom.getText();
                var geoms=this._group.getData();
                var geomText=null;
                if(geoms.length>0){
                    geomText=JSON.stringify(geoms[0]);
                }else{
                    return;
                }
               
                var featureId="";
                for(var key in properties){
                    if(key === 'id'){
                        featureId=properties[key];
                        delete properties[key];
                    }
                }
                var myself=this;
                myself.map.jsonReq(this.url,{geometry:geomText,properties:properties,id:featureId},function(xhr){
                    var body=xhr.response,status=xhr.status; 
                    if(status == 200){
                        var result=JSON.parse(body);
                        if(result.code === myself.map.codeOk){
                            myself.map.refresh();
                            myself.hideFrame();
                        }else{
                            alert(result.msg);
                        }
                        // myself.map.refresh();
                        // myself.hideFrame();
                    }
                });
                 
            }
        },
        getViewForm:function(){
            var bodyForm=this.form;
            var formId= bodyForm.id;
            bodyForm.buttons=[{id:"ok",type:"button",title:"",value:"确定",click:this._saveGeomEv}];
            var form=Element.parseToForm(bodyForm);
            this.formEl.appendChild(form);
            return this.root;
        },
        geomDataCallback:function(arg){
            var group=arg.geometry;
            this._group=group;
            // group.split(4,4);

            // var geometry=arg.geometry,layer=arg.layer,clearDraw=arg.clearDraw;
            // var myself=this;
            // this._data_geom=geometry;
            // if(clearDraw){clearDraw();}
            // if(geometry._coordinates.length<1){
            //     return;
            // }
             this.showFrame();
           
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