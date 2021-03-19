(function() {
    
    function create(tag,options) {
        options || (options = { });
      var el= geomap.document.createElement(tag);
      setOptions(tag,options);
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
   
   
    geomap.util.element = {
      create: create,
      setStyle: setStyle,
      setOptions:setOptions
    };
   
  })();