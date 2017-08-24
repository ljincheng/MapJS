//������
(function(){
MapGIS.extend({
    Geometry: new Class({
        Implements: [Events, Options],
        options: {
            width: 3000,
            height: 3000,
            resolution: 1,
            extent: { xmin: 0, ymin: 0, xmax: 0, ymax: 0 }
        },
        container: null,
        root: null,
        vectorRoot: null,
        toMap: function (point) {
            var xmin = this.options.extent.xmin;
            var ymax = this.options.extent.ymax;
            var res = this.options.resolution;
            var Lat = point[0] * res + xmin;
            var Lng = ymax - point[1] * res;
            return [Lat, Lng];
        },
        toScreen: function (point) {
            var xmin = this.options.extent.xmin;
            var ymax = this.options.extent.ymax;
            var res = this.options.resolution;
            return [Math.round((point[0] - xmin) / res), Math.round((ymax - point[1]) / res)];
        },
        initialize: function (container, options) {
            this.setOptions(options);
            if (container != null) {
                this.container = MapGIS.getElement(container);
                this.root = new ART(this.options.width, this.options.height);
                this.setStyle(this.root, null, { hasStyle: true });
                this.root.inject(this.container);
            }
        },
        setResolution: function (res, extent) {
            this.options.extent = extent;
            this.options.resolution = res;
        },
        creatGroup: function () {
            var group = this.groupFactory();
            group.inject(this.root);
            return group;
        },
        getGroup: function (index) {
            var children = this.root.children;
            var len = children.length;
            if (len > index) {
                return children[index];
            }
            return null;
        },
        groupFactory: function () {
            var group = new ART.Group();
            this.setStyle(group, null, { hasStyle: true });
            return group;
        },
        nodeFactory: function (nodetype) {
            if (nodetype == null) {
                return new ART.Shape();
            } else {
                switch (nodetype.toLowerCase()) {
                    // case "circle": 
                    //     return new ART.Ellipse(); 
                    //      break; 
                    case "wedge":
                        return new ART.Wedge();
                        break;
                    default:
                        return new ART.Shape();
                        break;
                }
            }
        },
        clear: function () {
            var children = this.root.children;
            var len = children.length;
            if (len > 0) {
                for (var i = 0, k = len; i < k; i++) {
                    if (children[i].data) {
                        children[i].data = null;
                    }
                    if (children[i].resetResolution) {
                        children[i].resetResolution = null;
                    }
                    if (children[i]._geotype) {
                        children[i]._geotype = null;
                    }
                    if (children[i]._style) {
                        children[i]._style = null;
                    }
                    if (children[i]._options) {
                        children[i]._options = null;
                    }
                    this.eject(children[i]);
                }
            }
        },
        eject: function (node) {
            var child;
            var children = node.children;
            if (children && children.length > 0) {
                child = children[0];
                if (children[0].data) {
                    children[0].data = null;
                }
                if (children[0].resetResolution) {
                    children[0].resetResolution = null;
                }
                if (children[0]._geotype) {
                    children[0]._geotype = null;
                }
                if (children[0]._style) {
                    children[0]._style = null;
                }
                if (children[0]._options) {
                    children[0]._options = null;
                }
                this.eject(child);
            }
            if (node) {
                if (node.data) {
                    node.data = null;
                }
                if (node.resetResolution) {
                    node.resetResolution = null;
                }
                if (node._geotype) {
                    node._geotype = null;
                }
                if (node._style) {
                    node._style = null;
                }
                if (node._options) {
                    node._options = null;
                }
                if (node.eject) {
                    node.eject();
                }
                else {
                    var element = node.toElement ? node.toElement() : node.element ? node.element : node;
                    var pnode = element.parentNode;
                    if (pnode) {
                        pnode.removeChild(element);
                    }
                }
                node = null;
            }

        },
        destroy: function () {
            this.eject(this.root);
        },
        addEvents: function (node, events) {
            if (events != null) {
                for (var c in events) {
                    node.listen(c, events[c].bind(node));
                }
            }
        },
        drawLineString: function (node, components, close, style) {
            var data = [];
            var xmin = this.options.extent.xmin;
            var ymax = this.options.extent.ymax;
            var res = this.options.resolution;
            for (var i = 0, k = components.length; i < k; i++) {
                data.push(this.toMap(components[i]));
                //data.push([components[i][0]*res+xmin,ymax-components[i][1]*res]);
            }
            node.data = data;
            if (!node.resetResolution) {
                node.resetResolution = function (res, extent) {
                    var data = this.data;
                    var components = [];
                    var xmin = extent.xmin;
                    var ymax = extent.ymax;
                    for (var i = 0, k = data.length; i < k; i++) {
                        components.push([Math.round((data[i][0] - xmin) / res), Math.round((ymax - data[i][1]) / res)]);
                    }
                    var path = new ART.Path();
                    var len = components.length;
                    if (len > 0) {
                        var x = components[0][0];
                        var y = components[0][1];
                        if (!isNaN(x) && !isNaN(y)) {
                            path.moveTo(x, y);
                        }
                    }
                    for (var i = 1, k = components.length; i < k; i++) {
                        var x = components[i][0];
                        var y = components[i][1];
                        if (!isNaN(x) && !isNaN(y)) {
                            path.lineTo(x, y);
                        }
                    }
                    if (this._geotype == "linearring" || this._geotype == "polygon") {
                        path.close();
                    }
                    this.draw(path);
                } .bind(node);
            }

            if (close) {
                node._geotype = "linearring";
            } else {
                node._geotype = "linestring";
            }
            node.resetResolution(this.options.resolution, this.options.extent);
            this.setStyle(node, style, { hasStroke: true });
            return node;
        },
        drawCircle: function (node, components, style, isfill) {
            var xmin = this.options.extent.xmin;
            var ymax = this.options.extent.ymax;
            var res = this.options.resolution;
            var data = { x: components.x * res + xmin, y: ymax - components.y * res, r: components.r * res };
            node.data = data;
            if (!node.resetResolution) {
                node.resetResolution = function (res, extent) {
                    var data = this.data;
                    var xmin = extent.xmin;
                    var ymax = extent.ymax;
                    var components = { x: Math.round((data.x - xmin) / res), y: Math.round((ymax - data.y) / res), r: Math.round(data.r / res) };
                    var x = components.x;
                    var y = components.y;
                    var r = components.r;

                    if (!isNaN(x) && !isNaN(y) && !isNaN(r)) {
                        // var r2 = r * 2;
                        //  var px = parseInt(x - r);
                        //  var py = parseInt(y - r);
                        var path = new ART.Path();
                        path.moveTo(x - r, y).arc(2 * r, 0, r, r).arc(-2 * r, 0, r, r);
                        // this.translate(px, py);
                        this.draw(path);
                    }
                } .bind(node);
            }
            node.resetResolution(this.options.resolution, this.options.extent);
            node._geotype = "circle";
            this.setStyle(node, style, { hasStroke: true, hasFill: isfill });
            return node;
        },
        drawPolygon: function (node, components, style) {
            this.drawLineString(node, components, true);
            this.setStyle(node, style, { hasStroke: true, hasFill: true });
            node._geotype = "polygon";
            return node;

        },
        drawRectangle: function (node, components, style) {
            var data = [];
            var xmin = this.options.extent.xmin;
            var ymax = this.options.extent.ymax;
            var res = this.options.resolution;
            for (var i = 0, k = components.length; i < k; i++) {
                data.push(this.toMap(components[i]));
            }
            node.data = data;
            if (!node.resetResolution) {
                node.resetResolution = function (res, extent) {
                    var data = this.data;
                    var components = [];
                    var xmin = extent.xmin;
                    var ymax = extent.ymax;
                    for (var i = 0, k = data.length; i < k; i++) {
                        components.push([Math.round((data[i][0] - xmin) / res), Math.round((ymax - data[i][1]) / res)]);
                    }

                    var sx = components[0][0];
                    var sy = components[0][1];
                    var ex = components[1][0];
                    var ey = components[1][1];

                    if (!isNaN(sx) && !isNaN(sy) && !isNaN(ex) && !isNaN(ey)) {
                        var path = new ART.Path();
                        path.moveTo(sx, sy).lineTo(sx, ey).lineTo(ex, ey).lineTo(ex, sy).close();
                        this.draw(path);

                    }
                } .bind(node);
            }
            node._geotype = "rectangle";
            node.resetResolution(this.options.resolution, this.options.extent);
            this.setStyle(node, style, { hasStroke: true, hasFill: true });

            return node;
        },
        setStyle: function (node, style, options) {
            var _style = null;
            style = style || node._style;
            options = options || node._options;
            if (style) {
                _style = new Hash(style);
                _style.combine(this.defaultStyle);
                _style = _style.getClean();
            }
            else {
                _style = this.defaultStyle;
            }
            node._style = _style;

            if (options) {
                if (options.hasStyle) {
                    var element = node.toElement ? node.toElement() : node.element ? node.element : node;
                    var _styles = _style.styles;
                    for (var e in _styles) {
                        element.style[e] = _styles[e];
                    }
                }
                if (options.hasFill) {
                    if ($type(_style.fillColor) == "array") {
                        if ($type(_style.fillColor) == "array") {
                            if (_style.fillColor.length > 1 && $type(_style.fillColor[0]) == "array") {
                                node.fill.run(_style.fillColor, node);
                            } else {
                                node.fill(_style.fillColor, _style.fillColor);
                            }
                        }
                    }
                    else {
                        node.fill(_style.fillColor);
                    }
                }
                if (options.hasStroke) {
                    node.stroke(_style.stroke.color, _style.stroke.width, _style.stroke.cap, _style.stroke.join);
                }
            }
            node._options = options;

            return node;
        },
        defaultStyle: {
            styles: {
                left: "0px",
                top: "0px",
                position: "absolute"
            },
            stroke: { color: "#47bfe1", width: 1, cap: "round", join: "miter" },
            fillColor: [32, 202, 172, 0.4],
            opacity: 0.7
        }
    })

});
})();