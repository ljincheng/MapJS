 var testdata=[{"gtype":"LINEARRING","data":[[92276.61008587225,43387.14866127917],[92276.61008587225,15605.84309866809],[100081.83402965346,14547.507648663857],[110136.02080469366,40609.01810501806]],"gstyle":{"stroke":{"color":"#ff9700","width":2},"fillColor":[255,173,50,0.5]}},{"gtype":"LINEARRING","data":[[110136.02080469366,40609.01810501806],[118867.28826722858,29893.371673725218],[115427.69805471482,10711.041642398515],[115559.98998596535,10446.45777989745],[115824.57384846642,10446.45777989745]],"gstyle":{"stroke":{"color":"#ff9700","width":2},"fillColor":[255,173,50,0.5]}},{"gtype":"POLYGON","data":[[116221.449642218,42196.52128002441],[123629.79779224763,15341.259236167025],[130112.10242352354,29496.495879973627],[130905.85401102672,40212.14231126648],[123232.92199849603,44577.77604253393]],"gstyle":{"stroke":{"color":"#ff9700","width":2},"fillColor":[255,173,50,0.5]}},{"gtype":"CIRCLE","data":{"x":144135.04713607964,"y":28041.28463621781,"r":8143.210458742048},"gstyle":{"stroke":{"color":"#ff9700","width":2},"fillColor":[255,173,50,0.5]}},{"gtype":"RECTANGLE","data":[[128789.18311101825,51853.83226131303],[148236.09700484603,41799.64548627282]],"gstyle":{"stroke":{"color":"#ff9700","width":2},"fillColor":[255,173,50,0.5]}}];

var map = null;
    var mapimageLayer = null;
    var geomlayer=null;
    function initWindow() {
        var winWH = window.getSize();
        $("mapContainer").setStyles({ width: winWH.x, height: winWH.y });
    }
    function mapresize() {
//        if (map != null)
//            map.resize();
    }
    function loadMap() {
       
    	   
        map = new MapGIS.OpenstreetMap("mapContainer");
        var imglayer=new MapGIS.Layers.MapImageLayer({id:"LB02"});
        map.addLayer(imglayer);
        imglayer.setData([{x:113.203125,y:11.953125,show:true,content:
//        "<br><br>sdjfowejrwerim" +"<img style='width:400px;height:100px;'/>"+
        "是否接受的发大水房价未来热舞两人额王老吉任务〈<br>了金日我了就日晚间阿胶荣威金融危就日王文杰认为哦人家问哦金融额外居然温柔几位rowM《<br><hr><br>jsidfewojrowejr即将哦就是覅精神负担<br><br>"},
        {x:123293.33655182851,y:19811.533521496683,show:true,content:"这是谁",title:"这是谁"}]);
        imglayer.setGraphicsData(testdata);
        
        geomlayer=new MapGIS.Layers.PaletteLayer({id:"LB03",stopEvent:map.stopEvent.bind(map)});
        map.addLayer(geomlayer);
        imglayer.selectedItem.marker={imgClass:"selectedpoint"};
        imglayer.addEvent("pointclick",function(data){
        	alert(data.data.content)
        	});
    }
    window.addEvent('domready', function () {
//        initWindow();
        loadMap();
    });
 
    
 var testBtnEvent=function()
 {
	 $("testA").set("text",JSON.encode(map.getCurrentExtent()));
 }
 var testBtnClickEvent=function()
 {
	 map.removeEvents("click");
	 map.addEvent("click",function(e,xy){
		 alert(JSON.encode(xy))
		 
	 });
 }
 
 var drawGeom=function(g)
 {
	 map.setActiveTool("*");
	 switch(g)
	 {
	 	case 1://矩形
	 		geomlayer.paintRectangle();
			break;
		case 2://线
			geomlayer.paintLine(false);
			break;
		case 3://圆
			geomlayer.paintCircle(true);
			break;
		case 4://闭合线
			geomlayer.paintLine(true);
			break;
		default://多边形
			geomlayer.paintPolygon();
			break;
	 }
	 
 }
