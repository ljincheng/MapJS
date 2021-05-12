
(function(global) {

    'use strict';
         
    if (!global.MapProject) {
    global.MapProject = { };
    }
    
    if (global.MapProject.DataListFrame) {
    geomap.warn('MapProject.MapQuery is already defined.');
    return;
    }
         
           
    var Util=geomap.util,Request=geomap.request,Template=Util.template,toPoint=Util.toPoint,Element=geomap.element;
    var extend = Util.object.extend;
    var Point=geomap.Point;
     
    MapProject.DataListFrame = geomap.Class(geomap.CommonMethods, geomap.Observable, {
        type:"DataListFrame",
        id:100,
        title:"数据列表",
        icon:null,
        onlyIcon:false,
        url:undefined,
        root:undefined,
        width:200,
        height:400,
        framePos:"rb",
        tbOpt:{"className":"datalist"},
        tbStyle:{width:"100%"},
        map:undefined,
        table:undefined,
        buttons:[],
        paramData:{},
        headColumn:[],
        menu:undefined,
        elOpt:{"className":"datalist"},
        elStyle:{},
        geomOption:{style:{fillStyle:"rgba(0,0,200,0.5)",strokeStyle:"#fff",lineWidth:2},_fill:true,lineDash:[4,2]},
        initialize: function( options) {
            options || (options = { });  
            this.id=+new Date();
            this._setOptions(options);
            this.root=Element.create("div",this.elOpt,this.elStyle);
            this._eventFn=this.eventFn.bind(this);
        },
        addToMenu:function(menu){
            this.menu=menu;
            this.menu.on("menu_click",this.menuClick.bind(this));
            this.menu.addMenu({mapMenu:true,type:this.type,text:this.title,icon:this.icon,id:this.id,onlyIcon:this.onlyIcon});
        },
        menuClick:function(arg){
            var menu=arg.menu,menuItem=menu.data;
            if(menuItem.mapMenu && menuItem.type=== this.type && menuItem.id && menuItem.id === this.id){
               var self=this;
               self.map.jsonReq(this.url,this.paramData,function(xhr){
                    if(xhr.status==200){
                        var result=JSON.parse(xhr.response);
                                if(result.code === self.map.codeOk){
                                    self.showData(result.data);
                                }else{
                                    alert(result.msg);
                                }
                            
                        
                    }
                });
            }
        },
        showData:function(data){
            this.viewData(data);
            this.showFrame();
        },
        viewData:function(data){
            var rows=data,features=null;
            if(!this.table){
                this.table=Element.create("table",this.tbOpt,this.tbStyle);
                this.root.appendChild(this.table);
            }
            this.table.innerHTML="";
             
                if(data && this.headColumn.length>0){ 
                    //做表格
                    var column=[];
                    for(var i=0,k=this.headColumn.length;i<k;i++){
                        var item=extend({text:'',type:'text',fn:null,id:''},this.headColumn[i]);
                        column.push(item);
                    }
                    // var column=this.headColumn;
                    
                    var table=this.table;
                    var thead=Element.create("thead"); 
                    table.appendChild(thead);
                    var thead_tr=Element.create("tr");
                    thead.appendChild(thead_tr);
                    for(var i=0,k=column.length;i<k;i++){
                        var th=Element.create("th");
                        th.innerText=column[i].text;
                        thead_tr.appendChild(th);
                    }
                   
                    if(this.buttons.length>0){
                        var th_opt=Element.create("th");
                        th_opt.innerText="操作";
                        thead_tr.appendChild(th_opt);
                    }
                    var tbody=Element.create("tbody");
                    table.appendChild(tbody);
                    for(var i=0,k=rows.length;i<k;i++){
                        var tr=Element.create("tr");
                        tbody.appendChild(tr);
                        // for(var item in column){
                        for(var j=0,jk=column.length;j<jk;j++){
                        // for(var item in rows[i]){
                            var th=Element.create("td");
                            if(column[j].type == 'fn'){
                                var value=column[j].fn(rows[i]);
                                if(typeof value !=undefined ){
                                    if(typeof value === 'string'){
                                        th.innerHTML=value;
                                    }else{
                                        th.appendChild(value);
                                    }
                                    
                                }
                                
                            }else{
                                var key=column[j].id
                                rows[i].properties[key] !=undefined ?( th.innerText=rows[i].properties[key] ):"";
                            }
                            tr.appendChild(th);
                        }
                        if(this.buttons.length>0){
                            var td=Element.create("td");
                            tr.appendChild(td);
                            for(var j=0,jk=this.buttons.length;j<jk;j++){
                                var button=this.buttons[j];
                                var el=Element.create(button.tag,button.opt|| {},button.style ||{});
                                el.innerText=button.text;
                                el._data=rows[i];
                                el._features=features[i]
                                el.self=button;
                                eventjs.add(el, "click",this._eventFn);
                                td.appendChild(el);
                            }
                        }
                       
                    }
                } 
               
        },
        eventFn:function(event,self){
            var td=self.target,data=td._data,button=td.self;
            console.log("td===,id="+data.parking_id);
            if(button && button.fn){
                var newself={data:data,self:button,target:td,features:td._features};
                button.fn(event,newself);
            }
        },
        removeRow:function(el){
            var tr=el;
            while(tr && tr.tagName.toString() != "TR" && tr.tagName.toString() != "tr"){
                tr=tr.parentElement || tr.parentNode;
            }
            if(tr && tr.tagName == 'TR'){
                tr.remove();
            }
        },
        showFrame:function(){
            if(this.viewFrame){
                this.viewFrame.show();
            }else{
                this.viewFrame=new geomap.view.Frame(document.body,{title:this.title, body:this.root,w:this.width,h:this.height,closeType:2,pos:this.framePos});
            }
        }
    
    });
    
       
    
    })(typeof exports !== 'undefined' ? exports : this);