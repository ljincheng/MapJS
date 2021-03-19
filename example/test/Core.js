// MapClass 
function MapClass(options) {
    this.options = options;
    this.getOptions = function () {
        return this.options;
    }
    this.addEvent=function(obj,type,fn){
        if ( obj.attachEvent ) { 
            obj['e'+type+fn] = fn; 
            obj[type+fn] = function(){obj['e'+type+fn]( window.event );} 
            obj.attachEvent( 'on'+type, obj[type+fn] ); 
            } else 
            obj.addEventListener( type, fn, false ); 
    }
    this.removeEvent=function(obj, type, fn ){
        if ( obj.detachEvent ) { 
            obj.detachEvent( 'on'+type, obj[type+fn] ); 
            obj[type+fn] = null; 
            } else 
            obj.removeEventListener( type, fn, false ); 
    }
};