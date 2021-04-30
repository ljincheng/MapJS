function ccw_conf(layer,saleStatus){
    var ccw_config={ 
        project:"http://master.cn/ccw/wms/map/project/{mapId}",
        mapinfo:"http://master.cn/ccw/wms/map/mapinfo/{mapId}",
        displayLayer:"http://master.cn/ccw/wms/map/displayLayer/{mapId}",
        tile:"http://master.cn/ccw/wms/map/image/{mapId}/{z}/{x}/{y}.png",
        addLayer:"http://master.cn/ccw/wms/map/addLayer/{mapId}",
        deleteLayer:"http://master.cn/ccw/wms/map/deleteLayer/{mapId}",
        orderChange:"http://master.cn/ccw/wms/map/layerOrderChange/{mapId}",
        parkingAdd:"http://master.cn/ccw/wms/parking/add/{mapId}",
        parkingQuery:"http://master.cn/ccw/wms/parking/query/{mapId}",
        parkingDelete:"http://master.cn/ccw/wms/parking/delete/{mapId}",
        forms:[{name:"车位",id:"form_edit_parking",properties:[{id:"id",type:"text",title:"车位ID",value:"",required:false}
            ,{id:"building_id",type:"text",title:"楼栋",value:"",required:false}
            ,{id:"parking_no",type:"text",title:"车位编号",value:"",required:false}
            ,{id:"map_id",type:"hidden",title:"地图ID",value:"",required:true}
            ,{id:"sale_status",type:"radio",title:"销售状态",value:"1",option:{"1":"已售","2":"未售"},required:true}
            
        ]}],
        code:{ok:0,fail:1},
    };

    if(layer=== 'building' || layer === 'building2'){
        ccw_config.parkingAdd="http://master.cn/ccw/wms/building/add/{mapId}";
        ccw_config.parkingQuery="http://master.cn/ccw/wms/building/query/{mapId}?saleStatus="+saleStatus;
        ccw_config.parkingDelete="http://master.cn/ccw/wms/building/delete/{mapId}";
        ccw_config.forms=[{name:"车位",properties:[{id:"id",type:"text",title:"楼栋ID",value:"",required:false}
            ,{id:"project_id",type:"text",title:"项目ID",value:"",required:false}
            ,{id:"map_id",type:"hidden",title:"地图ID",value:"",required:true}
        ]}];
        if(layer === 'building2'){
            ccw_config.parkingQuery="http://master.cn/ccw/wms/building/queryParking/{mapId}?saleStatus="+saleStatus;
        }
    }  
    return ccw_config;
}

