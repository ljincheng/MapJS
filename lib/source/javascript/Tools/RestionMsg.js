  RestionMsg:new Class({
      Implements: [Events, Options],
      options: {
          left: 0,
          top: 0,
          width: 300,
          height: 80,
          source: MapGIS.path.source,
          zIndex: 10
      },
      div: null,
      initialize: function (options) {
          this.setOptions(options);
          var layerDIV = new Element("div", { styles: { zIndex: this.options.zIndex, backgourndColor: "red"} });
          layerDIV.setStyles({ position: "absolute", left: this.options.left, top: this.options.top, width: this.options.width, height: this.options.height });
          this.div = layerDIV;

      },
      setData: function () {

      }

  });
 