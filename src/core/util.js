
(function(global) {

    var sqrt = Math.sqrt,
        atan2 = Math.atan2,
        pow = Math.pow,
        PiBy180 = Math.PI / 180,
        PiBy2 = Math.PI / 2;

    var templateRe=/\{ *([\w_ -]+) *\}/g;
    
var lastTime = 0;
function getPrefixed(name) {
	return window['webkit' + name] || window['moz' + name] || window['ms' + name];
};

 function bind(fn, obj) {
	var slice = Array.prototype.slice;

	if (fn.bind) {
		return fn.bind.apply(fn, slice.call(arguments, 1));
	};

	var args = slice.call(arguments, 2);

	return function () {
		return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
	};
};

// fallback for IE 7-8
function timeoutDefer(fn) {
	var time = +new Date(),
	    timeToCall = Math.max(0, 16 - (time - lastTime));

	lastTime = time + timeToCall;
	return window.setTimeout(fn, timeToCall);
};

var requestFn = window.requestAnimationFrame || getPrefixed('RequestAnimationFrame') || timeoutDefer;
var cancelFn = window.cancelAnimationFrame || getPrefixed('CancelAnimationFrame') ||
		getPrefixed('CancelRequestAnimationFrame') || function (id) { window.clearTimeout(id); };
 
function requestAnimFrame(fn, context, immediate) {
	if (immediate && requestFn === timeoutDefer) {
		fn.call(context);
	} else {
		return requestFn.call(window, bind(fn, context));
	}
};

// @function cancelAnimFrame(id: Number): undefined
// Cancels a previous `requestAnimFrame`. See also [window.cancelAnimationFrame](https://developer.mozilla.org/docs/Web/API/window/cancelAnimationFrame).
function cancelAnimFrame(id) {
	if (id) {
		cancelFn.call(window, id);
	}
};

function getUrlParam (name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(window.location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

    geomap.util = {
 
      formatNum: function(num,digits){

        var pow=Math.pow(10,(digits === undefined ? 6:digits));
        return Math.round(num * pow) / pow;
      },
      isArray: Array.isArray || function(obj){
        return (Object.prototype.toString.call(obj)=== '[object Array]');
      },
      template:function(str,data){
        return str.replace(templateRe,function(str,key){
          var value=data[key];
          if(value === undefined){
            value="{"+key+"}";
            // throw new Error("变量值不存在"+key+"|"+str);
          }else if(typeof value === 'function'){
            value=value(data);
          }
          return value;
        });
      },
      requestAnimFrame:requestAnimFrame,
      cancelAnimFrame:cancelAnimFrame,
      getUrlParam:getUrlParam
       

    };
  })(typeof exports !== 'undefined' ? exports : this);
  