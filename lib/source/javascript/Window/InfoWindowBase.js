(function(){
MapGIS.extend({
    InfoWindow: new Hash({
        InstanceWindow: function (id) {
            if ($(id)) {
                return $(id).retrieve("instance");
            }
            else {
                return null;
            }
        },
        InfoWindowBase: new Class({
            Implements: [Events, Options],
            options: {
                source: MapGIS.path.source,
                id: "win_" + Math.random(),
                content: "",
                left: 0,
                top: 0,
                display: "block",
                cssClass: "",
                logic: [0, 0]
            },
            Obj:null,
            initialize: function (options) {
                this.setOptions(options);
                var layerDIV = new Element("div", { id: this.options.id, styles: { position: "absolute", left: this.options.left, top: this.options.top, display: this.options.display } });
                if (this.options.cssClass != "")
                    layerDIV.addClass(this.options.cssClass);
                this.Obj = layerDIV;
                this.Obj.set("html", this.init());
                this.Obj.store("instance", this);
                this.Obj.addEvent('mousedown', function (event) {
                    event.stopPropagation();
                });
                this.Obj.addEvent('mouseup', function (event) {
                    event.stopPropagation();
                });
            },
            toggleClass: function (className) {
                this.Obj.toggleClass(className);
            },
            setLogic: function (x, y) {
                this.options.logic = [x, y];
            },
            getLogic: function () {
                return this.options.logic;
            },
            setDeflect: function (xy) {
                this.Obj.store("deflect", { x: xy.x, y: xy.y });
            },
            getDeflect: function () {
                var deflect = this.Obj.retrieve("deflect");
                return deflect;
            },
            set: function (left, top, content) {
                this.options.left = left;
                this.options.top = top;
                this.options.content = content;
                this.Obj.setStyles({ left: this.options.left, marginLeft: "-30px", top: this.options.top });
                //this.Obj.setStyle("left", (this.Obj.offsetLeft - 30) + "px");
                this.Obj.set("html", this.init());
                this.Obj.addEvent('click', function (event) {
                    event.stopPropagation();
                });
            },
            Obj: null,
            show: function () {
                this.options.display = "";
                this.Obj.setStyle("opacity", 0);
                this.Obj.setStyle("display", "");
                this.Obj.fade("in");
            },
            toggle: function () {
                this.Obj.fade("toggle");
            },
            hide: function () {
                this.options.display = "none";
                //this.Obj.setStyle("display", "none");
                this.Obj.fade("out");

            },
            init: function () {
                var _ID_Str = this.options.id + "_tbl";
                var imgPath = this.options.source + "images/window/"; //图片目录
                var content = this.options.content;
                var _table = "<table  id='" + _ID_Str + "'  cellPadding='0' cellSpacing='0' class='fc-tbx' style='font-size:12px; width:200px; '>";
                if (Browser.Engine.trident4) {
                    _table += "<tr><td style='filter : progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "tl.png ); width:16px'>&nbsp;&nbsp;</td><td style='HEIGHT: 25px; overflow:hidden;'><div  style='filter:progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=crop , src=" + imgPath + "t.png ); margin:0px;  padding:0px; overflow:hidden;  HEIGHT: 25px'></div></td><td  style='filter : progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "tr.png ); overflow:hidden; width:16px;'></td></tr>";
                    _table += "<tr><td style='filter : progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "l.png ); width:16px; height:10px;'><div style='filter:progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "none.png ); overflow:hidden; width:18px; height:8px; margin-top:0px; margin-right:0px '  ></div></td><td style='filter : progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "c.png ); '  align=\"right\"><div style='filter:progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "close.png ); overflow:hidden; width:10px; height:10px; margin-top:0px; margin-right:0px; background:#000000;'  onclick='$(\"" + this.options.id + "\").fade(\"out\");return false;'></div></td><td style='filter : progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "r.png );width:16px'><input type=\"image\" src=\'" + imgPath + "none.png\' /></td></tr>";
                    _table += "<tr><td style='filter : progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "l.png );  width:16px'>&nbsp;&nbsp;</td><td style='filter : progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "c.png );  margin:0px; padding:0px;  '  valign=\"top\"><div style='margin:0px; padding:0px; color:white;'>" + content + "</div></td><td style='filter : progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "r.png ); width:16px'> &nbsp;&nbsp;</td></tr>";
                    _table += "<tr><td style='filter : progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "bl.png );  width:16px'>&nbsp;&nbsp;</td><td style='filter : progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "b.png );  height:16px;'>&nbsp;</td><td style='filter : progid:DXImageTransform.Microsoft.AlphaImageLoader (sizingMethod=scale , src=" + imgPath + "br.png ); width:16px;'> &nbsp;&nbsp;</td><tr></table>";
                }
                else {
                    _table += "<tr><td style='BACKGROUND: url(" + imgPath + "tl.png) no-repeat; width:16px'>&nbsp;&nbsp;</td><td style='BACKGROUND: url(" + imgPath + "t.png)  no-repeat;  HEIGHT: 25px'></td><td  style='BACKGROUND: url(" + imgPath + "tr.png) no-repeat; width:16px;'> &nbsp;&nbsp;</td></tr>";
                    _table += "<tr><td style='BACKGROUND: url(" + imgPath + "none.png) repeat-y; width:16px; height:10px;'><input type=\"image\" src=\'" + imgPath + "l.png\' /></td><td style='BACKGROUND: url(" + imgPath + "c.png) '  align=\"right\">&nbsp;&nbsp;<input type='image' src='" + imgPath + "close.png' style='margin-top:0px; margin-right:0px' onclick='$(\"" + this.options.id + "\").fade(\"out\")' ></td><td style='BACKGROUND: url(" + imgPath + "r.png)  repeat-y;width:16px'><input type=\"image\" src=\'" + imgPath + "none.png\' /></td></tr>";
                    _table += "<tr><td style='BACKGROUND: url(" + imgPath + "l.png) repeat-y; width:16px'>&nbsp;&nbsp;</td><td style='BACKGROUND: url(" + imgPath + "c.png); margin:0px; padding:0px;  '  valign=\"top\"><div style='margin:0px; padding:0px; color:white;'>" + content + "</div></td><td style='BACKGROUND: url(" + imgPath + "r.png)  repeat-y;width:16px'> &nbsp;&nbsp;</td></tr>";
                    _table += "<tr><td style='BACKGROUND: url(" + imgPath + "bl.png) no-repeat; width:16px'>&nbsp;&nbsp;</td><td style='BACKGROUND: url(" + imgPath + "b.png) repeat-x; height:16px;'>&nbsp;</td><td style='BACKGROUND: url(" + imgPath + "br.png) no-repeat; width:16px;'> &nbsp;&nbsp;</td><tr></table>";
                }
                return _table;
            }


        })
    })

});
})();