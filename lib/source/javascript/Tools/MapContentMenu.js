(function(){
MapGIS.extend({
    MapContentMenu: new Class({
        Implements: [Events, Options],
        options: {
            left: 0,
            top: 0,
            width: 300,
            height: 80,
            zIndex: 10,
            showline: true,
            contentMenuList: [],
            baseMenuList: [{ title: "放大", fn: function () { this.map.setActiveTool('+'); } .bind(this) }, { title: "缩小", fn: function () { this.map.setActiveTool('-'); } .bind(this) }, { title: "拖曳", fn: function () { this.map.setActiveTool('$'); } .bind(this) }, { title: "还原", fn: function () { this.map.reposition(); } .bind(this) }]
        },
        div: null,
        map: null,
        objList: null,
        latLng:null,
        initialize: function (map, options) {
            this.setOptions(options);
            this.map = map;
            this.div = new Element("div", { styles: { width: "150px", height: "98px", display: "none", left: 0, top: 0, position: "absolute", margin: "0px", padding: "0px", zIndex: 9999, visibility: "visible"} });
            this.div.addEvent('mousedown', function (event) {
                event.stopPropagation();
            });
            this.div.addEvent('mouseup', function (event) {
                event.stopPropagation();
            });
            this.div.addEvent("click", this.hide.bindWithEvent(this));
            this.draw();
        },
        setData: function (data, clearbasemenu) {
            this.options.contentMenuList = data;
            if (clearbasemenu) {
                this.options.baseMenuList = null;
                this.options.baseMenuList = [];
            }
            this.draw();
        },
        draw: function () {
            this.clear();
            if ((this.options.contentMenuList == null || this.options.contentMenuList.length == 0) && (this.options.baseMenuList == null || this.options.baseMenuList.length == 0)) {
                return;
            }
            var rootULStyles = { "listStyle": "none", "margin": "0px", "marginTop": "4px", "marginLeft": "0px", "border": "1px solid  #999999", "background": "white", "padding": "0px", "fontSize": "13px" };
            var fristULStyles = { "listStyle": "none", "marginTop": "4px", "marginLeft": "0px", "padding": "0px", "textAlign": "center" };
            var comULStyles = { "listStyle": "none", "marginTop": "1px", "marginLeft": "0px", "padding": "0px", "textAlign": "center" };
            var lineLIStyles = { "listStyle": "none", "marginTop": "0px", "marginLeft": "0px", "padding": "0px", "textAlign": "center", "borderCollapse": "collapse", "lineHeight": "1px", "height": "1px" };
            var comLIStyles = { "listStyle": "none", "margin": "2px", "lineHeight": "20px", "padding": "0px", "cursor": "pointer" };
            var ul = new Element("ul", { styles: rootULStyles });
            var li = new Element("li");
            ul.appendChild(li);
            var CUl = new Element("ul", { styles: fristULStyles });
            li.appendChild(CUl);
            if (this.objList == null) {
                this.objList = [];
            }
            var menuText = this.options.baseMenuList; // [{ title: "�Ŵ�", fn: function () { this.options.activeTool = '+'; } .bind(this) }, { title: "��С", fn: function () { this.options.activeTool = '-'; } .bind(this) }, { title: "��ק", fn: function () { this.options.activeTool = '$'; } .bind(this) }, { title: "��ԭ", fn: function () { this.resetMap(); } .bind(this)}];
            for (var i = 0, k = menuText.length; i < k; i++) {
                var li_ = new Element("li", { styles: comLIStyles, events: { mouseover: function () { this.style.backgroundColor = '#e8ecf9' }, mouseout: function () { this.style.backgroundColor = 'white' } } });
                li_.set("html", menuText[i].title);
                if (menuText[i].fn != null) {
                    li_.addEvent("click", menuText[i].fn.pass({ latlng: this.latLng }));
                }
                CUl.appendChild(li_);
                this.objList[this.objList.length] = li_;
            }
            var otherMenuList = this.options.contentMenuList;
            if (otherMenuList.length > 0) {

                if (this.options.showline) {
                    var lineLi = new Element("li", { styles: lineLIStyles });
                    lineLi.set("html", "<hr/>");
                    CUl.appendChild(lineLi);
                }

                for (var i = 0, k = otherMenuList.length; i < k; i++) {
                    var li_ = new Element("li", { styles: comLIStyles, events: { mouseover: function () { this.style.backgroundColor = '#e8ecf9' }, mouseout: function () { this.style.backgroundColor = 'white' } } });
                    li_.set("html", otherMenuList[i].title);
                    if (otherMenuList[i].fn != null) {
                        li_.addEvent("click", otherMenuList[i].fn.pass({latlng:this.latLng}));
                    }
                    CUl.appendChild(li_);
                    this.objList[this.objList.length] = li_;
                }
            }
            this.div.appendChild(ul);
        },
        toggle: function (point) {
            this.draw();
            this.div.setStyles({ left: point.x, top: point.y });
            this.show();
        },
        show: function () {
            this.div.setStyle("display", "block");
        },
        hide: function () {
            this.div.setStyle("display", "none");
        },
        clear: function () {
            if (this.objList != null) {
                for (var i = 0, k = this.objList.length; i < k; i++) {
                    this.objList[i].removeEvents("click");
                    this.objList[i].removeEvents("mouseover");
                    this.objList[i].removeEvents("mouseout");
                    this.objList[i].destroy();
                    this.objList[i] = null;
                }
                this.objList = null;
            }
            this.div.empty();
        },
        dispose: function () {
            this.clear();
            this.div.removeEvents("click");
            this.div.removeEvents("mouseup");
            this.div.removeEvents("mousedown");
        }

    })
});
})();