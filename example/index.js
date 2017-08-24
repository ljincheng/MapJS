var testdata=[{"gtype":"LINEARRING","data":[[92276.61008587225,43387.14866127917],[92276.61008587225,15605.84309866809],[100081.83402965346,14547.507648663857],[110136.02080469366,40609.01810501806]],"gstyle":{"stroke":{"color":"#ff9700","width":2},"fillColor":[255,173,50,0.5]}},{"gtype":"LINEARRING","data":[[110136.02080469366,40609.01810501806],[118867.28826722858,29893.371673725218],[115427.69805471482,10711.041642398515],[115559.98998596535,10446.45777989745],[115824.57384846642,10446.45777989745]],"gstyle":{"stroke":{"color":"#ff9700","width":2},"fillColor":[255,173,50,0.5]}},{"gtype":"POLYGON","data":[[116221.449642218,42196.52128002441],[123629.79779224763,15341.259236167025],[130112.10242352354,29496.495879973627],[130905.85401102672,40212.14231126648],[123232.92199849603,44577.77604253393]],"gstyle":{"stroke":{"color":"#ff9700","width":2},"fillColor":[255,173,50,0.5]}},{"gtype":"CIRCLE","data":{"x":144135.04713607964,"y":28041.28463621781,"r":8143.210458742048},"gstyle":{"stroke":{"color":"#ff9700","width":2},"fillColor":[255,173,50,0.5]}},{"gtype":"RECTANGLE","data":[[128789.18311101825,51853.83226131303],[148236.09700484603,41799.64548627282]],"gstyle":{"stroke":{"color":"#ff9700","width":2},"fillColor":[255,173,50,0.5]}}];

var map = null;
var mapimageLayer = null;
var geomlayer=null;
function initWindow() {
    var winWH = window.getSize();
    $("mapContainer").setStyles({ width: winWH.x, height: winWH.y });
}
function mapresize() {
    if (map != null)
        map.resize();
}
function loadMap() {
    map = new MapGIS.OpenstreetMap("mapContainer");
    //    	map.imageLayer.showLines=true;
    map.imageLayer.options["visibleWindow"]=true;
    map.imageLayer.setData([{ 'x': 135233.577235, 'y': 24584.76784,'title':'4403080010020900017编码', 'html': '4403080010020900017', 'content': '4403080010020900017', 'marker': { 'imgClass': "markerTransparent "}}, { 'x': 140157.953695, 'y': 24947.496669, 'content': "编码：4403080040021200031<br><hr>样式为markerRed" }, { 'x': 132782.505746, 'y': 20587.174619, 'content': "编码：4403080020040800031<br><hr>样式为markerArrows", 'marker': { 'imgClass': "markerArrows"} }, { 'x': 131469.777941, 'y': 20583.994072, 'content': "编码：4403080030031100006<br><hr>样式为markerA", 'marker': { 'imgClass': "markerA"}}]);
    
}
window.addEvent('domready', function () {
                //        initWindow();
                loadMap();
                });
window.onresize=mapresize;

var testBtnEvent=function()
{
    $("testA").set("text",JSON.encode(map.getCurrentExtent()));
}
var testBtnClickEvent=function()
{
    map.setCenter({"x":113.96873474121094,"y":11.57135009765625});
    map.imageLayer.setData([{"x":113.96873474121094,"y":11.57135009765625}]);
}
 
var drawGeom=function(p)
{
    switch(p)
    {
        case 0:
            map.paletteLayer.pop();
            break;
        case -1:
            map.paletteLayer.shift();
            break;
        case -2:
            $("testB").set("text",JSON.encode(map.paletteLayer.getData()));
            break;
        case -3:
            map.paletteLayer.clear();
            break;
        default:
            map.paletteLayer.paintTools(p);
            break;
    }
    
    return false;
    
}

