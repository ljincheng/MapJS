(function(global) {

    'use strict';
  
    var extend = geomap.util.object.extend;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Image) {
      geomap.warn('geomap.Image is already defined.');
      return;
    }
   

    geomap.Image = geomap.util.createClass(geomap.CommonMethods,  {
      type: 'image',
      initialize: function(element, options) {
        options || (options = { });
        this._setOptions(options);
        this._element = element;
      },
       
      /**
       * Returns image element which this instance if based on
       * @return {HTMLImageElement} Image element
       */
      getElement: function() {
        return this._element || {};
      },
  
       
  
      /**
       * Returns source of an image
       * @param {Boolean} filtered indicates if the src is needed for svg
       * @return {String} Source of an image
       */
      getSrc: function(filtered) {
        var element = filtered ? this._element : this._originalElement;
        if (element) {
          if (element.toDataURL) {
            return element.toDataURL();
          }
  
          if (this.srcFromAttribute) {
            return element.getAttribute('src');
          }
          else {
            return element.src;
          }
        }
        else {
          return this.src || '';
        }
      },
  
      /**
       * Sets source of an image
       * @param {String} src Source string (URL)
       * @param {Function} [callback] Callback is invoked when image has been loaded (and all filters have been applied)
       * @param {Object} [options] Options object
       * @param {String} [options.crossOrigin] crossOrigin value (one of "", "anonymous", "use-credentials")
       * @see https://developer.mozilla.org/en-US/docs/HTML/CORS_settings_attributes
       * @return {geomap.Image} thisArg
       * @chainable
       */
      setSrc: function(src, callback, options) {
        geomap.util.loadImage(src, function(img, isError) {
          this.setElement(img, options);
          this._setWidthHeight();
          callback && callback(this, isError);
        }, this, options && options.crossOrigin);
        return this;
      }
    });
    
  
    /**
     * Creates an instance of geomap.Image from an URL string
     * @static
     * @param {String} url URL to create an image from
     * @param {Function} [callback] Callback to invoke when image is created (newly created image is passed as a first argument). Second argument is a boolean indicating if an error occurred or not.
     * @param {Object} [imgOptions] Options object
     */
    geomap.Image.fromURL = function(url, callback, imgOptions) {
      geomap.util.loadImage(url, function(img, isError) {
        callback && callback(new geomap.Image(img, imgOptions), isError);
      }, null, imgOptions && imgOptions.crossOrigin);
    }; 


    geomap.Div = geomap.util.createClass(geomap.Image,  {
        type: 'div',
        initialize: function(element, options) {
          options || (options = { });
          this._setOptions(options);
          this._element = element;
        },
    });  
  
  })(typeof exports !== 'undefined' ? exports : this);
  