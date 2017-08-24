(function(){
MapGIS.extend({
    EditGeometry: new Class({
        Implements: [Events, Options],
        options: {
            offsetLeft: 0,
            offsetTop: 0,
            extent: { xmin: 0, ymin: 0, xmax: 0, ymax: 0 },
            resolution: 1
        },
        container: null,
        root: null,
        canEdit: false,
        currentNode: null,
        geometry: null,
        fromNode: null,
        eventNode: null,
        editNodeList: [],
        keydownfn: null,
        initialize: function (container, options, eventNode) {

            this.setOptions(options);
            this.container = container;
            this.root = container;
            this.eventNode = eventNode || document;
            this.geometry = new MapGIS.Geometry(null, { extent: this.options.extent, resolution: this.options.resolution });
            this.keydownfn = this.keydownEvent.bind(this);
            this.eventNode.addEvent("keydown", this.keydownfn);
        },
        keydownEvent: function (event) {
            event = event || window.event;
            event = new Event(event);
            if (this.canEdit) {
                if (event.key == "delete") {
                    if (this.fromNode != null) {
                        if (this.fromNode.eject) {
                            this.fromNode.eject();
                            this.fromNode = null;
                            this.fireEvent("change", { event: event });
                            this.clear();
                        }
                    }
                }
            }
        },
        editNode: function (node) {
            if (node != null) {
                this.fromNode = node;
                this.initDragNode();

            }
        },
        setResolution: function (res, extent) {
            this.options.resolution = res;
            this.options.extent = extent;
            this.geometry.setResolution(res, extent);
        },
        resetResolution: function (res, extent) {
            this.setResolution(res, extent);
            for (var i = 0, k = this.editNodeList.length; i < k; i++) {
                if (this.editNodeList[i] != null) {
                    this.editNodeList[i].resetResolution(res, extent);
                }
            }
        },
        getPointList: function () {
            var pointlist = [];
            if (this.fromNode) {
                pointlist = this.fromNode.data;
            }
            return pointlist;
        },
        initDragNode: function () {
            var pointList = this.getPointList();
            this.clear();
            if (pointList != null) {
                if (this.fromNode._geotype == "circle") {
                    var node = this.creatDragNode([pointList.x, pointList.y], 0);
                    this.editNodeList.push(node);
                    var node1 = this.creatDragNode([pointList.x + pointList.r, pointList.y], 1);
                    this.editNodeList.push(node1);
                }
                else if (this.fromNode._geotype == "rectangle") {
                    var node = this.creatDragNode(pointList[0], 0);
                    this.editNodeList.push(node);
                    var node1 = this.creatDragNode(pointList[1], 1);
                    this.editNodeList.push(node1);
                }
                else {
                    for (var i = 0, k = pointList.length; i < k; i++) {
                        var node = this.creatDragNode(pointList[i], i);
                        this.editNodeList.push(node);
                        var ns = i + 1;
                        if (ns < k) {
                            var x = (pointList[ns][0] + pointList[i][0]) / 2;
                            var y = (pointList[ns][1] + pointList[i][1]) / 2;
                            var node2 = this.creatDragNode([x, y], -ns);
                            this.editNodeList.push(node2);
                        }
                        else if (ns == k && ns > 0) {
                            if (this.fromNode._geotype != "linestring") {
                                var x = (pointList[0][0] + pointList[i][0]) / 2;
                                var y = (pointList[0][1] + pointList[i][1]) / 2;
                                var node3 = this.creatDragNode([x, y], -ns);
                                this.editNodeList.push(node3);
                            }
                        }

                    }
                }
//                var node = new ART.Text("�༭", null, null);
//                node.inject(this.root);
            }
        },
        creatDragNode: function (xy, index) {
            var x = xy[0];
            var y = xy[1];
            var r = 6;
            var xy = this.geometry.toScreen([x, y]);
            if (!isNaN(x) && !isNaN(y)) {
                var node = this.geometry.nodeFactory("circle");
                this.geometry.drawCircle(node, { x: xy[0], y: xy[1], r: r }, { stroke: { color: "#fefefe", width: 1} }, true);
                node.fill("#1a85e8", "#3c70a0");
                node._index = index;
                node.listen("mousedown", this._mouseDown.bindWithEvent(this, node));
                node.listen("dblclick", this._dblclick.bindWithEvent(this, node));
                node.inject(this.root);
                return node;
            }
            return null;
        },
        MoveDragNode: function (xy, node) {
            var point = this.geometry.toMap(xy);
            if (node._index >= 0) {
                if (this.fromNode._geotype == "circle") {
                    if (node._index == 0) {
                        this.fromNode.data.x = point[0];
                        this.fromNode.data.y = point[1];
                        var x = this.editNodeList[1].data.x + point[0] - node.data.x;
                        var y = this.editNodeList[1].data.y + point[1] - node.data.y;
                        this.editNodeList[1].data.x = x;
                        this.editNodeList[1].data.y = y;
                        this.editNodeList[1].resetResolution(this.options.resolution, this.options.extent);
                    }
                    else {
                        this.fromNode.data.r = Math.sqrt(Math.pow((point[0] - this.fromNode.data.x), 2) + Math.pow((point[1] - this.fromNode.data.y), 2));
                    }
                }
                else {
                    this.fromNode.data[node._index] = point;
                    if (this.fromNode._geotype != "rectangle") {
                        var i = node._index;
                        var len = this.getPointList().length;
                        if (i > 0 && i < len - 1) {
                            this.editNodeList[2 * i + 1].data.x = (point[0] + this.getPointList()[i + 1][0]) / 2;
                            this.editNodeList[2 * i + 1].data.y = (point[1] + this.getPointList()[i + 1][1]) / 2;
                            this.editNodeList[2 * i + 1].resetResolution(this.options.resolution, this.options.extent);
                            this.editNodeList[2 * i - 1].data.x = (point[0] + this.getPointList()[i - 1][0]) / 2;
                            this.editNodeList[2 * i - 1].data.y = (point[1] + this.getPointList()[i - 1][1]) / 2;
                            this.editNodeList[2 * i - 1].resetResolution(this.options.resolution, this.options.extent);
                        }
                        else if (i == 0) {
                            this.editNodeList[1].data.x = (point[0] + this.getPointList()[1][0]) / 2;
                            this.editNodeList[1].data.y = (point[1] + this.getPointList()[1][1]) / 2;
                            this.editNodeList[1].resetResolution(this.options.resolution, this.options.extent);
                            if (this.fromNode._geotype != "linestring") {
                                this.editNodeList[2 * len - 1].data.x = (point[0] + this.getPointList()[len - 1][0]) / 2;
                                this.editNodeList[2 * len - 1].data.y = (point[1] + this.getPointList()[len - 1][1]) / 2;
                                this.editNodeList[2 * len - 1].resetResolution(this.options.resolution, this.options.extent);
                            }
                        }
                        else if (i == (len - 1)) {
                            if (this.fromNode._geotype != "linestring") {
                                this.editNodeList[2 * i + 1].data.x = (point[0] + this.getPointList()[0][0]) / 2;
                                this.editNodeList[2 * i + 1].data.y = (point[1] + this.getPointList()[0][1]) / 2;
                                this.editNodeList[2 * i + 1].resetResolution(this.options.resolution, this.options.extent);
                            }
                            this.editNodeList[2 * i - 1].data.x = (point[0] + this.getPointList()[i - 1][0]) / 2;
                            this.editNodeList[2 * i - 1].data.y = (point[1] + this.getPointList()[i - 1][1]) / 2;
                            this.editNodeList[2 * i - 1].resetResolution(this.options.resolution, this.options.extent);
                        }
                    }
                }
            }
            this.fromNode.resetResolution(this.options.resolution, this.options.extent);
            node.data.x = point[0];
            node.data.y = point[1];
            node.resetResolution(this.options.resolution, this.options.extent);
            return node;
        },
        clear: function () {
            for (var i = 0, k = this.editNodeList.length; i < k; i++) {
                if (this.editNodeList[i] != null) {
                    this.editNodeList[i].ignore("mousedown", null);
                    this.editNodeList[i].ignore("dblclick", null);
                    this.editNodeList[i].onmouseup = null;
                    this.editNodeList[i].onmouseup = null;
                    this.editNodeList[i].onmousemove = null;
                    this.editNodeList[i].eject();
                    this.editNodeList[i] = null;
                }
            }
            this.editNodeList = null;
            this.editNodeList = [];
        },
        draw: function (xy) {
            if (this.currentNode != null) {
                this.MoveDragNode(xy, this.currentNode);
            }
        },
        _mousePoint: function (event) {
            var ol = this.options.offsetLeft;
            var ot = this.options.offsetTop;
            var x = 0, y = 0;
            if (event.client) {
                x = event.client.x - ol;
                y = event.client.y - ot;
            }
            else {
                x = event.clientX - ol;
                y = event.clientY - ot;
            }
            return [x, y];
        },
        _mouseMove: function (event) {
            event = event || window.event;
            if (!this.canEdit) { return false; }
            this.draw(this._mousePoint(event));
            return false;
        },
        _mouseDown: function (event, node) {
            this.currentNode = node;
            if (!this.canEdit) { return false; }

            if (node._index < 0) {
                var i = node._index;
                this.fromNode.data.splice(-i, 0, [node.data.x, node.data.y]);
                this.editNode(this.fromNode);
                this.currentNode = this.editNodeList[-i * 2];
            }

            this.eventNode.onmouseup = this.eventNode.onmousemove = null;
            this.eventNode.onmousemove = this._mouseMove.bind(this);
            this.eventNode.onmouseup = this._mouseUp.bind(this);
            return false;
        },
        _mouseUp: function (event) {
            event = event || window.event;
            this.currentNode = null;
            this.eventNode.onmouseup = this.eventNode.onmousemove = null;
            return false;
        },
        _dblclick: function (event) {
            event = event || window.event;
            this.clear();
            this.fireEvent("change", { event: event });
            this.eventNode.onmousedown = this.eventNode.onmouseup = this.eventNode.onmousemove = this.eventNode.ondblclick = null;
        },
        start: function () {
            this.canEdit = true;
        },
        stop: function () {
            this.canEdit = false;
            this.clear();
        },
        destroy: function () {
            this.eventNode.removeEvent("keydown", this.keydownfn);
            this.clear();
            this.eventNode = null;
            this.editNodeList = null;
        }

    })

});
})();