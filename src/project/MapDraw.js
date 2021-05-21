
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
            var toolEl=Element.create("div",{className:"tooldiv"},{margin:"20px"});
            this.toolEl=toolEl;
            this.formEl=Element.create("div");
            this.root.appendChild(this.toolEl);
            this.root.appendChild(this.formEl);
            this.creatTools();
        },
        creatTools:function(){
            var styleOpt={width:"80px"};
           var xnumEl=Element.create("input",{type:"text" ,id:"tool_xnum"},styleOpt);
           var ynumEl=Element.create("input",{type:"text" ,id:"tool_ynum"},styleOpt);
           var pnumEl=Element.create("input",{type:"text" ,id:"tool_pnum"},styleOpt);
           var btn=Element.create("input",{type:"button",value:"确定" ,id:"tool_btn"},{marginLeft:"10px"});
           this.geomInfoDiv=Element.create("div",{},{color:"gray"});
          
           this._xnumEl=xnumEl;
           this._ynumEl=ynumEl;
           this._pnumEl=pnumEl;

           var layerStyleOpt={display:"initial"};
           var titlelayer=Element.create("div",{},layerStyleOpt);titlelayer.innerHTML="拆分矩行操作<br>";
           var xlayer=Element.create("div",{},layerStyleOpt);xlayer.innerText="水平:";
           var ylayer=Element.create("div",{},layerStyleOpt);ylayer.innerText="垂直:";
           var player=Element.create("div",{},layerStyleOpt);player.innerText="间距:";

           this.toolEl.appendChild(titlelayer)
           this.toolEl.appendChild(xlayer);
           this.toolEl.appendChild(xnumEl);
           this.toolEl.appendChild(ylayer);
           this.toolEl.appendChild(ynumEl);
           this.toolEl.appendChild(player);
           this.toolEl.appendChild(pnumEl);
           this.toolEl.appendChild(btn);
           this.toolEl.appendChild(this.geomInfoDiv);
           eventjs.add(btn,"click",this.editGeometry.bind(this));
        },
        editGeometry:function(){
            if(this._group){
                var value=this._xnumEl.value;
                var ynum=this._ynumEl.value;
                var pnum=this._pnumEl.value;
                var padding=this.map.transform(new Point(pnum,pnum),1);
                this._group.split(Number(value),Number(ynum),padding);
                this.map.drawMap();
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
                if(geoms.length==0){
                    
                
                    return;
                }
               
                var featureId="";
                for(var key in properties){
                    if(key === 'id'){
                        featureId=properties[key];
                        delete properties[key];
                    }
                }
                var reqData=[],idNum=Number(featureId);
                for(var i=0,k=geoms.length;i<k;i++){
                    var geomText=JSON.stringify(geoms[i]); 
                    reqData.push({geometry:geomText,properties:properties,id:idNum});
                    idNum+=1; 
                }
                
                var myself=this;
                // myself.map.jsonReq(this.url,{geometry:geomText,properties:properties,id:featureId},function(xhr){
                    myself.map.jsonReq(this.url,reqData,function(xhr){
                    var body=xhr.response,status=xhr.status; 
                    if(status == 200){
                        var result=JSON.parse(body);
                        if(result.code === myself.map.codeOk){
                            myself.map.clearDrawGeometry();
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
            var geomNum=this._group.getSize();
            if(geomNum>0){
                if(this._group.getPaths().length==1){
                    var p=this._group.getPaths()[0].bounds().getSize();
                    this.geomInfoDiv.innerText="Size="+p.x+","+p.y;
                } 
                this.showFrame();
            }
            // group.split(4,4);

            // var geometry=arg.geometry,layer=arg.layer,clearDraw=arg.clearDraw;
            // var myself=this;
            // this._data_geom=geometry;
            // if(clearDraw){clearDraw();}
            // if(geometry._coordinates.length<1){
            //     return;
            // }
             
           
        },
        showFrame:function(){
            if(this.viewFrame){
                this.viewFrame.show();
            }else{
                this.viewFrame=new geomap.view.Frame(document.body,{title:this.title, body:this.getViewForm(),w:this.width,h:this.height,closeType:2});
                this.viewFrame.on("hide",this._closeFrameEv);
            }
        },
        hideFrame:function(){
            if(this.viewFrame){
                this.viewFrame.hide();
            }
        }
    
    });
    
       
    
    })(typeof exports !== 'undefined' ? exports : this);