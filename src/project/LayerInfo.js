
(function(global) {

    'use strict';
         
    if (!global.MapProject) {
    global.MapProject = { };
    }
    
    if (global.MapProject.LayerInfo) {
    geomap.warn('MapProject.Menu is already defined.');
    return;
    }
         
           
    var Util=geomap.util,Request=geomap.request,Template=Util.template,toPoint=Util.toPoint,Element=geomap.element;
    var extend = Util.object.extend;
    var Point=geomap.Point;
     
    MapProject.LayerInfo = geomap.Class(geomap.CommonMethods, geomap.Observable, {
        map:undefined,
        root:undefined, 
        toolBar:undefined,
        tbOpt:{"className":"toolBar"},
        tbStyle:{"width":"100%","height":"50px"},
        layers:[],
        menu:undefined,
        title:"图层信息",
        initialize: function(options) {
            options || (options = { });  
            this._setOptions(options);
            this.root=Element.create("div");
            this.toolBar=Element.create("div",this.tbOpt,this.tbStyle);
            this.tableDiv=Element.create("div");
            this.detailDiv=Element.create("div",{},{"padding":"20px"});
            this.root.appendChild(this.toolBar);
            this.root.appendChild(this.tableDiv);
            this.root.appendChild(this.detailDiv);
            this.addToolBar();
            if(this.map!=undefined){
                this.setMap(this.map);
            }
        },
        setMap:function(map){
            this.map=map; 
            this.createMapLayerTable();
            this.map.on("server_layer_ok",this._loadMapLayer.bind(this));
        },
        addToMenu:function(menu){
            this.menu=menu;
            this.menu.on("menu_click",this.menuClick.bind(this));
            this.menu.addMenu({mapMenu:true,type:"serverLayerInfo",text:this.title,id:"map_server_layer_info"});
        },
        menuClick:function(arg){
            var menu=arg.menu,menuItem=menu.data;
            if(menuItem.mapMenu && menuItem.type=== 'serverLayerInfo'){
                if(this.viewFrame){
                    this.viewFrame.show();
                }else{
                    this.viewFrame=new geomap.view.Frame(document.body,{title:this.title, body:this.getElement(),w:600,h:450,closeType:2});
                }
            }
        },
        getElement:function(){
            return this.root;
        },
        addToolBar:function(){
            var editFormFn=this.editForm.bind(this);
            var addBtn=Element.create("input",{"value":"添加","type":"button","className":"btn"});
            eventjs.add(addBtn,"click",editFormFn); 
            this.toolBar.appendChild(addBtn);
        },
        _loadMapLayer:function(){
            this.layers=this.map._server_layers;
            this.createMapLayerTable();
        },
        createMapLayerTable:function(){ 
            var extHead={opt:"操作"};
            var extBody=[{"text":"删除","tag":"a","id":"delete","style":{"cursor": "pointer"}},{"text":"显隐","tag":"a","id":"display"}];
            var headV={layerOrder:"序号",layerType:"类型",display:"状态",title:"图层说明",layerSource:"图层源"};
            var thead=document.createElement("thead");
            {
                var tr=document.createElement("tr");
                for(var key in headV){
                    var td=document.createElement("td");
                    td.innerText=headV[key];
                    tr.appendChild(td);
                }
                for(var key in extHead){
                    var td=document.createElement("td");
                    td.innerText=extHead[key];
                    tr.appendChild(td);
                }
                thead.appendChild(tr);
            }
            var tbody=document.createElement("tbody");
            if(this.layers!=undefined && this.layers.length>0){
                for(var i=0,k=this.layers.length;i<k;i++){
                    var layer=this.layers[i];
                    var tr=document.createElement("tr");
                    for(var key in headV){
                        var td=document.createElement("td");
                        td.innerText=layer[key];
                        tr.appendChild(td);
                    }
                    if(extBody.length>0){
                        var td=document.createElement("td");
                        tr.appendChild(td);
                        for(var j=0,jk=extBody.length;j<jk;j++){
                            var item=extBody[j];
                            var el=Element.create(item.tag,{},item.style||{"paddingLeft":"10px","cursor": "pointer"});
                            el.innerText=item.text;
                            el._rowIndex=i;
                            el._data=item;
                            el._myself=this;
                            eventjs.add(el,"click",function(event,self){ 
                                eventjs.cancel(event);
                                this.eventFn(event,self);
                            }.bind(this));
                            td.appendChild(el);
                        }
                    }
                    
                    tbody.appendChild(tr);
                    
                }
            }
            
            if(!this.table){
                this.table=document.createElement("table");
                //=== 测试
                eventjs.add(this.table,"drag",this.dragTableEvent.bind(this));
                eventjs.add(this.table,"mouseOver",this.mouseOverEvent.bind(this));
                this.tableDiv.appendChild(this.table);
            }
            this.table.innerHTML="";
            this.table.appendChild(thead);
            this.table.appendChild(tbody); 
        },
        dragTableEvent:function(event,self){
            var target1=self.target,target2=event.target;
            if(self.state === 'down'){
                eventjs.cancel(event);
                var trEl=target2;
                if(target2.nodeName =='TD'){
                    trEl=target2.parentElement || target2.parentNode;
                    this._drag_tr=trEl;
                    this._drag_rowIndex=trEl.rowIndex;
    
                }
            }else if(self.state === 'up'){
                if(this._drag_on_tr && this._drag_tr!=undefined){
                    if(this._drag_on_tr.rowIndex ==this._drag_rowIndex){
                    //  geomap.debug("原来位置了－－－");
                    }else　if(this._drag_tr.querySelectorAll){
                        var cells=this._drag_tr.querySelectorAll("td");
                        
                        this.table.deleteRow(this._drag_rowIndex);
                        var row=null;
                        var oldIndex=this._drag_rowIndex;
                        var newIndex=this._drag_on_tr.rowIndex;
                        if(this._drag_rowIndex < this._drag_on_tr.rowIndex){
                            newIndex+=1;
                            row=this.table.insertRow(newIndex);
                        }else{
                            row=this.table.insertRow(newIndex);
                        }
                        for(var i=0,k=cells.length;i<k;i++){
                            row.appendChild(cells[i]);
                        } 
                        this.orderChangeFn(oldIndex-1,newIndex-1);
                        // geomap.debug("放到=="+this._drag_on_tr.rowIndex);
                    }
                }
                this._drag_tr=undefined;
           
            }
        },
        mouseOverEvent:function (event,self) {
            var target2=event.target; 
                var trEl=target2;
                if(target2.nodeName =='TD'){
                    trEl=target2.parentElement || target2.parentNode;
                    this._drag_on_tr=trEl;
                    var tr_arrary=this.table.querySelectorAll("tr.selected");
                    for(var i=0,k=tr_arrary.length;i<k;i++){
                        var tr=tr_arrary[i];
                        Element.removeClass(tr,"selected");
                    }
                    if(this._drag_tr){
                    Element.addClass(this._drag_on_tr,"selected");
                    } 
                }
          
        },
        editForm:function () {
            var addLayerFn=this.addLayerFn.bind(this);
           var forms={name:"车位",id:"form_edit_parking",properties:[{id:"title",type:"text",title:"图层说明",value:"",required:false}
                ,{id:"layerSource",type:"text",title:"图层源",value:"",required:false}
                ,{id:"layerType",type:"radio",title:"类型",value:"POLYGON",option:{"POLYGON":"面","POINT":"点","RASTER":"栅格图    "},required:false}
                ,{id:"display",type:"radio",title:"状态",value:"1",option:{"1":"可见","2":"不可见"},required:true}
                ,{id:"styleId",type:"radio",title:"样式",value:"parking_polygon",option:{"parking_polygon":"车位面","parking_point":"车位点","line_dash":"楼栋边界线"},required:true}
            ],buttons:[{title:"确定",type:"button",value:"确定",click:addLayerFn}]};
            var formEl=Element.parseToForm(forms);
            this.addFormEl=formEl;
            this.detailDiv.innerHTML="";
            this.detailDiv.appendChild(formEl);
        },
        orderChangeFn:function (oldIndex,newIndex) {
            var myself=this;
            myself.map.orderChangeFn(oldIndex,newIndex);
        },
        addLayerFn:function(){
            var obj=Element.formToJson(this.addFormEl);
            var myself=this;
            myself.map.addServerLayer(obj);
        },
        eventFn:function (event,self) {
            var el=self.target,myself=el._myself,data=el._data,index=el._rowIndex;
            if(data.id =='delete'){
                var i=typeof index ==='string' ?Number(index):index;
                if(myself.layers.length>i){
                    var layer=myself.layers[i];
                    myself.map.deleteServerLayer(layer.id);
                }
            }else if(data.id=="display"){
                var i=typeof index ==='string' ?Number(index):index;
                if(myself.layers.length>i){
                    var layer=myself.layers[i];
                    var display=layer.display==1?0:1; 
                    myself.map.displayServerLayer(layer.id,display);
                }
            }
            // myself.detail(tr._rowIndex); 
        },
        
    });
    
       
    
    })(typeof exports !== 'undefined' ? exports : this);