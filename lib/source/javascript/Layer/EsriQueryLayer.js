
/*
Class: MapGIS.Layers.MapImageLayer
Required :Point.js , Extent.js
*/

MapGIS.Layers.extend({

    EsriQueryLayer: new Class({
        Extends: MapGIS.Layers.TileLayer,
        Implements: [Events, Options],
        options: {
            displayModes: 1,
            graphicsData: [],
            tileOrigin: null,
            startShowLevel: 7,
            startShowGraphic: null,
            initialExtent: null,
            imgurl: null,
            jsonurl: null,
            queryparam: { requesttype: { img: "export?F=image&FORMAT=png", json: "0/query?" }, geometryType: "esriGeometryEnvelope", outFields: "", geometry: "", tolerance: 10, mapExtent: "", imageDisplay: "256,256,96", f: "json" },
            layers: []
        },
        geometry: null,
        graphicsRoot: null,
        initLayer: function () {
            this.parent();
            this.geometry = new MapGIS.Geometry(this.div, { width: this.options.width, height: this.options.height });
            this.graphicsRoot = this.geometry.creatGroup();
            if (this.options.startShowGraphic == null) {
                this.options.startShowGraphic = this.options.startShowLevel;
            }
            if (this.options.url !== null) {
                this.url = this.options.url;
                this.initServer();
            }
            else {
                this.loader = true;
            }
        },
        initServer: function () {
            var myRequest = new Request.JSONP({
                url: this.options.url,
                data: {
                    f: 'json',
                    pretty: 'true',
                    maptype: 'arcgis',
                    format: 'png'
                },
                async: true,
                link: "cancel",
                onComplete: function (data) {
                    var t = data;
                    this.options.fullExtent = t.fullExtent;
                    this.options.initialExtent = t.initialExtent;
                    this.options.queryparam.mapExtent = (t.fullExtent.xmin + "," + t.fullExtent.ymin + "," + t.fullExtent.xmax + "," + t.fullExtent.ymax);
                    this.options.queryparam.geometry = this.options.queryparam.mapExtent;
                    this.options.layers = t.layers;
                    if (t.tileInfo) {

                        this.options.tileOrigin = t.tileInfo.origin;
                        var lods = t.tileInfo.lods;
                        this.options.resolution = [];
                        for (var i = 0, k = lods.length; i < k; i++) {
                            this.options.resolution[this.options.resolution.length] = lods[i].resolution;
                        }
                        this.options.imgformat = t.tileInfo.format;
                        this.options.imgSize = t.tileInfo.rows.toInt();
                        this.resolution = function (level) { var res = this[level]; return { x: res, y: res} } .bind(this.options.resolution).create();
                    } else {
                        if (this.options.tileOrigin == null) {
                            this.options.tileOrigin = { x: this.options.fullExtent.xmin, y: this.options.fullExtent.ymax };
                        }
                        this.options.imgformat = "png";
                        this.resolution = function (level) { var imgnum = Math.pow(2, level); var resx = ((this.fullExtent.xmax - this.fullExtent.xmin) / (this.imgSize * imgnum)); return { x: resx, y: resx} } .bind({ imgSize: this.options.imgSize, fullExtent: this.options.fullExtent }).create();
                    }
                    this.loader = true;
                } .bind(this),
                onFailure: function () {
                    this.isError = true;
                } .bind(this)
            }).send();
        },
        setQueryOptions: function (opts) {

        },
        draw: function (mapOptions) {
            if (this.isBaseLayer === true) {
                mapOptions.resolution = this.resolution.create();
                mapOptions.reset();
            } else {
                this.resolution = mapOptions.resolution;
            }
            if (!this.loader) {
                return;
            }
            this.clear();
            if (this.mapOptions == null) {
                this.mapOptions = new MapGIS.MapOptions();
            }
            this.mapOptions.previousLevel = this.mapOptions.level;
            this.mapOptions = $merge(this.mapOptions, mapOptions);
            switch (this.options.displayModes) {
                case 0:
                    this.drawBySingleTileMode();
                    break;
                case 1:
                    this.drawByMultiTileMode();
                    break;
                case 2:
                    this.drawByGraphicsMode();
                    break;
                case 3:
                    this.drawByMultiTileMode();
                    this.drawByGraphicsMode();
                    break;
                default:
                    this.drawByMultiTileMode();
                    break;
            }
        },
        drawBySingleTileMode: function () {
            var mapOptions = this.mapOptions;
            if (mapOptions.level < this.options.startShowLevel) {
                if (this.mapImageDiv.innerHTML != "" || this.zoomImageDiv.innerHTML != "") {
                    this.zoomImageDiv.empty();
                    this.mapImageDiv.empty();
                }
                return;
            }

            var tileSize = this.mapOptions.viewSize;
            var postParam = this.getPostParam();
            var currentExtent = this.mapOptions.currentExtent;
            var bbox = currentExtent.xmin + "%2C" + currentExtent.ymin + "%2C" + currentExtent.xmax + "%2C" + currentExtent.ymax;
            arg = this.options.queryparam.requesttype.img + "&transparent=true&SIZE=" + tileSize[0] + "%2C" + tileSize[1] + "&BBOX=" + bbox + postParam;
            var url = this.options.url + arg;
            if (this.options.imgurl != null) {
                url = this.options.imgurl + arg;
            }
            var img = new Element("img", { 'src': url, 'styles': { 'position': "absolute", 'left': "0px", 'top': "0px", 'width': tileSize[0], 'height': tileSize[1], 'border': "0px", 'margin': "0px", 'padding': "0px"} });
            this.mapImageDiv.empty();
            this.mapImageDiv.appendChild(img);
        },
        layerLoadTimeOut: null,
        drawByMultiTileMode: function () {
            var mapOptions = this.mapOptions;
            if (mapOptions.level < this.options.startShowLevel) {
                if (this.mapImageDiv.innerHTML != "" || this.zoomImageDiv.innerHTML != "") {
                    this.zoomImageDiv.setStyle('display', 'none');
                    this.mapImageDiv.setStyle('display', 'none');
                    this.emptyLayer(this.zoomImageDiv);
                    this.emptyLayer(this.mapImageDiv);
                }
                return;
            }
            var imgSize = this.options.imgSize;
            var previousLevel = this.mapOptions.previousLevel;
            var centerpoint = mapOptions.center();
            var level = mapOptions.level;
            var viewSize = mapOptions.viewSize;
            this.imgsobj = null;
            var imgs = this.drawImg(centerpoint, level, viewSize, imgSize);
            this.imgsobj = imgs;
            if (previousLevel != mapOptions.level) {
                this.mapImageDivToZoomImageDiv();
            } else {
                this.emptyLayer(this.mapImageDiv);
                this.emptyLayer(this.zoomImageDiv);
                for (var i = 0, k = imgs.length; i < k; i++) {
                    this.mapImageDiv.appendChild(imgs[i]);
                }
            }

            //            var centerpoint = mapOptions.center();
            //            var level = mapOptions.level;
            //            var viewSize = mapOptions.viewSize;
            //            var imgSize = this.options.imgSize;
            //            var previousLevel = mapOptions.previousLevel;
            //            var imgs = this.drawImg(centerpoint, level, viewSize, imgSize);
            //            var times = ((mapOptions != null) ? 800 : 0);
            //            if (previousLevel != mapOptions.level) {

            //                this.emptyLayer(this.zoomImageDiv);
            //                this.mapImageDivToZoomImageDiv();
            //                this.zoomImageDiv.setStyle('display', 'block');
            //                this.mapImageDiv.getElements("img.oldimg").each(function (item, index) { item.destroy() });

            //                this.emptyLayer(this.mapImageDiv);
            //                var r = mapOptions.resolution(previousLevel).x / mapOptions.resolution(mapOptions.level).x;
            //                var point = mapOptions.point;
            //                if (point == null) {
            //                    point = new MapGIS.Point(parseInt(viewSize[0] / 2), parseInt(viewSize[1] / 2));
            //                }
            //                this.zoomImages(point, this.zoomImageDiv, parseInt(imgSize * r));
            //                if (this.layerloadTimeout_ == null) {
            //                    this.layerloadTimeout_ = window.setTimeout(this.layerloadTimeout.bind(this, [imgs]), times); //.delay(times, this, [imgs]);
            //                }

            //            } else {
            //                this.emptyLayer(this.mapImageDiv);
            //                for (var i = 0, k = imgs.length; i < k; i++) {
            //                    this.mapImageDiv.appendChild(imgs[i]);
            //                }
            //            }
            //            this.mapImageDiv.getElements("img").each(function (item, index) {
            //                if (!item.hasClass("oldimg")) {
            //                    item.addClass("oldimg");
            //                }
            //            });
            //            if (this.isIe6) {
            //                MapGIS.correctPNG();
            //            }
        },
        setGraphicsData: function (arg) {
            this.options.graphicsData = arg;
            this.creatGraphics();
        },
        clear: function () {
            this.clearGraphics();
        },
        clearGraphics: function () {
            var children = this.graphicsRoot.children;
            if (children && children.length > 0) {
                var i = ((children && children.length > 0) ? children.length : 0);
                while (children && children.length > 0 && i > 0) {
                    if (children[0].ignore) {
                        children[0].ignore("click", null);
                        children[0].ignore("mouseover", null);
                        children[0].ignore("mouseout", null);
                        children[0].ignore("mouseup", null);
                        children[0].ignore("mousedown", null);
                        children[0].ignore("dblclick", null);
                    }
                    children[0].eject();
                    i--;
                }
            }
        },
        creatGraphics: function () {
            //  this.initPaletteLayer();
            var _data = this.options.graphicsData;
            if (_data != null && _data.length > 0) {
                var grapData = [];
                for (var i = 0, k = _data.length; i < k; i++) {
                    var pointList = _data[i].data;
                    var pointPath = [];
                    for (var i1 = 0, k1 = pointList.length; i1 < k1; i1++) {
                        var point = [pointList[i1][0], pointList[i1][1]];
                        var pObjSize = this.toScreen(point);
                        pointPath.push([parseInt(pObjSize.x), parseInt(pObjSize.y)]);
                    }
                    var node = this.geometry.nodeFactory("shape");
                    this.geometry.drawPolygon(node, pointPath, { stroke: { color: "1e343e" }, fillColor: [200, 161, 156, 0.2] });
                    this.geometry.addEvents(node, _data[i].events);
                    node.inject(this.graphicsRoot);

                    //  grapData.push({ options: _data[i].options, events: _data[i].events, data: pointPath });
                }
            }
        },
        drawByGraphicsMode: function () {

            var mapOptions = this.mapOptions;
            this.options.graphicsData = null;
            this.setGraphicsData([]);
            if (mapOptions.level < this.options.startShowGraphic) {
                return;
            }
            var mapExtents = mapOptions.currentExtent.getBBox();

            var wh = mapOptions.viewSize;
            var url = this.options.url + this.options.queryparam.requesttype.json;
            if (this.options.jsonurl != null) {
                url = this.options.jsonurl + this.options.queryparam.requesttype.json;
            }
            var param = new Hash({ geometryType: "esriGeometryEnvelope", geometry: mapExtents, tolerance: 10, mapExtent: mapExtents, imageDisplay: (wh[0] + "," + wh[1] + ",96"), f: "json" });
            var parStr = param.toQueryString();
            this.JSONPObj = new Request.JSONP({
                url: url,
                data: param.toQueryString(),
                async: true,
                link: "cancel",
                onComplete: function (data) {
                    if (data.features && data.features.length > 0) {
                        var points = data.features;
                        if (points.length > 0) {
                            var polygonList = [];
                            for (var i = 0, k = points.length; i < k; i++) {
                                var rings = points[i].geometry.rings;
                                if (rings.length > 0) {
                                    var gdata = { 'data': rings[0], 'events': { 'mouseover': function () { this.fill([200, 161, 156, 0.7]); }, 'mouseout': function () { this.fill([200, 161, 156, 0.2]); } } };
                                    polygonList.push(gdata);
                                }
                            }
                            this.setGraphicsData(polygonList);
                        }
                    }
                } .bind(this)
            }).send();

        },
        getPostParam: function () {
            return "&LAYERS=" + encodeURIComponent("show:0,4,145");
        },
        getTileNo: function (level, x, y) {
            var res = this.resolution(level);
            var imgSize = this.options.imgSize;
            var origin = this.options.tileOrigin;
            var line = Math.floor((x - origin.x) / res.x / imgSize);
            var row = Math.floor((origin.y - y) / res.y / imgSize);
            var left = (x - origin.x) / res.x - imgSize * line;
            var top = (origin.y - y) / res.y - imgSize * row;
            return { line: line, row: row, left: left, top: top };
        },
        getTileNoBounds: function (tileObj) {
            var res = this.resolution(tileObj.level);
            var imgSize = tileObj.imgSize;
            var origin = this.options.tileOrigin;
            var xmin = origin.x + tileObj.line * res.x * imgSize;
            var ymax = origin.y - tileObj.row * res.y * imgSize;
            var xmax = xmin + imgSize * res.x;
            var ymin = ymax - imgSize * res.y;
            var bbox = (xmin + "," + ymin + "," + xmax + "," + ymax);
            return { xmin: xmin, ymin: ymin, xmax: xmax, ymax: ymax, bbox: bbox };
        },
        getLayer: function (level, point) {
            var tileNo = this.getTileNo(level, point.x, point.y);
            var fullextent = this.options.fullExtent;
            var maxTileNo = this.getTileNo(level, fullextent.xmax, fullextent.ymin);
            var minTileNo = this.getTileNo(level, fullextent.xmin, fullextent.ymax);
            var layer = { line: tileNo.line, row: tileNo.row, startNo: [minTileNo.line, minTileNo.row], endNo: [maxTileNo.line, maxTileNo.row],
                cols: function () { return Math.abs(this.endNo[0] - this.startNo[0]) },
                rows: function () { return Math.abs(this.endNo[1] - this.startNo[1]) },
                left: tileNo.left,
                top: tileNo.top
            };
            return layer;
        },
        filterMatrixImg: function (cell, row, minValue, maxValue, left, top, imgsize, tag, z) {
            if (cell >= minValue[0] && cell <= maxValue[0] && row >= minValue[1] && row <= maxValue[1]) {
                var tileSize = this.options.imgSize;
                var bounds = this.getTileNoBounds({ level: z, line: cell, row: row, imgSize: tileSize });
                var postParam = this.getPostParam();
                var arg = tag + this.options.queryparam.requesttype.img + "&SIZE=" + imgsize + "%2C" + imgsize + "&BBOX=" + encodeURIComponent(bounds.bbox) + postParam + "&x=" + cell + "&y=" + row + "&z=" + z;
                var url = this.options.url + arg;
                if (this.options.imgurl != null) {
                    url = this.options.imgurl + arg;
                }
                var img = null;
                if (this.isIe6) {
                    img = new Element("div");
                    img.innerHTML = "<span unselectable='on' style=\"position:absolute;left:" + left + "px;top:" + top + "px;width:" + imgsize + "px;height:" + imgsize + "px;text-decoration:none;filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + url + "', sizingMethod='scale');\"></span>";
                } else {
                    img = new Element("img", { 'src': url, 'styles': { 'position': "absolute", 'left': left, 'top': top, 'width': imgsize, 'height': imgsize, 'border': "0px", 'margin': "0px", 'padding': "0px"} });
                    img.set('morph', {
                        duration: 'long'
                    });
                }
                if (!this.isIe6) {
                    img.setStyle("opacity", this.opacity);
                }
                return img;
            }
            return null;
        }
        , getVerticalImg: function (cell, row, rows, minValue, maxValue, left, top, imgsize, tag, z, imgElements) {
            for (var t = 1; t <= rows; t++) {
                var toprow = row - t;
                var imgtop = top - imgsize * t;
                var img_top = this.filterMatrixImg(cell, toprow, minValue, maxValue, left, imgtop, imgsize, tag, z);
                if (img_top != null) {
                    imgElements.push(img_top);
                }
                var bottomrow = row + t;
                var imgtop_ = top + imgsize * t;
                var img_bottom = this.filterMatrixImg(cell, bottomrow, minValue, maxValue, left, imgtop_, imgsize, tag, z);
                if (img_bottom != null) {
                    imgElements.push(img_bottom);
                }
            }
        }



    })
});
