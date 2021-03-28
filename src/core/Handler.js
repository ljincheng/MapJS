(function(){

    var Handler = geomap.Class( {
        initialize: function(map, options) {
            options || (options = { }); 
            this._setOptions(options); 
            this._map=map;
          }, 
          enable: function () {
            if (this._enabled) { return this; }
    
            this._enabled = true;
            return this;
        },
        disable: function () {
            if (!this._enabled) { return this; }
    
            this._enabled = false;
            return this;
        },
        enabled: function () {
            return !!this._enabled;
        }
    });

    geomap.Handler=Handler;
})();