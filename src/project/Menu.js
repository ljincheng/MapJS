
(function(global) {

'use strict';
     
if (!global.MapProject) {
global.MapProject = { };
}

if (global.MapProject.Menu) {
geomap.warn('MapProject.Menu is already defined.');
return;
}
     
       
var Util=geomap.util,Request=geomap.request,Template=Util.template,toPoint=Util.toPoint,Element=geomap.element;
var extend = Util.object.extend;
var Point=geomap.Point;
 
MapProject.Menu = geomap.Class(geomap.CommonMethods, geomap.Observable, {
    map:undefined,
    container:undefined,
    toolBar:undefined,
    tbOpt:{"className":"menu-nav"},
    tbStyle:{},
    memuOpt:{"className":"menu-item"},
    menu:[],
    mapmenu:[{mapMenu:true,type:"reference_line",text:"参考线",id:"map_reference_Line"}],
    _mapmenu:[],
    initialize: function(container, options) {
        options || (options = { });  
        this._setOptions(options);
        if(typeof container === 'string'){
                this.container=document.getElementById(container)
        }else{
            this.container=container;
        } 
        this.toolBar=Element.create("ul",this.tbOpt,this.tbStyle);
        eventjs.add(this.toolBar,"click",this._ev_menu_item);
        this.container.appendChild(this.toolBar);
        this._init_handle_ev();
        if(this.map!=undefined){
            this.setMap(this.map);
        }
        this._init_menu();
    },
    _init_handle_ev:function(){
        this._init_map_menu=this.__init_map_menu.bind(this);
    },
    setMap:function(map){
        this.map=map;
        this.__init_map_menu();
        this.map.on("map_complete",this._init_map_menu);
    },
    addMenu:function(menuItem){
        this.menu.push(menuItem);
        this.__init_map_menu();
    },
    __init_map_menu:function(){
        this._mapmenu=[];
        var m=this.mapmenu;
        for(var i=0,k=m.length;i<k;i++){
            var item=m[i]; 
            this._mapmenu.push(item);
        }
        if(this.map && this.map._projectMap){
            var pmap=this.map._projectMap;
            for(var i=0,k=pmap.length;i<k;i++){
                var mapInfo=pmap[i];
                var menuId="map_"+i;
                this._mapmenu.push({mapMenu:true,type:"layer",id:menuId,text:mapInfo.subTitle,layerIndex:i});
            } 
        }
        this._init_menu();
    },
    _init_menu:function(){
        this.toolBar.innerHTML="";
        for(var i=0,k=this._mapmenu.length;i<k;i++){
            var item=this._mapmenu[i];
            var el=this._create_menu_item(item);
            this.toolBar.appendChild(el);
        }
        for(var i=0,k=this.menu.length;i<k;i++){
            var item=this.menu[i];
            var el=this._create_menu_item(item);
            this.toolBar.appendChild(el);
        }
    },
    _create_menu_item:function(item){
        var li=Element.create("li",this.memuOpt);
        var label=Element.create("a");
        if(item.icon!=undefined && item.icon !=''){
            label.innerHTML=item.icon +"&nbsp;"+ item.text;
        }else{
            label.innerText=item.text;
        }
        
        var myself=this;
        li.__menu_item=true;
        li._data={data:item,target:myself};
        li.appendChild(label);
       
        return li;
    },
    _ev_menu_item:function (event,self) {
        var obj=event.target;
        if(obj != undefined){
            var mel=obj;
            while(mel.__menu_item == undefined && mel.nodeName != 'BODY'){
                mel=mel.parentElement || mel.parentNode;
            }
            if(mel._data && mel._data.target &&  mel._data.target._ev_menu_map(mel._data)){
                var myself=mel._data.target;
                var newEvent={event:event,self:self,menu:{target:mel,data:mel._data.data,self:myself}};
                myself.fire("menu_click",newEvent);
             }

        }
    },
    _ev_menu_map:function(arg){
        var result=true,myself=arg.target,data=arg.data;
        if(myself && myself.map && data.id ){
            if(data.mapMenu){
                if(data.type=== "layer"){
                    if(data.layerIndex !=undefined){
                        myself.map.mapChange(data.layerIndex);
                        result=false;
                    }
                    
                }else if(data.type==='reference_line'){
                    myself.map.toggleReferenceLine();
                    result=false;
                }
            }
            
        }
        return result;
    }

});

   

})(typeof exports !== 'undefined' ? exports : this);