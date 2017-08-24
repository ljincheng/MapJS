
var MapGISConfig = { source: ((typeof MapGISConfig == "object" && MapGISConfig.registerSourcePath) ? MapGISConfig.registerSourcePath : "lib/source/") };
(function(){
window.MapGIS = new Hash({
    version: '3.0.0',
    path: {
        source: MapGISConfig.source,
        themes: 'themes/',
        plugins: 'plugins/'
    },
    files: new Hash(),
    lastSeqID: 0,
    createUniqueID: function (prefix) {
        if (prefix == null) {
            prefix = "id_";
        }
        MapGIS.lastSeqID += 1;
        return prefix + MapGIS.lastSeqID;
    },
    getElement: function () {
        var elements = [];
        for (var i = 0, len = arguments.length; i < len; i++) {
            var element = arguments[i];
            if (typeof element == 'string') {
                element = document.getElementById(element);
            }
            if (arguments.length == 1) {
                return element;
            }
            elements.push(element);
        }
        return elements;
    },
    False: function () {
        return false;
    },
    True: function () {
        return true;
    },
    Tween: function (t) {
        return (t /= 1) *t;
    },
    correctPNG: function () {
        if (Browser.Engine.trident4) {
            var imgs = document.getElementsByName("PngImgs");
            for (var i = 0; i < imgs.length; ) {
                var img = imgs[i];
                var strNewHTML;
                var imgID = (img.id) ? "id='" + img.id + "' " : "";
                var imgClass = (img.className) ? "class='" + img.className + "' " : "";
                var imgTitle = (img.title) ? "title='" + img.title + "' " : "title='" + img.alt + "' ";
                var imgStyle = "display:inline-block;" + img.style.cssText;
                if (img.align == "left") imgStyle = "float:left;" + imgStyle;
                if (img.align == "right") imgStyle = "float:right;" + imgStyle;
                if (img.parentElement.href) imgStyle = "cursor:hand;" + imgStyle;
                strNewHTML = "<span unselectable ='on' " + imgID + imgClass + imgTitle + " style=\"width:" + img.width + "px; height:" + img.height + "px;" + imgStyle + ";text-decoration:none;filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + img.src + "', sizingMethod='scale');\"></span>";
                if (item.morph) {
                    item.morph = null;
                }
                img.outerHTML = strNewHTML;
                if (img.destroy) {
                    img.destroy();
                }
                img = null;
            }
        }
    },
    //获取对象的大小
    getSize: function (obj) {
        var o = (typeof (obj) == "object") ? obj : document.getElementById(obj);
        var r = [o.offsetWidth, o.offsetHeight];
        if (o == document.body && !document.all) { r[1] = o.clientHeight; };
        if (!r[0]) { r[0] = o.clientWidth; };
        if (!r[0]) { r[0] = parseInt(o.style.width); };
        if (!r[1]) { r[1] = o.clientHeight; };
        if (!r[1]) { r[1] = parseInt(o.style.height); };
        if (!r[0] || !r[1]) {
            var pw = o.parentElement;
            while (pw) {
                if (!r[0] && pw.offsetWidth) { r[0] = pw.offsetWidth; };
                if (!r[1] && pw.offsetHeight) { r[1] = pw.offsetHeight; };
                if (r[0] && r[1]) { break; };
                pw = pw.parentElement;
            };
        };
        return r;
    },
    //获取对象坐标点
    getClientXY: function (evt, obj) {
        if (typeof (evt.client) != "undefined") {
            var tmp = $(obj.id).getPosition();
            return [evt.client.x - tmp.x, evt.client.y - tmp.y];
        }
        else if (typeof evt.offsetX != "undefined") {
            var pw = evt.target || evt.srcElement;
            var aw = [evt.offsetX, evt.offsetY];
            while (pw && pw != obj) {
                if (pw.tagName == "AREA") { pw = pw.offsetParent || pw.parentElement; continue; }
                aw[0] += pw.offsetLeft;
                aw[1] += pw.offsetTop;
                pw = pw.offsetParent || pw.parentElement;
            };
            return [aw[0], aw[1]];
        }
        else if (typeof evt.pageX != "undefined") {
            var aw = MapGIS.getAbsolutePos(obj);
            return [evt.clientX - aw[0], evt.clientY - aw[1]];
        }
        else
        { return [0, 0]; }
    },
    getAbsolutePos: function (obj) {
        var ow = [0, 0];
        var pw = obj;
        while (pw && pw.offsetParent) {
            ow[0] += pw.offsetLeft;
            ow[1] += pw.offsetTop;
            pw = pw.offsetParent;
        };
        return ow;
    },getExtentCenter:function(obj)
    {
    	var x = (obj[2] + [0]) / 2;
     	var y = (obj[3] + [1]) / 2;
     	return [x,y];
    },closeTabWindow:function(id,event)
    {
    	var e=(event)?event:window.event;
		 if (window.event) {
		  e.cancelBubble=true;     // ie下阻止冒泡
		 } else {
		  e.stopPropagation();     // 其它浏览器下阻止冒泡
		 }
    	if($(id))
    		{
    		$(id).fade("out");
    		}
    },stopPropagation:function(e)
    {
    	var e=(event)?event:window.event;
		 if (window.event) {
		  e.cancelBubble=true;     // ie下阻止冒泡
		 } else {
		  e.stopPropagation();     // 其它浏览器下阻止冒泡
		 }
    }
});
})();