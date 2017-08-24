MapGIS.Tools.extend({
    /**
    * 该类基于mootools-1.2-core.js
    */
    MenuBox: new Class({
        Extends: MapGIS.Tools.Base,
        titleItem: null, /*标题元素*/
        revivebtn: null,
        titleContainer: null,
        itemsContainer: null,
        contentContainer: null,
        contentItemsDiv: null, /*容纳菜单项元素的DIV*/
        contentItems: null, /*菜单项元素*/
        clearItem: null,
        originalTitleItemInfo: null,
        selectedItem: null,
        options: {
            titleSize: [50, 50], /*标题大小*/
            itemSize: [60, 60], /*菜单项大小*/
            top: 20,
            left: 20,
            width: 50,
            height: 50,
            cwidth: 400,
            cheight: 200,
            flashRate: 10,
            img: null,
            cols: -1,
            rows: -1,
            align: "bottom",
            titleItem: { marker: "", title: "", itemid: null },
            bgicon: "",
            showAll: true
        },
        display: false,
        clearTimeObj: null,
        CONTENTSIZE: [1, 1],
        Implements: [Events, Options],
        init: function () {
            this.titleContainer = new Element("div", { "styles": { "left": "0px", "top": "0px", "width": this.options.titleSize[0] - 2, "height": this.options.titleSize[1] - 2, "position": "absolute", "background": "#3182BD", "border": "1px solid #afbac9", "cursor": "pointer", "boxShadow": "1px 1px 3px rgba(0,0,0,0.3)", "borderRadius": "8px" }, "events": { "mouseover": this.titleContainerEvent.bind(this, ["over"]), "mouseout": this.titleContainerEvent.bind(this, ["out"])} });
            this.titleContainer.inject(this.div);
            this.titleItemContainer = new Element("div", { "class": this.options.titleItem.marker, "styles": { "zIndex": 1, "width": this.options.titleSize[0] - 8, "height": this.options.titleSize[1] - 8, "overflow": "hidden", "margin": "4px"} });
            this.titleItemContainer.inject(this.titleContainer);

            this.revivebtn = new Element("div", { "html": "-", "title": "清除", "styles": { "background": "url('" + this.options.source + "/images/tool/remove.png')", "lineHeight": "12px", "textAlign": "center", "verticalAlign": "middle", "width": 20, "height": 20, "left": 2, "top": 2, "position": "absolute", "zIndex": 2, "display": "none" }, "events": { "click": this.revivebtnEvent.bindWithEvent(this)} });
            this.revivebtn.inject(this.titleContainer);
            this.titleContainer.addEvent("click", this.FLASH.bind(this));
            this.contentContainer = new Element("div", { "style": "filter:alpha(opacity=90); ", "styles": { "background": "#3182BD", "filter": "alpha(opacity=90)", "-moz-opacity": "0.9", "opacity": 0.9, "left": 0, "top": 0, "width": 0, "height": 0, "position": "absolute", "overflow": "hidden", "border": "1px solid #d7dce3", "display": "none", "boxShadow": "1px 1px 3px rgba(0,0,0,0.3)"} });
            this.itemsContainer = new Element("div", { "styles": { "width": 0, "height": 0, "left": 2, "top": 2, "position": "absolute", "border": "0px solid #4a545b"} });
            this.itemsContainer.inject(this.contentContainer);
            this.contentContainer.inject(this.div);
            this.resizeItemsContainer();
        },
        revivebtnEvent: function (event) {
            this.revive();
            event.stopPropagation();
            return false;
        },
        titleContainerEvent: function (mousetype) {
            if (mousetype == "over") {
                this.revivebtn.setStyle("display", "block");
            }
            else {
                this.revivebtn.setStyle("display", "none");
            }
        },
        getItems: function () {
        },
        clickEvent: function (data) {
        },
        getSelectedItem: function () {
            return this.selectedItem;
        },
        setTitle: function (data) {
        },
        itemid: 0,
        addItems: function (data) {
            if (data == null) {
                return;
            }
            if (this.contentItems == null) {
                this.contentItems = [];
            }
            for (var i = 0, k = data.length; i < k; i++) {
                var hash = new Hash({
                    'itemid': this.itemid++
                });
                this.contentItems.push(hash.extend(data[i]).getClean());
            }
            // this.contentItems.extend(data);
            this.resizeItemsContainer();
            this.drawItems();
        },
        setData: function (data) {
            if (data == null) {
                return;
            }
            if (this.contentItems == null) {
                this.contentItems = [];
            }
            for (var i = 0, k = data.length; i < k; i++) {
                var hash = new Hash({
                    'itemid': this.itemid++
                });
                this.contentItems.push(hash.extend(data[i]).getClean());
            }


            // this.contentItems = data;
            this.resizeItemsContainer();
            this.drawItems();
        },
        revive: function () {
            var data = this.options.titleItem;
            this.titleItemContainer.className = "";
            this.titleItemContainer.addClass(data.marker);
            this.titleItemContainer.set("title", data.title);
            if (this.selectedItem == null || this.selectedItem.itemid != data.itemid) {
                this.fireEvent("change", data);
                this.fireEvent("revive", this.selectedItem);
            }
            this.selectedItem = data;
        },
        removeItem: function (data) {

        },
        showContent: function () {
        },
        hideContent: function () {
        },
        resizeItemsContainer: function () {
            var ItemPadding = 0;
            if (this.contentItems != null && this.contentItems.length > 0) {

                var len = this.contentItems.length;
                var cols = 1;
                var rows = len;
                if (this.options.cols > 0) {
                    cols = this.options.cols;
                    rows = Math.ceil(len / cols);
                } else if (this.options.rows > 0) {
                    rows = this.options.rows;
                    cols = Math.ceil(len / rows);
                } else {/*假设是正方形布局*/
                    cols = Math.ceil(Math.sqrt(len));
                    rows = Math.ceil(len / cols);

                }
                var margin = 2;
                var border = 0;
                ItemPadding = parseInt(this.itemsContainer.style.left) * 2 + parseInt(this.itemsContainer.style.borderWidth) * 2;
                ItemPadding = isNaN(ItemPadding) ? 0 : ItemPadding;

                var w = this.options.itemSize[0] * cols + (margin + border) * 2 * cols + ItemPadding;
                var h = (this.options.itemSize[1] + 15) * rows + (margin + border) * 2 * rows + ItemPadding;
                this.CONTENTSIZE = [w, h];
            } else {
                this.CONTENTSIZE = [ItemPadding, ItemPadding];
            }

            var left = 0, top = 0;
            var bw = parseInt(this.contentContainer.style.borderWidth) * 2;
            var tbw = parseInt(this.titleContainer.style.borderWidth) * 2;
            bw = isNaN(bw) ? 0 : bw;
            tbw = isNaN(tbw) ? 0 : tbw;
            switch (this.options.align) {
                case "left":
                    left = -this.CONTENTSIZE[0] - bw;
                    this.titleContainer.setStyles({ "borderRadius": "8px", "borderTopLeftRadius": "0px" });
                    this.revivebtn.setStyles({ left: this.options.titleSize[0] - 14, top: this.options.titleSize[1] - 14 });
                    break;
                case "right":
                    left = this.options.titleSize[0];
                    top = this.options.titleSize[1];
                    this.titleContainer.setStyles({ "borderRadius": "8px", "borderTopRightRadius": "0px" });
                    this.revivebtn.setStyles({ left: 2, top: this.options.titleSize[1] - 14 });
                    break;
                case "top":
                    top = -this.CONTENTSIZE[1] - bw;
                    this.titleContainer.setStyles({ "borderRadius": "8px", "borderTopLeftRadius": "0px" });
                    this.revivebtn.setStyles({ left: 2, top: this.options.titleSize[1] - 14 });
                    break;
                case "bottom":
                    left = this.options.titleSize[0] - this.CONTENTSIZE[0] - bw;
                    top = this.options.titleSize[1] + tbw;
                    this.titleContainer.setStyles({ "borderRadius": "8px", "borderBottomRightRadius": "0px" });
                    this.revivebtn.setStyles({ left: 2, top: 2 });
                    break;
                default:
                    left = this.options.titleSize[0] - this.CONTENTSIZE[0] - bw;
                    top = this.options.titleSize[1] + tbw;
                    this.titleContainer.setStyles({ "borderRadius": "8px", "borderBottomRightRadius": "0px" });
                    this.revivebtn.setStyles({ left: 2, top: 2 });

                    break;
            }
            this.itemsContainer.setStyles({ width: this.CONTENTSIZE[0] - ItemPadding, height: this.CONTENTSIZE[1] - ItemPadding });
            this.contentContainer.setStyles({ width: this.CONTENTSIZE[0], height: this.CONTENTSIZE[1], left: left, top: top });
        },
        drawItems: function () {
            this.clearItems();
            var w = this.options.itemSize[0];
            var h = this.options.itemSize[1];
            if (this.contentContainer != null && this.contentItems != null && this.contentItems.length > 0) {
                var k = this.contentItems.length;
                var bg = this.options.bgicon;
                for (var i = 0; i < k; i++) {
                    var itemdiv = new Element("div", { "class": "menuitem",
                        "styles": { "width": w, "height": h + 15, "margin": "2px", "float": "left", "cursor": "pointer", "border": "0px solid #3182BD", "backgroundRepeat": "no-repeat", "overflow": "hidden" },
                        "events": { "mouseover": function () {
                            this.style.backgroundImage = "url(" + bg + ")"; this.style.border = "0px solid #e3e5e9";
                            this.getLast().style.color = "";
                        },
                            "mouseout": function () {
                                this.style.backgroundImage = ""; this.style.border = "0px solid #3182BD";
                                this.getLast().style.color = "#ffffff";
                            },
                            "click": this.displaceItem.bind(this, [this.contentItems[i]])
                        }
                    });
                    var item = new Element("div", { "title": this.contentItems[i].title, "styles": { "width": w, "height": h, "borderRadius": "4px", "backgroundColor": "" }, "events": this.contentItems[i].events, "class": this.contentItems[i].marker });
                    item.inject(itemdiv);
                    if (this.contentItems[i].html) {
                        item.set("html", this.contentItems[i].html);
                    }
                    var text = new Element("div", { "class": "menuitemtitle", "styles": { "width": w, "heigth": 14, "overflow": "hidden", "fontSize": "12px", "color": "white", "textAlign": "center", "marginTop": "1px"} });
                    text.set("html", this.contentItems[i].title);
                    text.inject(itemdiv);
                    itemdiv.inject(this.itemsContainer);
                }
            }
        },
        displaceItem: function (data) {
            this.titleItemContainer.className = "";
            this.titleItemContainer.addClass(data.marker);
            this.titleItemContainer.set("title", data.title);
            this.FLASH();
            if (this.selectedItem == null || this.selectedItem.itemid != data.itemid) {
                this.fireEvent("change", data);
            }
            this.selectedItem = data;
            this.fireEvent("selected", data);
        },
        clearItems: function () {
            if (this.itemsContainer != null) {
                var items = this.itemsContainer.getElements("div.menuitem");
                items.each(function (item, index) {
                    item.removeEvents("mouseover");
                    item.removeEvents("mouseout");
                    item.removeEvents("click");
                });
                this.itemsContainer.empty();
            }
        },
        FLASHWH: [0, 0],
        FLASHR: 5,
        FLASH: function () {
            if (this.contentContainer) {
                if (this.display) {
                    this.display = false;
                    this.FLASHWH = this.CONTENTSIZE;
                    if (this.clearTimeObj != null) {
                        window.clearInterval(this.clearTimeObj);
                        this.clearTimeObj = null;
                    }
                    var bw = parseInt(this.contentContainer.style.borderWidth) * 2;
                    var tbw = parseInt(this.titleContainer.style.borderWidth) * 2;
                    bw = isNaN(bw) ? 0 : bw;
                    tbw = isNaN(tbw) ? 0 : tbw;
                    this.clearTimeObj = window.setInterval(function () {
                        if (this.FLASHWH[0] > 0 || this.FLASHWH[1] > 0) {
                            var w = this.FLASHWH[0] - this.FLASHR;
                            var h = this.FLASHWH[1] - (this.FLASHWH[1] / this.FLASHWH[0]) * this.FLASHR;
                            w = w < 0 ? 0 : w;
                            h = h < 0 ? 0 : h;
                            var l = 0, t = 0;
                            switch (this.options.align) {
                                case "top":
                                    t = -h - bw;
                                    break;
                                case "left":
                                    l = -w - bw;
                                    break;
                                case "right":
                                    l = this.options.titleSize[0] + tbw;
                                    //  t = this.options.titleSize[1] + tbw;
                                    break;
                                case "bottom":
                                    l = this.options.titleSize[0] - w - bw;
                                    t = this.options.titleSize[1] + tbw;
                                    break;
                                default:
                                    l = this.options.titleSize[0] - w - bw;
                                    t = this.options.titleSize[1] + tbw;
                                    break;
                            }
                            this.FLASHWH = [w, h];
                            if (w == 0 && h == 0) {
                                this.contentContainer.setStyle("display", "none");
                            }
                            this.contentContainer.setStyles({ left: l, top: t, width: w, height: h });
                        } else {
                            window.clearInterval(this.clearTimeObj);
                            this.clearTimeObj = null;
                        }
                    } .bind(this), this.options.flashRate);
                } else {
                    this.display = true;
                    this.FLASHWH = [0, 0];
                    if (this.clearTimeObj != null) {
                        window.clearInterval(this.clearTimeObj);
                        this.clearTimeObj = null;
                    }
                    this.contentContainer.setStyle("display", "");
                    var bw = parseInt(this.contentContainer.style.borderWidth) * 2;
                    var tbw = parseInt(this.titleContainer.style.borderWidth) * 2;
                    bw = isNaN(bw) ? 0 : bw;
                    tbw = isNaN(tbw) ? 0 : tbw;
                    this.clearTimeObj = window.setInterval(function () {
                        var W = this.CONTENTSIZE[0];
                        var H = this.CONTENTSIZE[1];
                        if (this.FLASHWH[0] < W || this.FLASHWH[1] < H) {
                            var w = this.FLASHWH[0] + this.FLASHR;
                            var h = this.FLASHWH[1] + (H / W) * this.FLASHR;
                            w = w > W ? W : w;
                            h = h > H ? H : h;
                            var l = 0, t = 0;
                            switch (this.options.align) {
                                case "top":
                                    t = -h - bw;
                                    break;
                                case "left":
                                    l = -w - bw;
                                    break;
                                case "right":
                                    l = this.options.titleSize[0] + tbw;
                                    // t = this.options.titleSize[1] + tbw;
                                    break;
                                case "bottom":
                                    l = this.options.titleSize[0] - w - bw;
                                    t = this.options.titleSize[1] + tbw;
                                    break;
                                default:
                                    l = this.options.titleSize[0] - w - bw;
                                    t = this.options.titleSize[1] + tbw;
                                    break;
                            }
                            this.FLASHWH = [w, h];
                            this.contentContainer.setStyles({ left: l, top: t, width: w, height: h });
                        } else {
                            window.clearInterval(this.clearTimeObj);
                            this.clearTimeObj = null;
                        }
                    } .bind(this), this.options.flashRate);
                }
            }
        }


    })
});