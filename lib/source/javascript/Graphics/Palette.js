(function(){
MapGIS.extend({
    Palette: new Class({
        Implements: [Events, Options],
        options: {
            width: 1,
            height: 1,
            resolution: 1,
            extent: { xmin: 0, ymin: 0, xmax: 0, ymax: 0 }
        },
        container: null,
        paintContainer: null,
        root: null,
        paintRoot: null,
        storeRoot: null,
        geometry: null,
        editGeometry: null,
        canPaint: false,
        canEditNode: false,
        showLeadNode: true,
        eventNode: null,
        paintStatus: 0,
        paintType: 0,
        winTimeout: null,
        keydownfn: null,
        paintevent: {
            movepoint: [0, 0],
            pointlist: [],
            clear: function () {
                this.pointlist = null;
                this.pointlist = [];
                this.movepoint = [0, 0]
            },
            clickpoint: function (point) {
                this.pointlist.push(point);
            },
            paint: { id: null, node: null, leadnode: null, leadnode2: null }

        },
        setResolution: function (res, extent) {
            this.options.extent = extent;
            this.options.resolution = res;
            this.geometry.setResolution(res, extent);
        },
        resetResolution: function (res, extent) {
            this.setResolution(res, extent);
            if (this.editGeometry != null) {
                this.editGeometry.resetResolution(res, extent);
            }
            var children = this.storeRoot.children;
            if (children && children.length > 0) {
                for (var i = 0, k = children.length; i < k; i++) {
                    children[i].resetResolution(res, extent);
                }
            }
        },
        initialize: function (container, options) {
            this.setOptions(options);
            var wh = { width: this.options.width, height: this.options.height, extent: this.options.extent, resolution: this.options.resolution };
            this.geometry = new MapGIS.Geometry(container, wh);
            this.container = this.geometry.container;
            this.root = this.geometry.root;
            this.initStoreRoot();
            this.initPaintRoot();
            if (!this.eventNode) {
                this.eventNode = this.container;
            }
            this.keydownfn = this.keydownFun.bind(this);
            document.addEvent("keydown", this.keydownfn);
        },
        keydownFun: function (event) {
            event = event || window.event;
            event = new Event(event);

            if (this.canPaint) {

                if (event.key == "delete" && this.paintStatus == 1) {

                    if (this.paintevent.pointlist.length > 0) {
                        if (this.paintevent.pointlist.length == 1) {
                            this.paintevent.pointlist.splice(0, 1);
                            this.paintevent.clear();
                            if (this.paintevent.paint.leadnode) {
                                this.paintevent.paint.leadnode.eject();
                                this.paintevent.paint.leadnode = null;
                            }
                            if (this.paintevent.paint.node) {
                                this.paintevent.paint.node.eject();
                                this.paintevent.paint.node = null;
                                this.paintevent.paint.id = -1;
                            }

                            this.paintStatus = 0;

                        } else {
                            this.paintevent.pointlist.splice(this.paintevent.pointlist.length - 1, 1);
                            this.paintDraw();
                        }
                    }
                }
            }
        },
        initPaintRoot: function () {
            this.paintRoot = this.geometry.groupFactory();
            this.paintRoot.inject(this.root);
        },
        initStoreRoot: function () {
            if (this.storeRoot != null) {
                this.storeRoot.eject();
            }
            this.storeRoot = this.geometry.groupFactory();
            this.storeRoot.inject(this.root);
        },
        paintLine: function (isClose) {
            this.paintType = 0;
            if (isClose) {
                this.paintType = 1;
            }
        },
        paintCircle: function (isFill) {
            this.paintType = 2;
            if (isFill) {
                this.paintType = 3;
            }
        },
        paintPolygon: function () {
            this.paintType = 4;
        },
        paintRectangle: function () {
            this.paintType = 5;
        },
        storeNode: function (node) {
            if (node != null) {
                node.inject(this.storeRoot);
                this.fireEvent("change", { options: this.options, data: this.getData() });
            }
        },
        clickEditNode: function (obj, node) {
            if (obj.editGeometry == null) {
                var coord = $(obj.container.id).getCoordinates();
                obj.editGeometry = new MapGIS.EditGeometry(obj.paintRoot, { width: obj.options.width, height: obj.options.height, offsetLeft: coord.left, offsetTop: coord.top, resolution: obj.options.resolution, extent: obj.options.extent });
                obj.editGeometry.addEvent("change", function () { this.fireEvent("change", { options: this.options, data: this.getData() }); }.bind(obj));
            }
            obj.editGeometry.editNode(node);
            obj.editGeometry.start();
        },
        getData: function () {
            var data = [];
            var children = this.storeRoot.children;
            if (children && children.length > 0) {
                for (var i = 0, k = children.length; i < k; i++) {
                    var gtype = "POLYGON";

                    switch (children[i]._geotype) {
                        case "polygon":
                            gtype = "POLYGON";
                            break;
                        case "circle":
                            gtype = "CIRCLE";
                            break;
                        case "linestring":
                            gtype = "LINE";
                            break;
                        case "linearring":
                            gtype = "LINEARRING";
                            break;
                        case "rectangle":
                            gtype = "RECTANGLE";
                            break;
                        default:
                            gtype = "UNKNOWN";
                            break;

                    }
                    var gstyle = { stroke: { color: children[i]._style.stroke.color, width: children[i]._style.stroke.width, cap: children[i]._style.stroke.cap, join: children[i]._style.stroke.join }, fillColor: children[i]._style.fillColor };
                    data.push({ gtype: gtype, data: children[i].data, gstyle: gstyle });
                }
            }
            return data;
        },
        loadData: function (data) {
            if (data != null) {
                for (var i = 0, k = data.length; i < k; i++) {
                    var gtype = data[i].gtype;
                    var gdata = data[i].data;
                    var gstyle = data[i].gstyle;
                    var goptions = null;
                    var node = null;
                    switch (gtype) {
                        case "POLYGON":
                            node = this.geometry.nodeFactory("shape");
                            this.geometry.drawPolygon(node, [[0, 0]], gstyle);
                            break;
                        case "CIRCLE":
                            node = this.geometry.nodeFactory("circle");
                            this.geometry.drawCircle(node, { x: 0, y: 0, r: 0 }, gstyle, true);
                            break;
                        case "LINE":
                            node = this.geometry.nodeFactory("shape");
                            this.geometry.drawLineString(node, [[0, 0]], false, gstyle);
                            break;
                        case "LINEARRING":
                            node = this.geometry.nodeFactory("shape");
                            this.geometry.drawLineString(node, [[0, 0]], true, gstyle);
                            break;
                        case "RECTANGLE":
                            node = this.geometry.nodeFactory("shape");
                            this.geometry.drawRectangle(node, [[0, 0], [0, 0]], gstyle);
                            break;
                        default:
                            node = this.geometry.nodeFactory("shape");
                            this.geometry.drawPolygon(node, [[0, 0]], gstyle);
                            break;

                    }
                    node.data = gdata;
                    node.inject(this.storeRoot);

                }
                this.resetResolution(this.options.resolution, this.options.extent);
            }
        },
        drawingGeometry: function (xy) {
            if (!this.showLeadNode) {
                return;
            }
            var leadnode = this.paintevent.paint.leadnode;
            if (leadnode == null) {
                leadnode = this.geometry.nodeFactory("circle");
                this.paintevent.paint.leadnode = leadnode;
                leadnode.inject(this.paintRoot);
            }
            leadnode.show();
            this.geometry.drawCircle(leadnode, { x: xy[0], y: xy[1], r: 7 }, this.paintingSTYLE, true);
        },
        checkNode: function (nodetype, isHide) {
            var painttype = this.paintType;
            var paint = this.paintevent.paint;
            if (paint.id != painttype) {
                paint.id = painttype;
                if (paint.node != null) {
                    paint.node.eject();
                    paint.node = null;
                }
                paint.node = this.geometry.nodeFactory(nodetype);
                paint.node.inject(this.paintRoot);
                paint.leadnode2 = this.geometry.nodeFactory("LINE");
                paint.leadnode2.inject(this.paintRoot);
            }
            if (isHide) {
                paint.node.hide();
                if (paint.leadnode) {
                    paint.leadnode.hide();
                }
                if (paint.leadnode2) {
                    paint.leadnode2.hide();
                }
            } else {
                this.drawingGeometry(this.paintevent.movepoint);
                paint.node.show();
                if (paint.leadnode) {
                    paint.leadnode.show();
                }
                if (paint.leadnode2) {
                    paint.leadnode2.show();
                }
            }
        },
        paintDraw: function () {
            var painttype = this.paintType;
            var paint = this.paintevent.paint;
            switch (painttype) {
                case 0:
                case 1:

                    if (this.paintStatus) {
                        this.checkNode("shape", false);
                        var pointlist = $A(this.paintevent.pointlist);
                        pointlist.push(this.paintevent.movepoint);
                        this.geometry.drawLineString(paint.node, pointlist, painttype, this.paintingSTYLE);
                    } else {
                        this.checkNode("shape", true);
                        var storenode = this.geometry.nodeFactory("shape");
                        this.geometry.drawLineString(storenode, this.paintevent.pointlist, painttype, this.paintedSTYLE);
                        this.storeNode(storenode);
                    }

                    break;
                case 2:
                case 3:

                    var len = this.paintevent.pointlist;
                    if (len < 1) {
                        return;
                    }
                    if (this.paintStatus) {
                        this.checkNode("circle", false);
                        var pointlist = this.paintevent.pointlist;
                        var movepoint = this.paintevent.movepoint;
                        var x = pointlist[0][0];
                        var y = pointlist[0][1];
                        var w = Math.pow(Math.abs(movepoint[0] - x), 2) + Math.pow(Math.abs(movepoint[1] - y), 2);
                        var r = Math.sqrt(w);

                        this.geometry.drawCircle(paint.node, { x: x, y: y, r: r }, this.paintingSTYLE, (painttype == 2 ? 0 : 1));
                        this.geometry.drawLineString(paint.leadnode2, [[x, y], movepoint], (painttype == 2 ? 0 : 1), "LINE");
                    } else {
                        this.checkNode("circle", true);
                        var pointlist = this.paintevent.pointlist;
                        var movepoint = pointlist.getLast();
                        var x = pointlist[0][0];
                        var y = pointlist[0][1];
                        var w = Math.pow(Math.abs(movepoint[0] - x), 2) + Math.pow(Math.abs(movepoint[1] - y), 2);
                        var r = Math.sqrt(w);
                        var storenode = this.geometry.nodeFactory("circle");
                        this.geometry.drawCircle(storenode, { x: x, y: y, r: r }, this.paintedSTYLE, (painttype == 2 ? 0 : 1));
                        this.storeNode(storenode);
                    }
                    break;
                case 4:

                    var len = this.paintevent.pointlist;
                    if (len < 1) {
                        return;
                    }
                    if (this.paintStatus) {
                        this.checkNode("shape", false);
                        var pointlist = $A(this.paintevent.pointlist);
                        pointlist.push(this.paintevent.movepoint);
                        this.geometry.drawPolygon(paint.node, pointlist, this.paintingSTYLE);
                    } else {
                        this.checkNode("shape", true);
                        var storenode = this.geometry.nodeFactory("shape");
                        this.geometry.drawPolygon(storenode, this.paintevent.pointlist, this.paintedSTYLE);
                        this.storeNode(storenode);
                    }
                    break;
                case 5:
                    var len = this.paintevent.pointlist;
                    if (len < 1) {
                        return;
                    }
                    if (this.paintStatus) {
                        this.checkNode("shape", false);
                        var pointlist = [];
                        pointlist.push(this.paintevent.pointlist[0]);
                        pointlist.push(this.paintevent.movepoint);
                        this.geometry.drawRectangle(paint.node, pointlist, this.paintingSTYLE);

                    } else {
                        this.checkNode("shape", true);
                        var pointlist = [];
                        pointlist.push(this.paintevent.pointlist[0]);
                        pointlist.push(this.paintevent.pointlist.getLast());
                        var storenode = this.geometry.nodeFactory("shape");
                        this.geometry.drawRectangle(storenode, pointlist, this.paintedSTYLE);
                        this.storeNode(storenode);
                    }
                    break;
                default:
                    break;
            }
        },
        startPaint: function () {
            this.stopPaint();
            this.canPaint = true;
            this.paintStatus = 0;
            if (this.canEditNode && this.editGeometry) {
                this.editGeometry.start();
            }
            this.eventNode.onmousedown = null;
            this.eventNode.onmousedown = this._paintMouseDown.bindWithEvent(this);
            this.fireEvent("start", { options: this.options, data: this.getData() });

        },
        stopPaint: function () {
            this.canPaint = false;
            this.eventNode.onmousedown = null;
            if (this.canEditNode && this.editGeometry) {
                this.editGeometry.stop();
            }
            var children = this.storeRoot.children;
            if (children && children.length > 0) {
                for (var i = 0, k = children.length; i < k; i++) {
                    children[i].ignore("click", null);
                    children[i].ignore("mousedown", null);
                    children[i].ignore("dblclick", null);
                }
            }
            this.fireEvent("stop", { options: this.options, data: this.getData() });
        },
        repaint: function () {
            var children = this.storeRoot.children;
            if (children && children.length > 0) {
                var node = children[children.length - 1];
                if (node.ignore) {
                    node.ignore("click", null);
                }
                node.eject();
                if (this.editGeometry != null && this.editGeometry.fromNode == node) {
                    this.editGeometry.clear();
                }
                this.fireEvent("change", { options: this.options, data: this.getData() });

            }
        },
        edit: function (tf) {
            this.canEditNode = tf;
            if (this.canEditNode) {
                var children = this.storeRoot.children;
                if (children && children.length > 0) {
                    for (var i = 0, k = children.length; i < k; i++) {
                        children[i].ignore("dblclick", null);
                        children[i].listen("dblclick", this.clickEditNode.pass([this, children[i]]));
                    }
                }
                // this.editGeometry.start();
            } else {
                var children = this.storeRoot.children;
                if (children && children.length > 0) {
                    for (var i = 0, k = children.length; i < k; i++) {
                        children[i].ignore("dblclick", null);
                    }
                }
            }

            // document.ondblclick=null;
        },
        paintingStyle: function (style) {
            if (style != null) {
                this.paintingSTYLE = new Hash(this.paintingSTYLE);
                this.paintingSTYLE.extend(style);
                this.paintingSTYLE = this.paintingSTYLE.getClean();
            }
        },
        paintedStyle: function (style) {
            if (style != null) {
                this.paintedSTYLE = new Hash(this.paintedSTYLE);
                this.paintedSTYLE.extend(style);
                this.paintedSTYLE = this.paintedSTYLE.getClean();
            }
        },
        edittingStyle: function () {
        },
        paintingSTYLE: {
            stroke: { color: "#22a1c5", width: 2 },
            fillColor: [32, 202, 172, 0.4]
        },
        paintedSTYLE: {
            stroke: { color: "#ff9700", width: 2 },
            fillColor: [255, 173, 50, 0.5]
        },
        show: function () {

        },
        hide: function () {

        },
        clear: function () {
            var children = this.storeRoot.children;
            if (children && children.length > 0) {
                var i = ((children && children.length > 0) ? children.length : 0);
                while (children && children.length > 0 && i > 0) {
                    if (children[0].ignore) {
                        children[0].ignore("click", null);
                        children[0].ignore("mousedown", null);
                        children[0].ignore("dblclick", null);

                    }
                    if (children[0].data) {
                        children[0].data = null;
                    }
                    if (children[0]._geotype) {
                        children[0]._geotype = null;
                    }
                    children[0].eject();
                    i--;
                }
                this.fireEvent("change", { options: this.options, data: this.getData() });
            }
            children = null;
            var children = this.paintRoot.children;
            if (children && children.length > 0) {
                var i = ((children && children.length > 0) ? children.length : 0);
                while (children && children.length > 0 && i > 0) {
                    if (children[0].ignore) {
                        children[0].ignore("click", null);
                        children[0].ignore("mousedown", null);
                        children[0].ignore("dblclick", null);
                    }
                    children[0].eject();
                    i--;
                }
            }
            if (this.paintevent.paint.leadnode) {
                this.paintevent.paint.leadnode.eject();
                this.paintevent.paint.leadnode = null;
            }
            if (this.paintevent.paint.node) {
                this.paintevent.paint.node.eject();
                this.paintevent.paint.node = null;
            }
            this.paintevent.paint.id = null;
        },
        destroy: function () {
            if (this.editGeometry) {
                this.editGeometry.removeEvents("change");
            }
            document.removeEvent("keydown", this.keydownfn);
            this.clear();

            this.paintRoot.eject();
            this.storeRoot.eject();
            this.root.eject();
        },
        _mousePoint: function (event) {
            var lt = $(this.container.id).getCoordinates();
            var x = 0, y = 0;

            if (event.client) {
                x = event.client.x - lt.left;
                y = event.client.y - lt.top;
            }
            else {
                x = event.clientX - lt.left;
                y = event.clientY - lt.top;
            }
            return [x, y];
        },
        _paintMouseDown: function (event) {
            event = event || window.event;
            if (!this.canPaint) { return; }
            if (this.paintStatus == 0) {
                this.paintStatus = 1;
                this.paintevent.clear();
                this.eventNode.onmousemove = this._paintMouseMove.bindWithEvent(this);
                this.eventNode.onclick = this._paintClick.bindWithEvent(this);
                this.eventNode.ondblclick = this._paintDblclick.bindWithEvent(this);
            }
            return false;
        },
        _paintMouseMove: function (event) {
            event = event || window.event;
            if (!this.canPaint) { return false; }
            if (this.paintStatus == 1) {
                var xy = this._mousePoint(event);
                this.paintevent.movepoint = xy;
                this.paintDraw();
            }
            return false;
        },
        _paintClick: function (event) {
            event = event || window.event;
            if (!this.canPaint) { return; }
            if (this.paintStatus == 1) {
                var xy = this._mousePoint(event);
                if (this.winTimeout) {
                    window.clearTimeout(this.winTimeout);
                    this.winTimeout = null;
                }
                this.winTimeout = window.setTimeout(function (xy) { this.paintevent.movepoint = xy; this.paintevent.clickpoint(xy); }.bind(this, [xy]), 20);
            }
            return false;
        },
        _paintDblclick: function (event) {
            event = event || window.event;
            if (!this.canPaint) { return false; }
            if (this.paintStatus == 1) {
                this.paintStatus = 0;
                if (this.winTimeout) {
                    window.clearTimeout(this.winTimeout);
                    this.winTimeout = null;
                    if (this.paintevent.pointlist.length < 2) {
                        this.paintevent.clear();
                    } else {
                        this.paintDraw();
                    }

                }
                this.eventNode.onmousemove = this.eventNode.onclick = this.eventNode.ondblclick = null;
            }
            return false;
        }

    })

});
})();