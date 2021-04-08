(function() {
    
    function create(tag,options,styles) {
        options || (options = { });
        styles || (styles={});
      var el= geomap.document.createElement(tag);
      setOptions(el,options);
      setStyle(el,styles);
      return el;
    }

    function setStyle(element,options){
        for (var prop in options) {
            element.style[prop]=options[prop];
          }
    }

    function setOptions(element,options){
        for (var prop in options) {
            element[prop]=options[prop];
          }
    }

    function createHiDPICanvas(canvas,w, h, ratio) {

      const PIXEL_RATIO = (function () {
        const c = document.createElement("canvas"),
          ctx = c.getContext("2d"),
          dpr = window.devicePixelRatio || 1,
          bsr = ctx['webkitBackingStorePixelRatio'] ||
            ctx['mozBackingStorePixelRatio'] ||
            ctx['msBackingStorePixelRatio'] ||
            ctx['oBackingStorePixelRatio'] ||
            ctx['backingStorePixelRatio'] || 1;
    
        return dpr / bsr;
      })();
    
      if (!ratio) { ratio = PIXEL_RATIO; }
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
      return canvas;
    }
    
    
   
   
    geomap.util.element = {
      create: create,
      setStyle: setStyle,
      setOptions:setOptions,
      createHiDPICanvas:createHiDPICanvas
    };
   
  })();