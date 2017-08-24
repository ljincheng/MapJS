/*
* 地图导航条工具
*
*/
(function(){
MapGIS.extend({
    MapNavigation: new Class({
        Implements: [Events, Options],
        options: {
            isInitStep: false,
            slideObj: null,
            scrollbar: null,
            left: 0,
            top: 0,
            width: 300,
            height: 80,
            levelFormMap: false,
            source: MapGIS.path.source,
            zIndex: 10
        },
        map: null,
        div: null,
        initialize: function (map, options) {
            this.setOptions(options);
            this.map = map;
            var layerDIV = new Element("div", { styles: { zIndex: this.options.zIndex, backgourndColor: "red" } });
            layerDIV.setStyles({ position: "absolute", left: this.options.left, top: this.options.top, width: this.options.width, height: this.options.height });
            this.div = layerDIV;
            layerDIV.addEvent('mousedown', function (event) {
                event.stopPropagation();
            });
            this.map.addEvent("zoom", this.mapZoom.bind(this));
            window.mapnavigationinterval = window.setInterval(function () { if (this.div.getParent() == null) { return; } else { window.clearInterval(window.mapnavigationinterval); this.init(); } }.bind(this), 1000);
        },
        show: function () {
            this.div.setStyle("display", "block");
        },
        hide: function () {
            this.div.setStyle("display", "none");
        },
        init: function () {
            var levelMin = this.map.options.levelMin;
            var levelNum = this.map.options.levelMax - levelMin;
            var level = this.map.getLevel() - levelMin;
            var R = this.map.width / 8;
            var h = (levelNum) * 10;
            var source = this.options.source;
            this.div.setStyle("width", "60px");
            if (!Browser.Engine.trident)
                this.div.setStyle("-webkit-user-select", "none");

            var navBox = new Element("div", { unselectable: 'on', styles: { width: "60px", height: (h + 120) + "px", position: "absolute", left: "20px", top: "40px" } });

            var bgIMG = new Element("img", { name: "PngImgs", src: source + "images/tool/mapcontrols.png", styles: { left: "0px", top: "0px", position: "absolute", width: "59px", height: "492px" } });
            var navDirection = new Element("div", { styles: { width: "60px", height: "60px", position: "absolute", left: "0px", top: "0px", overflow: "hidden" } });
            var navDir_top = new Element("div", { title: "向上平移", styles: { width: "20px", height: "20px", cursor: "pointer", position: "absolute", left: "20px", top: "0px" } });
            var navDir_left = new Element("div", { title: "向左平移", styles: { width: "20px", height: "20px", cursor: "pointer", position: "absolute", left: "0px", top: "20px" } });
            var navDir_center = new Element("div", { title: "还原初始状态", styles: { width: "20px", height: "20px", cursor: "pointer", position: "absolute", left: "20px", top: "20px" } });
            var navDir_right = new Element("div", { title: "向右平移", styles: { width: "20px", height: "20px", cursor: "pointer", position: "absolute", left: "40px", top: "20px" } });
            var navDir_bottom = new Element("div", { title: "向下平移", styles: { width: "20px", height: "20px", cursor: "pointer", position: "absolute", left: "20px", top: "40px" } });

            if (Browser.Engine.trident) {
                navDir_top.setStyles({ backgroundColor: "white", filter: "alpha(opacity=0.1)", opacity: 0.1 });
                navDir_left.setStyles({ backgroundColor: "white", filter: "alpha(opacity=0.1)", opacity: 0.1 });
                navDir_center.setStyles({ backgroundColor: "white", filter: "alpha(opacity=0.1)", opacity: 0.1 });
                navDir_right.setStyles({ backgroundColor: "white", filter: "alpha(opacity=0.1)", opacity: 0.1 });
                navDir_bottom.setStyles({ backgroundColor: "white", filter: "alpha(opacity=0.1)", opacity: 0.1 });
            }

            var navSeries = new Element("div", { styles: { width: "20px", height: (h + 44) + "px", position: "absolute", left: "20px", top: "60px", overflow: "hidden" } });
            var navMax = new Element("div", { title: "放大[" + levelNum + "]", styles: { width: "20px", height: "22px", position: "absolute", left: "0px", top: "0px", overflow: "hidden" } });
            var navMin = new Element("div", { title: "缩小", styles: { width: "20px", height: "22px", position: "absolute", left: "0px", top: (h + 21) + "px", overflow: "hidden" } });
            var sliderBox = new Element("div", { styles: { width: "20px", height: (h) + "px", position: "absolute", left: "0px", top: "22px", overflow: "hidden" } });
            //sliderBox.setStyle("height", h + "px");
            var sliderObj2 = new Element("div", { title: "拖动缩放", styles: { width: "20px", height: "10px", overflow: "hidden" } });
            this.options.scrollbar = sliderObj2;
            var navMax_Img = bgIMG.clone();
            navMax_Img.setStyles({ left: "-19px", top: "-65px" });
            navMax.appendChild(navMax_Img);
            var navMin_Img = bgIMG.clone();
            navMin_Img.setStyles({ left: "-19px", top: "-360px" });
            navMin.appendChild(navMin_Img);

            var sliderBox_Img = bgIMG.clone();
            sliderBox_Img.setStyles({ left: "-19px", top: "-87px" });
            sliderBox.appendChild(sliderBox_Img);

            var sliderObj2_Img = bgIMG.clone();
            sliderObj2_Img.setStyles({ left: "0px", top: "-384px" });
            sliderObj2.appendChild(sliderObj2_Img);


            navSeries.appendChild(navMax);
            navSeries.appendChild(navMin);
            navSeries.appendChild(sliderBox);
            navDirection.appendChild(bgIMG);
            navDirection.appendChild(navDir_top);
            navDirection.appendChild(navDir_left);
            navDirection.appendChild(navDir_right);
            navDirection.appendChild(navDir_bottom);
            navDirection.appendChild(navDir_center);
            sliderBox.appendChild(sliderObj2);
            navBox.appendChild(navDirection);
            navBox.appendChild(navSeries);
            this.div.appendChild(navBox);
            MapGIS.correctPNG();

            navBox.addEvent("contextmenu", function () { return false; });
            navMax.addEvent("click", this.setNavSeries.bindWithEvent(this, true));
            navMin.addEvent("click", this.setNavSeries.bindWithEvent(this, false));
            navDir_top.addEvent("click", this.setNavDirection.bindWithEvent(this, [0, R]));
            navDir_left.addEvent("click", this.setNavDirection.bindWithEvent(this, [R, 0]));
            navDir_right.addEvent("click", this.setNavDirection.bindWithEvent(this, [-R, 0]));
            navDir_bottom.addEvent("click", this.setNavDirection.bindWithEvent(this, [0, -R]));
            navDir_center.addEvent("click", this.setNavDirection.bindWithEvent(this, [0, 0]));

            this.options.slideObj = new Slider(sliderBox, sliderObj2, {
                steps: levelNum,
                snap: true,
                offset: 0,
                mode: "vertical",
                initialStep: (levelNum - level),
                onComplete: this.navigationChange.bindWithEvent(this)
            });

        },
        noFristLoad:false,
        navigationChange: function (step) {
            var levelNum = this.map.options.levelMax;
            var l = levelNum - step;
            if(this.noFristLoad)
            	{
            		this.map.setLevel(l, !this.options.levelFormMap);
            		
            	}
            this.noFristLoad=true;
            this.options.levelFormMap = false;
            this.options.scrollbar.set("title", "拖动缩放[" + l + "]");
        },
        setNavDirection: function (e, left, top) {
            if (left == 0 && top == 0) {
                this.map.reposition();
            }
            else {
                if (left > 0) {//右边
                    this.map.panMove(256,0);
                } else if (left < 0) {//左边
                    this.map.panMove(-256,0);
                } else if (top > 0) {
                   this.map.panMove(0,256);
                }
                else if (top < 0) {
                    this.map.panMove(0,-256);
                }
            }
        },
        setNavSeries: function (e, step) {
            if (this.options.slideObj == null) {
                return;
            }
            if (step) {
            	this.map.upLevel();
                var newStep =this.map.getLevel();
                if (newStep > this.map.options.levelMax) {
                    return;
                }
                else {
                    this.options.isInitStep = true;
                    var level = (this.map.options.levelMax - newStep);
                    this.options.slideObj.set(level);
                }
            }
            else {
            	this.map.downLevel();
               var newStep =this.map.getLevel();
                if (newStep < 0) {
                    return;
                }
                else {
                    this.options.isInitStep = true;
                    var level = (this.map.options.levelMax - newStep);
                    this.options.slideObj.set(level);

                }
            }
        },
        mapZoom: function (mapArg) {
            //  this.options.isInitStep = false;
            if (this.options.slideObj != null) {
                //  alert(mapArg.level);
                //  alert(this.map.getLevel());
                this.options.scrollbar.set("title", "拖动缩放[" + mapArg.level + "]");
                this.options.levelFormMap = true;
                this.options.slideObj.set(this.map.options.levelMax - mapArg.level);
            }

        }

    })
});
})();