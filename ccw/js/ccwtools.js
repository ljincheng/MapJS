
(function(global) {

    var REQ_HEADER={token:"test001"}, Request=geomap.request, Extend =geomap.util.object.extend,Template=geomap.util.template;


/**
 *  menu=[{title:"参考线",fn:emptyFn}]
 * @param {*} container 
 */
function Menu(container){
    this._container=container;
    this.toolBar=geomap.element.create("ul",{"className":"menu-nav"});
    //this._container.innerHTML="";
    this._container.appendChild(this.toolBar);
    return this;
}

Menu.prototype={
    setMenu:function(menu){
        this._menu=menu||[];
        this.initMenu();
    },
    initMenu:function(){
        this.toolBar.innerHTML="";
        for(var i=0,k=this._menu.length;i<k;i++){
            var item=this._menu[i];
            var el=this.menuItemEl(item);
            this.toolBar.appendChild(el);
        }
    },
    menuItemEl:function(item){
        var li=geomap.element.create("li",{"className":"menu-item"});
        var label=geomap.element.create("a");
        if(item.icon!=undefined && item.icon !=''){
            label.innerHTML=item.icon +"&nbsp;"+ item.title;
        }else{
            label.innerText=item.title;
        }
        
        var myself=this;
        li._data={data:item,target:myself};
 li.appendChild(label);
        eventjs.add(li,"click",this.eventFn);
        return li;
    },
    eventFn:function (event,self) {
        var obj=self.target;
        if(obj._data ){
            Project.Events.fire("menu",{event:event,self:self});
        }
    }
};


function MapLayerInfo(project,layers,option){
    this._project=project;
    this.layers=layers;
    this.option=option||{};
    this.root=geomap.element.create("div");
    this.toolBar=geomap.element.create("div",{"className":"toolBar"},{"width":"100%","height":"50px"});
    this.tableDiv=geomap.element.create("div");
    this.detailDiv=geomap.element.create("div",{},{"padding":"20px"});
    this.root.appendChild(this.toolBar);
    this.root.appendChild(this.tableDiv);
    this.root.appendChild(this.detailDiv);
    return this;
}
MapLayerInfo.prototype={
    addToolBar:function(){
        var editFormFn=this.editForm.bind(this);
        var addBtn=geomap.element.create("input",{"value":"添加","type":"button","className":"btn"});
        eventjs.add(addBtn,"click",editFormFn); 
        this.toolBar.appendChild(addBtn);
    },
    getElement:function(){
        return this.root;
    },
    loadMapInfo:function(){
        var myself=this;
        var url=geomap.util.template(this._project.conf.mapinfo,{mapId:this._project._map.mapId});
        Request(url,{method:"JSON",body:{},onComplete:function(xhr){
            var body=xhr.response,status=xhr.status; 
            if(status==200){ 
                var result=JSON.parse(body);
                if(result.code== myself._project.conf.code.ok){
                    myself.layers=result.data.layers;
                    myself.initTable();
                }
               
            }
        }});
    },
    initTable:function(){
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
                // tr._rowIndex=i;
                // tr._myself=this;
                //eventjs.add(tr,"click",this.eventFn);
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
                        var el=geomap.element.create(item.tag,{},item.style||{"paddingLeft":"10px","cursor": "pointer"});
                        el.innerText=item.text;
                        el._rowIndex=i;
                        el._data=item;
                        el._myself=this;
                        eventjs.add(el,"click",this.eventFn);
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
            if(this._drag_on_tr){
                if(this._drag_on_tr.rowIndex ==this._drag_rowIndex){
                 geomap.debug("原来位置了－－－");
                }else{
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
                    geomap.debug("放到=="+this._drag_on_tr.rowIndex);
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
                    geomap.element.removeClass(tr,"selected");
                }
                if(this._drag_tr){
                geomap.element.addClass(this._drag_on_tr,"selected");
                }

                // var dragtable=geomap.element.create("table")
                // document.body.appendChild()
            }
      
    },
    detail:function(index){
        this.editForm();
        return;
        var i=typeof index ==='string' ?Number(index):index;
        this.detailDiv.innerHTML="";
        if(this.layers.length>i){
            var layer=this.layers[i];
            var html="<b>详情:</b>";
            for(var key in layer){
                var value=layer[key];
                html+="<br>"+key+":"+( typeof value === 'object'?JSON.stringify(value):value);
            }
            this.detailDiv.innerHTML=html;
        }
    },
    eventFn:function (event,self) {
        var el=self.target,myself=el._myself,data=el._data,index=el._rowIndex;
        if(data.id =='delete'){
            var i=typeof index ==='string' ?Number(index):index;
            if(myself.layers.length>i){
                var layer=myself.layers[i];
                console.log(layer.id);
                // var url=myself.option.layerUrl.delete;
                var url=geomap.util.template(myself._project.conf.deleteLayer,{mapId:myself._project._map.mapId});
                
                Request(url,{method:"JSON",body:{id:layer.id},onComplete:function(xhr){
                    var body=xhr.response,status=xhr.status; 
                    geomap.debug("body="+body);
                    if(status==200){ 
                        myself._project.refresh();
                    }
                }});
            }
        }else if(data.id=="display"){
            var i=typeof index ==='string' ?Number(index):index;
            if(myself.layers.length>i){
                var layer=myself.layers[i];
                console.log(layer.id);
                var display=layer.display==1?0:1;
                // var url=myself.option.layerUrl.delete;
                var url=geomap.util.template(myself._project.conf.displayLayer,{mapId:myself._project._map.mapId});
                Request(url,{method:"JSON",body:{layerId:layer.id,display:display},onComplete:function(xhr){
                    var body=xhr.response,status=xhr.status; 
                    geomap.debug("body="+body);
                    if(status==200){ 
                        myself._project.refresh();
                    }
                }});
            }
        }
        // myself.detail(tr._rowIndex); 
    },
    editForm:function () {
        var addLayerFn=this.addLayerFn.bind(this);
       var forms={name:"车位",id:"form_edit_parking",properties:[{id:"title",type:"text",title:"图层说明",value:"",required:false}
            ,{id:"layerSource",type:"text",title:"图层源",value:"",required:false}
            ,{id:"layerType",type:"radio",title:"类型",value:"POLYGON",option:{"POLYGON":"面","POINT":"点","RASTER":"栅格图    "},required:false}
            ,{id:"display",type:"radio",title:"状态",value:"1",option:{"1":"可见","2":"不可见"},required:true}
            ,{id:"styleId",type:"radio",title:"样式",value:"parking_polygon",option:{"parking_polygon":"车位面","parking_point":"车位点","line_dash":"楼栋边界线"},required:true}
        ],buttons:[{title:"确定",type:"button",value:"确定",click:addLayerFn}]};
        var formEl=geomap.element.parseToForm(forms);
        this.addFormEl=formEl;
        this.detailDiv.innerHTML="";
        this.detailDiv.appendChild(formEl);
    },
    orderChangeFn:function (oldIndex,newIndex) {
        var myself=this;
        var url=geomap.util.template(myself._project.conf.orderChange,{mapId:myself._project._map.mapId});
        Request(url,{method:"JSON",body:{oldIndex:oldIndex,newIndex:newIndex},onComplete:function(xhr){
            var body=xhr.response,status=xhr.status; 
            if(status==200){ 
                myself._project.refresh();
            }
        }});
    },
    addLayerFn:function(){
        var obj=geomap.element.formToJson(this.addFormEl);
        // var url=this.option.layerUrl.add;
        var myself=this;
        var url=geomap.util.template(myself._project.conf.addLayer,{mapId:myself._project._map.mapId});
        Request(url,{method:"JSON",body:obj,onComplete:function(xhr){
            var body=xhr.response,status=xhr.status; 
            if(status==200){ 
                myself._project.refresh();
            }
        }});
    }
};

Project.Menu=Menu;
Project.MapLayerInfo=MapLayerInfo;

})(typeof exports !== 'undefined' ? exports : this);