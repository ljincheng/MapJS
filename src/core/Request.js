(function() {

    function addParamToUrl(url, param) {
      return url + (/\?/.test(url) ? '&' : '?') + param;
    }
  
    function emptyFn() { }
  
    /**
     * Cross-browser abstraction for sending XMLHttpRequest
     * @memberOf fabric.util
     * @param {String} url URL to send XMLHttpRequest to
     * @param {Object} [options] Options object
     * @param {String} [options.method="GET"]
     * @param {String} [options.parameters] parameters to append to url in GET or in body
     * @param {String} [options.body] body to send with POST or PUT request
     * @param {Function} options.onComplete Callback to invoke when request is completed
     * @return {XMLHttpRequest} request
     */
    function request(url, options) {
      options || (options = { });
  
      var method = options.method ? options.method.toUpperCase() : 'GET',
          onComplete = options.onComplete || function() { },
          xhr = new geomap.window.XMLHttpRequest(),
          body = options.body || options.parameters
          headers=options.header||{};
  
      /** @ignore */
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          onComplete(xhr);
          xhr.onreadystatechange = emptyFn;
        }
      };
  
      if (method === 'GET') {
        body = null;
        if (typeof options.parameters === 'string') {
          url = addParamToUrl(url, options.parameters);
        }
      }
  
      if(method === 'JSON'){
        xhr.open('POST', url, true);
      }else{
        xhr.open(method, url, true);
      }
  
      for(var key in headers){
        xhr.setRequestHeader(key,headers[key]);
      }
      
      if(method === 'JSON'){
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      }else if (method === 'POST' || method === 'PUT') {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      }

      
  
      if(body!= undefined && method=== 'JSON' && body !=null ){
        xhr.send(JSON.stringify(body));
      }else{
        xhr.send(body);
      }
     
      return xhr;
    }
  
    geomap.request = request;
  })();