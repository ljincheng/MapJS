
(function(global) {

    'use strict';
         
    if (!global.MapProject) {
    global.MapProject = { };
    }
    
    if (global.MapProject.MapQuery) {
    geomap.warn('MapProject.MapQuery is already defined.');
    return;
    }
         
           
    var Util=geomap.util,Request=geomap.request,Template=Util.template,toPoint=Util.toPoint,Element=geomap.element;
    var extend = Util.object.extend;
    var Point=geomap.Point;
     
    MapProject.MapQuery = geomap.Class(geomap.CommonMethods, geomap.Observable, {
        url:undefined,
        root:undefined,
        title:"查询结果",
        width:600,
        height:400,
        tbOpt:{},
        tbStyle:{width:"100%"},
        map:undefined,
        table:undefined,
        buttons:[{text:"删除",tag:"a",style:{cursor:"pointer"}}],
        initialize: function( options) {
            options || (options = { });  
            this._setOptions(options);
            this.root=Element.create("div");
            this._eventFn=this.eventFn.bind(this);
            this.on("coord_data",this.coord_data.bind(this));
        },
        coord_data:function(data){
            this.viewData(data);
            this.showFrame();
        },
        viewData:function(featureData){
            var rows=[];
            if(!this.table){
                this.table=Element.create("table",this.tbOpt,this.tbStyle);
                this.root.appendChild(this.table);
            }
            this.table.innerHTML="";
            if(featureData.type=="FeatureCollection"){
                    var geomNum=featureData.features.length;
                    for(var i=0;i<geomNum;i++){
                        var feature=featureData.features[i];
                        var properties=feature.properties;
                        var fid=feature.id.split(".");
                        if(fid.length>1){
                            properties.id=fid[1]
                        }else{
                            properties.id=feature.id;
                        }
                        
                        rows.push(properties);
                    }
                }else if(featureData.type=="Feature"){
                    var properties=featureData.properties;
                    var fid=featureData.id.split(".");
                        if(fid.length>1){
                            properties.id=fid[1]
                        }else{
                            properties.id=featureData.id;
                        }
                    rows.push(properties);
                }
                if(rows.length>0){
                    
                    var table=this.table;
                    var thead=Element.create("thead");
                    
                    table.appendChild(thead);
                    var thead_tr=Element.create("tr");
                    thead.appendChild(thead_tr);
                    for(var item in rows[0]){
                        var th=Element.create("th");
                        th.innerText=item;
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
                        for(var item in rows[i]){
                            var th=Element.create("td");
                            th.innerText=rows[i][item];
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
                var newself={data:data,self:button,target:td};
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
                this.viewFrame=new geomap.view.Frame(document.body,{title:this.title, body:this.root,w:this.width,h:this.height,closeType:2});
            }
        }
    
    });
    
       
    
    })(typeof exports !== 'undefined' ? exports : this);