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
            initialize: function (options) {
                this.setOptions(options);
                var layerDIV = new Element("div", { id: this.options.id, styles: { position: "absolute", border: "1px solid red", left: this.options.left, top: this.options.top, display: this.options.display} });
                if (this.options.cssClass != "")
                    layerDIV.addClass(this.options.cssClass);
                this.Obj = layerDIV;
                this.Obj.set("html", this.init());
                this.Obj.store("instance", this);
                //                this.Obj.addEvent('mousedown', function (event) {
                //                    event.stopPropagation();
                //                });
                //                this.Obj.addEvent('mouseup', function (event) {
                //                    event.stopPropagation();
                //                });
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
                        //init: function () {
                        //    var _ID_Str = this.options.id + "_tbl";
                        //    var imgPath = this.options.source + "images/window/"; //图片目录
                        //    var content = this.options.content;
                        //    var _table = "<div style=\"z-index:1;position:absolute; bottom:63px; background:#ffffff; border:1px solid #ababab;\">";
                        //    _table += "<img src=\"" + imgPath + "IMCloseButton_Normal.bmp\"   onclick='$(\"" + this.options.id + "\").fade(\"out\")'  style=\"float:right; margin:4px;cursor:pointer;\"/><div style=\"width:200px;height:30px; float:right; \"></div>";
                        //    _table +=   content  ;
                        //    _table += "<div style=\"position:absolute; bottom:-70px; BACKGROUND: url(" + imgPath + "w.png) no-repeat -5px -715px; width:92px;height:70px;margin-top:-64px;margin-left:38px;\"></div>";
                        //    _table += "</div>";
                        //    _table += "<img src=\"" + imgPath + "w_bk.png\" style=\"position:absolute;width:690px;height:786px; top:-760px; left:-20px;\" />";
                        //    return _table;
                        //}
            //init: function () {
            //    var _ID_Str = this.options.id + "_tbl";
            //    var imgPath = this.options.source + "images/window/"; //图片目录
            //    var content = this.options.content;
               
            //    var html = "<div style=\"width:260px;height:70px; background:url(" + imgPath + "w_bk.png) no-repeat bottom left; border:1px solid blue;float:left;\">";
            //    html += "<div style=\"margin-top:-444px;width:400px;height:2000px; float:left; background:url(" + imgPath + "w_bk.png) no-repeat  -760px 140px; margin-left:260px; border:1px solid green;\"></div>";
            //    html += "</div>";

            //    return html;
            //}
            init:function(){
                    var _ID_Str = this.options.id + "_tbl";
                    var imgPath = this.options.source + "images/window/"; //图片目录
                    var content = this.options.content;
                    var _table = "<div style=\"z-index:1;position:absolute; bottom:63px; min-width:200px; background:#ffffff; border:1px solid #ababab;\">";
                    _table += "<img src=\"" + imgPath + "IMCloseButton_Normal.bmp\"   onclick='$(\"" + this.options.id + "\").fade(\"out\")'  style=\"position:absolute;top:2px; cursor:pointer; right:2px;\"/>";
                    _table += content;
                    _table += this.shadowHtml();
                    _table += "<div style=\"width:200px;height:1px; \"></div><div style=\"position:absolute; bottom:-70px; BACKGROUND: url(" + imgPath + "w.png) no-repeat -5px -715px; width:92px;height:70px;margin-top:-64px;margin-left:38px;\"></div>";
                   
                    _table += "</div>";
                  
                    return _table;
            }
            , shadowHtml: function () {
                var imgPath = this.options.source + "images/window/"; //图片目录
                var html = "";
                html = "<div style=\"position:absolute; bottom:-70px; width:60px;height:70px; BACKGROUND: url(" + imgPath + "w_bk.png) no-repeat -10px -300px; border:1px solid red; \"></div>"
                html += "<div style=\"position:absolute; left:60px; bottom:-70px; width:100px;height:70px; BACKGROUND: url(" + imgPath + "w_bk.png) no-repeat  -160px -300px; border:1px solid red; \"></div>"
                return html;
            }


        })
    })

});