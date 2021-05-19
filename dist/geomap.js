/* build: `node build.js modules=ALL minifier=yui` */

var geomap = geomap || { version: '1.0.0' };
if (typeof exports !== 'undefined') {
  exports.geomap = geomap;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document instanceof (typeof HTMLDocument !== 'undefined' ? HTMLDocument : Document)) {
    geomap.document = document;
  }
  else {
    geomap.document = document.implementation.createHTMLDocument('');
  }
  geomap.window = window;
  geomap.log = console.log;
  geomap.warn = console.warn;
  geomap.debug= console.log;
}
else {
  // assume we're running under node.js when document/window are not present
  var jsdom = require('jsdom');
  var virtualWindow = new jsdom.JSDOM(
    decodeURIComponent('%3C!DOCTYPE%20html%3E%3Chtml%3E%3Chead%3E%3C%2Fhead%3E%3Cbody%3E%3C%2Fbody%3E%3C%2Fhtml%3E'),
    {
      features: {
        FetchExternalResources: ['img']
      },
      resources: 'usable'
    }).window;
  geomap.document = virtualWindow.document;
  geomap.jsdomImplForWrapper = require('jsdom/lib/jsdom/living/generated/utils').implForWrapper;
  geomap.nodeCanvas = require('jsdom/lib/jsdom/utils').Canvas;
  geomap.window = virtualWindow;
 
  geomap.log = console.log;
  geomap.warn = console.warn;
  geomap.debug= console.log;
  
  DOMParser = geomap.window.DOMParser;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  window.geomap = geomap;
}


/*:
	----------------------------------------------------
	event.js : 1.1.5 : 2014/02/12 : MIT License
	----------------------------------------------------
	https://github.com/mudcube/Event.js
	----------------------------------------------------
	1  : click, dblclick, dbltap
	1+ : tap, longpress, drag, swipe
	2+ : pinch, rotate
	   : mousewheel, devicemotion, shake
	----------------------------------------------------
	Ideas for the future
	----------------------------------------------------
	* GamePad, and other input abstractions.
	* Event batching - i.e. for every x fingers down a new gesture is created.
	----------------------------------------------------
	http://www.w3.org/TR/2011/WD-touch-events-20110505/
	----------------------------------------------------
*/

if (typeof(eventjs) === "undefined") var eventjs = {};

(function(root) { "use strict";

// Add custom *EventListener commands to HTMLElements (set false to prevent funkiness).
root.modifyEventListener = false;

// Add bulk *EventListener commands on NodeLists from querySelectorAll and others  (set false to prevent funkiness).
root.modifySelectors = false;

root.configure = function(conf) {
	if (isFinite(conf.modifyEventListener)) root.modifyEventListener = conf.modifyEventListener;
	if (isFinite(conf.modifySelectors)) root.modifySelectors = conf.modifySelectors;
	/// Augment event listeners
	if (eventListenersAgumented === false && root.modifyEventListener) {
		augmentEventListeners();
	}
	if (selectorsAugmented === false && root.modifySelectors) {
		augmentSelectors();
	}
};

// Event maintenance.
root.add = function(target, type, listener, configure) {
	return eventManager(target, type, listener, configure, "add");
};

root.remove = function(target, type, listener, configure) {
	return eventManager(target, type, listener, configure, "remove");
};

root.returnFalse = function(event) {
	return false;
};

root.stop = function(event) {
	if (!event) return;
	if (event.stopPropagation) event.stopPropagation();
	event.cancelBubble = true; // <= IE8
	event.cancelBubbleCount = 0;
};

root.prevent = function(event) {
	if (!event) return;
	if (event.preventDefault) {
		event.preventDefault();
	} else if (event.preventManipulation) {
		event.preventManipulation(); // MS
	} else {
		event.returnValue = false; // <= IE8
	}
};

root.cancel = function(event) {
	root.stop(event);
	root.prevent(event);
};

root.blur = function() { // Blurs the focused element. Useful when using eventjs.cancel as canceling will prevent focused elements from being blurred.
	var node = document.activeElement;
	if (!node) return;
	var nodeName = document.activeElement.nodeName;
	if (nodeName === "INPUT" || nodeName === "TEXTAREA" || node.contentEditable === "true") {
		if (node.blur) node.blur();
	}
};

// Check whether event is natively supported (via @kangax)
root.getEventSupport = function (target, type) {
	if (typeof(target) === "string") {
		type = target;
		target = window;
	}
	type = "on" + type;
	if (type in target) return true;
	if (!target.setAttribute) target = document.createElement("div");
	if (target.setAttribute && target.removeAttribute) {
		target.setAttribute(type, "");
		var isSupported = typeof target[type] === "function";
		if (typeof target[type] !== "undefined") target[type] = null;
		target.removeAttribute(type);
		return isSupported;
	}
};

var clone = function (obj) {
	if (!obj || typeof (obj) !== 'object') return obj;
	var temp = new obj.constructor();
	for (var key in obj) {
		if (!obj[key] || typeof (obj[key]) !== 'object') {
			temp[key] = obj[key];
		} else { // clone sub-object
			temp[key] = clone(obj[key]);
		}
	}
	return temp;
};

/// Handle custom *EventListener commands.
var eventManager = function(target, type, listener, configure, trigger, fromOverwrite) {
	configure = configure || {};
	// Check whether target is a configuration variable;
	if (String(target) === "[object Object]") {
		var data = target;
		target = data.target; delete data.target;
		///
		if (data.type && data.listener) {
			type = data.type; delete data.type;
			listener = data.listener; delete data.listener;
			for (var key in data) {
				configure[key] = data[key];
			}
		} else { // specialness
			for (var param in data) {
				var value = data[param];
				if (typeof(value) === "function") continue;
				configure[param] = value;
			}
			///
			var ret = {};
			for (var key in data) {
				var param = key.split(",");
				var o = data[key];
				var conf = {};
				for (var k in configure) { // clone base configuration
					conf[k] = configure[k];
				}
				///
				if (typeof(o) === "function") { // without configuration
					var listener = o;
				} else if (typeof(o.listener) === "function") { // with configuration
					var listener = o.listener;
					for (var k in o) { // merge configure into base configuration
						if (typeof(o[k]) === "function") continue;
						conf[k] = o[k];
					}
				} else { // not a listener
					continue;
				}
				///
				for (var n = 0; n < param.length; n ++) {
					ret[key] = eventjs.add(target, param[n], listener, conf, trigger);
				}
			}
			return ret;
		}
	}
	///
	if (!target || !type || !listener) return;
	// Check for element to load on interval (before onload).
	if (typeof(target) === "string" && type === "ready") {
		if (window.eventjs_stallOnReady) { /// force stall for scripts to load
			type = "load";
			target = window;
		} else { //
			var time = (new Date()).getTime();
			var timeout = configure.timeout;
			var ms = configure.interval || 1000 / 60;
			var interval = window.setInterval(function() {
				if ((new Date()).getTime() - time > timeout) {
					window.clearInterval(interval);
				}
				if (document.querySelector(target)) {
					window.clearInterval(interval);
					setTimeout(listener, 1);
				}
			}, ms);
			return;
		}
	}
	// Get DOM element from Query Selector.
	if (typeof(target) === "string") {
		target = document.querySelectorAll(target);
		if (target.length === 0) return createError("Missing target on listener!", arguments); // No results.
		if (target.length === 1) { // Single target.
			target = target[0];
		}
	}

	/// Handle multiple targets.
	var event;
	var events = {};
	if (target.length > 0 && target !== window) {
		for (var n0 = 0, length0 = target.length; n0 < length0; n0 ++) {
			event = eventManager(target[n0], type, listener, clone(configure), trigger);
			if (event) events[n0] = event;
		}
		return createBatchCommands(events);
	}

	/// Check for multiple events in one string.
	if (typeof(type) === "string") {
		type = type.toLowerCase();
		if (type.indexOf(" ") !== -1) {
			type = type.split(" ");
		} else if (type.indexOf(",") !== -1) {
			type = type.split(",");
		}
	}

	/// Attach or remove multiple events associated with a target.
	if (typeof(type) !== "string") { // Has multiple events.
		if (typeof(type.length) === "number") { // Handle multiple listeners glued together.
			for (var n1 = 0, length1 = type.length; n1 < length1; n1 ++) { // Array [type]
				event = eventManager(target, type[n1], listener, clone(configure), trigger);
				if (event) events[type[n1]] = event;
			}
		} else { // Handle multiple listeners.
			for (var key in type) { // Object {type}
				if (typeof(type[key]) === "function") { // without configuration.
					event = eventManager(target, key, type[key], clone(configure), trigger);
				} else { // with configuration.
					event = eventManager(target, key, type[key].listener, clone(type[key]), trigger);
				}
				if (event) events[key] = event;
			}
		}
		return createBatchCommands(events);
	} else if (type.indexOf("on") === 0) { // to support things like "onclick" instead of "click"
		type = type.substr(2);
	}

	// Ensure listener is a function.
	if (typeof(target) !== "object") return createError("Target is not defined!", arguments);
	if (typeof(listener) !== "function") return createError("Listener is not a function!", arguments);

	// Generate a unique wrapper identifier.
	var useCapture = configure.useCapture || false;
	var id = getID(target) + "." + getID(listener) + "." + (useCapture ? 1 : 0);
	// Handle the event.
	if (root.Gesture && root.Gesture._gestureHandlers[type]) { // Fire custom event.
		id = type + id;
		if (trigger === "remove") { // Remove event listener.
			if (!wrappers[id]) return; // Already removed.
			wrappers[id].remove();
			delete wrappers[id];
		} else if (trigger === "add") { // Attach event listener.
			if (wrappers[id]) {
				wrappers[id].add();
				return wrappers[id]; // Already attached.
			}
			// Retains "this" orientation.
			if (configure.useCall && !root.modifyEventListener) {
				var tmp = listener;
				listener = function(event, self) {
					for (var key in self) event[key] = self[key];
					return tmp.call(target, event);
				};
			}
			// Create listener proxy.
			configure.gesture = type;
			configure.target = target;
			configure.listener = listener;
			configure.fromOverwrite = fromOverwrite;
			// Record wrapper.
			wrappers[id] = root.proxy[type](configure);
		}
		return wrappers[id];
	} else { // Fire native event.
		var eventList = getEventList(type);
		for (var n = 0, eventId; n < eventList.length; n ++) {
			type = eventList[n];
			eventId = type + "." + id;
			if (trigger === "remove") { // Remove event listener.
				if (!wrappers[eventId]) continue; // Already removed.
				target[remove](type, listener, useCapture);
				delete wrappers[eventId];
			} else if (trigger === "add") { // Attach event listener.
				if (wrappers[eventId]) return wrappers[eventId]; // Already attached.
				target[add](type, listener, useCapture);
				// Record wrapper.
				wrappers[eventId] = {
					id: eventId,
					type: type,
					target: target,
					listener: listener,
					remove: function() {
						for (var n = 0; n < eventList.length; n ++) {
							root.remove(target, eventList[n], listener, configure);
						}
					}
				};
			}
		}
		return wrappers[eventId];
	}
};

/// Perform batch actions on multiple events.
var createBatchCommands = function(events) {
	return {
		remove: function() { // Remove multiple events.
			for (var key in events) {
				events[key].remove();
			}
		},
		add: function() { // Add multiple events.
			for (var key in events) {
				events[key].add();
			}
		}
	};
};

/// Display error message in console.
var createError = function(message, data) {
	if (typeof(console) === "undefined") return;
	if (typeof(console.error) === "undefined") return;
	console.error(message, data);
};

/// Handle naming discrepancies between platforms.
var pointerDefs = {
	"msPointer": [ "MSPointerDown", "MSPointerMove", "MSPointerUp" ],
	"touch": [ "touchstart", "touchmove", "touchend" ],
	"mouse": [ "mousedown", "mousemove", "mouseup" ]
};

var pointerDetect = {
	// MSPointer
	"MSPointerDown": 0,
	"MSPointerMove": 1,
	"MSPointerUp": 2,
	// Touch
	"touchstart": 0,
	"touchmove": 1,
	"touchend": 2,
	// Mouse
	"mousedown": 0,
	"mousemove": 1,
	"mouseup": 2
};

var getEventSupport = (function() {
	root.supports = {};
	if (window.navigator.msPointerEnabled) {
		root.supports.msPointer = true;
	}
	if (root.getEventSupport("touchstart")) {
		root.supports.touch = true;
	}
	if (root.getEventSupport("mousedown")) {
		root.supports.mouse = true;
	}
})();

var getEventList = (function() {
	return function(type) {
		var prefix = document.addEventListener ? "" : "on"; // IE
		var idx = pointerDetect[type];
		if (isFinite(idx)) {
			var types = [];
			for (var key in root.supports) {
				types.push(prefix + pointerDefs[key][idx]);
			}
			return types;
		} else {
			return [ prefix + type ];
		}
	};
})();

/// Event wrappers to keep track of all events placed in the window.
var wrappers = {};
var counter = 0;
var getID = function(object) {
	if (object === window) return "#window";
	if (object === document) return "#document";
	if (!object.uniqueID) object.uniqueID = "e" + counter ++;
	return object.uniqueID;
};

/// Detect platforms native *EventListener command.
var add = document.addEventListener ? "addEventListener" : "attachEvent";
var remove = document.removeEventListener ? "removeEventListener" : "detachEvent";

/*
	Pointer.js
	----------------------------------------
	Modified from; https://github.com/borismus/pointer.js
*/

root.createPointerEvent = function (event, self, preventRecord) {
	var eventName = self.gesture;
	var target = self.target;
	var pts = event.changedTouches || root.proxy.getCoords(event);
	if (pts.length) {
		var pt = pts[0];
		self.pointers = preventRecord ? [] : pts;
		self.pageX = pt.pageX;
		self.pageY = pt.pageY;
		self.x = self.pageX;
		self.y = self.pageY;
	}
	///
	var newEvent = document.createEvent("Event");
	newEvent.initEvent(eventName, true, true);
	newEvent.originalEvent = event;
	for (var k in self) {
		if (k === "target") continue;
		newEvent[k] = self[k];
	}
	///
	var type = newEvent.type;
	if (root.Gesture && root.Gesture._gestureHandlers[type]) { // capture custom events.
//		target.dispatchEvent(newEvent);
		self.oldListener.call(target, newEvent, self, false);
	}
};

var eventListenersAgumented = false;
var augmentEventListeners = function() {
	/// Allows *EventListener to use custom event proxies.
	if (!window.HTMLElement) return;
	var augmentEventListener = function(proto) {
		var recall = function(trigger) { // overwrite native *EventListener's
			var handle = trigger + "EventListener";
			var handler = proto[handle];
			proto[handle] = function (type, listener, useCapture) {
				if (root.Gesture && root.Gesture._gestureHandlers[type]) { // capture custom events.
					var configure = useCapture;
					if (typeof(useCapture) === "object") {
						configure.useCall = true;
					} else { // convert to configuration object.
						configure = {
							useCall: true,
							useCapture: useCapture
						};
					}
					eventManager(this, type, listener, configure, trigger, true);
//					handler.call(this, type, listener, useCapture);
				} else { // use native function.
					var types = getEventList(type);
					for (var n = 0; n < types.length; n ++) {
						handler.call(this, types[n], listener, useCapture);
					}
				}
			};
		};
		recall("add");
		recall("remove");
	};
	// NOTE: overwriting HTMLElement doesn't do anything in Firefox.
	if (navigator.userAgent.match(/Firefox/)) {
		// TODO: fix Firefox for the general case.
		augmentEventListener(HTMLDivElement.prototype);
		augmentEventListener(HTMLCanvasElement.prototype);
	} else {
		augmentEventListener(HTMLElement.prototype);
	}
	augmentEventListener(document);
	augmentEventListener(window);
};

var selectorsAugmented = false;
var augmentSelectors = function() {
/// Allows querySelectorAll and other NodeLists to perform *EventListener commands in bulk.
	var proto = NodeList.prototype;
	proto.removeEventListener = function(type, listener, useCapture) {
		for (var n = 0, length = this.length; n < length; n ++) {
			this[n].removeEventListener(type, listener, useCapture);
		}
	};
	proto.addEventListener = function(type, listener, useCapture) {
		for (var n = 0, length = this.length; n < length; n ++) {
			this[n].addEventListener(type, listener, useCapture);
		}
	};
};

return root;

})(eventjs);

/*:
	----------------------------------------------------
	eventjs.proxy : 0.4.2 : 2013/07/17 : MIT License
	----------------------------------------------------
	https://github.com/mudcube/eventjs.js
	----------------------------------------------------
*/

if (typeof(eventjs) === "undefined") var eventjs = {};
if (typeof(eventjs.proxy) === "undefined") eventjs.proxy = {};

eventjs.proxy = (function(root) { "use strict";

/*
	Create a new pointer gesture instance.
*/

root.pointerSetup = function(conf, self) {
	/// Configure.
	conf.target = conf.target || window;
	conf.doc = conf.target.ownerDocument || conf.target; // Associated document.
	conf.minFingers = conf.minFingers || conf.fingers || 1; // Minimum required fingers.
	conf.maxFingers = conf.maxFingers || conf.fingers || Infinity; // Maximum allowed fingers.
	conf.position = conf.position || "relative"; // Determines what coordinate system points are returned.
	delete conf.fingers; //-
	/// Convenience data.
	self = self || {};
	self.enabled = true;
	self.gesture = conf.gesture;
	self.target = conf.target;
	self.env = conf.env;
	///
	if (eventjs.modifyEventListener && conf.fromOverwrite) {
		conf.oldListener = conf.listener;
		conf.listener = eventjs.createPointerEvent;
	}
	/// Convenience commands.
	var fingers = 0;
	var type = self.gesture.indexOf("pointer") === 0 && eventjs.modifyEventListener ? "pointer" : "mouse";
	if (conf.oldListener) self.oldListener = conf.oldListener;
	///
	self.listener = conf.listener;
	self.proxy = function(listener) {
		self.defaultListener = conf.listener;
		conf.listener = listener;
		listener(conf.event, self);
	};
	self.add = function() {
		if (self.enabled === true) return;
		if (conf.onPointerDown) eventjs.add(conf.target, type + "down", conf.onPointerDown);
		if (conf.onPointerMove) eventjs.add(conf.doc, type + "move", conf.onPointerMove);
		if (conf.onPointerUp) eventjs.add(conf.doc, type + "up", conf.onPointerUp);
		self.enabled = true;
	};
	self.remove = function() {
		if (self.enabled === false) return;
		if (conf.onPointerDown) eventjs.remove(conf.target, type + "down", conf.onPointerDown);
		if (conf.onPointerMove) eventjs.remove(conf.doc, type + "move", conf.onPointerMove);
		if (conf.onPointerUp) eventjs.remove(conf.doc, type + "up", conf.onPointerUp);
		self.reset();
		self.enabled = false;
	};
	self.pause = function(opt) {
		if (conf.onPointerMove && (!opt || opt.move)) eventjs.remove(conf.doc, type + "move", conf.onPointerMove);
		if (conf.onPointerUp && (!opt || opt.up)) eventjs.remove(conf.doc, type + "up", conf.onPointerUp);
		fingers = conf.fingers;
		conf.fingers = 0;
	};
	self.resume = function(opt) {
		if (conf.onPointerMove && (!opt || opt.move)) eventjs.add(conf.doc, type + "move", conf.onPointerMove);
		if (conf.onPointerUp && (!opt || opt.up)) eventjs.add(conf.doc, type + "up", conf.onPointerUp);
		conf.fingers = fingers;
	};
	self.reset = function() {
		conf.tracker = {};
		conf.fingers = 0;
	};
	///
	return self;
};

/*
	Begin proxied pointer command.
*/

var sp = eventjs.supports; // Default pointerType
///
eventjs.isMouse = !!sp.mouse;
eventjs.isMSPointer = !!sp.touch;
eventjs.isTouch = !!sp.msPointer;
///
root.pointerStart = function(event, self, conf) {
	/// tracks multiple inputs
	var type = (event.type || "mousedown").toUpperCase();
	if (type.indexOf("MOUSE") === 0) {
		eventjs.isMouse = true;
		eventjs.isTouch = false;
		eventjs.isMSPointer = false;
	} else if (type.indexOf("TOUCH") === 0) {
		eventjs.isMouse = false;
		eventjs.isTouch = true;
		eventjs.isMSPointer = false;
	} else if (type.indexOf("MSPOINTER") === 0) {
		eventjs.isMouse = false;
		eventjs.isTouch = false;
		eventjs.isMSPointer = true;
	}
	///
	var addTouchStart = function(touch, sid) {
		var bbox = conf.bbox;
		var pt = track[sid] = {};
		///
		switch(conf.position) {
			case "absolute": // Absolute from within window.
				pt.offsetX = 0;
				pt.offsetY = 0;
				break;
			case "differenceFromLast": // Since last coordinate recorded.
				pt.offsetX = touch.pageX;
				pt.offsetY = touch.pageY;
				break;
			case "difference": // Relative from origin.
				pt.offsetX = touch.pageX;
				pt.offsetY = touch.pageY;
				break;
			case "move": // Move target element.
				pt.offsetX = touch.pageX - bbox.x1;
				pt.offsetY = touch.pageY - bbox.y1;
				break;
			default: // Relative from within target.
				pt.offsetX = bbox.x1 - bbox.scrollLeft;
				pt.offsetY = bbox.y1 - bbox.scrollTop;
				break;
		}
		///
		var x = touch.pageX - pt.offsetX;
		var y = touch.pageY - pt.offsetY;
		///
		pt.rotation = 0;
		pt.scale = 1;
		pt.startTime = pt.moveTime = (new Date()).getTime();
		pt.move = { x: x, y: y };
		pt.start = { x: x, y: y };
		///
		conf.fingers ++;
	};
	///
	conf.event = event;
	if (self.defaultListener) {
		conf.listener = self.defaultListener;
		delete self.defaultListener;
	}
	///
	var isTouchStart = !conf.fingers;
	var track = conf.tracker;
	var touches = event.changedTouches || root.getCoords(event);
	var length = touches.length;
	// Adding touch events to tracking.
	for (var i = 0; i < length; i ++) {
		var touch = touches[i];
		var sid = touch.identifier || Infinity; // Touch ID.
		// Track the current state of the touches.
		if (conf.fingers) {
			if (conf.fingers >= conf.maxFingers) {
				var ids = [];
				for (var sid in conf.tracker) ids.push(sid);
				self.identifier = ids.join(",");
				return isTouchStart;
			}
			var fingers = 0; // Finger ID.
			for (var rid in track) {
				// Replace removed finger.
				if (track[rid].up) {
					delete track[rid];
					addTouchStart(touch, sid);
					conf.cancel = true;
					break;
				}
				fingers ++;
			}
			// Add additional finger.
			if (track[sid]) continue;
			addTouchStart(touch, sid);
		} else { // Start tracking fingers.
			track = conf.tracker = {};
			self.bbox = conf.bbox = root.getBoundingBox(conf.target);
			conf.fingers = 0;
			conf.cancel = false;
			addTouchStart(touch, sid);
		}
	}
	///
	var ids = [];
	for (var sid in conf.tracker) ids.push(sid);
	self.identifier = ids.join(",");
	///
	return isTouchStart;
};

/*
	End proxied pointer command.
*/

root.pointerEnd = function(event, self, conf, onPointerUp) {
	// Record changed touches have ended (iOS changedTouches is not reliable).
	var touches = event.touches || [];
	var length = touches.length;
	var exists = {};
	for (var i = 0; i < length; i ++) {
		var touch = touches[i];
		var sid = touch.identifier;
		exists[sid || Infinity] = true;
	}
	for (var sid in conf.tracker) {
		var track = conf.tracker[sid];
		if (exists[sid] || track.up) continue;
		if (onPointerUp) { // add changedTouches to mouse.
			onPointerUp({
				pageX: track.pageX,
				pageY: track.pageY,
				changedTouches: [{
					pageX: track.pageX,
					pageY: track.pageY,
					identifier: sid === "Infinity" ? Infinity : sid
				}]
			}, "up");
		}
		track.up = true;
		conf.fingers --;
	}
/*	// This should work but fails in Safari on iOS4 so not using it.
	var touches = event.changedTouches || root.getCoords(event);
	var length = touches.length;
	// Record changed touches have ended (this should work).
	for (var i = 0; i < length; i ++) {
		var touch = touches[i];
		var sid = touch.identifier || Infinity;
		var track = conf.tracker[sid];
		if (track && !track.up) {
			if (onPointerUp) { // add changedTouches to mouse.
				onPointerUp({
					changedTouches: [{
						pageX: track.pageX,
						pageY: track.pageY,
						identifier: sid === "Infinity" ? Infinity : sid
					}]
				}, "up");
			}
			track.up = true;
			conf.fingers --;
		}
	} */
	// Wait for all fingers to be released.
	if (conf.fingers !== 0) return false;
	// Record total number of fingers gesture used.
	var ids = [];
	conf.gestureFingers = 0;
	for (var sid in conf.tracker) {
		conf.gestureFingers ++;
		ids.push(sid);
	}
	self.identifier = ids.join(",");
	// Our pointer gesture has ended.
	return true;
};

/*
	Returns mouse coords in an array to match event.*Touches
	------------------------------------------------------------
	var touch = event.changedTouches || root.getCoords(event);
*/

root.getCoords = function(event) {
	if (typeof(event.pageX) !== "undefined") { // Desktop browsers.
		root.getCoords = function(event) {
			return Array({
				type: "mouse",
				x: event.pageX,
				y: event.pageY,
				pageX: event.pageX,
				pageY: event.pageY,
				identifier: event.pointerId || Infinity // pointerId is MS
			});
		};
	} else { // Internet Explorer <= 8.0
		root.getCoords = function(event) {
			var doc = document.documentElement;
			event = event || window.event;
			return Array({
				type: "mouse",
				x: event.clientX + doc.scrollLeft,
				y: event.clientY + doc.scrollTop,
				pageX: event.clientX + doc.scrollLeft,
				pageY: event.clientY + doc.scrollTop,
				identifier: Infinity
			});
		};
	}
	return root.getCoords(event);
};

/*
	Returns single coords in an object.
	------------------------------------------------------------
	var mouse = root.getCoord(event);
*/

root.getCoord = function(event) {
	if ("ontouchstart" in window) { // Mobile browsers.
		var pX = 0;
		var pY = 0;
		root.getCoord = function(event) {
			var touches = event.changedTouches;
			if (touches && touches.length) { // ontouchstart + ontouchmove
				return {
					x: pX = touches[0].pageX,
					y: pY = touches[0].pageY
				};
			} else { // ontouchend
				return {
					x: pX,
					y: pY
				};
			}
		};
	} else if(typeof(event.pageX) !== "undefined" && typeof(event.pageY) !== "undefined") { // Desktop browsers.
		root.getCoord = function(event) {
			return {
				x: event.pageX,
				y: event.pageY
			};
		};
	} else { // Internet Explorer <=8.0
		root.getCoord = function(event) {
			var doc = document.documentElement;
			event = event || window.event;
			return {
				x: event.clientX + doc.scrollLeft,
				y: event.clientY + doc.scrollTop
			};
		};
	}
	return root.getCoord(event);
};

/*
	Get target scale and position in space.
*/

var getPropertyAsFloat = function(o, type) {
	var n = parseFloat(o.getPropertyValue(type), 10);
	return isFinite(n) ? n : 0;
};

root.getBoundingBox = function(o) {
	if (o === window || o === document) o = document.body;
	///
	var bbox = {};
	var bcr = o.getBoundingClientRect();
	bbox.width = bcr.width;
	bbox.height = bcr.height;
	bbox.x1 = bcr.left;
	bbox.y1 = bcr.top;
	bbox.scaleX = bcr.width / o.offsetWidth || 1;
	bbox.scaleY = bcr.height / o.offsetHeight || 1;
	bbox.scrollLeft = 0;
	bbox.scrollTop = 0;
	///
	var style = window.getComputedStyle(o);
	var borderBox = style.getPropertyValue("box-sizing") === "border-box";
	///
	if (borderBox === false) {
		var left = getPropertyAsFloat(style, "border-left-width");
		var right = getPropertyAsFloat(style, "border-right-width");
		var bottom = getPropertyAsFloat(style, "border-bottom-width");
		var top = getPropertyAsFloat(style, "border-top-width");
		bbox.border = [ left, right, top, bottom ];
		bbox.x1 += left;
		bbox.y1 += top;
		bbox.width -= right + left;
		bbox.height -= bottom + top;
	}

/*	var left = getPropertyAsFloat(style, "padding-left");
	var right = getPropertyAsFloat(style, "padding-right");
	var bottom = getPropertyAsFloat(style, "padding-bottom");
	var top = getPropertyAsFloat(style, "padding-top");
	bbox.padding = [ left, right, top, bottom ];*/
	///
	bbox.x2 = bbox.x1 + bbox.width;
	bbox.y2 = bbox.y1 + bbox.height;

	/// Get the scroll of container element.
	var position = style.getPropertyValue("position");
	var tmp = position === "fixed" ? o : o.parentNode;
	while (tmp !== null) {
		if (tmp === document.body) break;
		if (tmp.scrollTop === undefined) break;
		var style = window.getComputedStyle(tmp);
		var position = style.getPropertyValue("position");
		if (position === "absolute") {

		} else if (position === "fixed") {
//			bbox.scrollTop += document.body.scrollTop;
//			bbox.scrollLeft += document.body.scrollLeft;
			bbox.scrollTop -= tmp.parentNode.scrollTop;
			bbox.scrollLeft -= tmp.parentNode.scrollLeft;
			break;
		} else {
			bbox.scrollLeft += tmp.scrollLeft;
			bbox.scrollTop += tmp.scrollTop;
		}
		///
		tmp = tmp.parentNode;
	};
	///
	bbox.scrollBodyLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
	bbox.scrollBodyTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
	///
	bbox.scrollLeft -= bbox.scrollBodyLeft;
	bbox.scrollTop -= bbox.scrollBodyTop;
	///
	return bbox;
};

/*
	Keep track of metaKey, the proper ctrlKey for users platform.
	----------------------------------------------------
	http://www.quirksmode.org/js/keys.html
	-----------------------------------
	http://unixpapa.com/js/key.html
*/

(function() {
	var agent = navigator.userAgent.toLowerCase();
	var mac = agent.indexOf("macintosh") !== -1;
	var metaKeys;
	if (mac && agent.indexOf("khtml") !== -1) { // chrome, safari.
		metaKeys = { 91: true, 93: true };
	} else if (mac && agent.indexOf("firefox") !== -1) {  // mac firefox.
		metaKeys = { 224: true };
	} else { // windows, linux, or mac opera.
		metaKeys = { 17: true };
	}
	(root.metaTrackerReset = function() {
		eventjs.fnKey = root.fnKey = false;
		eventjs.metaKey = root.metaKey = false;
		eventjs.escKey = root.escKey = false;
		eventjs.ctrlKey = root.ctrlKey = false;
		eventjs.shiftKey = root.shiftKey = false;
		eventjs.altKey = root.altKey = false;
	})();
	root.metaTracker = function(event) {
		var isKeyDown = event.type === "keydown";
		if (event.keyCode === 27) eventjs.escKey = root.escKey = isKeyDown;
		if (metaKeys[event.keyCode]) eventjs.metaKey = root.metaKey = isKeyDown;
		eventjs.ctrlKey = root.ctrlKey = event.ctrlKey;
		eventjs.shiftKey = root.shiftKey = event.shiftKey;
		eventjs.altKey = root.altKey = event.altKey;
	};
})();

return root;

})(eventjs.proxy);
/*:
	----------------------------------------------------
	"MutationObserver" event proxy.
	----------------------------------------------------
	author: Selvakumar Arumugam - MIT LICENSE
	   src: http://stackoverflow.com/questions/10868104/can-you-have-a-javascript-hook-trigger-after-a-dom-elements-style-object-change
	----------------------------------------------------
*/
if (typeof(eventjs) === "undefined") var eventjs = {};

eventjs.MutationObserver = (function() {
	var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
	var DOMAttrModifiedSupported = !MutationObserver && (function() {
		var p = document.createElement("p");
		var flag = false;
		var fn = function() { flag = true };
		if (p.addEventListener) {
			p.addEventListener("DOMAttrModified", fn, false);
		} else if (p.attachEvent) {
			p.attachEvent("onDOMAttrModified", fn);
		} else {
			return false;
		}
		///
		p.setAttribute("id", "target");
		///
		return flag;
	})();
	///
	return function(container, callback) {
		if (MutationObserver) {
			var options = {
				subtree: false,
				attributes: true
			};
			var observer = new MutationObserver(function(mutations) {
				mutations.forEach(function(e) {
					callback.call(e.target, e.attributeName);
				});
			});
			observer.observe(container, options)
		} else if (DOMAttrModifiedSupported) {
			eventjs.add(container, "DOMAttrModified", function(e) {
				callback.call(container, e.attrName);
			});
		} else if ("onpropertychange" in document.body) {
			eventjs.add(container, "propertychange", function(e) {
				callback.call(container, window.event.propertyName);
			});
		}
	}
})();
/*:
	"Click" event proxy.
	----------------------------------------------------
	eventjs.add(window, "click", function(event, self) {});
*/

if (typeof(eventjs) === "undefined") var eventjs = {};
if (typeof(eventjs.proxy) === "undefined") eventjs.proxy = {};

eventjs.proxy = (function(root) { "use strict";

root.click = function(conf) {
	conf.gesture = conf.gesture || "click";
	conf.maxFingers = conf.maxFingers || conf.fingers || 1;
	/// Tracking the events.
	conf.onPointerDown = function (event) {
		if (root.pointerStart(event, self, conf)) {
			eventjs.add(conf.target, "mouseup", conf.onPointerUp);
		}
	};
	conf.onPointerUp = function(event) {
		if (root.pointerEnd(event, self, conf)) {
			eventjs.remove(conf.target, "mouseup", conf.onPointerUp);
			var pointers = event.changedTouches || root.getCoords(event);
			var pointer = pointers[0];
			var bbox = conf.bbox;
			var newbbox = root.getBoundingBox(conf.target);
			var y = pointer.pageY - newbbox.scrollBodyTop;
			var x = pointer.pageX - newbbox.scrollBodyLeft;
			////
			if (x > bbox.x1 && y > bbox.y1 &&
				x < bbox.x2 && y < bbox.y2 &&
				bbox.scrollTop === newbbox.scrollTop) { // has not been scrolled
				///
				for (var key in conf.tracker) break; //- should be modularized? in dblclick too
				var point = conf.tracker[key];
				self.x = point.start.x;
				self.y = point.start.y;
				///
				conf.listener(event, self);
			}
		}
	};
	// Generate maintenance commands, and other configurations.
	var self = root.pointerSetup(conf);
	self.state = "click";
	// Attach events.
	eventjs.add(conf.target, "mousedown", conf.onPointerDown);
	// Return this object.
	return self;
};

eventjs.Gesture = eventjs.Gesture || {};
eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
eventjs.Gesture._gestureHandlers.click = root.click;

return root;

})(eventjs.proxy);
/*:
	"Double-Click" aka "Double-Tap" event proxy.
	----------------------------------------------------
	eventjs.add(window, "dblclick", function(event, self) {});
	----------------------------------------------------
	Touch an target twice for <= 700ms, with less than 25 pixel drift.
*/

if (typeof(eventjs) === "undefined") var eventjs = {};
if (typeof(eventjs.proxy) === "undefined") eventjs.proxy = {};

eventjs.proxy = (function(root) { "use strict";

root.dbltap =
root.dblclick = function(conf) {
	conf.gesture = conf.gesture || "dbltap";
	conf.maxFingers = conf.maxFingers || conf.fingers || 1;
	// Setting up local variables.
	var delay = 700; // in milliseconds
	var time0, time1, timeout;
	var pointer0, pointer1;
	// Tracking the events.
	conf.onPointerDown = function (event) {
		var pointers = event.changedTouches || root.getCoords(event);
		if (time0 && !time1) { // Click #2
			pointer1 = pointers[0];
			time1 = (new Date()).getTime() - time0;
		} else { // Click #1
			pointer0 = pointers[0];
			time0 = (new Date()).getTime();
			time1 = 0;
			clearTimeout(timeout);
			timeout = setTimeout(function() {
				time0 = 0;
			}, delay);
		}
		if (root.pointerStart(event, self, conf)) {
			eventjs.add(conf.target, "mousemove", conf.onPointerMove).listener(event);
			eventjs.add(conf.target, "mouseup", conf.onPointerUp);
		}
	};
	conf.onPointerMove = function (event) {
		if (time0 && !time1) {
			var pointers = event.changedTouches || root.getCoords(event);
			pointer1 = pointers[0];
		}
		var bbox = conf.bbox;
		var ax = (pointer1.pageX - bbox.x1);
		var ay = (pointer1.pageY - bbox.y1);
		if (!(ax > 0 && ax < bbox.width && // Within target coordinates..
			  ay > 0 && ay < bbox.height &&
			  Math.abs(pointer1.pageX - pointer0.pageX) <= 25 && // Within drift deviance.
			  Math.abs(pointer1.pageY - pointer0.pageY) <= 25)) {
			// Cancel out this listener.
			eventjs.remove(conf.target, "mousemove", conf.onPointerMove);
			clearTimeout(timeout);
			time0 = time1 = 0;
		}
	};
	conf.onPointerUp = function(event) {
		if (root.pointerEnd(event, self, conf)) {
			eventjs.remove(conf.target, "mousemove", conf.onPointerMove);
			eventjs.remove(conf.target, "mouseup", conf.onPointerUp);
		}
		if (time0 && time1) {
			if (time1 <= delay) { // && !(event.cancelBubble && ++event.cancelBubbleCount > 1)) {
				self.state = conf.gesture;
				for (var key in conf.tracker) break;
				var point = conf.tracker[key];
				self.x = point.start.x;
				self.y = point.start.y;
				conf.listener(event, self);
			}
			clearTimeout(timeout);
			time0 = time1 = 0;
		}
	};
	// Generate maintenance commands, and other configurations.
	var self = root.pointerSetup(conf);
	self.state = "dblclick";
	// Attach events.
	eventjs.add(conf.target, "mousedown", conf.onPointerDown);
	// Return this object.
	return self;
};

eventjs.Gesture = eventjs.Gesture || {};
eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
eventjs.Gesture._gestureHandlers.dbltap = root.dbltap;
eventjs.Gesture._gestureHandlers.dblclick = root.dblclick;

return root;

})(eventjs.proxy);
/*:
	"Drag" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: maxFingers, position.
	----------------------------------------------------
	eventjs.add(window, "drag", function(event, self) {
		console.log(self.gesture, self.state, self.start, self.x, self.y, self.bbox);
	});
*/

if (typeof(eventjs) === "undefined") var eventjs = {};
if (typeof(eventjs.proxy) === "undefined") eventjs.proxy = {};

eventjs.proxy = (function(root) { "use strict";

root.dragElement = function(that, event) {
	root.drag({
		event: event,
		target: that,
		position: "move",
		listener: function(event, self) {
			that.style.left = self.x + "px";
			that.style.top = self.y + "px";
			eventjs.prevent(event);
		}
	});
};

root.drag = function(conf) {
	conf.gesture = "drag";
	conf.onPointerDown = function (event) {
		if (root.pointerStart(event, self, conf)) {
			if (!conf.monitor) {
				eventjs.add(conf.doc, "mousemove", conf.onPointerMove);
				eventjs.add(conf.doc, "mouseup", conf.onPointerUp);
			}
		}
		// Process event listener.
		conf.onPointerMove(event, "down");
	};
	conf.onPointerMove = function (event, state) {
		if (!conf.tracker) return conf.onPointerDown(event);
		var bbox = conf.bbox;
		var touches = event.changedTouches || root.getCoords(event);
		var length = touches.length;
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var identifier = touch.identifier || Infinity;
			var pt = conf.tracker[identifier];
			// Identifier defined outside of listener.
			if (!pt) continue;
			pt.pageX = touch.pageX;
			pt.pageY = touch.pageY;
			// Record data.
			self.state = state || "move";
			self.identifier = identifier;
			self.start = pt.start;
			self.fingers = conf.fingers;
			if (conf.position === "differenceFromLast") {
				self.x = (pt.pageX - pt.offsetX);
				self.y = (pt.pageY - pt.offsetY);
				pt.offsetX = pt.pageX;
				pt.offsetY = pt.pageY;
			} else {
				self.x = (pt.pageX - pt.offsetX);
				self.y = (pt.pageY - pt.offsetY);
			}
			///
			conf.listener(event, self);
		}
	};
	conf.onPointerUp = function(event) {
		// Remove tracking for touch.
		if (root.pointerEnd(event, self, conf, conf.onPointerMove)) {
			if (!conf.monitor) {
				eventjs.remove(conf.doc, "mousemove", conf.onPointerMove);
				eventjs.remove(conf.doc, "mouseup", conf.onPointerUp);
			}
		}
	};
	// Generate maintenance commands, and other configurations.
	var self = root.pointerSetup(conf);
	// Attach events.
	if (conf.event) {
		conf.onPointerDown(conf.event);
	} else { //
		eventjs.add(conf.target, "mousedown", conf.onPointerDown);
		if (conf.monitor) {
			eventjs.add(conf.doc, "mousemove", conf.onPointerMove);
			eventjs.add(conf.doc, "mouseup", conf.onPointerUp);
		}
	}
	// Return this object.
	return self;
};

eventjs.Gesture = eventjs.Gesture || {};
eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
eventjs.Gesture._gestureHandlers.drag = root.drag;

return root;

})(eventjs.proxy);
/*:
	"Gesture" event proxy (2+ fingers).
	----------------------------------------------------
	CONFIGURE: minFingers, maxFingers.
	----------------------------------------------------
	eventjs.add(window, "gesture", function(event, self) {
		console.log(
			self.x, // centroid
			self.y,
			self.rotation,
			self.scale,
			self.fingers,
			self.state
		);
	});
*/

if (typeof(eventjs) === "undefined") var eventjs = {};
if (typeof(eventjs.proxy) === "undefined") eventjs.proxy = {};

eventjs.proxy = (function(root) { "use strict";

var RAD_DEG = Math.PI / 180;
var getCentroid = function(self, points) {
	var centroidx = 0;
	var centroidy = 0;
	var length = 0;
	for (var sid in points) {
		var touch = points[sid];
		if (touch.up) continue;
		centroidx += touch.move.x;
		centroidy += touch.move.y;
		length ++;
	}
	self.x = centroidx /= length;
	self.y = centroidy /= length;
	return self;
};

root.gesture = function(conf) {
	conf.gesture = conf.gesture || "gesture";
	conf.minFingers = conf.minFingers || conf.fingers || 2;
	// Tracking the events.
	conf.onPointerDown = function (event) {
		var fingers = conf.fingers;
		if (root.pointerStart(event, self, conf)) {
			eventjs.add(conf.doc, "mousemove", conf.onPointerMove);
			eventjs.add(conf.doc, "mouseup", conf.onPointerUp);
		}
		// Record gesture start.
		if (conf.fingers === conf.minFingers && fingers !== conf.fingers) {
			self.fingers = conf.minFingers;
			self.scale = 1;
			self.rotation = 0;
			self.state = "start";
			var sids = ""; //- FIXME(mud): can generate duplicate IDs.
			for (var key in conf.tracker) sids += key;
			self.identifier = parseInt(sids);
			getCentroid(self, conf.tracker);
			conf.listener(event, self);
		}
	};
	///
	conf.onPointerMove = function (event, state) {
		var bbox = conf.bbox;
		var points = conf.tracker;
		var touches = event.changedTouches || root.getCoords(event);
		var length = touches.length;
		// Update tracker coordinates.
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var sid = touch.identifier || Infinity;
			var pt = points[sid];
			// Check whether "pt" is used by another gesture.
			if (!pt) continue;
			// Find the actual coordinates.
			pt.move.x = (touch.pageX - bbox.x1);
			pt.move.y = (touch.pageY - bbox.y1);
		}
		///
		if (conf.fingers < conf.minFingers) return;
		///
		var touches = [];
		var scale = 0;
		var rotation = 0;

		/// Calculate centroid of gesture.
		getCentroid(self, points);
		///
		for (var sid in points) {
			var touch = points[sid];
			if (touch.up) continue;
			var start = touch.start;
			if (!start.distance) {
				var dx = start.x - self.x;
				var dy = start.y - self.y;
				start.distance = Math.sqrt(dx * dx + dy * dy);
				start.angle = Math.atan2(dx, dy) / RAD_DEG;
			}
			// Calculate scale.
			var dx = touch.move.x - self.x;
			var dy = touch.move.y - self.y;
			var distance = Math.sqrt(dx * dx + dy * dy);
			scale += distance / start.distance;
			// Calculate rotation.
			var angle = Math.atan2(dx, dy) / RAD_DEG;
			var rotate = (start.angle - angle + 360) % 360 - 180;
			touch.DEG2 = touch.DEG1; // Previous degree.
			touch.DEG1 = rotate > 0 ? rotate : -rotate; // Current degree.
			if (typeof(touch.DEG2) !== "undefined") {
				if (rotate > 0) {
					touch.rotation += touch.DEG1 - touch.DEG2;
				} else {
					touch.rotation -= touch.DEG1 - touch.DEG2;
				}
				rotation += touch.rotation;
			}
			// Attach current points to self.
			touches.push(touch.move);
		}
		///
		self.touches = touches;
		self.fingers = conf.fingers;
		self.scale = scale / conf.fingers;
		self.rotation = rotation / conf.fingers;
		self.state = "change";
		conf.listener(event, self);
	};
	conf.onPointerUp = function(event) {
		// Remove tracking for touch.
		var fingers = conf.fingers;
		if (root.pointerEnd(event, self, conf)) {
			eventjs.remove(conf.doc, "mousemove", conf.onPointerMove);
			eventjs.remove(conf.doc, "mouseup", conf.onPointerUp);
		}
		// Check whether fingers has dropped below minFingers.
		if (fingers === conf.minFingers && conf.fingers < conf.minFingers) {
			self.fingers = conf.fingers;
			self.state = "end";
			conf.listener(event, self);
		}
	};
	// Generate maintenance commands, and other configurations.
	var self = root.pointerSetup(conf);
	// Attach events.
	eventjs.add(conf.target, "mousedown", conf.onPointerDown);
	// Return this object.
	return self;
};

eventjs.Gesture = eventjs.Gesture || {};
eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
eventjs.Gesture._gestureHandlers.gesture = root.gesture;

return root;

})(eventjs.proxy);
/*:
	"Pointer" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: minFingers, maxFingers.
	----------------------------------------------------
	eventjs.add(window, "gesture", function(event, self) {
		console.log(self.rotation, self.scale, self.fingers, self.state);
	});
*/

if (typeof(eventjs) === "undefined") var eventjs = {};
if (typeof(eventjs.proxy) === "undefined") eventjs.proxy = {};

eventjs.proxy = (function(root) { "use strict";

root.pointerdown =
root.pointermove =
root.pointerup = function(conf) {
	conf.gesture = conf.gesture || "pointer";
	if (conf.target.isPointerEmitter) return;
	// Tracking the events.
	var isDown = true;
	conf.onPointerDown = function (event) {
		isDown = false;
		self.gesture = "pointerdown";
		conf.listener(event, self);
	};
	conf.onPointerMove = function (event) {
		self.gesture = "pointermove";
		conf.listener(event, self, isDown);
	};
	conf.onPointerUp = function (event) {
		isDown = true;
		self.gesture = "pointerup";
		conf.listener(event, self, true);
	};
	// Generate maintenance commands, and other configurations.
	var self = root.pointerSetup(conf);
	// Attach events.
	eventjs.add(conf.target, "mousedown", conf.onPointerDown);
	eventjs.add(conf.target, "mousemove", conf.onPointerMove);
	eventjs.add(conf.doc, "mouseup", conf.onPointerUp);
	// Return this object.
	conf.target.isPointerEmitter = true;
	return self;
};

eventjs.Gesture = eventjs.Gesture || {};
eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
eventjs.Gesture._gestureHandlers.pointerdown = root.pointerdown;
eventjs.Gesture._gestureHandlers.pointermove = root.pointermove;
eventjs.Gesture._gestureHandlers.pointerup = root.pointerup;

return root;

})(eventjs.proxy);
/*:
	"Device Motion" and "Shake" event proxy.
	----------------------------------------------------
	http://developer.android.com/reference/android/hardware/Sensoreventjs.html#values
	----------------------------------------------------
	eventjs.add(window, "shake", function(event, self) {});
	eventjs.add(window, "devicemotion", function(event, self) {
		console.log(self.acceleration, self.accelerationIncludingGravity);
	});
*/

if (typeof(eventjs) === "undefined") var eventjs = {};
if (typeof(eventjs.proxy) === "undefined") eventjs.proxy = {};

eventjs.proxy = (function(root) { "use strict";

root.shake = function(conf) {
	// Externally accessible data.
	var self = {
		gesture: "devicemotion",
		acceleration: {},
		accelerationIncludingGravity: {},
		target: conf.target,
		listener: conf.listener,
		remove: function() {
			window.removeEventListener('devicemotion', onDeviceMotion, false);
		}
	};
	// Setting up local variables.
	var threshold = 4; // Gravitational threshold.
	var timeout = 1000; // Timeout between shake events.
	var timeframe = 200; // Time between shakes.
	var shakes = 3; // Minimum shakes to trigger event.
	var lastShake = (new Date()).getTime();
	var gravity = { x: 0, y: 0, z: 0 };
	var delta = {
		x: { count: 0, value: 0 },
		y: { count: 0, value: 0 },
		z: { count: 0, value: 0 }
	};
	// Tracking the events.
	var onDeviceMotion = function(e) {
		var alpha = 0.8; // Low pass filter.
		var o = e.accelerationIncludingGravity;
		gravity.x = alpha * gravity.x + (1 - alpha) * o.x;
		gravity.y = alpha * gravity.y + (1 - alpha) * o.y;
		gravity.z = alpha * gravity.z + (1 - alpha) * o.z;
		self.accelerationIncludingGravity = gravity;
		self.acceleration.x = o.x - gravity.x;
		self.acceleration.y = o.y - gravity.y;
		self.acceleration.z = o.z - gravity.z;
		///
		if (conf.gesture === "devicemotion") {
			conf.listener(e, self);
			return;
		}
		var data = "xyz";
		var now = (new Date()).getTime();
		for (var n = 0, length = data.length; n < length; n ++) {
			var letter = data[n];
			var ACCELERATION = self.acceleration[letter];
			var DELTA = delta[letter];
			var abs = Math.abs(ACCELERATION);
			/// Check whether another shake event was recently registered.
			if (now - lastShake < timeout) continue;
			/// Check whether delta surpasses threshold.
			if (abs > threshold) {
				var idx = now * ACCELERATION / abs;
				var span = Math.abs(idx + DELTA.value);
				// Check whether last delta was registered within timeframe.
				if (DELTA.value && span < timeframe) {
					DELTA.value = idx;
					DELTA.count ++;
					// Check whether delta count has enough shakes.
					if (DELTA.count === shakes) {
						conf.listener(e, self);
						// Reset tracking.
						lastShake = now;
						DELTA.value = 0;
						DELTA.count = 0;
					}
				} else {
					// Track first shake.
					DELTA.value = idx;
					DELTA.count = 1;
				}
			}
		}
	};
	// Attach events.
	if (!window.addEventListener) return;
	window.addEventListener('devicemotion', onDeviceMotion, false);
	// Return this object.
	return self;
};

eventjs.Gesture = eventjs.Gesture || {};
eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
eventjs.Gesture._gestureHandlers.shake = root.shake;

return root;

})(eventjs.proxy);
/*:
	"Swipe" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: snap, threshold, maxFingers.
	----------------------------------------------------
	eventjs.add(window, "swipe", function(event, self) {
		console.log(self.velocity, self.angle);
	});
*/

if (typeof(eventjs) === "undefined") var eventjs = {};
if (typeof(eventjs.proxy) === "undefined") eventjs.proxy = {};

eventjs.proxy = (function(root) { "use strict";

var RAD_DEG = Math.PI / 180;

root.swipe = function(conf) {
	conf.snap = conf.snap || 90; // angle snap.
	conf.threshold = conf.threshold || 1; // velocity threshold.
	conf.gesture = conf.gesture || "swipe";
	// Tracking the events.
	conf.onPointerDown = function (event) {
		if (root.pointerStart(event, self, conf)) {
			eventjs.add(conf.doc, "mousemove", conf.onPointerMove).listener(event);
			eventjs.add(conf.doc, "mouseup", conf.onPointerUp);
		}
	};
	conf.onPointerMove = function (event) {
		var touches = event.changedTouches || root.getCoords(event);
		var length = touches.length;
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var sid = touch.identifier || Infinity;
			var o = conf.tracker[sid];
			// Identifier defined outside of listener.
			if (!o) continue;
			o.move.x = touch.pageX;
			o.move.y = touch.pageY;
			o.moveTime = (new Date()).getTime();
		}
	};
	conf.onPointerUp = function(event) {
		if (root.pointerEnd(event, self, conf)) {
			eventjs.remove(conf.doc, "mousemove", conf.onPointerMove);
			eventjs.remove(conf.doc, "mouseup", conf.onPointerUp);
			///
			var velocity1;
			var velocity2
			var degree1;
			var degree2;
			/// Calculate centroid of gesture.
			var start = { x: 0, y: 0 };
			var endx = 0;
			var endy = 0;
			var length = 0;
			///
			for (var sid in conf.tracker) {
				var touch = conf.tracker[sid];
				var xdist = touch.move.x - touch.start.x;
				var ydist = touch.move.y - touch.start.y;
				///
				endx += touch.move.x;
				endy += touch.move.y;
				start.x += touch.start.x;
				start.y += touch.start.y;
				length ++;
				///
				var distance = Math.sqrt(xdist * xdist + ydist * ydist);
				var ms = touch.moveTime - touch.startTime;
				var degree2 = Math.atan2(xdist, ydist) / RAD_DEG + 180;
				var velocity2 = ms ? distance / ms : 0;
				if (typeof(degree1) === "undefined") {
					degree1 = degree2;
					velocity1 = velocity2;
				} else if (Math.abs(degree2 - degree1) <= 20) {
					degree1 = (degree1 + degree2) / 2;
					velocity1 = (velocity1 + velocity2) / 2;
				} else {
					return;
				}
			}
			///
			var fingers = conf.gestureFingers;
			if (conf.minFingers <= fingers && conf.maxFingers >= fingers) {
				if (velocity1 > conf.threshold) {
					start.x /= length;
					start.y /= length;
					self.start = start;
					self.x = endx / length;
					self.y = endy / length;
					self.angle = -((((degree1 / conf.snap + 0.5) >> 0) * conf.snap || 360) - 360);
					self.velocity = velocity1;
					self.fingers = fingers;
					self.state = "swipe";
					conf.listener(event, self);
				}
			}
		}
	};
	// Generate maintenance commands, and other configurations.
	var self = root.pointerSetup(conf);
	// Attach events.
	eventjs.add(conf.target, "mousedown", conf.onPointerDown);
	// Return this object.
	return self;
};

eventjs.Gesture = eventjs.Gesture || {};
eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
eventjs.Gesture._gestureHandlers.swipe = root.swipe;

return root;

})(eventjs.proxy);
/*:
	"Tap" and "Longpress" event proxy.
	----------------------------------------------------
	CONFIGURE: delay (longpress), timeout (tap).
	----------------------------------------------------
	eventjs.add(window, "tap", function(event, self) {
		console.log(self.fingers);
	});
	----------------------------------------------------
	multi-finger tap // touch an target for <= 250ms.
	multi-finger longpress // touch an target for >= 500ms
*/

if (typeof(eventjs) === "undefined") var eventjs = {};
if (typeof(eventjs.proxy) === "undefined") eventjs.proxy = {};

eventjs.proxy = (function(root) { "use strict";

root.longpress = function(conf) {
	conf.gesture = "longpress";
	return root.tap(conf);
};

root.tap = function(conf) {
	conf.delay = conf.delay || 500;
	conf.timeout = conf.timeout || 250;
	conf.driftDeviance = conf.driftDeviance || 10;
	conf.gesture = conf.gesture || "tap";
	// Setting up local variables.
	var timestamp, timeout;
	// Tracking the events.
	conf.onPointerDown = function (event) {
		if (root.pointerStart(event, self, conf)) {
			timestamp = (new Date()).getTime();
			// Initialize event listeners.
			eventjs.add(conf.doc, "mousemove", conf.onPointerMove).listener(event);
			eventjs.add(conf.doc, "mouseup", conf.onPointerUp);
			// Make sure this is a "longpress" event.
			if (conf.gesture !== "longpress") return;
			timeout = setTimeout(function() {
				if (event.cancelBubble && ++event.cancelBubbleCount > 1) return;
				// Make sure no fingers have been changed.
				var fingers = 0;
				for (var key in conf.tracker) {
					var point = conf.tracker[key];
					if (point.end === true) return;
					if (conf.cancel) return;
					fingers ++;
				}
				// Send callback.
				if (conf.minFingers <= fingers && conf.maxFingers >= fingers) {
					self.state = "start";
					self.fingers = fingers;
					self.x = point.start.x;
					self.y = point.start.y;
					conf.listener(event, self);
				}
			}, conf.delay);
		}
	};
	conf.onPointerMove = function (event) {
		var bbox = conf.bbox;
		var touches = event.changedTouches || root.getCoords(event);
		var length = touches.length;
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var identifier = touch.identifier || Infinity;
			var pt = conf.tracker[identifier];
			if (!pt) continue;
			var x = (touch.pageX - bbox.x1);
			var y = (touch.pageY - bbox.y1);
			///
			var dx = x - pt.start.x;
			var dy = y - pt.start.y;
			var distance = Math.sqrt(dx * dx + dy * dy);
			if (!(x > 0 && x < bbox.width && // Within target coordinates..
				  y > 0 && y < bbox.height &&
				  distance <= conf.driftDeviance)) { // Within drift deviance.
				// Cancel out this listener.
				eventjs.remove(conf.doc, "mousemove", conf.onPointerMove);
				conf.cancel = true;
				return;
			}
		}
	};
	conf.onPointerUp = function(event) {
		if (root.pointerEnd(event, self, conf)) {
			clearTimeout(timeout);
			eventjs.remove(conf.doc, "mousemove", conf.onPointerMove);
			eventjs.remove(conf.doc, "mouseup", conf.onPointerUp);
			if (event.cancelBubble && ++event.cancelBubbleCount > 1) return;
			// Callback release on longpress.
			if (conf.gesture === "longpress") {
				if (self.state === "start") {
					self.state = "end";
					conf.listener(event, self);
				}
				return;
			}
			// Cancel event due to movement.
			if (conf.cancel) return;
			// Ensure delay is within margins.
			if ((new Date()).getTime() - timestamp > conf.timeout) return;
			// Send callback.
			var fingers = conf.gestureFingers;
			if (conf.minFingers <= fingers && conf.maxFingers >= fingers) {
				self.state = "tap";
				self.fingers = conf.gestureFingers;
				conf.listener(event, self);
			}
		}
	};
	// Generate maintenance commands, and other configurations.
	var self = root.pointerSetup(conf);
	// Attach events.
	eventjs.add(conf.target, "mousedown", conf.onPointerDown);
	// Return this object.
	return self;
};

eventjs.Gesture = eventjs.Gesture || {};
eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
eventjs.Gesture._gestureHandlers.tap = root.tap;
eventjs.Gesture._gestureHandlers.longpress = root.longpress;

return root;

})(eventjs.proxy);
/*:
	"Mouse Wheel" event proxy.
	----------------------------------------------------
	eventjs.add(window, "wheel", function(event, self) {
		console.log(self.state, self.wheelDelta);
	});
*/

if (typeof(eventjs) === "undefined") var eventjs = {};
if (typeof(eventjs.proxy) === "undefined") eventjs.proxy = {};

eventjs.proxy = (function(root) { "use strict";

root.wheelPreventElasticBounce = function(el) {
	if (!el) return;
	if (typeof(el) === "string") el = document.querySelector(el);
	eventjs.add(el, "wheel", function(event, self) {
		self.preventElasticBounce();
		eventjs.stop(event);
	});
};

root.wheel = function(conf) {
	// Configure event listener.
	var interval;
	var timeout = conf.timeout || 150;
	var count = 0;
	// Externally accessible data.
	var self = {
		gesture: "wheel",
		state: "start",
		wheelDelta: 0,
		target: conf.target,
		listener: conf.listener,
		preventElasticBounce: function(event) {
			var target = this.target;
			var scrollTop = target.scrollTop;
			var top = scrollTop + target.offsetHeight;
			var height = target.scrollHeight;
			if (top === height && this.wheelDelta <= 0) eventjs.cancel(event);
			else if (scrollTop === 0 && this.wheelDelta >= 0) eventjs.cancel(event);
			eventjs.stop(event);
		},
		add: function() {
			conf.target[add](type, onMouseWheel, false);
		},
		remove: function() {
			conf.target[remove](type, onMouseWheel, false);
		}
	};
	// Tracking the events.
	var onMouseWheel = function(event) {
		event = event || window.event;
		self.state = count++ ? "change" : "start";
		self.wheelDelta = event.detail ? event.detail * -20 : event.wheelDelta;
		conf.listener(event, self);
		clearTimeout(interval);
		interval = setTimeout(function() {
			count = 0;
			self.state = "end";
			self.wheelDelta = 0;
			conf.listener(event, self);
		}, timeout);
	};
	// Attach events.
	var add = document.addEventListener ? "addEventListener" : "attachEvent";
	var remove = document.removeEventListener ? "removeEventListener" : "detachEvent";
	var type = eventjs.getEventSupport("mousewheel") ? "mousewheel" : "DOMMouseScroll";
	conf.target[add](type, onMouseWheel, false);
	// Return this object.
	return self;
};

eventjs.Gesture = eventjs.Gesture || {};
eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
eventjs.Gesture._gestureHandlers.wheel = root.wheel;

return root;

})(eventjs.proxy);
/*
	"Orientation Change"
	----------------------------------------------------
	https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html#//apple_ref/doc/uid/TP40010526
	----------------------------------------------------
	Event.add(window, "deviceorientation", function(event, self) {});
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

root.orientation = function(conf) {
	// Externally accessible data.
	var self = {
		gesture: "orientationchange",
		previous: null, /* Report the previous orientation */
		current: window.orientation,
		target: conf.target,
		listener: conf.listener,
		remove: function() {
			window.removeEventListener('orientationchange', onOrientationChange, false);
		}
	};

	// Tracking the events.
	var onOrientationChange = function(e) {

		self.previous = self.current;
		self.current = window.orientation;
	    if(self.previous !== null && self.previous != self.current) {
			conf.listener(e, self);
			return;
	    }


	};
	// Attach events.
	if (window.DeviceOrientationEvent) {
    	window.addEventListener("orientationchange", onOrientationChange, false);
  	}
	// Return this object.
	return self;
};

Event.Gesture = Event.Gesture || {};
Event.Gesture._gestureHandlers = Event.Gesture._gestureHandlers || {};
Event.Gesture._gestureHandlers.orientation = root.orientation;

return root;

})(Event.proxy);



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

function coordCenter(coords){
  if(coords && coords.length>0){
    var minx=coords[0][0],miny=coords[0][1],maxx=minx,maxy=miny;
    for(var i=0,k=coords.length;i<k;i++){
      var coord=coords[i];
        minx=Math.min(minx,coord[0]);
        maxx=Math.max(maxx,coord[0]);
        miny=Math.min(miny,coord[1]);
        maxy=Math.max(maxy,coord[1]);
    }
    var x=(minx+maxx)/2,y=(miny+maxy)/2;
    return [x,y];
  }
  return null;
}

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
      getUrlParam:getUrlParam,
      coordCenter:coordCenter
       

    };
  })(typeof exports !== 'undefined' ? exports : this);
  

(function() {

    var slice = Array.prototype.slice;
  
    /**
     * Invokes method on all items in a given array
     * @memberOf fabric.util.array
     * @param {Array} array Array to iterate over
     * @param {String} method Name of a method to invoke
     * @return {Array}
     */
    function invoke(array, method) {
      var args = slice.call(arguments, 2), result = [];
      for (var i = 0, len = array.length; i < len; i++) {
        result[i] = args.length ? array[i][method].apply(array[i], args) : array[i][method].call(array[i]);
      }
      return result;
    }
  
    /**
     * Finds maximum value in array (not necessarily "first" one)
     * @memberOf fabric.util.array
     * @param {Array} array Array to iterate over
     * @param {String} byProperty
     * @return {*}
     */
    function max(array, byProperty) {
      return find(array, byProperty, function(value1, value2) {
        return value1 >= value2;
      });
    }
  
    /**
     * Finds minimum value in array (not necessarily "first" one)
     * @memberOf fabric.util.array
     * @param {Array} array Array to iterate over
     * @param {String} byProperty
     * @return {*}
     */
    function min(array, byProperty) {
      return find(array, byProperty, function(value1, value2) {
        return value1 < value2;
      });
    }
  
    /**
     * @private
     */
    function fill(array, value) {
      var k = array.length;
      while (k--) {
        array[k] = value;
      }
      return array;
    }
  
    /**
     * @private
     */
    function find(array, byProperty, condition) {
      if (!array || array.length === 0) {
        return;
      }
  
      var i = array.length - 1,
          result = byProperty ? array[i][byProperty] : array[i];
      if (byProperty) {
        while (i--) {
          if (condition(array[i][byProperty], result)) {
            result = array[i][byProperty];
          }
        }
      }
      else {
        while (i--) {
          if (condition(array[i], result)) {
            result = array[i];
          }
        }
      }
      return result;
    }
  
    /**
     * @namespace geomap.util.array
     */
    geomap.util.array = {
      fill: fill,
      invoke: invoke,
      min: min,
      max: max
    };
  
  })();
  

(function() {

    /**
     * @private
     * @param {String} eventName
     * @param {Function} handler
     */
    function _removeEventListener(eventName, handler) {
      if (!this.__eventListeners[eventName]) {
        return;
      }
      var eventListener = this.__eventListeners[eventName];
      if (handler) {
        eventListener[eventListener.indexOf(handler)] = false;
      }
      else {
        geomap.util.array.fill(eventListener, false);
      }
    }
  
    /**
     * Observes specified event
     * @memberOf geomap.Observable
     * @alias on
     * @param {String|Object} eventName Event name (eg. 'after:render') or object with key/value pairs (eg. {'after:render': handler, 'selection:cleared': handler})
     * @param {Function} handler Function that receives a notification when an event of the specified type occurs
     * @return {Self} thisArg
     * @chainable
     */
    function on(eventName, handler) {
      if (!this.__eventListeners) {
        this.__eventListeners = { };
      }
      // one object with key/value pairs was passed
      if (arguments.length === 1) {
        for (var prop in eventName) {
          this.on(prop, eventName[prop]);
        }
      }
      else {
        if (!this.__eventListeners[eventName]) {
          this.__eventListeners[eventName] = [];
        }
        this.__eventListeners[eventName].push(handler);
      }
      return this;
    }
  
    /**
     * Stops event observing for a particular event handler. Calling this method
     * without arguments removes all handlers for all events
     * @memberOf geomap.Observable
     * @alias off
     * @param {String|Object} eventName Event name (eg. 'after:render') or object with key/value pairs (eg. {'after:render': handler, 'selection:cleared': handler})
     * @param {Function} handler Function to be deleted from EventListeners
     * @return {Self} thisArg
     * @chainable
     */
    function off(eventName, handler) {
      if (!this.__eventListeners) {
        return this;
      }
  
      // remove all key/value pairs (event name -> event handler)
      if (arguments.length === 0) {
        for (eventName in this.__eventListeners) {
          _removeEventListener.call(this, eventName);
        }
      }
      // one object with key/value pairs was passed
      else if (arguments.length === 1 && typeof arguments[0] === 'object') {
        for (var prop in eventName) {
          _removeEventListener.call(this, prop, eventName[prop]);
        }
      }
      else {
        _removeEventListener.call(this, eventName, handler);
      }
      return this;
    }
  
    /**
     * Fires event with an optional options object
     * @memberOf Observable
     * @param {String} eventName Event name to fire
     * @param {Object} [options] Options object
     * @return {Self} thisArg
     * @chainable
     */
    function fire(eventName, options) {
      if (!this.__eventListeners) {
        return this;
      }
  
      var listenersForEvent = this.__eventListeners[eventName];
      if (!listenersForEvent) {
        return this;
      }
  
      for (var i = 0, len = listenersForEvent.length; i < len; i++) {
        listenersForEvent[i] && listenersForEvent[i].call(this, options || { });
      }
      this.__eventListeners[eventName] = listenersForEvent.filter(function(value) {
        return value !== false;
      });
      return this;
    }
 
    geomap.Observable = {
      fire: fire,
      on: on,
      off: off,
    };
  })();
  


  geomap.CommonMethods = {

    /**
     * Sets object's properties from options
     * @param {Object} [options] Options object
     */
    _setOptions: function(options) {
      for (var prop in options) {
        this.set(prop, options[prop]);
      }
    },
   
  
    /**
     * @private
     */
    _setObject: function(obj) {
      for (var prop in obj) {
        this._set(prop, obj[prop]);
      }
    },
  
    /**
     * Sets property to a given value. When changing position/dimension -related properties (left, top, scale, angle, etc.) `set` does not update position of object's borders/controls. If you need to update those, call `setCoords()`.
     * @param {String|Object} key Property name or object (if object, iterate over the object properties)
     * @param {Object|Function} value Property value (if function, the value is passed into it and its return value is used as a new one)
     * @return {geomap.Object} thisArg
     * @chainable
     */
    set: function(key, value) {
      if (typeof key === 'object') {
        this._setObject(key);
      }
      else {
        this._set(key, value);
      }
      return this;
    },
  
    _set: function(key, value) {
      this[key] = value;
    },
  
    /**
     * Toggles specified property from `true` to `false` or from `false` to `true`
     * @param {String} property Property to toggle
     * @return {geomap.Object} thisArg
     * @chainable
     */
    toggle: function(property) {
      var value = this.get(property);
      if (typeof value === 'boolean') {
        this.set(property, !value);
      }
      return this;
    },
  
    /**
     * Basic getter
     * @param {String} property Property name
     * @return {*} value of a property
     */
    get: function(property) {
      return this[property];
    }
  };

(function() {
    function extend(destination, source, deep) {
      if (deep) {
        if (!geomap.isLikelyNode && source instanceof Element) {
          destination = source;
        }
        else if (source instanceof Array) {
          destination = [];
          for (var i = 0, len = source.length; i < len; i++) {
            destination[i] = extend({ }, source[i], deep);
          }
        }
        else if (source && typeof source === 'object') {
          for (var property in source) {
            if (property === 'canvas' || property === 'group') {
              destination[property] = null;
            }
            else if (source.hasOwnProperty(property)) {
              destination[property] = extend({ }, source[property], deep);
            }
          }
        }
        else {
          destination = source;
        }
      }
      else {
        for (var property in source) {
          destination[property] = source[property];
        }
      }
      return destination;
    }
  
    function clone(object, deep) {
      return extend({ }, object, deep);
    }
  
    geomap.util.object = {
      extend: extend,
      clone: clone
    };
    geomap.util.object.extend(geomap.util, geomap.Observable);
  })();

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

      var PIXEL_RATIO = (function () {
        var c = document.createElement("canvas"),
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
    
    function hasClass(elem, cls) {
      cls = cls || '';
      if (cls.replace(/\s/g, '').length == 0) return false; //当cls没有参数时，返回false
      return new RegExp(' ' + cls + ' ').test(' ' + elem.className + ' ');
    }
   
    function addClass(elem, cls){
      if(!hasClass(elem, cls)){
          elem.className += ' ' + cls;
      }
  }

  function removeClass(elem, cls){
    if(hasClass(elem, cls)){
        var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, '') + ' ';
        while(newClass.indexOf(' ' + cls + ' ') >= 0){
            newClass = newClass.replace(' ' + cls + ' ', ' ');
        }
        elem.className = newClass.replace(/^\s+|\s+$/g, '');
    }
}

function formToJson(form) {
  var json = new Object();
  var inputs = form.getElementsByTagName("input"); // 取得所有DOM
  for (var index = 0; index < inputs.length; index++) { // 遍历DOM获取值
    var element = inputs[index];
    var key = element.name;
    var value="";
   
    if (element.type==='radio'){
      if(json[key] === undefined){
        json[key]="";
      }
      if(element.checked){
        value=element.value;
        json[key] = value;
      } 
    }else if(element.type === 'checkbox' ){
      if(json[key] === undefined){
        json[key]=[];
      }
      if(element.checked){
        value=element.value;
        json[key].push(value);
      } 
    }else if(element.type != 'button' && element.type != 'submit'){
      value = element.value;
      json[key] = value;
    }
        //checkbox应根据需求赋值为true/false或 1/0
    // json[key] = value // 利用 ES6 计算属性名为对象创建属性
  }

  var selectEl = form.getElementsByTagName("select"); // 取得所有DOM
  for (var index = 0; index < selectEl.length; index++) {
    var element = selectEl[index];
    var key = element.name;
    var i = element.selectedIndex;
    value = element.options[i].value;
    json[key] = value;
  }
  var textareas = form.getElementsByTagName("textarea"); // 思路同上
  for (var index = 0; index < textareas.length; index++) {
    var element = textareas[index];
    json[element.name] = element.value;
  }

  // console.log(JSON.stringify(json));
  return json;
} 

function parseToForm(form){
  var formId=form.id || ("form_"+ new Date());
  var root=geomap.element.create("form",{"id":formId},{"marginTop":"10px"});
  if(form.properties){
    // var form=formObj.form;
    var rowStyle={"height":"30px"};
    for(var j=0,jn=form.properties.length;j<jn;j++){
      var pro=form.properties[j];
      if(pro.type === "text"){
        var div=geomap.element.create("div",{},rowStyle);
        var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
        layer.innerText=pro.title;
        var input=geomap.element.create("input",{"type":"text","name":pro.id});
        input.value=pro.value;
        div.appendChild(layer);
        div.appendChild(input);
        root.appendChild(div);
      }else if(pro.type === 'hidden'){
        var input=geomap.element.create("input",{"type":"hidden","name":pro.id});
        input.value=pro.value;
        root.appendChild(input);
      }else if(pro.type === 'radio' || pro.type==='checkbox'){
        var div=geomap.element.create("div",{},rowStyle);
        var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
        layer.innerText=pro.title;
        div.appendChild(layer);
        for(var option in pro.option){
            var label=geomap.element.create("label");
            var radio=geomap.element.create("input",{"type":pro.type,"name":pro.id});
            radio.value=option;
            var labelTxt=geomap.element.create("a");
            labelTxt.innerText=pro.option[option];
            label.appendChild(radio);
            label.appendChild(labelTxt);
            div.appendChild(label);
          if(pro.value === option){
            radio.checked=true;
          } 
        }
        root.appendChild(div); 
      }else if(pro.type==='select'){
        var div=geomap.element.create("div",{},rowStyle);
        var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
        layer.innerText=pro.title;
        var selectObj=geomap.element.create("select",{"name":pro.id});
        for(var option in pro.option){
            var selOpt=geomap.element.create("option",{"type":'checkbox',"name":pro.id});
            selOpt.value=option;
            selOpt.innerText=pro.option[option]; 
            selectObj.appendChild(selOpt); 
          if(pro.value === pro.option[option]){
            radio.selected=true;
          } 
        }
        div.appendChild(layer);
        div.appendChild(selectObj);
        root.appendChild(div); 
      }else if(pro.type === 'button'){
        var div=geomap.element.create("div",{},rowStyle);
        var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
        layer.innerHTML="&nbsp;";
        div.appendChild(layer);
        var btn=geomap.element.create("input",{"type":"button","className":"btn","name":pro.id});
        btn.value=pro.value;
        div.appendChild(btn);
        root.appendChild(div);
        if(pro.click){
          eventjs.add(btn,"click",pro.click);
        }
      }else if(pro.type === 'buttons'){
        var div=geomap.element.create("div",{},rowStyle);
        var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
        layer.innerHTML="&nbsp;";
        div.appendChild(layer);
        for(var i=0,k=pro.group.length;i<k;i++){
          var groupBtn=pro.group[i];
          var btn=geomap.element.create("input",{"type":"button","className":"btn","name":groupBtn.id});
          btn.value=groupBtn.value;
          div.appendChild(btn);
          if(groupBtn.click){
            eventjs.add(btn,"click",groupBtn.click);
          }
        }
        root.appendChild(div);
      }
    }
  }
  if(form.buttons){
    var div=geomap.element.create("div",{},rowStyle);
    var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
    layer.innerHTML="&nbsp;";
    div.appendChild(layer);
    for(var i=0,k=form.buttons.length;i<k;i++){
      var groupBtn=form.buttons[i];
      var btn=geomap.element.create("input",{"type":"button","className":"btn","name":groupBtn.id});
      btn.value=groupBtn.value;
      div.appendChild(btn);
      if(groupBtn.click){
        eventjs.add(btn,"click",groupBtn.click);
      }
    }
    root.appendChild(div); 
  }
  return root;
}
 

    geomap.element = {
      create: create,
      setStyle: setStyle,
      setOptions:setOptions,
      hasClass:hasClass,
      addClass:addClass,
      removeClass:removeClass,
      formToJson:formToJson,
      parseToForm:parseToForm,
      createHiDPICanvas:createHiDPICanvas
    };
   
  })();

(function() {
  geomap.util.event = {

    _ev_xy_now:[0,0],
    _ev_xy_last:[0,0],
    _ev_smooth:[[0,0]],
    _ev_speed:[0,0],
    _ev_inertance:-1,
    _ev_speed_down:0.90,
    speedStart:function(x,y){
        this._ev_inertance=1;
        this._ev_speed=[0,0];
        this._ev_xy_last=[x,y];
        var p0=[0,0];
        this._ev_smooth=[p0,p0,p0,p0,p0,p0,p0,p0,p0,p0,p0,p0];
    },
    
    speedEnd: function() {
        this._ev_inertance=-1;
    },
    moving:function(x,y){
        this._ev_xy_now=[x,y];
    },
    speeding:function(){
        if(this._ev_inertance==1){
            var mspeed=geomap.util.matrixSubtract(this._ev_xy_now,this._ev_xy_last);
            this._ev_smooth.push(mspeed);
            this._ev_smooth.shift();
            var totalSpeed=[0,0];
            
            var s=this._ev_smooth;
            var k=s.length;
            for(var i=0;i<k;i++){
                totalSpeed=geomap.util.matrixAdd(totalSpeed,s[i]);
            }
            totalSpeed[0]=totalSpeed[0]/k;
            totalSpeed[1]=totalSpeed[1]/k;
            this._ev_speed=[Math.round(totalSpeed[0]),Math.round(totalSpeed[1])];
            this._ev_xy_last=this._ev_xy_now;
        }else{
            var s=this._ev_speed,rs=this._ev_speed_down;
            s=geomap.util.matrixMultiply(s,[rs,rs]);
            this._ev_speed=geomap.util.posFloor(s);
        }

        return this._ev_speed;
    }
    
  }
})();

(function() {

    var slice = Array.prototype.slice, emptyFunction = function() { },
  
        IS_DONTENUM_BUGGY = (function() {
          for (var p in { toString: 1 }) {
            if (p === 'toString') {
              return false;
            }
          }
          return true;
        })(),
  
        /** @ignore */
        addMethods = function(klass, source, parent) {
          for (var property in source) {
  
            if (property in klass.prototype &&
                typeof klass.prototype[property] === 'function' &&
                (source[property] + '').indexOf('callSuper') > -1) {
  
              klass.prototype[property] = (function(property) {
                return function() {
  
                  var superclass = this.constructor.superclass;
                  this.constructor.superclass = parent;
                  var returnValue = source[property].apply(this, arguments);
                  this.constructor.superclass = superclass;
  
                  if (property !== 'initialize') {
                    return returnValue;
                  }
                };
              })(property);
            }
            else {
              klass.prototype[property] = source[property];
            }
  
            if (IS_DONTENUM_BUGGY) {
              if (source.toString !== Object.prototype.toString) {
                klass.prototype.toString = source.toString;
              }
              if (source.valueOf !== Object.prototype.valueOf) {
                klass.prototype.valueOf = source.valueOf;
              }
            }
          }
        };
  
    function Subclass() { }
  
    function callSuper(methodName) {
      var parentMethod = null,
          _this = this;
  
      // climb prototype chain to find method not equal to callee's method
      while (_this.constructor.superclass) {
        var superClassMethod = _this.constructor.superclass.prototype[methodName];
        if (_this[methodName] !== superClassMethod) {
          parentMethod = superClassMethod;
          break;
        }
        // eslint-disable-next-line
        _this = _this.constructor.superclass.prototype;
      }
  
      if (!parentMethod) {
        return console.log('tried to callSuper ' + methodName + ', method not found in prototype chain', this);
      }
  
      return (arguments.length > 1)
        ? parentMethod.apply(this, slice.call(arguments, 1))
        : parentMethod.call(this);
    }
  
    /**
     * Helper for creation of "classes".
     * @memberOf geomap.util
     * @param {Function} [parent] optional "Class" to inherit from
     * @param {Object} [properties] Properties shared by all instances of this class
     *                  (be careful modifying objects defined here as this would affect all instances)
     */
    function createClass() {
      var parent = null,
          properties = slice.call(arguments, 0);
  
      if (typeof properties[0] === 'function') {
        parent = properties.shift();
      }
      function klass() {
        this.initialize.apply(this, arguments);
      }
  
      klass.superclass = parent;
      klass.subclasses = [];
  
      if (parent) {
        Subclass.prototype = parent.prototype;
        klass.prototype = new Subclass();
        parent.subclasses.push(klass);
      }
      for (var i = 0, length = properties.length; i < length; i++) {
        addMethods(klass, properties[i], parent);
      }
      if (!klass.prototype.initialize) {
        klass.prototype.initialize = emptyFunction;
      }
      klass.prototype.constructor = klass;
      klass.prototype.callSuper = callSuper;
      return klass;
    }
  
    geomap.Class = createClass;
  })();
  

(function(global) {

    'use strict';
   
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.DBStore) {
        geomap.warn('geomap.Image is already defined.');
      return;
    }
 
    geomap.DBStore=geomap.Class(geomap.CommonMethods, geomap.Observable,{
        type: 'DBStore',
        indexedDB:null,
        dbVersion:1.0,
        dbFile:"geomapFile",
        dbRequest:null,
        db:null, 
        openSuccess:false,
        openError:false,
        dbInitStatus:false,
        dbNames:["geomap"],
    initialize: function(options) {
          options || (options = { }); 
          this._setOptions(options);  
          
          var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
         // IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
          this.indexedDB=indexedDB;
          this.openStore();
    },
    createStore:function(event){
        console.log("Creating objectStore");
        var db = event.target.result;
      
        for(var i=0,k=this.dbNames.length;i<k;i++){
            var dbName=this.dbNames[i];
            if (!db.objectStoreNames.contains(dbName)) {
                db.createObjectStore(dbName);
            }
        }
        this.dbInitStatus=true;
    },
    openStore:function(){
        var request = this.indexedDB.open(this.dbFile, this.dbVersion);
        this.dbRequest=request;
        request.onerror =this.openStoreError.bind(this);
        request.onsuccess=this.openStoreSuccess.bind(this);
        request.onupgradeneeded = this.createStore.bind(this); 
    },
    openStoreError:function(event){
        console.log("Error creating/accessing IndexedDB database");
        this.openError=true;
        this.dbInitStatus=true;
        var myself=this;
        this.fire("open_error",myself);
    },
    openStoreSuccess:function(event){ 
        console.log("Success creating/accessing IndexedDB database");
        this.openSuccess=true;
        var request=this.dbRequest;
       var db = request.result;
       this.db=db;

    //    request.onupgradeneeded = this.createStore.bind(this);

        db.onerror = function (event) {
            console.log("Error creating/accessing IndexedDB database");
        };
        
        // Interim solution for Google Chrome to create an objectStore. Will be deprecated
        if (db.setVersion) {
            if (db.version != dbVersion) {
                var setVersion = db.setVersion(dbVersion);
                setVersion.onsuccess =this.createStore.bind(this);
            }else{
                this.dbInitStatus=true;
            }
           
        }else{
            this.dbInitStatus=true;
        }
        var myself=this;
         this.fire("open_success",myself);
       
    },
    clearData:function(dbName){
        if(this.openSuccess){
            var transaction =this.db.transaction(dbName, "readwrite");
            var tranStore=transaction.objectStore(dbName);
            var clearRes=tranStore.clear();
           var myself=this;
            clearRes.onsuccess=function(e){
                myself.fire("clear_success",myself);
                geomap.log('表名['+dbName+']数据清理成功');
            }
        }
    },
    deleteDb:function(dbName){
        this.indexedDB.deleteDatabase(dbName);
    },
    putStore:function(dbName,key,data){
        if(this.openSuccess){
            try{
                var transaction =this.db.transaction(dbName, "readwrite");
                var tranStore=transaction.objectStore(dbName);
                tranStore.put(data,key);
                // this.getTranStore(this.dbName).put(data,key);
                return true;
            }catch(e){
                // throw new Error("保存数据库失败");
                geomap.log("保存数据库失败");
                geomap.warn(e);
                return false;
            }
        }
        return false;
    },

    getStore:function(dbName,key){
        if(this.openSuccess){
            try{
                var transaction =this.db.transaction(dbName, "readwrite");
                var tranStore=transaction.objectStore(dbName);
                return new Promise(function(resolve, reject) {
                    tranStore.get(key).onsuccess=resolve;
                });
            }catch(e){
                geomap.log("获取数据库数据失败");
                geomap.warn(e);
                // throw new Error("获取数据库数据失败");
            }
        }
        return null;
    }
   
	 
    });


    geomap.GlobalDBStore=function (dbNames,dbFile,dbVersion){
        if(dbFile==undefined){
            dbFile="geomap";
        }
        if(dbVersion==undefined){
            dbVersion=1.0;
        }
        if(!geomap._GLOBAL_DB_STORE){
            geomap._GLOBAL_DB_STORE={};
        }
        var key=dbFile;
        if(!geomap._GLOBAL_DB_STORE[key]){
            var dbStore=new geomap.DBStore({dbNames:dbNames,dbFile:dbFile,dbVersion:dbVersion});
            var _global_store= {dbStore:dbStore,open:false};
            geomap._GLOBAL_DB_STORE[key]= _global_store;
            dbStore.on("open_success",function(){
                _global_store.open=true; 
            });
        //      var res=dbStore.openStore();
        //      if(res!=null){
        //         res.then(function(resolve,reject){
        //             dbStore.openStoreSuccess(null);
        //            // dbStore.clearData();
        //             _global_store.open=true; 
        //         },function(event){
        //             dbStore.openStoreError(event);
        //         });
        //        }
   
           }
           return geomap._GLOBAL_DB_STORE[key];
    }
})(typeof exports !== 'undefined' ? exports : this);

(function() {

    // var startAnim=function(arg){
    //     var duration = arg.duration || 1000;
    //     var action=arg.action;

    // };

    geomap.PosAnimation=geomap.Class(geomap.CommonMethods, geomap.Observable,{
 
	 
	easeLinearity:0.5,
	initialize: function( options) {
        options || (options = { }); 
		this.fnContext=this; 
        this._setOptions(options);  
	},
	run: function(loopTarget,callback,pos,duration,context){
		this.stop();
		this._callback = callback;
		this._callbackContext=context || this;
		this._inProgress = true;
		this._duration = duration || 0.25;
		// this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);
		this._easeOutPower = 1 / Math.max(this.easeLinearity, 0.2);

		this._pos=pos;
		this._startPos = pos[0];
		this._offset = pos[1].subtract(this._startPos);
		this._startTime = +new Date();
		this.fire('start');
		this._animate();
		this.loopTarget=loopTarget;
		this._timerId=this._animate.bind(this);
		this.loopTarget.on("looptime",this._timerId);
	},

	// @method stop()
	// Stops the animation (if currently running).
	stop: function () {
		if (!this._inProgress) { return; }

		this._step(true);
		this._complete();
	},

	_animate: function () {
		// this._animId = geomap.util.requestAnimFrame(this._animate, this);
		// console.log("[Animation.js]_animate=========");
		this._step();
	},

	_step: function (round) {
		var elapsed = (+new Date()) - this._startTime,
		    duration = this._duration * 1000;
			// console.log("[Animation.js]_step=========");
		if (elapsed < duration) {
			this._runFrame(this._easeOut(elapsed / duration), round);
		} else {
			this._runFrame(1);
			this._complete();
		}
	},

	_runFrame: function (progress, round) {
		var _stepProgress=this._offset.multiplyBy(progress);
		var pos = this._startPos.add(_stepProgress);
		if (round) {
			pos._round();
		}
		var e={animationTarget:this,step: _stepProgress,offset:this._offset,progress:progress,pos:this._pos};
		// console.log("[Animation.js]_runFrame=========");
		// this._fn.call(this._fnContext,pos,e);
		this._callback.call(this._callbackContext,pos,e);
        // this._fn(pos,e);   
		this.fire('step');
	},

	_complete: function () {
		// geomap.util.cancelAnimFrame(this._animId);
		this.loopTarget.off("looptime",this._timerId);
		this._inProgress = false; 
		this.fire('end');
	},

	_easeOut: function (t) {
		return 1 - Math.pow(1 - t, this._easeOutPower);
	}
    });

})();

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

   var ImageCache={
        cacheImage:function(img){
            if(!this.__cache_imgs){
            this.__cache_imgs={};
            }
            var url=img.src;
            this.__cache_imgs[url]=img;
            return img; 
        },
        getCache:function(url){
            if(!this.__cache_imgs){
              return null;
            }
            if(this.__cache_imgs[url]){
              return this.__cache_imgs[url];
            }
            return null; 
          },
        hasKey:function(url){
        if(!this.__load_img_key){
          this.__load_img_key={};
          this.__load_img_key[url]=1;
          return false;
        }
        if(this.__load_img_key[url]){
          this.__load_img_key[url]=this.__load_img_key[url]+1;
          return true;
        }else{
          this.__load_img_key[url]=1;
          return false;
        } 
      }
    };

    // function loadImage(url,callback,context){
    //   if(!url){
    //     callback && callback.call(context,url);
    //     return;
    //   }
    //   var img=geomap.window.document.createElement('img');
    //   var onLoadCallback=function(){
    //     callback && callback.call(context,img,false);
    //     img = img.onload = img.onerror = null;
    //     //img=img.onload=img.onerror=null;
    //   };
    //   img.onload=onLoadCallback;
    //   img.onerror=function(){
    //     //console.log("Error loading "+img.src);
    //     callback && callback.call(context,null,true);
    //     img = img.onload = img.onerror = null;
    //   };
    //   img.src=url;
    // };

    geomap.Image=geomap.Class(geomap.CommonMethods, geomap.Observable,{
        type: 'image',
        x:0,
        y:0,
        z:0,
        left:0,
        top:0,
        cacheTime:0,
        lockKey:1,
        tileKey:null,
        tableKey:null,
        image:null,
        loaded:false,
        ctx:undefined,
        tag:0,
        tileSize:256,
        headers:{},
        useCache:false,
        dbName:"tile",
        dbFile:"geomap",
        dbStore:undefined,
        layer:null,
    initialize: function(options) {
          options || (options = { }); 
          this._setOptions(options);  
          this.image=window.document.createElement('img');
          this._onloadHandle=this.onLoad.bind(this);
          this.image.onload=this._onloadHandle;
       //  this.setElement(element);
       this.getDBStore();
    },
    isTile:function(tile){
      return (tile.x === this.x && tile.y === this.y && tile.z === this.z && tile.cacheTime == this.cacheTime);
    },
    getTileUrl:function(url,tile){
      var imgUrl=geomap.util.template(url+ (/\?/.test(url) ? '&' : '?')+"cacheTime={cacheTime}",tile);
      return imgUrl;
    },
    loadTile:function(url,tile){
      this._setOptions(tile);  
      var imgSrc=this.getTileUrl(url,tile);
      if(this.getSrc() === imgSrc){
          this.drawCanvas();
        }else{
          this.setSrc(imgSrc);
        }
    },
    drawCanvas:function(){
      if(this.loaded && this.ctx !=undefined){
        if(this.layer && this.layer._drawLock == this.lockKey){
          this.ctx.drawImage(this.image,this.left,this.top);
          var other=this;
          this.fire("drawend",this);
        }
      }
    },
    // setElement:function(img){
    //   this._element=img;
    //   this._onloadHandle=this.onLoad.bind(this);
    //   this._element.onload=this._onloadHandle;
    // },
    // getElement:function(){
    //   if(!this._element){
    //     var img=geomap.window.document.createElement('img');
    //     this.setElement(img);
    //   }
    //   return this._element;
    // },
    draw:function(ctx){
      if(this.loaded){
        ctx.drawImage(this.image,this.x,this.y);
        if(this.drawCallback){
          var other=this;
          this.drawCallback(other);
        }
      }
    },
    onLoad:function(event){ 
      this.loaded=true;
      this.drawCanvas(); 
        this.fire("onload");
    },
    getDBStore:function(){
      if(!this.dbStore){
        var store=geomap.GlobalDBStore([this.dbName],this.dbFile);
        if(store.open){
          this.useCache=true;
        }else{
          var myself=this;
          store.dbStore.on("open_success",function(event){
            store.dbStore.clearData(myself.dbName);
            myself.useCache=true;
          });
        }

        this.dbStore=store.dbStore;
      }
      return  this.dbStore;
    },
    saveCache:function(url,blob){
      if(this.useCache){
        this.dbStore.putStore(this.dbName,url,blob);
      }
    },
    setSrc:function(url){ 
 
        this.loaded=false;
        this.imgSrc=url;
        var img=this.image;　
        var other=this;
    
        if(this.useCache){

          var store=this.dbStore.getStore(this.dbName,url);
            if(store!=null){
              store.then(function(event){
                  var imgFile = event.target.result;
                  if(imgFile !=undefined){
                    var imageURL = window.URL.createObjectURL(imgFile);
                    img.src=imageURL; 
                    // img.src=imgFile;
                    // window.URL.revokeObjectURL(imageURL); 
                  }else{
                    other.reqImageData(url).then(function(response){
                     
                      if(response !=undefined && response !=''){
                        var imageURL = window.URL.createObjectURL(response);
                        img.src=imageURL; 
                        other.saveCache(url,response);
                      }
                      // var canvas = document.createElement('canvas');
                      // var ctxt = canvas.getContext('2d');
                      // canvas.width = this.tileSize;
                      // canvas.height = this.tileSize;
                      // var w=this.tileSize;
                      // ctxt.clearRect(0, 0,w, w);
                      // ctxt.drawImage(img, 0, 0);
                      // var imgAsDataURL = canvas.toDataURL("image/png");
                      // other.saveCache(url,imgAsDataURL);
                      //  window.URL.revokeObjectURL(imageURL);
                    });
                  }
              });
            }else{
              this.reqImageData(url).then(function(response){
                var imageURL = window.URL.createObjectURL(response);
                img.src=imageURL;
              });
            }
        }else{
          this.reqImageData(url).then(function(response){
            var imageURL = window.URL.createObjectURL(response);
            img.src=imageURL;
          });
        }
        
    },
    getSrc:function(){
      return  this.imgSrc;
      // return this.image.src;
    },
 reqImageData:function(url) {
   var headers=this.headers;
  return new Promise(function(resolve, reject) {
    var request = new XMLHttpRequest();
    request.open('GET', url);
    request.responseType = 'blob';
    request.onload = function() {
      if (request.status === 200) {
        resolve(request.response);
      } else {
        reject(Error('Image didn\'t load successfully; error code:' + request.statusText));
      }
    };
    request.onerror = function() {
        reject(Error('There was a network error.'));
    };
    for(var key in headers){
      request.setRequestHeader(key,headers[key]);
    }
    request.send();
  });
},
    fromURL:function(url,x,y){
      if(x!=undefined && y != undefined){
        this.x=x;
        this.y=y;
      } 
      if(this.loaded && this.image.src === url){
        this.onLoad(this.image);
      }else{
        // this.loaded=false;
        this.image.src=url;
      }
      // if(this.getElement().src == url)
      // {
      //   this.onLoad(this._element);
      // }else{
      //   this.setSrc(url);
      // }
        
    }
	 
    });

})(typeof exports !== 'undefined' ? exports : this);

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
     * @param {String} [options.contentType="application/x-www-form-urlencoded"]
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
          body = options.body || options.parameters,
          contentType= (options.contentType === undefined) ? "application/x-www-form-urlencoded":options.contentType ,
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
      // }else if (method === 'POST' || method === 'PUT') {
      }else if (method != 'GET') {
        if(contentType && contentType.length >0){
          xhr.setRequestHeader('Content-Type', contentType);
        }
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

(function() {

    function Point(x,y){
        if(typeof x == 'string'){
            x=Number(x);
        }
        if(typeof y == 'string'){
            y=Number(y);
        }
        this.x=x;
        this.y=y;
    };

    var trunc = Math.trunc || function(v){
        return v>0? Math.floor(v):Math.ceil(v);
    };

    Point.prototype={
        clone: function(){
            return new Point(this.x,this.y);
        },
        zero:function(){
            this.x=0;
            this.y=0;
            return this;
        },
        add: function(point){
            return this.clone()._add(point);
        },
        _add: function(point){
            this.x +=point.x;
            this.y +=point.y;
            return this;
        },
        subtract: function(point){
            return this.clone()._subtract(point);
        },
        _subtract: function(point){
            this.x -= point.x;
            this.y -= point.y;
            return this;
        },
        divideBy:function(num){
            return this.clone()._divideBy(num);
        },
        _divideBy:function(num){
            this.x /=num;
            this.y /=num;
            return this;
        },
        multiplyBy:function(num){
            return this.clone()._multiplyBy(num);
        },
        _multiplyBy:function(num){
            this.x *=num;
            this.y *=num;
            return this;
        },
        scaleBy:function(point){
            return this.clone()._scaleBy(point);
        },
        _scaleBy:function(point){
            this.x *=point.x;
            this.y *=point.y;
            return this;
        },
        unscaleBy:function(point){
            return this.clone()._unscaleBy(point);
        },
        _unscaleBy:function(point){
            this.x=this.x / point.x;
            this.y=this.y / point.y;
            return this;
        },
        round:function(){
            return this.clone()._round();
        },
        _round:function(){
            this.x=Math.round(this.x);
            this.y=Math.round(this.y);
            return this;
        },
        floor:function(){
            return this.clone()._floor();
        },
        _floor:function(){
            this.x=Math.floor(this.x);
            this.y=Math.floor(this.y);
            return this;
        },
        ceil:function(){
            return this.clone()._ceil();
        },
        _ceil:function(){
            this.x=Math.ceil(this.x);
            this.y=Math.ceil(this.y);
            return this;
        },
        trunc:function(){
            return this.clone()._trunc();
        },
        _trunc:function(){
            this.x=trunc(this.x);
            this.y=trunc(this.y);
            return this;
        },
        distanceTo: function(point){
            var x=point.x-this.x,y=point.y-this.y;
            return Math.sqrt(x * x + y * y);
        },
        equals:function(p){
            p=toPoint(p);
            return p.x === this.x && p.y === this.y;
        },
        toString:function(){
            return "POINT("+this.x+" "+this.y+")";
        }

    };

    function toPoint(x,y){
        if(x instanceof Point){
            return x;
        }
        if(geomap.util.isArray(x)){
            return new Point(x[0],x[1]);
        }
        if(typeof x === 'object' && 'x' in x && 'y' in x){
            return new Point(x.x,x.y);
        }
        return new Point(x,y);
    }

    function isPoint(p0){
        if(p0 instanceof Point){
            return true;
        }
        return false;
    }

    function isZeroPoint(p0){
        return (p0.x==0 && p0.y ==0);
    }

    function hasXY(p0){
        if(!p0){
            return false;
        }
        if(isPoint(p0)){
            return true
        }
        if(typeof p0 === 'object' && 'x' in p0 && 'y' in p0){
            return true;
        }
        return false;
    }
    
    geomap.Point=Point;
    geomap.util.toPoint=toPoint;
    geomap.util.isPoint=isPoint;
    geomap.util.hasXY=hasXY;
    geomap.util.isZeroPoint=isZeroPoint;
  })();
  

(function() {

    var Point =geomap.Point;

    function Transformtion(a,b,c,d){
        this._a=a;
        this._b=b;
        this._c=c;
        this._d=d;
    };

    Transformtion.prototype={
        setOrigin: function(b,d){
            this._b=b;
            this._d=d;
            return this;
        },
        transform:function(point,scale){
            return this._transform(point,scale);
        },
        _transform:function(point,scale){
            scale = scale || 1;
            point.x =scale * (this._a * point.x + this._b);
            point.y= scale * (this._c * point.y + this._d);
            return point;
        },
        untransform:function(point,scale){
            scale = scale || 1;
            return new Point(
                (point.x /scale -this._b)/ this._a,
                (point.y /scale -this._d)/ this._c);
        }
        
    };

    

 

    geomap.Transformtion=Transformtion;
     
 
  })();
  

(function() {

      var Point =geomap.Point;
  
      function TouchZoom(map){
          this._map=map; 
      };
  
      TouchZoom.prototype={
          addEvent:function(element){
              eventjs.add(element,"gesture",this.handle.bind(this));
          },
          handle:function(event,self){
              eventjs.cancel(event);
              if(self.state == 'start'){
                  this._zooming=true;
                  this._moved=false;
                  this._zoom=this._map.zoom;
                   return ;
              }else if(self.state == 'end'){
                  this._map._touchZoomStatus=false;
                  if(!this._moved || !this._zooming){
                      this._zooming=false;
                      return this;
                    }
                    this._zooming=false; 
                   this._map.touchZoomEnd(event,this._centerPos,self.scale);
                  return ;
              }else{
                  if(!this._zooming ){
                      this._zooming=false;
                      return this;
                  }
                  if(!this._moved){ 
                      var p0=new Point(self.touches[0].x,self.touches[0].y);
                      var p1=new Point(self.touches[1].x,self.touches[1].y);
                      var cpos=p0.add(p1)._divideBy(2);
                      this._centerPos=cpos;
                     this._map.touchZoomStart(event,this._centerPos);
                      this._moved=true;
                      return;
                    }
                 
                    this._map.touchZoom(event,this._centerPos,self.scale);
                  return ;
              }
          } 
           
      };
  
      function Drag(map){
          this._map=map;
          this._inertia=true;
          this._inertia_speed=[0,0];
      };
  
      Drag.prototype={
          addEvent:function(element){
              eventjs.add(element,"drag gesture",this.handle.bind(this));
              if(this.dragingSpeedTimeId === undefined){
              this.dragingSpeedTimeId=this.dragingSpeed.bind(this);
              this._map.on("looptime",this.dragingSpeedTimeId);
              }
          },
          dragingSpeed:function(){
              if(this._drag_speed && this._draging){
                var  directionX =this._drag_nowpos[0] - this._drag_lastpos[0];
                var  directionY =this._drag_nowpos[1] - this._drag_lastpos[1];
                this._drag_speed.push([directionX,directionY]);
                this._drag_speed.shift();
                var totalSpeed=[0,0];
                var num=this._drag_speed.length;
                for(var i=0;i<num;i++){
                    totalSpeed[0]=totalSpeed[0]+this._drag_speed[i][0];
                    totalSpeed[1]=totalSpeed[1]+this._drag_speed[i][1];
                }
                var speedX=Math.round(totalSpeed[0]/num);
                var speedY=Math.round(totalSpeed[1]/num);
                this._inertia_speed=[speedX,speedY];
                this._drag_lastpos=this._drag_nowpos;
            }else{
                var mEventSpeed=this._inertia_speed, s=mEventSpeed;
                if(Math.abs(s[0])<0 )
                	{
                        mEventSpeed[0]=0;
		                 
                	}
                if(Math.abs(s[1])<0)
                	{
                	  
		                mEventSpeed[1]=0;
                	}
                    mEventSpeed[0]=s[0]*0.97;
                    mEventSpeed[1]=s[1]*0.97;
                    this._inertia_speed=mEventSpeed;
            }
          },
          handle:function(event,self){ 
            if(!self.fingers || self.fingers ==1){
              eventjs.cancel(event);
               event.openInertia=this._inertia;
              if(self.state == 'down'){
                  this._draging=true;
                  this._moved=false;
                  if(this._inertia){
                    var p0= [0,0];
                      this._drag_speed=[p0,p0,p0,p0,p0,p0,p0,p0]; 
                    //   this._positions=[];
                      this._inertia_speed=[0,0];
                      this._drag_lastpos=[self.x,self.y];
                      this._drag_nowpos=[self.x,self.y];
                    //   this._times = [];
                    //   this._lastTime = +new Date();
                    //   this.dragingSpeed(this._lastTime );
                      
                  }
                  return ;
              }else if(self.state == 'up'){
                  if(!this._moved || !this._draging){
                      this._draging=false;
                      this._moved=false;
                      return this;
                  }
                  this._traging=false; 
                  var newevent=event;
                  newevent.inertiaSpeed= this._inertia_speed;
                  var pos=new Point(self.x,self.y);
                  this._map.dragEnd(newevent,pos);
                  return this;
              }else{
                  if(!this._draging  || this._map._touchZoomStatus){
                      this._draging=false;
                      return this;
                  }
                  if(!this._moved ){
                      this._map.dragStart(event,new Point(self.x,self.y));
                      this._moved=true;
                      return this;
                  }
                  if(this._inertia){
                      //TODO 惯性操作
                    //    var time= +new Date();
                     this._drag_nowpos=[self.x,self.y];
                    //  this.dragingSpeed(time);
                 }
                 var pos=new Point(self.x,self.y);
                 this._map.dragChange(event,pos);
              }
              }
          } 
      };
  
      function ScrollWheelZoom(map){
          this._map=map;
          this.wheelDebounceTime=40;
          this.wheelPxPerZoomLevel=60;
      };
  
      function userAgentContains(str) {
        return navigator.userAgent.toLowerCase().indexOf(str) >= 0;
    }

      ScrollWheelZoom.prototype={
          addEvent:function(element){
              eventjs.add(element,"wheel",this.handle.bind(this));
          },
          getWheelDelta:function(e){
            var ie = 'ActiveXObject' in window;
            var ielt9 = ie && !document.addEventListener;
            var webkit = userAgentContains('webkit');
            var android = userAgentContains('android');
            var android23 = userAgentContains('android 2') || userAgentContains('android 3');
            var opera = !!window.opera;
            var safari = !chrome && userAgentContains('safari');
            var mobile = typeof orientation !== 'undefined' || userAgentContains('mobile');
            var edge = 'msLaunchUri' in navigator && !('documentMode' in document);
            var chrome = !edge && userAgentContains('chrome');
            var win = navigator.platform.indexOf('Win') === 0;
            var gecko = userAgentContains('gecko') && !webkit && !opera && !ie;
            var wheelPxFactor =(win && chrome) ? 2 * window.devicePixelRatio :gecko ? window.devicePixelRatio : 1;

            return edge ? e.wheelDeltaY / 2 : // Don't trust window-geometry-based delta
            (e.deltaY && e.deltaMode === 0) ? -e.deltaY / wheelPxFactor : // Pixels
            (e.deltaY && e.deltaMode === 1) ? -e.deltaY * 20 : // Lines
            (e.deltaY && e.deltaMode === 2) ? -e.deltaY * 60 : // Pages
            (e.deltaX || e.deltaZ) ? 0 :	// Skip horizontal/depth wheel events
            e.wheelDelta ? (e.wheelDeltaY || e.wheelDelta) / 2 : // Legacy IE pixels
            (e.detail && Math.abs(e.detail) < 32765) ? -e.detail * 20 : // Legacy Moz lines
            e.detail ? e.detail / -32765 * 60 : // Legacy Moz pages
            0;
          },
          handle:function(event,self){
              eventjs.cancel(event);
              var delta=self.wheelDelta;//this.getWheelDelta(event);
              if(self.state == 'start'){
                  this._zooming=true;
                  this._zooming_start=false; 
              }else if(self.state == 'end'){
                  if(!this._zooming){
                      this._zooming_start=false;
                          this._zooming=false;
                          return this;
                  }
                //   if(this._timer){
                //       clearTimeout(this._timer);
                //       this._timer=null;
                //   }
                  this._map.wheelZoomEnd(event,new Point(event.offsetX,event.offsetY),delta);
              }else{
                  if(!this._zooming ){
                      return this;
                  }
                  if(!this._zooming_start){
                      this._zooming_start=true;
                      this._map.wheelZoomStart(event,new Point(event.offsetX,event.offsetY));
                      return 
                  }
                //   if(!this._startTime){
                //       this._startTime= +new Date(); 
                //   }
                //   var left=Math.max(this.wheelDebounceTime - (+new Date() - this._startTime),0);
                //   if(this._timer){
                //       clearTimeout(this._timer);
                //       this._timer=null;
                //   }
                  var point=new Point(event.offsetX,event.offsetY);
                //   this._timer=setTimeout(this._preformWheelZoom.bind(this,event,point,self.wheelDelta),left);
                this._map.wheelZoom(event,point,delta);
                  
              } 
          },
          _preformWheelZoom:function(event,point,delta){
              this._map.wheelZoom(event,point,delta);
          }
      };
   
      geomap.Event={TouchZoom:TouchZoom,Drag:Drag,ScrollWheelZoom:ScrollWheelZoom};
       
   
    })();
    

(function() {

    var Point =geomap.Point;

    function Bounds(p0,p1){
        this.min=p0;
        this.max=p1;
    };

    Bounds.prototype={
        clone:function(){
            return new Bounds(this.min.clone(),this.max.clone());
        },
        getCenter:function(){
            return new Point((this.min.x+this.max.x)/2,(this.min.y+this.max.y)/2);
        },
        getBottomLeft:function(){
            return new Point(this.min.x,this.max.y);
        },
        getTopRigth:function(){
            return new Point(this.max.x,this.min.y);
        },
        getSize:function(){
            return this.max.subtract(this.min);
        },
        contains:function(p0){
            var min,max;
            p0=geomap.util.toPoint(p0);
            min=p0.min;
            max=p0.max;
            return (min.x >= this.min.x) && (max.x <= this.max.x) && (min.y >=this.min.y) && (max.y <= this.max.y);
        },
        //是否有边界相交　
        intersects:function(bounds){
            var min=this.min,max=this.max,min2=bounds.min,max2=bounds.max,
            xIntersects=(max2.x>=min.x) && (min2.x <=max.y),
            yIntersects=(max2.y>=min.y) && (min2.y <= max.y);
            return xIntersects && yIntersects;
        },
        //是否重叠
        overlaps:function(bounds){
            var min=this.min,max=this.max,min2=bounds.min,max2=bounds.max,
            xOverlaps=(max2.x> min.x) && (min2.x < max.y),
            yOverlaps=(max2.y> min.y) && (min2.y < max.y);
            return xOverlaps && yOverlaps;
        },
        toString:function(){
            return "Bounds("+this.min.x+","+this.min.y+","+this.max.x+","+this.max.y+")";
        }


    };

    function toBounds(minx,miny,maxx,maxy){
        var isPoint=geomap.util.isPoint,hasXY=geomap.util.hasXY,toPoint=geomap.util.toPoint;
        if(!minx || minx instanceof Bounds){
            return minx;
        }
        if(miny && isPoint(minx) && isPoint(miny)){
            return new Bounds(minx,miny);
        }
        if(hasXY(minx) && hasXY(miny)){
            return new Bounds(toPoint(minx),toPoint(miny));
        }
        return new Bounds(toPoint(minx,miny),toPoint(maxx,maxy));
    };

    geomap.Bounds=Bounds;
    geomap.util.toBounds=toBounds;

 
  })();
  


(function(global) {

    if (!global.geomap) {
        global.geomap = { };
      }
    
      if (global.geomap.view) {
        geomap.warn('geomap.Map is already defined.');
        return;
      }
    
      geomap.view ={};

  })(typeof exports !== 'undefined' ? exports : this);


(function() {
    
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
    
    geomap.view.Frame= geomap.Class(geomap.CommonMethods, geomap.Observable,  {
      type: 'BaseFrame',
      container:undefined,
      headBar:undefined,
      bodyBar:undefined,
      rootFrame:undefined,
      closeBtn:undefined,
      x:0,
      y:0,
      w:200,
      h:120,
      pos:'center',
      posPad:10,
      headHeight:26,
      bodyheight:50,
      closeBtnSize:20,
      padding:4,
      title:"",
      body:undefined,
      radius:6,
      closeType:1,//１为直关闭，２为隐藏
      showBody:true,
      canHeadDblClick:true,
      boxShadow:"2px 2px 4px #888888",
      background:"rgba(255,255,255,0.97)",
      closeIcon:'<svg t="1619335973042" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1119" width="20" height="20"><path d="M391.68 667.306667a34.133333 34.133333 0 0 1-24.132267-58.2656L464.571733 512l-97.024-97.041067a34.133333 34.133333 0 1 1 48.264534-48.264533l97.041066 97.041067 96.187734-96.170667a34.133333 34.133333 0 1 1 48.264533 48.264533l-96.1024 96.1024 96.017067 95.3344a34.133333 34.133333 0 1 1-48.093867 48.4352l-96.187733-95.505066-97.109334 97.109333c-6.673067 6.656-15.4112 10.001067-24.149333 10.001067z" p-id="1120"></path></svg>',
      initialize: function(container,options) {
        options || (options = { }); 
        this._setOptions(options);
        this.container=container;
        // borderRadius:opt.borderRadius,boxShadow:"2px 2px 4px #888888"
        this.rootFrame =geomap.element.create("div",{className:"rootFrame"},{zIndex:"1000",position:"absolute",top:"0px",left:"0px",border:"0px solid #989898",background:this.background,borderRadius:this.radius+"px",boxShadow:this.boxShadow});
        this.headBar =geomap.element.create("div",{className:"headBar"},{position:"absolute",top:"0px",left:"0px",borderBottom:"1px solid #b9b9b9"});
        this.bodyBar =geomap.element.create("div",{className:"body"},{position:"absolute",top:this.headHeight+"px",left:"0px"});
        var left=this.w-this.closeBtnSize-this.padding,top=this.padding;
        this.closeBtn=geomap.element.create("div",{className:"closeBtn"},{position:"absolute",top:top+"px",left:left+"px",width:this.closeBtnSize+"px",height:this.closeBtnSize+"px"});
        this.closeBtn.innerHTML=this.closeIcon;
        this.rootFrame.appendChild(this.headBar);
        this.rootFrame.appendChild(this.bodyBar);
        this.rootFrame.appendChild(this.closeBtn);
        this.container.appendChild(this.rootFrame);
        this.resetPos();
        this.resetStyle();
        this.resetBody();
        this._resize=this.resetStyle.bind(this);
        var closeFn=this.close.bind(this);
        this._close=closeFn
       // this.on("resize",this._resize);
        // this.on("close",this._close);
        var togle
        
        eventjs.add(this.closeBtn,"click touch",this._close);
        eventjs.add(this.headBar,"drag gesture",this.dragHeadBarEv.bind(this));
        if(this.canHeadDblClick){
          eventjs.add(this.headBar,"dblclick",this.displayBodyToggle.bind(this));
        }
        eventjs.add(this.rootFrame,"click touch",this.rootFrameClickEv.bind(this));
        // this.closeBtn.click=closeFn;
        this.rootFrameClickEv();
      }, 
      rootFrameClickEv:function(event,self){
        if(event){
          eventjs.cancel(event);
        }
        if(geomap._FrameLayerZIndex){
          geomap._FrameLayerZIndex+=1;
          this.rootFrame.style.zIndex= geomap._FrameLayerZIndex;
        }else{
          geomap._FrameLayerZIndex=geomap.util.formatNum(this.rootFrame.style.zIndex);
          this.rootFrame.style.zIndex=geomap._FrameLayerZIndex;
        }
      },
      dragHeadBarEv:function(event,self){
        eventjs.cancel(event);
        if(self.state == 'down'){
          var x=self.x,y=self.y;
          this._start_point=new Point(x,y);
          this._status_drag=true;
          this.rootFrameClickEv(event,self);
        }else if(self.state == 'up'){
          this._status_drag=false;
          var p=new Point(self.x,self.y);
          p._subtract(this._start_point);
          var left=this.x+p.x,top=this.y+p.y;
          if(left< (this.closeBtnSize-this.w)){
            left= this.closeBtnSize-this.w;
          }else if(left > (window.innerWidth -5)){
            left=window.innerWidth -5;
          }
          
          if(top<0){
            top=0;
          }else if(top > (window.innerHeight - this.headHeight)){
            top=window.innerHeight-this.headHeight;
          }

          this.x=left;
          this.y=top;
          this.resetStyle();
        }else{
          if(this._status_drag){
            var p=new Point(self.x,self.y);
            // geomap.debug("#=====p0:"+p.toString()+",sp:"+this._start_point.toString());
            p._subtract(this._start_point);
            // geomap.debug("#=====p1:"+p.toString());
            var left=this.x+p.x,top=this.y+p.y;
            if(left<(this.closeBtnSize-this.w)){
              left=(this.closeBtnSize-this.w);
            }else if(left > (window.innerWidth -5)){
              left=window.innerWidth-5;
            }
            
            if(top<0){
              top=0;
            }else if(top > (window.innerHeight -this.headHeight)){
              top=window.innerHeight-this.headHeight;
            }
       
            this.rootFrame.style.left=left+"px";
            this.rootFrame.style.top=top+"px";
          }

        }
      },
      resetPos:function(){
        var w=this.container.clientWidth || window.clientWidth,h=this.container.clientHeight || window.innerHeight;
        var pad=this.posPad;
         if(this.pos=== 'center'){
              this.x=Math.floor((w-this.w)/2);
              this.y=Math.floor((h-this.h)/2);
              return this;
         }
         if(this.pos=== 'rc'){
          this.x=Math.floor((w-this.w))-pad;
          this.y=Math.floor((h-this.h)/2);
          return this;
          }
          if(this.pos=== 'lc'){
            this.x=pad;
            this.y=Math.floor((h-this.h)/2);
            return this;
            }
         if(this.pos === 'lb'){
            this.x= pad;
            this.y=h-this.h - pad;
            return this;
         }
         if(this.pos === 'rb'){
           this.x=w-this.w - pad;
           this.y=h-this.h - pad;
           return this;
         }
          
         if(this.pos === 'rt'){
           this.x=w-this.w - pad;
           this.y=pad;
           return this;
         }
         if(this.pos=== 'lt'){
           this.y= pad;
           this.x= pad;
           return this;
         }

      },
      resetStyle:function(){
        this.bodyheight=this.h-this.headHeight;
        var winW=window.innerWidth,winH=window.innerHeight;
        this.w=Math.min(this.w,winW);
        this.h=Math.min(this.h,winH);
        var left=this.w-this.closeBtnSize-this.padding,top=this.padding; 
        var  headH=this.headHeight-this.padding;
        geomap.element.setStyle(this.closeBtn,{width:this.closeBtnSize+"px",height:this.closeBtnSize+"px",left:left+"px",top:top+"px"});
        geomap.element.setStyle(this.headBar,{width:(this.w-this.padding)+"px",height:headH+"px",paddingLeft:this.padding+"px",paddingTop:this.padding+"px"});
        if(this.showBody){
          geomap.element.setStyle(this.bodyBar,{width:this.w+"px",height:this.bodyheight+"px",top:this.headHeight+"px",display:""});
          geomap.element.setStyle(this.rootFrame,{width:this.w+"px",height:this.h+"px",top:this.y+"px",left:this.x+"px"});
        }else{
          geomap.element.setStyle(this.bodyBar,{width:this.w+"px",height:"0px",top:this.headHeight+"px",display:"none"});
          geomap.element.setStyle(this.rootFrame,{width:this.w+"px",height:this.headHeight+"px",top:this.y+"px",left:this.x+"px"});
        }
        return this;
      },
      resetBody:function(){
        // this.headBar.innerHTML=this.title;
        // this.bodyBar.innerHTML=this.body;
        this.setTitle(this.title);
        this.setBody(this.body);
        return this;
      },
      setTitle:function(title){
        this.title=title;
        this.headBar.innerHTML=this.title;
        return this;
      },
      setBody:function(body){
        this.body=body;
        if(this.body === undefined){
          this.bodyBar.innerHTML="";
        }else if(typeof this.body === 'string'){
          this.bodyBar.innerHTML=this.body;
        }else{
          this.bodyBar.innerHTML="";
          this.bodyBar.appendChild(this.body);
          // this.setFormJson(this.body);
        }
      
        if(this._loadBody){
          this.fire("datachange");
        } 
        this._loadBody=true;
        return this;
      },
      setData:function(title,body,options){
        this.setTitle(title);this.setBody(body);
        if(options!= undefined){
          this._setOptions(options);
          this.resetStyle();
        }
       
      },
      close:function(){
        if(this.closeType ===1){
          this.fire("closestart"); 
          this.body=null;
          this.container.removeChild(this.rootFrame);
          this.fire("close"); 
          delete this;
        }else{
          this.hide();
          this.fire("close"); 
        }
      },
     
      show:function(){
        if(this.rootFrame.style.display === 'none'){
          this.rootFrame.style.display="";
          this.fire("show"); 
        }
        this.rootFrameClickEv();
        return this;
      },
      hide:function(){
        if(this.rootFrame.style.display != 'none'){
          this.rootFrame.style.display="none";
          this.fire("hide"); 
        }
        return this;
      },
      displayToggle:function(){
        if(this.rootFrame.style.display === 'none'){
          this.show();
        }else{
          this.hide();
        }
      },
      displayBodyToggle:function(){
        this.showBody= !this.showBody;
        this.resetStyle();
      }
      
    });
   
  
  })();
  

(function() {

    var Point =geomap.Point;
    var Bounds =geomap.Bounds;
    var toPoint=geomap.util.toPoint;
    geomap.Model={
        origin:new Point(-180,90),
        tileSize:256,
        res:undefined,
        bounds:undefined,
        center:new Point(0,0),
        viewSize:undefined,
        zoom:0,
        map:undefined,
        transformtion:new geomap.Transformtion(1,0,-1,0),
        // transformtion2:new geomap.Transformtion(1,0,1,0),
        // transformtion2:new geomap.Transformtion(1 / 180, 1, 1 / 180, 0.5),
        // transformtion3:new geomap.Transformtion(1 / 180, 1, -1 / 180, 0.5),
        // transformtion3:new geomap.Transformtion(1 / 180, 1, 1 / 180, 0.5),
        resolution:function(zoom)
        {
            var x = (360 / (Math.pow(2, zoom)) / this.tileSize);
            var y = (180 / (Math.pow(2, zoom)) / this.tileSize);
           return new Point(x,y);
        },
        getScale:function(zoom){
            return this.tileSize * Math.pow(2,zoom);
        },
        getZoomScale:function(toZoom,fromZoom){
            fromZoom = fromZoom === undefined ? this.zoom:fromZoom;
            return this.getScale(toZoom) / this.getScale(fromZoom);
         },
        getBounds:function(){
            return this._getBounds().clone();
        },
        _getBounds:function(){
            if(!this._bounds || this._boundsChanged){
                var r1,s1,p1,cp1,min,max;
                cp1=this.center;
                r1=this.resolution(this.zoom);
                s1=this.getSize().divideBy(2);
                p1=r1._scaleBy(s1);
                // min=cp1.subtract(p1);
                // max=cp1.add(p1);
                // min=this.modelCoord(min);
                // max=this.modelCoord(max);
                min=cp1.subtract(this.modelCoord(p1));
                max=cp1.add(this.modelCoord(p1));
                // min=this.modelCoord(min);
                // max=this.modelCoord(max);
                this._bounds= new Bounds(min,max);
                this._boundsChanged=false;
            }
            return this._bounds;
        },
        setZoom:function(zoom){
            if(this.zoom!=zoom){
                this._boundsChanged=true;
            }
            this.zoom=zoom;
            return this;
        },
        setZoomCoord:function(coord,zoom){ 
            if(this.zoom==zoom){
                return this;
            }
            var sc1=this.coordToScreen(coord);
            var r1=this.resolution(zoom);
            // var min= this.modelCoord(coord).subtract(sc1._scaleBy(r1));
            var min= coord.subtract(this.modelCoord(sc1._scaleBy(r1)));
            // this.center=this.getSize()._unscaleBy(2)._scaleBy(r1).add(min);
            this.center=this.getSize().divideBy(2)._scaleBy(r1).add(min);
            this.zoom=zoom;
            this._boundsChanged=true;
            return this;
        },
        setZoomScreen:function(point,zoom){ 
            var p1=point; 
               r1=this.resolution(zoom),
              coord=this.screenToCoord(p1),
              viewHalf=this.getSize().divideBy(2),
              centerOffset=viewHalf.subtract(p1);
            //   this.center=this.modelCoord(coord)._add(centerOffset._scaleBy(r1));
              this.center=coord._add(this.modelCoord(centerOffset._scaleBy(r1)));
            this.zoom=zoom;
            this._boundsChanged=true;
            return this;
        },
        panScreen:function(opts){
            var p1=toPoint(opts);
            var zoom=this.zoom;
            var  r1=this.resolution(zoom);
            this.center._subtract(this.modelCoord(p1.scaleBy(r1)));
            this._boundsChanged=true;
        },
        screenToCoord:function(p0){
            var bounds=this.getBounds();
            var r1=this.resolution(this.zoom);
            var  p1=this.modelCoord(r1._scaleBy(p0));
           return bounds.min._add(p1);
        },
        coordToScreen:function(p0){
            var bounds=this.getBounds();
           
            var r1=this.resolution(this.zoom);
            var p1=this.modelCoord(p0.subtract(bounds.min));
             return p1._unscaleBy(r1);
           //return this.modelCoord(p1._unscaleBy(r1));
        },
        toTransform:function(coord,scale){
            return this.transformtion.transform(coord,scale);
        },
        modelCoord:function(coord){
            return this.toTransform(coord,1);
        }
        // toTransformScreen:function(point,scale){
        //     return this.transformtion2.transform(point,scale);
        // }
      
    // project: function (latlng) {
	// 	return new Point(latlng.x, latlng.y);
	// },

	// unproject: function (point) {
	// 	return new Point(point.y, point.x);
	// },
    //     coordToScreen1:function(p0){
    //        var p= this.unproject(p0);
    //        var scale = this.getScale(this.zoom);
    //        var np= this.transformtion3._transform(p,scale);
    //        return np;
    //     },
    //     screenToCoord1:function(p0){
    //         var p= this.project(p0);
    //         var scale = this.getScale(this.zoom);
    //         var np= this.transformtion3.untransform(p,scale);
    //         return np;
    //     }

    }; 
     
  })();
  

(function() {

    var Point =geomap.Point;
    var Bounds =geomap.Bounds;
    var toPoint=geomap.util.toPoint;
    geomap.Caliper={
        capliperPos:[5,5],// 屏幕坐标位置
        capliperHeight:150,
        capliperWidth:3,
        caliperDraw:function(ctx){
            var maxZ=this.maxZoom;
            var minZ=this.minZoom;
            var z=this.zoom,num=maxZ-minZ+1;
            var x=this.capliperPos[0],y=this.capliperPos[1],height=this.capliperHeight, offset=Math.ceil(height/num),len=this.capliperWidth;
            height=offset*(num-1);

            var  nextNum=z-minZ,endy=y+nextNum*offset;
            ctx.fillStyle = "#009688";
            ctx.strokeStyle="#009688";
            this.drawTriangle(ctx,x,endy,len,x,y,offset,len,nextNum);

            // ctx.strokeStyle="black"; 
            // ctx.beginPath();
            // ctx.moveTo(x, endy);
            // ctx.lineTo(x,endy+(num-nextY-1)*offset);
            // for(var i=nextY+1;i<num;i++){
            //     var sy=i*offset;
            //     var sx=(i%2) * len+len;
            //     ctx.moveTo(x, y+sy);
            //     ctx.lineTo(x+sx,y+sy);
            // }
            // ctx.stroke();

            if((nextNum+1) == num){
                ctx.strokeStyle="#009688"; 
            }else{
                var color1=(endy-y+1)/height;
                color1=color1>1?1:color1;
                var lingrad = ctx.createLinearGradient(x,y,x,y+height);
                lingrad.addColorStop(0, '#009688');
                lingrad.addColorStop(color1, '#009688');
                lingrad.addColorStop(color1, '#000000');
                lingrad.addColorStop(1, '#000000');
                ctx.strokeStyle=lingrad; 
            }
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x,y+height);
            for(var i=0;i<num;i++){
                var sy=i*offset;
                var sx=(i%2) * len+len;
                ctx.moveTo(x, y+sy);
                ctx.lineTo(x+sx,y+sy);
            }
            ctx.stroke();
           
        },
         drawTriangle:function(ctx,endX,endY,r,sx,sy,offset,len,num) {
              ctx.fillStyle = "#009688";
              ctx.strokeStyle="#009688";
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(sx, endY);
              for(var i=0;i<num;i++){
                  var sy2=i*offset;
                  var sx2=(i%2) * len+len;
                  ctx.moveTo(sx, sy+sy2);
                  ctx.lineTo(sx+sx2,sy+sy2);
              }
              var sx3=num%2 * len+len;
              ctx.moveTo(endX, endY);
              ctx.lineTo(endX+sx3,endY);
              ctx.stroke();
              ctx.moveTo(endX, endX);
              ctx.arc(endX, endY, r, 0, Math.PI * 2, true); 
              ctx.fill();
              
            
        }

    }; 
     
  })();
  



(function() {

    var Point =geomap.Point;
 
     geomap.MapEvent ={
        wheelDebounceTime:40,
        wheelPxPerZoomLevel:60,
        _preformWheelZoom:function(event,point){
            var delta=this._wheel_delta,startZoom=this.zoom,
                zoom=this.zoom,snap=0,
            d2=delta / (this.wheelPxPerZoomLevel * 4),
            d3= 4 * Math.log(2/(1 + Math.exp(-Math.abs(d2)))) / Math.LN2,
            d4 = snap ? Math.ceil(d3/snap) * snap : d3,
            zoomDelta=this._limitZoom(zoom+(this._wheel_delta > 0 ? d4 : -d4)) - zoom;

            // geomap.debug("_wheel_delta="+this._wheel_delta+",d0="+ this._wheel_d0);

             if(this._wheel_delta>0){
                 if(this._wheel_d0>=0){ 
                    if(this._wheel_d0<this._wheel_delta){
                        this._wheel_d0=this._wheel_delta;
                        this._wheel_d1=0;
                    }else{
                        if(this._wheel_d1==0){
                            this._wheel_d1=1;
                            //TODO fire
                            //geomap.debug("fire zoom +");
                            var startZoom=this.zoom;
                            var zoom=this._limitZoom(startZoom+1);
                             this.setZoomScreen(point,zoom);
                            this.fire("zoom",{event:event,point:point,delta:this._wheel_delta});
                            this.fire("wheelzoom",{event:event,point:point,delta:this._wheel_delta,startZoom:startZoom,endZoom:zoom});
                        }else{
                             this._wheel_d0=this._wheel_delta;
                            // this._wheel_d1=0;
                        } 
                    }
                    
                 }
             }else{
                 if(this._wheel_d2<=0){
                    if(this._wheel_d2<=this._wheel_delta){
                        this._wheel_d2=this._wheel_delta;
                        this._wheel_d1=0;
                    }else{
                        if(this._wheel_d1==0){
                            this._wheel_d1=1;
                            //TODO fire
                           // geomap.debug("fire zoom -");
                            var startZoom=this.zoom;
                            var zoom=this._limitZoom(startZoom-1);
                             this.setZoomScreen(point,zoom);
                            this.fire("zoom",{event:event,point:point,delta:this._wheel_delta});
                            this.fire("wheelzoom",{event:event,point:point,delta:this._wheel_delta,startZoom:startZoom,endZoom:zoom});
                        } else{
                            this._wheel_d2=this._wheel_delta;
                        }
                    }
                 } 

             }
             
            // this._wheel_delta=0;
            this.__wheel_startTime=null;
            if(!zoomDelta){
                return ;
            }
             var endZoom=Math.ceil(zoom+zoomDelta);
            //  geomap.debug("(Map_Event)endZoom="+endZoom+"|"+zoom+",d4="+d4+",zoomDelta="+zoomDelta+",delta="+delta);
            // this.setZoomScreen(point,endZoom);
            // this.fire("zoom",{event:event,point:point,delta:zoomDelta,startZoom:startZoom,endZoom:endZoom});
        },
            wheelZoomStart:function(e,p,delta){
                
                this._wheel_d0=0;
                this._wheel_d1=0;
                this._wheel_d2=0;
                this._wheel_delta=0;
                this.fire("zoomstart",{event:e,point:p,delta:delta,zoom:this.zoom});
            },
            wheelZoom:function(e,p,delta){

                
                this._wheel_delta =delta;
                // this._wheel_delta +=delta;
              //  geomap.debug("delta="+delta+",w="+this._wheel_delta);

                if(!this.__wheel_startTime){
                    this.__wheel_startTime= +new Date(); 
                }
                var left=Math.max(this.wheelDebounceTime - (+new Date() - this.__wheel_startTime),0);
               // geomap.debug("left="+left);
                if(this.__wheeltimer){
                    clearTimeout(this.__wheeltimer);
                    this.__wheeltimer=null;
                }
                 
                this.__wheeltimer=setTimeout(this._preformWheelZoom.bind(this,e,p),left);

                // var z=this.zoom+(delta>0?1:-1);
                // var zoom=this._limitZoom(z);
                // this.setZoomScreen(p,zoom);
                // this.fire("zoom",{event:e,point:p,delta:delta,zoom:zoom});
            },
            wheelZoomEnd:function(e,p,delta){
                this._wheel_d0=0;
                this._wheel_d1=0;
                this._wheel_d2=0;
                this._wheel_delta=0;
                // geomap.debug("_wheel_delta(END)="+this._wheel_delta);
                this.fire("zoomend",{event:e,point:p,delta:delta});
            },
            dragStart:function(e,p){
                this.__startPos=p;
                
                this.__bounds_changed= (!e.ctrlKey && !e.altKey);
                
                this.fire("dragstart",{event:e,point:p,boundsChanged:this.__bounds_changed});
            },
            dragChange:function(e,p){
                // this.__bounds_changed= (!e.ctrlKey && !e.altKey);
                if(this.__bounds_changed){
                    // this.panScreen(this.__startPos.subtract(p)); 
                    this.panScreen(p.subtract(this.__startPos)); 
                }
                this.fire("drag",{event:e,point:p,boundsChanged:this.__bounds_changed});
                this.__startPos=p;
            },
            dragEndWithInertiaSpeed:function(arg){
                var event=arg.event;
                if(this._dragEndSpeedAnimFn){
                    this._dragEndSpeedAnimFn.stop();
                }else{
                    this._dragEndSpeedAnimFn=new geomap.PosAnimation({easeLinearity:0.1});
                    this._dragEndSpeedAnimFn.on("end",function(){ 
                        // geomap.debug("###======dragend=====");
                        var _map=this.other;
                        var fireEvent=this.arg;
                        _map.fire("dragend",fireEvent);
                        _map.__bounds_changed=true;
                    }.bind({other:this,args:arg}));
                }
                var startP=arg.point; 
                var d_e=new Point(arg.event.inertiaSpeed[0],arg.event.inertiaSpeed[1]);
                // var res=this._map.resolution(this._map.zoom);
                this._dragEndSpeedAnimFn.run(this,function(pos,e){ 
                    this.other.panScreen(pos); 
                    var p=this.startP.add(pos);
                    this.startP=p;
                    var arg=this.arg;
                    arg.point=p;
                    // geomap.debug("##[[[point="+p.toString());
                    this.other.fire("drag",arg);
                },[d_e,new Point(0,0)],0.4,{startP:startP,other:this,arg:arg});
            },
            dragEnd:function(e,p){
                //this.__bounds_changed= !e.ctrlKey;
                if(e.openInertia){
                    this.dragEndWithInertiaSpeed({event:e,point:p,boundsChanged:this.__bounds_changed});
                }else{
                    this.fire("dragend",{event:e,point:p,boundsChanged:this.__bounds_changed});
                    this.__bounds_changed=true;
                }
                
            },
            touchZoomStart:function(e,p){
                    this.__touch_point=p;
                    this.__touch_zoom=this.zoom;
                   // geomap.debug("(touchZoomStart2) point="+p.toString());
                this.fire("touchzoomstart",{event:e,point: this.__touch_point});
            },
            touchZoom:function(e,p,scale){
               // geomap.debug("(Map_Event) scale="+scale);
                    var r0=this.getScale(this.__touch_zoom);
                    var s1=r0 * scale;
                var newZoom=Math.round(Math.log(s1/256) / Math.LN2);
                // var z=geomap.util.formatNum(scale,1)-1+this.__touch_zoom;
                
                var z=this._limitZoom(newZoom);
                this.setZoomScreen(this.__touch_point,z);
                this.zoom=z;
                this.fire("touchzoom",{event:e,scale:scale,point:p});
            },
            touchZoomEnd:function(e,p,scale){
                var r0=this.getScale(this.__touch_zoom);
                var s1=r0 * scale;
                var newZoom=Math.round(Math.log(s1/256) / Math.LN2);
                var z=newZoom;
                // geomap.debug("(Map_Event) newZoom="+newZoom);
                // var z=geomap.util.formatNum(scale,1)-1+this.__touch_zoom;
                this.setZoomScreen(this.__touch_point,z);
                this.zoom=z;
                this.fire("touchzoomend",{event:e,scale:scale,point:this.__touch_point});
                }
            
        };
     
  
   // geomap.MapEvent2=MapEvent;
     
 
  })();
  

(function() {

    var Point =geomap.Point;
    var Bounds =geomap.Bounds;
    var toPoint=geomap.util.toPoint;
    geomap.MapRectSelect={
        _rectPoints:[],
        _movingPos:[0,0], 
        RectSelectBindEvent:function(eventTarget){
            if(!this._RectSelectDrawDownID){
                this._RectSelectDrawDownID=this.RectSelectDrawDown.bind(this);
                this._RectSelectDrawUpID=this.RectSelectDrawUp.bind(this);
                this._RectSelectDrawMovingID=this.RectSelectDrawMoving.bind(this);
                // this._RectSelectDrawEndID=this.RectSelectDrawEnd.bind(this);
                this._RectSelectDrawID=this.RectSelectDraw.bind(this);
                eventTarget.on("mousedown",this._RectSelectDrawDownID);
                eventTarget.on("mouseup",this._RectSelectDrawUpID);
                eventTarget.on("mousemove",this._RectSelectDrawMovingID);
                // eventTarget.on("draw_end",this._RectSelectDrawEndID);
                eventTarget.on("drawingCanvas",this._RectSelectDrawID);
            }
            // this.on("draw_end",this.RectSelectDrawEnd);
        },
        RectSelectDrawDown:function(e){
            if(e.event.altKey){
            this.__status_draw=true;
            this.__status_draw_p0=e.point; 
            this._movingPos=e.point; 
            this.fire("drawCanvas");
            }
        },
        RectSelectDrawMoving:function(e){
            this._movingPos=e.point;
        },
        RectSelectDrawUp:function(e){ 
            if(this.__status_draw &&  this.__status_draw_p0){
                if( this.__status_draw_p0.equals(e.point)){
                    var coord=this.screenToCoord(e.point);
                    var arg={event:e,coord:coord};
                    this.fire("pointcoord",arg);
                    this.__status_draw=false;
                    
                    return;
                }else{
                    this.__status_draw_p1=e.point; 
                    var minP=this.screenToCoord(this.__status_draw_p0);
                    var maxP=this.screenToCoord(this.__status_draw_p1);
                    var arg={event:e,minx:Math.min(minP.x,maxP.x),miny:Math.min(minP.y,maxP.y),maxx:Math.max(minP.x,maxP.x),maxy:Math.max(minP.y,maxP.y)};
                    this.fire("rectcoord",arg);
                    this.__status_draw=false;
                }
            }
            
        },
        RectSelectDraw:function(ctx){
            if(this.__status_draw && this._movingPos){
                var p0=this.__status_draw_p0,
                   p1=this._movingPos;
                   ctx.setLineDash([]);
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.strokeStyle="#fff";
                ctx.beginPath();
                ctx.moveTo(p0.x,p0.y);
                ctx.lineTo(p0.x,p1.y);
                ctx.lineTo(p1.x,p1.y);
                ctx.lineTo(p1.x,p0.y);
                ctx.closePath();
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                this.fire("drawCanvas");
            } 
        }

    }; 
     
  })();
  

//const { geomap } = require("../HEADER");

(function(global) {

    'use strict';
   
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Map) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }
   
    
    var Util=geomap.util;
    var extend = Util.object.extend;
    var Point=geomap.Point;
    var toPoint=geomap.util.toPoint;
 
    geomap.Map = geomap.Class(geomap.CommonMethods, geomap.Observable, geomap.Model,
      geomap.MapEvent, geomap.Caliper,geomap.MapRectSelect, {
      type: 'object',
      width:100,
      height:1000,
      viewOrigin:{x:0,y:0},
      center:undefined,
      canvas:undefined,
      canvasCtx:undefined,
      bgCanvas:undefined,
      bgCanvasCtx:undefined,
      zoom:2,
      maxZoom:11,
      minZoom:0,
      layers:[],
      _global_interval:null,
      _canrender:true,
      _container:undefined,
      _geometrys:[],
      model:undefined,
      loopTime:40,
      canvasRatio:1,
      initialize: function(container, options) {
        options || (options = { });  
        this._setOptions(options);  
        this._sizeChanged=true;
        if(options.debug){
          geomap.debug=options.debug;
        }
        if(this.center === undefined){
          this.center=new Point(0,0);
        }else{
          this.center=toPoint(this.center);
        }
        // this._element = element;
        this._container=container;
        this._initElement();
       // this._drawlayer();
       this.FNID_draw=this.draw.bind(this);
       this.FNID_fireAnimmoveEnd=this.FireAnimmoveEnd.bind(this);
        this.on("drawmap",this.drawMap.bind(this));
        this.on("drawCanvas",this.FNID_draw);
        this.on("clear_geometry",this.clearGeometry.bind(this));
        this.LoopTime();
      },
      _dispose:function(){
        geomap.util.cancelAnimFrame(this._global_interval);
        this._global_interval=null;
        
        // if(this._global_interval!=null){
        //   clearInterval(this._global_interval);
        //   this._global_interval=null;
        // } 
      },
      _initElement:function(){
        this._container.style.position="absolute";
        this._container.style.overflow="hidden";
        // this._container.style.width=this.width+"px";
        // this._container.style.height=this.height+"px";
        var size=this.getSize();
        var width=size.x,height=size.y;
        var el_canvas=geomap.element.create("canvas",{id:"_map_canvas",width:width,height:height},{zIndex:2,border:"0px solid red",backgroundColor:"#e4e4e4",position:"absolute",width:width+"px",height:height+"px"});
        geomap.element.createHiDPICanvas(el_canvas,width,height,this.canvasRatio);
        var bgCanvas=geomap.element.create("canvas",{width:width,height:height},{backgroundColor:"#e4e4e4",position:"absolute",width:width+"px",height:height+"px"});
        this.bgCanvas=bgCanvas;
        this.bgCanvasCtx=bgCanvas.getContext("2d");
        this._container.appendChild(el_canvas);
        this.canvas=el_canvas;
        const ctx=el_canvas.getContext("2d");
        this.canvasCtx=ctx;
        this._eventDrag=new geomap.Event.Drag(this);
        this._eventTouchZoom=new geomap.Event.TouchZoom(this);
        this._eventWheelZoom=new geomap.Event.ScrollWheelZoom(this);
        this._eventDrag.addEvent(this.canvas);
        // geomap.debug("==============new event|||2222=============");
        this._eventTouchZoom.addEvent(this.canvas);
        this._eventWheelZoom.addEvent(this.canvas);
        this.RectSelectBindEvent(this);
        eventjs.add(this.canvas,"contextmenu",eventjs.cancel);
        eventjs.add(this.canvas,"click touch",function(event,self){
          // geomap.debug("[click touch] point="+self.x+","+self.y);
          var point=new Point(event.offsetX || self.x ,event.offsetY || self.y);
          var coord=this.screenToCoord(point);
          var e=extend({},{target: this,coord:coord ,point:point,event:event});
          this.fire("click",e);
          // if(event.altKey){
          //   this.fire("pointcoord",e);
          // }
        }.bind(this));
        eventjs.add(this.canvas,"mousedown",function(event,self){
          var point=new Point(event.offsetX,event.offsetY);
          var arg={event:event,point:point};
          this.fire("mousedown",arg);

        }.bind(this));
        eventjs.add(this.canvas,"mousemove",function(event,self){

          var point=new Point(event.offsetX,event.offsetY);
          var arg={event:event,point:point};
          this.fire("mousemove",{event:event,point:point});

        }.bind(this));
        eventjs.add(this.canvas,"mouseup",function(event,self){
          var point=new Point(event.offsetX,event.offsetY);
          var arg={event:event,point:point};
          this.fire("mouseup",arg);
        }.bind(this));
      },
      _limitZoom:function(z){
        if(this.maxZoom<z){
          return this.maxZoom;
        }else if (this.minZoom>z){
          return this.minZoom;
        }
        return z;
      },
      LoopTime:function(){
        this.fire("looptime");
        for(var i=0,k=this.layers.length;i<k;i++){
          var layer=this.layers[i];
              layer.OnLoopTime();
        }
        this._redrawingCanvas.call(this);
        // geomap.util.cancelAnimFrame(this._global_interval);
        // this._global_interval=geomap.util.requestAnimFrame(this.LoopTime,this,this.loopTime);
        geomap.util.requestAnimFrame(this.LoopTime,this);
      },
      _redrawingCanvas:function(){
        if(this._redrawing==true || this._move_type==1){
          this._redrawing=false;
          const ctx=this.canvasCtx;
          var size=this.getSize();
           ctx.clearRect(0,0,size.x,size.y);
          for(var i=0,k=this.layers.length;i<k;i++){
                var layer=this.layers[i];
                  layer.drawingCanvas(ctx);
          } 
     
          var geomNum=this._geometrys.length;
          if(geomNum>0){
            for(var i=0;i<geomNum;i++){
              var geomObj=this._geometrys[i];
              
                 geomObj.render(ctx);
                 if(geomObj.loopRender){
                   this._redrawing=true;
                 }
            }
          }
          this.caliperDraw(ctx);
          this.fire("drawingCanvas",ctx);
        
        }
      }, 
      animated:function(){
        this.fire("animated");
      },
      drawMap:function(){
          this.fire("viewreset");
          this._redrawing=true;
      }, 
      draw:function(){
        this._redrawing=true;
      },
      _loadLayer:function(layer){
        layer.on("drawCanvas",this.FNID_draw);
        layer.initLayer(this.canvas,this);
      },
      addLayer:function(layer){ 
        this._loadLayer(layer);
        this.layers.push(layer);
        this.fire("drawmap");
      },
      setCenter:function(coord,zoom){
        coord=toPoint(coord);
        this.center=coord;
        this._boundsChanged=true;
        if(zoom != undefined && typeof zoom == "number"){
          this.setZoom(zoom);
        }
       },
       FireAnimmoveEnd:function(event){
        this.fire("animmove_end",this._event_animMove_arg);
       },
       animMove:function(coord,feature){
          coord=toPoint(coord);
          var startCoord,size=this.getSize(),
            pos1=this.coordToScreen(coord).round(); 
          var cpos=size.divideBy(2).round();
          var offsetR=Math.round( pos1.distanceTo(cpos));
          var sizeR=Math.round( Math.sqrt(size.x* size.x + size.y* size.y));
          if(offsetR > sizeR){
            // geomap.debug("offsetR 1");
            var scale=offsetR/sizeR;
            var startCoordX,startCoordY; 
            startCoordX = pos1.x - (pos1.x-cpos.x) * scale;
            startCoordY = pos1.y + (cpos.y - pos1.y) * scale;
            pos1=this.modelCoord(new Point(startCoordX,startCoordY).round());
            startCoord=this.screenToCoord(pos1);
          }else{
            // geomap.debug("offsetR 2");
            startCoord=this.center;
            // geomap.debug("2 startCoord="+startCoord.toString()+",center="+this.center.toString());
          }
          if(!coord.equals(this.center)){
              if(this._animMoveFn){
                this._animMoveFn.stop();
              }else{
                this._animMoveFn=new geomap.PosAnimation();
                var self=this;
                this._animMoveFn.on("end",this.FNID_fireAnimmoveEnd);
              }
              var self=this;
              this._event_animMove_arg={map:self,coord:coord,feature:feature};
              this._animMoveFn.run(this,function(pos){
              // this.moveTo(pos); 
             // geomap.debug("pos="+pos.toString());
              this.setCenter(pos);
              this.fire("drawmap");
            },[startCoord,coord],1,this);
          }

       },
      moveTo:function(coord,zoom,data){
        this.setCenter(toPoint(coord))
        if(zoom === undefined){

        }else{
          if(typeof zoom =='string'){
            zoom=Number(zoom);
          }
          this.setZoom(zoom);
        }
         this.fire("drawmap");
      },
      getSize:function(){
        if(!this._size || this._sizeChanged){
          this._size=new Point(this._container.clientWidth||this.width,this._container.clientHeight || this.height);
          this._sizeChanged=false;
        }
        return this._size.clone();
      },
       resize:function(){
         this._sizeChanged=true;
         var size=this.getSize();
        //  this.canvas.width=size.x;
        //  this.canvas.height=size.y;
        //  this.canvas.style.width=size.x+"px";
        //  this.canvas.style.height=size.y+"px";
         geomap.element.createHiDPICanvas(this.canvas,size.x,size.y,this.canvasRatio);
         geomap.element.createHiDPICanvas(this.bgCanvas,size.x,size.y,this.canvasRatio);
         this._boundsChanged=true;
         this._redrawing=true;
         this.fire("resize");
         this.fire("drawmap");
      },
      getCoord:function(p0){
        return this.model.screenToCoord(Util.toPoint(p0));
      },
      addGeometry:function(geomtry){
        this._geometrys.push(geomtry);
        this._redrawing=true;
      },
      clearGeometry:function(){
        this._geometrys=[];
        this._redrawing=true;
      }
      
     
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  


(function(global) {

  function draw(ctx,map,geometry){
          var coords=geometry.coordinates,len=coords.length;
          if(len>0){
            switch(geometry.type){
              case "Polygon":{ 
                coords=coords[0];
                len=coords.length;
                if(coords.length>1){
                  ctx.beginPath();
                  var p0=map.coordToScreen(coords[0]).round();
                  ctx.moveTo(p0.x,p0.y);
                  for(var i=1;i<len;i++){
                      var coord=coords[i];
                      var p=map.coordToScreen(coord).round();
                      ctx.lineTo(p.x,p.y);
                  }
                  ctx.closePath();
                  ctx.stroke();
                  ctx.fill();
                }
                  break;
              }
              case "Point":{
                var p=map.coordToScreen(coords[0]).round(),r=geometry.r;
                ctx.fillRect(p.x-r/2,p.y-r/2,r,r);
                ctx.strokeRect(p.x-r/2,p.y-r/2,r,r);
                break;
            }
              default:{
                ctx.beginPath();
                  var p0=map.coordToScreen(coords[0]).round();
                  ctx.moveTo(p0.x,p0.y);
                  for(var i=1;i<len;i++){
                      var coord=coords[i];
                      var p=map.coordToScreen(coord).round();
                      ctx.lineTo(p.x,p.y);
                  }
                  ctx.closePath();
                  ctx.stroke();
              }

            }
          }
    }
  

    geomap.shape = {draw:draw};
  })(typeof exports !== 'undefined' ? exports : this);




  (function() { 

    var toPoint=geomap.util.toPoint,extend = geomap.util.object.extend;

    function Group(){
       this.type="group";
       this._data=[];

    }
    Group.prototype={
        add:function(geometry){
            if(geometry){
                if(typeof geometry == 'array'){
                    for(var i=0,k=geometry.length;i<k;i++){
                        this._data.push(geometry[i]);
                    }
                }else if(typeof geometry == 'object'){
                    this._data.push(geometry);
                }
            }
        },
        remove:function(index){
            if(this._data.length<index){
                this._data.splice(index,1);
            }
        },
        draw:function(ctx,map){
            for(var i=0,k=this._data.length;i<k;i++){
                geomap.shape.draw(ctx,map,this._data[i].getGeometry())
               // this._data[i].draw(ctx,options);
            }
        },
        split:function(xnum,ynum,padding){
            var data=[]
            for(var i=0,k=this._data.length;i<k;i++){
                this._data[i].split(xnum,ynum,padding);
            }
            
        },
        bounds:function(){
            var boundArr=[],minx,miny;
            for(var i=0,k=this._data.length;i<k;i++){
                boundArr.push(this._data[i].bounds());
            }
            for(var i=0,k=boundArr.length;i<k;i++){
                var bd=boundArr[i];
                if(bd!=null){
                    
                }
            }
        },
        getSize:function(){
            return this._data.length;
        },
        getPaths:function(){return this._data;},
        getData:function(){
            var data=[]
            for(var i=0,k=this._data.length;i<k;i++){
                data.push(this._data[i].getData());
            }
            return data;
        },
        clear:function(){
            var n=this._data.length;
            if(n>0){
                while(n>0){
                    var last=this._data.pop();
                    delete last;
                    n=this._data.length;
                }
            }
        }
    };
   

    geomap.shape.Group=Group;
  })();



  (function() { 

    var toPoint=geomap.util.toPoint,extend = geomap.util.object.extend;

    function Path(group,geometry){
       this.type="Path";
       this._group=group;
       group.add(this);
       this._geometry=extend({type:null,coordinates:[]},geometry);
    } 

    Path.prototype={
        setData:function(type,coords){
            this._geometry.type=type;
            this._geometry.coordinates=coords;
        },
        setProp:function(prop){
            this._properties=prop;
        },
        addProp:function(key,value){
            var prop= this._properties ||{};
            prop[key]=value;
            this._properties=prop;
        },
        splitH:function(cs,xnum,padding){
            var groupGeometry=[];
            if(padding ==undefined){
                padding=0;
            }
            if(cs.length==5){
                var ptx0=cs[0],ptx1=cs[3],pbx0=cs[1],pbx1=cs[2];
                var pt=ptx1.subtract(ptx0),pb=pbx1.subtract(pbx0),pnum=xnum-1;
                var rt=(pt.x - pnum * padding) / xnum, rb=(pb.x -pnum * padding)/ xnum;
                var start_p0=ptx0,start_p1=pbx0;
                for(var i=0;i<xnum;i++){//水平拆分
                    var newCoords=[];
                    newCoords.push(start_p0);
                    newCoords.push(start_p1);
                    var p0=start_p1.clone();
                    p0.x += rb;
                    newCoords.push(p0);
                    var p1=start_p0.clone();
                    p1.x+=rt;
                    newCoords.push(p1);
                    newCoords.push(start_p0);
                    // groupGeometry.push({type:'Polygon',coordinates:[newCoords]});
                    groupGeometry.push(newCoords);
                  
                    start_p0=p1.clone();
                    start_p1=p0.clone();
                    start_p0.x +=padding;
                    start_p1.x +=padding;
                }
            }
            return groupGeometry;
        },
        splitV:function(cs,ynum,padding){
            var groupGeometry=[];
            if(padding ==undefined){
                padding=0;
            }
            padding=padding/2;
            if(cs.length==5){
                var pty0=cs[0],pty1=cs[1],pby0=cs[3],pby1=cs[2];
                var pl=pty1.subtract(pty0),pr=pby1.subtract(pby0),pnum=ynum-1;
                var rl=(pl.y + pnum * padding)/ ynum, rr=(pr.y + pnum * padding)/ ynum;
                var start_p0=pty0,start_p1=pby0;
                for(var i=0;i<ynum;i++){//垂直拆分
                    var newCoords=[];
                    newCoords.push(start_p0);
                    var p0=start_p0.clone();
                    p0.y += rl;
                    newCoords.push(p0);
                    var p1=start_p1.clone();
                    p1.y +=rr;
                    newCoords.push(p1); 
                    newCoords.push(start_p1);
                    newCoords.push(start_p0);
                  
                    // groupGeometry.push({type:'Polygon',coordinates:[newCoords]});
                    groupGeometry.push(newCoords);
                   
                    start_p0=p0.clone();
                    start_p1=p1.clone();
                    start_p0.y -=padding;
                    start_p1.y -=padding;
                }
            }
            return groupGeometry;
        },
        split:function(xnum,ynum,padding){
            var geom=this._geometry,minx=null,miny=null,maxx=null,maxy=null,cs;
            switch(geom.type){
                case 'Polygon':{
                      cs=geom.coordinates;
                    if(cs.length==1 && cs[0].length==5){
                        cs=cs[0];
                        var groupGeomArr=[];
                        var groupGeometry=this.splitH(cs,xnum,padding);
                            if(groupGeometry.length>0 ){
                                if( ynum !=undefined && ynum>1){
                                    for(var i=0,k=groupGeometry.length;i<k;i++){
                                        var vgeomArr=this.splitV(groupGeometry[i],ynum,padding);
                                        for(var j=0,jk=vgeomArr.length;j<jk;j++){
                                            groupGeomArr.push(vgeomArr[j]);
                                        }
                                    }
                                }else{
                                    groupGeomArr=groupGeometry;
                                }
                            }
                        // var groupGeometry=[];
                        // var ptx0=cs[0],ptx1=cs[3],pbx0=cs[1],pbx1=cs[2];
                        // var pt=ptx1.subtract(ptx0),pb=pbx1.subtract(pbx0);
                        // var rt=pt.x / xnum, rb=pb.x/ xnum;
                        // var start_p0=ptx0,start_p1=pbx0;
                        // for(var i=0;i<xnum;i++){//水平拆分
                        //     var newCoords=[];
                        //     newCoords.push(start_p0);
                        //     newCoords.push(start_p1);
                        //     var p0=start_p1.clone();
                        //     p0.x += rb;
                        //     newCoords.push(p0);
                        //     var p1=start_p0.clone();
                        //     p1.x+=rt;
                        //     newCoords.push(p1);
                        //     newCoords.push(start_p0);
                        //     for(var j=0;j<ynum;j++){//垂直拆分


                        //     }
                        //      groupGeometry.push({type:'Polygon',coordinates:[newCoords]});
                        //      if(i>0){
                        //          new Path(this._group,{type:'Polygon',coordinates:[newCoords]});
                        //      }
                        //     start_p0=p1;
                        //     start_p1=p0;
                        // }
                        if(groupGeomArr.length>0){
                            this._geometry.coordinates=[groupGeomArr[0]];
                            for(var i=1,k=groupGeomArr.length;i<k;i++){
                                new Path(this._group,{type:'Polygon',coordinates:[ groupGeomArr[i]]});
                            }
                        }
                         
                         
                    }
                    
                    break;
                }
                default:{
                    cs=geom.coordinates;
                }
            }
        },
        bounds:function(){
            var geom=this._geometry,minx=null,miny=null,maxx=null,maxy=null,cs;
            switch(geom.type){
                case 'Polygon':{
                      cs=geom.coordinates;
                    if(cs.length>0){
                        cs=cs[0];
                    }
                    break;
                }
                default:{
                    cs=geom.coordinates;
                }
            }
            if(cs.length>0){
                maxx = minx = cs[0].x; maxy = miny = cs[0].y;
                for(var i=1,k=cs.length;i<k;i++){
                    minx=Math.min(minx,cs[i].x);
                    miny=Math.min(miny,cs[i].y);
                    maxx=Math.max(maxx,cs[i].x);
                    maxy=Math.max(maxy,cs[i].y);
                }
                return  geomap.util.toBounds(minx,miny,maxx,maxy); 
            }else{
                return null;
            }
           
        },
        getGeometry:function(){
           return this._geometry;
        },
        getData:function(){
            var coords=this._geometry.coordinates,cs=[];
            var geometry={type:this._geometry.type,coordinates:[]};
            if(geometry.type == 'Polygon'){
                if(coords.length>0){
                    coords=coords[0];
                }
                geometry.coordinates=[cs];
            }else{
                geometry.coordinates=cs;
            }
            if(coords.length>0){
                for(var i=0,k=coords.length;i<k;i++){
                    cs.push([coords[i].x,coords[i].y]);
                }
                return geometry;
            }else{
                return null;
            }
          
        },
        getFeature:function(){
            return {geometry:this._geometry,properties:this._properties};
        }
    };
   

    geomap.shape.Path=Path;
    
  })();

(function() {

     /**
      * Data:{coordinates:[[[x,y],[x,y]...],[[x,y]...]],type:"Polygon",}
      */
     var toPoint=geomap.util.toPoint;
    
    geomap.Geometry=geomap.Class(geomap.CommonMethods, geomap.Observable ,{
        _coordinates:[],
        _map:null, 
        _start:true,
        _fill:false,
        _pointWeight:6,
        _type:0,//type:0-polygon,1-point,2=line,3-rect,4-circle
        style:{fillStyle:"rgba(0, 0, 0, 0.4)",strokeStyle:"rgba(0,255,255,0.9)",lineWidth:2},
        lineDashOffset:0,
        lineDash:[],
        loopRender:false,
           initialize: function(map, options) { 
                options || (options = { });
                // Extend(this,Geometry);
                this._setOptions(options); 
                this._map=map;
                this._type=0;
              },
        setMap:function(map){this._map=map;},
        s2c:function(p){return this._map.screenToCoord(p);},
        c2s:function(c){ return this._map.coordToScreen(c).round(); },
        addCoord:function(coord){ 
            var len=this._coordinates.length;
            if(len>0){
                if(!this._coordinates[len-1].equals(coord)){
                    this._coordinates.push(coord);
                }
            }else{
               this._coordinates.push(coord);
            }
        }, 
        setType:function(gtype,fill){
            this.clear();
            this._fill= fill||false;
             if(typeof gtype == 'string'){
                if(gtype=="Polygon"){
                    this._type=0;
                }else if(gtype == "Point"){
                    this._type=1;
                }else if(gtype == "Line"){
                    this._type=2;
                }else if(gtype== "Rect"){
                    this._type=3;
                }else if(gtype=="Circle"){
                    this._type=4;
                }
            }else{
                this._type=gtype;
            }
            
        },
        getType:function(){
            var mtype="Polygon";
            
            switch(this._type){
                case 1:
                    mtype="Point";
                    break;
                case 2:
                    mtype="Line";
                    break;
                case 3:
                    mtype="Rect";
                    break;
                case 4:
                    mtype="Circle";
                    break;

            }
            return mtype;
        },
        push:function(p){ 
            var coord=this.s2c(p);
           this.addCoord(coord);
        },
        clear:function(){
            var oldCoords=this._coordinates;
            this._coordinates=[];
            var len=oldCoords.length;
            for(var i=0;i<len;i++){
                oldCoords[i]=null;
            } 
        },
        moveTo:function(p){
            if(this._start){
               this._movePoint=p;
            }
        },
        end:function(){
            this._movePoint=null;
            this._start=false;
            var len=this._coordinates.length;
            switch(this._type){
                case 0:{
                   if(len>2){
                       this._coordinates.push(this._coordinates[0])
                   }else{
                       this.clear();
                   }
                }
                break;
                case 2:{
                    if(len<2){
                        this.clear();
                    }
                }break;
                case 3:
                case 4:{
                    if(len!=2){
                        this.clear();
                    }
                }break;
                
            }
        },
        isEnd:function(){
            switch(this._type){
                case 1:
                    return this._coordinates.length==1;
               case 3:
                   case 4:
                   return this._coordinates.length==2;
            }
            return false;
        },
        setStyle:function(ctx){
            var options=this.style;
               for (var prop in options) { 
                   ctx[prop]=options[prop];
                }
        },
        getText:function(){
            var jsonObj=this.getJson();
            return JSON.stringify(jsonObj);
        },
        getCoordJson:function(){
            var coords=this._coordinates,num=coords.length;
            var geoJson={type:"",coordinates:[]};
            if(num<1){
                return geoJson;
            } 
            switch(this._type){
                case 1:{
                    geoJson.type="Point";
                    geoJson.coordinates.push(coords[0]);
                }
                    break;
                case 2:{
                    geoJson.type="Line";
                    for(var i=0;i<num;i++){
                        geoJson.coordinates.push(coords[i]);
                    }
                }
                    break;
                case 3:{
                    geoJson.type="Polygon";
                    if(num>1){

                        var p1=coords[0],p2=coords[1],pg1=[];
                        pg1.push(toPoint([p1.x,p1.y]));
                        pg1.push(toPoint([p1.x,p2.y]));
                        pg1.push(toPoint([p2.x,p2.y]));
                        pg1.push(toPoint([p2.x,p1.y]));
                        pg1.push(toPoint([p1.x,p1.y]));
                        geoJson.coordinates.push(pg1);
                    }
                }
                    break;
                default:{
                    geoJson.type="Polygon";
                    if(num>1){

                        var p1=coords[0],p2=coords[1],pg1=[];
                        for(var i=0;i<num;i++){
                            pg1.push(coords[i]);
                        }
                        geoJson.coordinates.push(pg1);
                    }
                }

            }
            return geoJson; 
        },
        getJson:function(){
            var coords=this._coordinates,num=coords.length;
            var geoJson={type:"",coordinates:[]};
            if(num<1){
                return geoJson;
            } 
            switch(this._type){
                case 1:{
                    geoJson.type="Point";
                    geoJson.coordinates=[coords[0].x,coords[0].y];
                }
                    break;
                case 2:{
                    geoJson.type="Line";
                    for(var i=0;i<num;i++){
                        geoJson.coordinates.push([coords[i].x,coords[i].y]);
                    }
                }
                    break;
                case 3:{
                    geoJson.type="Polygon";
                    if(num>1){

                        var p1=coords[0],p2=coords[1],pg1=[];
                        pg1.push([p1.x,p1.y]);
                        pg1.push([p1.x,p2.y]);
                        pg1.push([p2.x,p2.y]);
                        pg1.push([p2.x,p1.y]);
                        pg1.push([p1.x,p1.y]);
                        geoJson.coordinates.push(pg1);
                    }
                }
                    break;
                default:{
                    geoJson.type="Polygon";
                    if(num>1){

                        var p1=coords[0],p2=coords[1],pg1=[];
                        for(var i=0;i<num;i++){
                            pg1.push([coords[i].x,coords[i].y]);
                        }
                        geoJson.coordinates.push(pg1);
                    }
                }

            }
            return geoJson; 

        },
        render:function(ctx){
            var len=this._coordinates.length;
            ctx.setLineDash([]);
            
            if(this.lineDash && this.lineDash.length>1){
                ctx.setLineDash(this.lineDash);
                ctx.lineDashOffset = this.lineDashOffset;
                this.lineDashOffset += 1;
                this.loopRender=true;
            } else{
                this.loopRender=false;
            }

           if(len>0){ 
               this.setStyle(ctx);
               switch(this._type){
                   case 0:{
                       ctx.beginPath();
                       var p0=this.c2s(this._coordinates[0]);
                       ctx.moveTo(p0.x,p0.y);
                       for(var i=1;i<len;i++){
                           var coord=this._coordinates[i];
                           var p=this.c2s(coord);
                           ctx.lineTo(p.x,p.y);
                       }
                       if(this._start && this._movePoint && this._movePoint != null){
                           ctx.lineTo(this._movePoint.x,this._movePoint.y);
                       }
                        ctx.closePath();
                        ctx.stroke();
                         
                        if(this._fill){
                        ctx.fill();
                        }
                   }break;
                   case 1:{
                       var p=this.c2s(this._coordinates[0]),r=this._point_weight;
                       ctx.fillRect(p.x-r/2,p.y-r/2,r,r);
                       ctx.strokeRect(p.x-r/2,p.y-r/2,r,r);
                   }break;
                   case 2:{
                       ctx.beginPath();
                       var p0=this.c2s(this._coordinates[0]);
                       ctx.moveTo(p0.x,p0.y);
                       for(var i=1;i<len;i++){
                           var coord=this._coordinates[i];
                           var p=this.c2s(coord);
                           ctx.lineTo(p.x,p.y);
                       }
                       if(this._start && this._movePoint && this._movePoint != null){
                           ctx.lineTo(this._movePoint.x,this._movePoint.y);
                       }
                       ctx.stroke();
                   }break;
                   case 3:{
                       var p0=this.c2s(this._coordinates[0]),p1;
                       if(len==2){
                           p1=this.c2s(this._coordinates[1]).subtract(p0);
                           // ctx.strokeRect(p0.x,p0.y,p1.x,p1.y);
                           this._fill?ctx.fillRect(p0.x,p0.y,p1.x,p1.y):ctx.strokeRect(p0.x,p0.y,p1.x,p1.y);
                       }else if(this._start && this._movePoint && this._movePoint != null){
                           p1=this._movePoint.subtract(p0);
                           // ctx.strokeRect(p0.x,p0.y,p1.x,p1.y);
                           this._fill?ctx.fillRect(p0.x,p0.y,p1.x,p1.y):ctx.strokeRect(p0.x,p0.y,p1.x,p1.y);
                       }
                   }
               }
                
              
           }

        }
    });
    
  })();
  

(function() { 
    var Point =geomap.Point;

    geomap.Path=geomap.Class(geomap.Geometry, {
      lineDash:null,
       initialize: function(map, options) {
        // this._map=map;
        options || (options = { });
        this.callSuper('initialize',map,options); 
        //  this._setOptions(options); 
      },
      setData:function (data){
        // var gtype=data.type;
        var gcoords=data.coordinates;
        this._type=0;
        this._coordinates=[];
        if(gcoords.length>0){
            var gcoord=gcoords[0];
            if(gcoord.length>0){
                for(var i=0,k=gcoord.length;i<k;i++){
                    this._coordinates.push(new Point(gcoord[i][0],gcoord[i][1]));
                }
            }
        }
        this._map.fire("drawmap");
        }
    });
  })();

(function() { 
    var Point =geomap.Point;
    var Clone=geomap.util.object.clone;
    // var Extend=geomap.util.object.extend;

    geomap.Polygon=geomap.Class( geomap.Geometry,{
       initialize: function(map, options) {
      
        options || (options = { });
        // Extend(this,geomap.Geometry,true);
        // this._setOptions(options); 
        this.callSuper('initialize',map,options);
        // this._map=map;
        this._type=0;
      },
      setData:function (data){
        // var gtype=data.type;
        var gcoords=data.coordinates;
        this._type=0;
        this._coordinates=[];
        if(gcoords.length>0){
            var gcoord=gcoords[0];
            if(gcoord.length>0){
                for(var i=0,k=gcoord.length;i<k;i++){
                    this._coordinates.push(new Point(gcoord[i][0],gcoord[i][1]));
                }
            }
        }
        this._map.fire("drawmap");
        }
    });
  })();
  

(function() { 
    var Point =geomap.Point;

    geomap.Marker=geomap.Class(geomap.CommonMethods, geomap.Observable,geomap.Geometry, {
        type:"Marker",
        canvas:null,
        ctx:null,
        point:null,
        width:400,
        height:200,
        ratio:3,
        radius:10,
        lineV:20,
        padding:10,
        textRows:[],
        style:{fillStyle:"rgba(0, 0, 0, 0.9)"},
        fontStyle:{font : "bold 14px serif",fillStyle:"white"},
       initialize: function(map, options) {
        this._map=map;
        options || (options = { });
        if(options.style){
            options.style=geomap.util.object.extend(this.style,options.style);
        } 
        this._setOptions(options); 
        this._type=0;
        var canvas=geomap.element.create("canvas");
        var ctx=canvas.getContext("2d");
        geomap.element.createHiDPICanvas(canvas,this.width,this.height,this.ratio);
        this.canvas=canvas;
        this.ctx=ctx;
        this.point=new Point(100,100);
         
      },
      setData:function (data){
        // var gtype=data.type;
        var geometry=data.geometry;
        var properties=data.properties;
        // var gcoords=geometry && geometry.coordinates,
        // this._type=0;
        // this._coordinates=[];
        // if(gcoords.length>0){
        //     var gcoord=gcoords[0];
        //     if(gcoord.length>0){
        //         for(var i=0,k=gcoord.length;i<k;i++){
        //             this._coordinates.push(new Point(gcoord[i][0],gcoord[i][1]));
        //         }
        //     }
        // }
        this.textRows=[];
        if(properties != undefined ){
            var ctx=this.ctx;
            var rtsize=this.getRectTextSize();
            for(var t in properties){
                this.drawText(ctx,t+":"+properties[t],rtsize[0]);
            }
        }
        this.draw();
        this._map.fire("drawmap");
        },
        draw:function(){
            var ctx=this.ctx,width=this.width,height=this.height;
            ctx.clearRect(0,0,width,height);
            this.roundedRect(ctx,0,0,width,height,this.radius);
            // 字体样式设置
            var fontStyles=this.fontStyle;
            for (var prop in fontStyles) { 
                ctx[prop]=fontStyles[prop];
            }
            var rowNum=this.textRows.length,
                y=this.padding+this.lineV,
                x=this.padding;
            for(var b=0;b<rowNum;b++){
                ctx.fillText(this.textRows[b],x,y);//每行字体y坐标间隔20
                y+=this.lineV;
            }
        },
        getRectTextSize:function(){
            var w=this.width- (this.padding * 2),h=this.height- (this.padding * 2);
            return [w,h];
        },
        drawText:function(ctx,t,w){
            //参数说明
            //ctx：canvas的 2d 对象，t：绘制的文字，x,y:文字坐标，w：文字最大宽度
            var chr = t.split("");
            var temp = "";
            for (var a = 0; a<chr.length;a++){
                if( ctx.measureText(temp).width < w && ctx.measureText(temp+(chr[a])).width <= w){
                    temp += chr[a];
                }else{
                    this.textRows.push(temp);
                    temp = chr[a];
                }
            }
            this.textRows.push(temp);
        },
        render:function(ctx){
            var w=this.width,
              h=this.height;
            ctx.drawImage(this.canvas,this.point.x,this.point.y,w,h);
        },
        roundedRect:function(ctx, x, y, width, height, radius){
        this.setStyle(ctx);
        ctx.beginPath();
        ctx.moveTo(x, y + radius);
        ctx.lineTo(x, y + height - radius);
        ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
        ctx.lineTo(x + width - radius, y + height);
        ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
        ctx.lineTo(x + width, y + radius);
        ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
        ctx.lineTo(x + radius, y);
        ctx.quadraticCurveTo(x, y, x, y + radius);
        ctx.fill();

        }
    });
  })();
  



  (function() { 

    var toPoint=geomap.util.toPoint,extend = geomap.util.object.extend;

    function Feature(feature,map){
        var data=extend({id:null,properties:null,geometry:{type:null,coordinates:[]}},feature);
        this._data=data;
        if(map != undefined){
            this._map=map;
        }
        // this.id=id;
        // this.geometry=data.geometry;
        // this.properties=data.prop;
    }
    Feature.prototype={
        drawOptions:{lineWidth:2,
            lineDash:[],
            radius:5,
            dashOffset:1,
            animated:false,
            strokeStyle:"rgba(3,169, 244,1)",
            fillStyle:"rgba(41,182,246,1)",
            fill:true},
        setMap:function(map){
            this._map=map;
        },
        initCoords:function(){
            if(!this._coords){
                this._coords=[];
                var geometry=this._data.geometry;
                var coords=geometry.coordinates;
                if(coords && coords.length>0){
                    if(geometry.type === "Polygon"){
                        coords=coords[0];
                    }
                    for(var i=0,k=coords.length;i<k;i++){
                        this._coords.push(toPoint(coords[i]));
                    }
                }    
            }
        },
        clearCanvasOpt:function(ctx){
            ctx.fillStyle=null;
            ctx.strokeStyle=null;
            //还原
            ctx.lineDashOffset=1;
            ctx.lineWidth =1;
            ctx.setLineDash([]);
        },
        drawPolygon:function(ctx,opt){
            if(!this._coords){
                this.initCoords();
            }
            if(this._coords.length>3){
                var m=this._map,s=this,c=s._coords,len=c.length;
                ctx.lineWidth = opt.lineWidth;
                ctx.setLineDash(opt.lineDash);
                ctx.strokeStyle =opt.strokeStyle;
                ctx.fillStyle=opt.fillStyle;
                ctx.lineDashOffset = (s.drawOptions.dashOffset+=0.5);
                ctx.beginPath();
                    var p0=m.coordToScreen(c[0]);
                    ctx.moveTo(p0.x,p0.y);
                    for(var i=1;i<len;i++){
                        var coord=c[i];
                        var p=m.coordToScreen(coord);
                        ctx.lineTo(p.x,p.y);
                    }
                ctx.closePath();
                ctx.stroke();
                if(opt.fill){
                    ctx.fill();
                }
                
            }
        },
        drawPoint:function(ctx,opt){
            if(!this._coords){
                this.initCoords();
            }
            if(this._coords.length>0){
                var m=this._map,s=this,c=s._coords,len=c.length,r=s.radius;
                var p0=m.coordToScreen(c[0]);
                ctx.lineWidth = opt.lineWidth;
                ctx.setLineDash(opt.lineDash);
                ctx.strokeStyle =opt.strokeStyle;
                ctx.fillStyle=opt.fillStyle;
                ctx.lineDashOffset = (s.drawOptions.dashOffset+=1);
                ctx.beginPath();
                ctx.arc(p0.x, p0.y, r, 0, Math.PI * 2, true);
                ctx.closePath();
               
                ctx.stroke();
                if(opt.fill){
                    ctx.fill();
                }
            }
        },
        draw:function(ctx,options){
            var geometry=this._data.geometry,option=options||{};

             var opt=extend({},this.drawOptions);
              extend(opt,option);
            
           this.clearCanvasOpt(ctx);
           switch(geometry.type){
               case "Polygon":{
                this.drawPolygon(ctx,opt);
                break;
               }
               case "Point":{
                   this.drawPoint(ctx,opt);
                   break;
               }
           }

           this.clearCanvasOpt(ctx);
           if(opt.animated){
               this._map.animated();
           }
        }
    };
   

    geomap.Feature=Feature;
  })();


(function(global) {

    'use strict';
  
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Layer) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }
    
    var Layer={
      type:'Layer',
      width:100,
      height:100, 
      _canvas:null,
      _map:undefined,
      transformtion: null,
      wheelZoomChanage:false,
      canvas:null,
      canvasCtx:null,
      cacheTime:0,
      initLayer:function(canvas,map){
        this.transformtion=new geomap.Transformtion(-1,0,-1, 0);
        this._canvas=canvas; 
        this._drawLock=1;
        this._map=map;
        this.cacheTime= +new Date();
        var canvas=geomap.element.create("canvas",{},{zIndex:2,border:"1px solid blue",backgroundColor:"#e4e4e4",position:"absolute",top:"0px"});
        var canvasCtx=canvas.getContext("2d");
        this.canvas=canvas;
        this.canvasCtx=canvasCtx;
        this.OnResize();
        map.on("resize",this.OnResize.bind(this));
        map.on("viewreset",this.ViewReset.bind(this));
        map.on("dragstart",this.OnDragStart.bind(this));
        map.on("drag",this.OnDrag.bind(this));
        map.on("dragend",this.OnDragEnd.bind(this));
        map.on("touchzoomstart",this.OnTouchZoomStart.bind(this));
        map.on("touchzoom",this.OnTouchZoom.bind(this));
        map.on("touchzoomend",this.OnTouchZoomEnd.bind(this));
        map.on("wheelzoom",this.OnScrollZoom.bind(this));
        this.fire("initLayer");
        this.ViewReset();
      },
      OnResize:function(){
        var size=this._map.getSize();
        this.width=size.x;
        this.height=size.y;
        this.canvas.width=size.x;
        this.canvas.height=size.y;
        this.canvas.style.width=size.x+"px";
        this.canvas.style.height=size.y+"px";
      },
      OnTouchZoomStart:function(arg){
        var event=arg.event,cpos=arg.point;
        this._touchZoomStart=cpos;
      },
      OnTouchZoom:function(arg){
        var event=arg.event,scale=arg.scale;
        this._canvasScale=geomap.util.formatNum(scale,4);
        this.fire("drawCanvas");
      }, 
      OnTouchZoomEnd:function(arg){
        // var event=arg.event,scale=arg.scale;
        this._touchZoomStart=null;
        this.ViewReset();
      },
      scrollZoomEnd:function(arg){
        this._canvasScale=1;
        this.ViewReset();
      },
      OnScrollZoom:function(arg){
        if(arg.startZoom ==arg.endZoom){
          return ;
        }
          if(this._animMoveFn){
            this._animMoveFn.stop();
          }else{
            this._animMoveFn=new geomap.PosAnimation({easeLinearity:0.1});
            this._animMoveFn.on("end",function(){this._touchZoomStart=null;this._canvasScale = 1; this.wheelZoomChanage=false;this.ViewReset();}.bind(this));
          }
          this._touchZoomStart=arg.point;
          this._animMoveFn.run(this._map,function(pos,e){
           var startRes=this._map.getScale(e.pos[0].x)/256;
           var res=this._map.getScale(pos.x)/256;
           var scale=res/startRes;
            this._canvasScale =scale;
            this.wheelZoomChanage=true;
            this.fire("drawCanvas");
        },[new Point(arg.startZoom,0),new Point(arg.endZoom,0)],0.4,this);
        
      },
      OnDragStart:function(arg){
        this._dragStartPos=arg.point;
      },
      OnDrag:function(arg){
        if(arg.boundsChanged){
          this._dragOffset=arg.point.subtract(this._dragStartPos);
          this.fire("drawCanvas");
        }
      },
      OnDragEnd:function(e){ 
       this._dragOffset = null;
       this.ViewReset();
      },
      ViewReset:function(){ 
        this.fire("drawCanvas");
      },
      getCanavsSize:function(){
        return this._map.getSize();
      },
      OnLoopTime:function(){ },
      refreshCache:function(){
        this.cacheTime= +new Date();
        this.ViewReset();
      }
      // drawingCanvas:function(ctx){
        
      //   var map=this._map,zeroP=new Point(0,0),
      //   size=this.getCanavsSize(),
      //   offsetDrag=this._dragOffset || zeroP,
      //   p0 = (this._touchZoomStart || zeroP),
      //   scale=(this._canvasScale || 1),
      //   box=size.multiplyBy(scale).round();
      //   var baseP1=this.transformtion.transform(p0.clone(),scale)._add(p0).add(offsetDrag).round();
      //   ctx.drawImage(this.canvas,baseP1.x,baseP1.y,box.x,box.y);
      //   // var r=5;
      //   // ctx.globalAlpha = 1;
      //   // ctx.fillRect(p0.x-r/2,p0.y-r/2,r,r);
      //   // ctx.globalAlpha = 1;
      // } 
     
    };
   
    geomap.Layer = geomap.Class(geomap.CommonMethods, geomap.Observable, Layer,{
      initialize: function(options) {
        options || (options = { }); 
        this._setOptions(options);
      },
      drawingCanvas:function(ctx,opt){
        
        var map=this._map,zeroP=new Point(0,0),
        size=this.getCanavsSize(),
        offsetDrag=this._dragOffset || zeroP,
        p0 = (this._touchZoomStart || zeroP),
        scale=(this._canvasScale || 1),
        box=size.multiplyBy(scale).round();
        var baseP1=this.transformtion.transform(p0.clone(),scale)._add(p0).add(offsetDrag).round();
        ctx.drawImage(this.canvas,baseP1.x,baseP1.y,box.x,box.y);
        // var r=5;
        // ctx.globalAlpha = 1;
        // ctx.fillRect(p0.x-r/2,p0.y-r/2,r,r);
        // ctx.globalAlpha = 1;
      } 
     
    }); 
     

  // geomap.Layer=Layer;
  
  })(typeof exports !== 'undefined' ? exports : this);
  


(function(global) {

  'use strict';

  var extend = geomap.util.object.extend;
  var Point =geomap.Point;
  var Element=geomap.element;

  if (!global.geomap) {
    global.geomap = { };
  }

  if (global.geomap.TileLayer) {
    geomap.warn('geomap.Map is already defined.');
    return;
  }
 
  geomap.TileLayer = geomap.Class(geomap.Layer, {
      url:null,
      _drawLock:1,
      cache:true,
      _canvas_map_size:new Point(0,0),
      _mapSize:null,
      _tiles:{},
      headers:{},
      useReqModel:false,
     initialize: function( options) {
      this.callSuper('initialize',options);
      this.on("initLayer",this.OnInitLayer.bind(this));
      this.on("draw_tile",this.DrawTile.bind(this));
    }, 
    OnInitLayer:function(){
      this.getCanavsSize();
      this._levels = {};
  this._tiles = {};
    },
     getCanavsSize:function(){
      var map=this._map,size=map.getSize();
      if(!this._canvas_copy_size || !this._mapSize || !size.equals(this._mapSize)){
        this._mapSize=size.clone();
        this._canvas_copy_size=size.multiplyBy(3); 
        // this._canvas_copy_size=size; 
        this.canvas.width=this._canvas_copy_size.x;
        this.canvas.height=this._canvas_copy_size.y;
        this.canvas.style.width=this._canvas_copy_size.x+"px";
        this.canvas.style.height=this._canvas_copy_size.y+"px";
         this._canvas_map_size=size;
         this.transformtion.setOrigin(-size.x,-size.y);
      }
      return this._canvas_copy_size;
     },
     InitLevels:function(){
         var map=this._map;
         var zoom=map.zoom;
         var maxZoom=map.maxZoom;
              var level= this._levels[zoom];
              if(!level){
                  level = this._levels[zoom] = {};
                  level.zoom=zoom;
              }
              this.UpdateLevel(level);
     },
     UpdateLevel:function(level){
          var map=this._map,
          z=level.zoom,
          tsize=map.tileSize,
          bounds=map.getBounds(),
          res=map.resolution(z),
          canvasSize=this.getCanavsSize(),
          offsetSize=this._canvas_map_size;

          var tiles=level.tiles;
          if(!tiles){
              tiles = level["tiles"] ={};
          }
          for(var i in tiles){
              tiles[i]["tag"]=0;
              tiles[i]["cacheTime"]=this.cacheTime;
          }

          var cells=Math.round(offsetSize.x  /tsize)+2;
          var rows=Math.round(offsetSize.y /tsize)+2;
          var startTile=this.OriginTileInfo(res,bounds.min);
          var cell=startTile.cell;
          var row=startTile.row;
          var left=startTile.left;
          var top=startTile.top;
          for(var c=-0,k=cells;c<k;c++){
              for(var r=-0,k2=rows;r<k2;r++){
                  var  x=1*cell + c;
                  var y=1*row + r;
                  var l=Math.floor(left+tsize*c)+offsetSize.x;
                  var t=Math.floor(top+tsize*r)+offsetSize.y;
                  var key="NO"+x+"-"+y;
                  var tile=tiles[key];
                  if(!tile){
                      tile = tiles[key]={};
                      tile.x=x;
                      tile.y=y;
                      tile.z=z;
                      tile.id=key;
                  }
                  tile.left=l;
                  tile.top=t;
                  tile.tag=1;
                  tile.cacheTime=this.cacheTime;
              }
          }
          this.LoadLevel(level);
          
     },
     LoadLevel:function(level){
              var tiles=level.tiles;
              if(tiles){
                  for(var i in tiles){
                      var tile=tiles[i];
                      if(tile.tag==0){
                          this.RemoveTile(tile);
                      }else{
                         this.LoadTile(tile);
                      }
                  }
              }
     },
     LoadTile:function(tile){
         var image=tile.image;
         if(!image){
             image = tile["image"]= Element.create('img');
             tile.status=0;
             var callback=this.OnloadImage;
             var context=this;
             var onLoadCallback=function (){
                  callback && callback.call(context, tile, false);
             }
             image.onload=onLoadCallback;
             image.onerror = function() {
                  geomap.log('Error loading ' + image.src);
                  callback && callback.call(context, tile, true);
            };
             image.tile=tile;
             image.src=this.GetTileUrl(this.url,tile);
         }else{
             var newSrc=this.GetTileUrl(this.url,tile);
             geomap.debug("newSrc="+newSrc);
             if(newSrc != image.src){
                  tile.status=0;
                  image.src=newSrc;
             }
         }
     },
     GetTileUrl:function(url,tile){
      var imgUrl=geomap.util.template(url+ (/\?/.test(url) ? '&' : '?')+"cacheTime={cacheTime}",tile);
      return imgUrl;
    },
     OnloadImage:function(tile,isError){
          if(!isError){
              if(tile.status === 0){
                  tile.status=1;
                  this.fire("draw_tile",tile);
              }
          }
     },
     RemoveTile:function(tile){
          if(tile.image){
              tile.image.remove();
              tile.image=null;
          }
          delete this._levels[tile.z].tiles[tile.id];
     },
     DrawTile:function(){
          var map=this._map,
          z=map.zoom;
          var level= this._levels[z];
          if(!level){
              return;
          }
          var tiles=level.tiles;
          if(tiles){
              for(var i in tiles){
                  var tile=tiles[i];
                  if(tile.tag === 1 && tile.status === 1 && tile.image){
                          // this.canvasCtx.clearRect(0,0,canvasSize.x,canvasSize.y);
                          this.canvasCtx.drawImage(tile.image,tile.left,tile.top);
                  }
              }
          }
          this.fire("drawCanvas");
     },
    ViewReset:function(){ 
      this._canvasScale=1;
      var map=this._map,
          z=map.zoom,
          tsize=map.tileSize,
          bounds=map.getBounds(),
          res=map.resolution(z),
          canvasSize=this.getCanavsSize(),
          offsetSize=this._canvas_map_size,
          lock=this._drawLock+1;
      this.canvasCtx.clearRect(0,0,canvasSize.x,canvasSize.y);
      this.InitLevels();
      this.fire("draw_tile",null);
    },
    OriginTileInfo:function(res,min){
      var map=this._map,o=map.origin,tsize=map.tileSize;
      var x=min.x,y=min.y;
      var cell = Math.floor((min.x - o.x) / res.x / tsize);
      var row = Math.floor((o.y - min.y) / res.y / tsize);
      var left = -(min.x - o.x) / res.x +tsize * cell ;
      var top = -(o.y - min.y) / res.y +tsize * row;
      return {cell:cell,row:row,left:left,top:top,res:res,tsize:tsize};
    }
     
  } );
  

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {
    'use strict';
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.PaletteLayer) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }
   
    geomap.PaletteLayer = geomap.Class( geomap.Layer,  {
      type: 'PaltteLayer',
      paths:[],
      drawType:0,
      fill:true,
      loopRender:false,
      _enabled:true,
      referenceLine:false,
      group:null,
      initialize: function(options) {
        this.callSuper('initialize',options);
        this.on("initLayer",this.OnInitLayer.bind(this));
      }, 
      OnInitLayer:function(){
        this._map.on("mousedown",this.OnMouseDown.bind(this));
        this._map.on("mousemove",this.OnMouseMove.bind(this));
        this._map.on("mouseup",this.OnMouseUp.bind(this));
        this.transformtion.setOrigin(0,0);
        this.group=new geomap.shape.Group();
      },
      setType:function(gtype,fill){
          this.drawType=gtype;
          if(fill!= undefined){
            this.fill=fill;
          }
        
          if(this._pathing){
              this._pathing.setType(this.drawType,this.fill);
          }
      },
      OnMouseDown:function(e){
        if(!this._enabled){
          return ;
        }
        var event=e.event,p=e.point; 
        if(event.ctrlKey){
            eventjs.cancel(event);
            this._opendraw=true;
            if(this._palette_drawing){
              this.fire("draw_point",e);
            }else{
              this._palette_drawing=true;
              this.fire("draw_start",e);
            }
            
            if(!this._pathing || this._pathing === null){
                this._pathing=new geomap.Path(this._map,{lineDash:[]});
                this._pathing.setType(this.drawType,this.fill);
            }
        }else{
            this._opendraw=false;
        }  
      },
      OnMouseMove:function(e){
        if(!this._enabled){
          return ;
        }
        var event=e.event,p=e.point;
        if(this._opendraw){
          if(!event.ctrlKey){
            if(this._palette_drawing){
              this._palette_drawing=false;
              this.fire("draw_end",e);
            } 
          }else{
              if(this._palette_drawing){
                this.fire("draw_moving",e);
              } 
          }
                
          if( this._pathing){
              if(!event.ctrlKey){
                  this.PathEnd(e,p);
              }else{
                  this._pathing.moveTo(p); 
                  this.ViewReset();
              }
          }
        }
      },
      OnMouseUp:function(e){
        if(!this._enabled){
          return ;
        }
        var event=e.event,p=e.point;
      
        if(!this._opendraw){ 
           this.PathEnd(e,p);
        }else{ 
            if(this._opendraw  && this._pathing){
                var p=e.point;
                this._pathing.push(p); 
                this.ViewReset();
                if(this._pathing.isEnd()){
                    this.PathEnd(e,p);
                }
            }
            
        }
      },
      addGeometry:function(geomtry){
        this.paths.push(geomtry);
        this.ViewReset();
      },
      clearGeometry:function(){
        this.paths=[];
        this.group.clear();
        this.ViewReset();
      },
      PathEnd:function(e,p){
        if(this._pathing && this._pathing!=null){
            this._pathing.end();
            var geometry=this._pathing.getJson();
            if(geometry.coordinates.length>0){
              var shapePath=new geomap.shape.Path(this.group,this._pathing.getCoordJson());
            }
            this.fire("geometry_change",this.group);
            // this.fire("geometry_change",this._pathing);
           
            this._pathing=null;
            this.ViewReset();
        }
      },
      OnLoopTime:function(){ 
        if(this.loopRender && (this._canvasScale==1 || this._canvasScale == undefined )){
          this._dragOffset=null;//实时重绘canvas，不需要拖拽偏移量。
           this.ViewReset();
        }
      },
      drawingCanvas:function(ctx){
        this.callSuper('drawingCanvas',ctx);
        this.drawReferenceLine(ctx);
      },
      // drawingCanvas:function(ctx){
        
      //   var map=this._map,zeroP=new Point(0,0),
      //   size=this.getCanavsSize(),
      //   offsetDrag=this._dragOffset || zeroP,
      //   p0 = (this._touchZoomStart || zeroP),
      //   scale=(this._canvasScale || 1),
      //   box=size.multiplyBy(scale).round();
      //   var baseP1=this.transformtion.transform(p0.clone(),scale)._add(p0).add(offsetDrag).round();
      //   ctx.drawImage(this.canvas,baseP1.x,baseP1.y,box.x,box.y);
      //   this.drawReferenceLine(ctx);
      // } ,
      ViewReset:function(){ 
        var ctx=this.canvasCtx;
        if(!this.wheelZoomChanage && (this._canvasScale==1 || this._canvasScale == undefined )){
          ctx.clearRect(0,0,this.width,this.height);
          ctx.setLineDash([]);
            this._canvasScale=1;
            var z=this._map.zoom,bounds=this._map.getBounds(),res=this._map.resolution(z);
            this.loopRender=false;
            if(this.paths.length>0){
                for(var i=0,k=this.paths.length;i<k;i++){
                    var path=this.paths[i];
                    path.render(ctx);
                    if(path.loopRender){
                      this.loopRender=true;
                    }
                }
            }
            this.group.draw(ctx,this._map);
            if(this._pathing && this._pathing != null){
                this._pathing.render(ctx);
            }
            this.fire("drawCanvas");
        }
      },
      toggleReferenceLine:function(){
        this.toggle("referenceLine");
        // this.ViewReset();
        this.fire("drawCanvas");
      },
      drawReferenceLine:function(ctx){
        if(!this.referenceLine){
          return;
        }
        var w=this.width,h=this.height,divide=20;
        ctx.strokeStyle = "rgba(66, 66, 66, 0.3)";
        ctx.beginPath();
        for(var i=0;i<w;i++){
          var x=i*divide,y=0;
           ctx.moveTo(x,y);
           ctx.lineTo(x,h);
        }
        for(var i=0;i<h;i++){
          var y=i*divide,x=0;
          ctx.moveTo(x,y);
          ctx.lineTo(w,y);
        }
        ctx.stroke();
        divide=10;
        ctx.strokeStyle = "rgba(224, 224, 224, 0.3)";
        ctx.beginPath();
        for(var i=0;i<w;i++){
          var x=i*divide,y=0;
           ctx.moveTo(x,y);
           ctx.lineTo(x,h);
        }
        for(var i=0;i<h;i++){
          var y=i*divide,x=0;
          ctx.moveTo(x,y);
          ctx.lineTo(w,y);
        }
        ctx.stroke();
      }

       
     
       
      
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  


(function(global) {
    'use strict';
   
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.FeatureLayer) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }

    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
    var Feature =geomap.Feature;
   
    geomap.FeatureLayer = geomap.Class(geomap.Layer,  {
      type: 'FeatureLayer',
      features:[],
      drawType:0,
      fill:true,
      loopRender:false,
      _enabled:true,
      drawOptions:{},
      initialize: function(options) {
        this.callSuper('initialize',options);
        this.on("initLayer",this.OnInitLayer.bind(this));
        
      }, 
      OnInitLayer:function(){ 
        this.transformtion.setOrigin(0,0);
        this._map.on("animated",this.AnimatedTag.bind(this));
      },
      AnimatedTag:function(){
        this.loopRender=true;
      },
      setType:function(gtype,fill){
          this.drawType=gtype;
          if(fill!= undefined){
            this.fill=fill;
          }
        
          if(this._pathing){
              this._pathing.setType(this.drawType,this.fill);
          }
      },
      setFeatures:function(featureData,options){
        this.clearData();
        this.drawOptions= options||{};

        if( typeof featureData == 'array'){
            for(var i=0,k=featureData.length;i<k;i++){
                this.features.push(new Feature(featureData,this._map));
            }
        }else if(typeof featureData == 'object'){
            if(featureData.type && featureData.type ==='FeatureCollection'){
                 
                var geomNum=featureData.features.length;
                for(var i=0;i<geomNum;i++){
                    this.features.push(new Feature(featureData.features[i],this._map));
                }
            }else{
                this.features.push(new Feature(featureData,this._map));
            } 
        }
         
        this.ViewReset();
      },
      clearData:function(){
        if(this.features){
            this.features.forEach(function (item, index, array) {
                // delete item;
                // array[index]=null;
            });
        }
        this.features=[];
      },
      clear:function(){
          this.clearData();
          this.ViewReset();
      },
      OnLoopTime:function(){ 
        if(this.loopRender && (this._canvasScale==1 || this._canvasScale == undefined )){
          this._dragOffset=null;//实时重绘canvas，不需要拖拽偏移量。
          this.loopRender=false;
           this.ViewReset();
        }
      },
      ViewReset:function(){
        if(!this.wheelZoomChanage && (this._canvasScale==1 || this._canvasScale == undefined )){
          this.canvasCtx.clearRect(0,0,this.width,this.height);
            this._canvasScale=1;
            var z=this._map.zoom,bounds=this._map.getBounds(),res=this._map.resolution(z);
                for(var i=0,k=this.features.length;i<k;i++){
                    var feature=this.features[i];
                    feature.draw(this.canvasCtx,this.drawOptions);
                }
            this.fire("drawCanvas");
           
        }
    //   },
    //   drawingCanvas:function(ctx){
    //       if(this.drawOptions.animated){
    //             for(var i=0,k=this.features.length;i<k;i++){
    //                 var feature=this.features[i];
    //                 feature.draw(ctx,this.drawOptions);
    //             }
    //         }else{
    //             this.callSuper('drawingCanvas',ctx);
    //         }
      }
      
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  



  (function() { 

    var toPoint=geomap.util.toPoint;
    var Ball = {
        x: 100,
        y: 100,
        vx: 5,
        vy: 2,
        radius: 50,
        color: '#e57373a8',
        drawType:0,
        times:0,
        setMap:function(map){
            this._map=map;
            this._play=false;
            this._map.on("drawingCanvas",this.draw.bind(this));
            this._radius=0;
            this._dashOffset=1;
        },
        play:function(event){
            this._radius=0;
            this._play=true;
            this._alpha=0;
            this.drawType=0;
            this.times=2,
            geomap.debug("====Ball do play.");
            if(this._coords){
                this._coords.forEach(function (item, index, array) {
                    delete item;
                    array[index]=null;
                });
                this._coords=[];
            }else{
                this._coords=[];
            }
            
            if(event!=undefined){
                var feature=event.feature;
                if(feature!=undefined &&  feature.geometry && feature.geometry.type=='Polygon'){
                    var coords=feature.geometry.coordinates; 
                    if(coords && coords.length>0){
                        var coord1=coords[0];
                        for(var i=0,k=coord1.length;i<k;i++){
                            this._coords.push(toPoint(coord1[i]));
                        }
                        this.drawType=1;
                    }
                }
            }
        },
        drawPolygon:function(ctx){
               if(this.times>0){
                            var coords=this._coords;
                            if(coords.length>0){
                                var m=this._map,len=coords.length;
                               
                                ctx.beginPath();
                                ctx.lineWidth = 3;
                                ctx.setLineDash([15,4]);
                                ctx.lineDashOffset = (this._dashOffset+=1);
                                    var p0=m.coordToScreen(coords[0]);
                                    ctx.moveTo(p0.x,p0.y);
                                    for(var i=1;i<len;i++){
                                        var coord=coords[i];
                                        var p=m.coordToScreen(coord);
                                        ctx.lineTo(p.x,p.y);
                                    }
                                ctx.closePath();
                                ctx.strokeStyle = 'rgba(255,87,34,'+this._alpha+')';
                                ctx.stroke();
                                ctx.lineWidth = 1;
                                this._alpha+=0.1;
                                if(this._alpha<1){
                                    m.draw();
                                }else{
                                    this._alpha=0;
                                    this.times-=1;
                                }
                        }
                    
                }

        },
        drawPoint:function(ctx){
            if(this.times>0){
                var m=this._map,r, center=m.center; 
                var pos1=m.coordToScreen(center).round(); 
                this.x=pos1.x,this.y=pos1.y;
                
                if(this._radius<this.radius){
                    this._radius+=1;
                   
                    r=this._radius;
                    var co= (this.radius-r)/this.radius;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, r, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(33, 150, 243,'+co+')';
                    ctx.fill();
                    m.draw(); 
                }else{
                    this.times -=1;
                    // this.drawText(ctx,pos1);
                    
                }
            }
        },
        drawLock:function(ctx){
            if(this.times>0){
                var m=this._map,r, center=m.center; 
                var pos1=m.coordToScreen(center).round(); 
                this.x=pos1.x,this.y=pos1.y;
                
                if(this._radius<this.radius){
                    this._radius+=1;
                   
                    r=this._radius;
                    var co= (this.radius-r)/this.radius;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, r, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(33, 150, 243,'+co+')';
                    ctx.fill();
                    m.draw(); 
                }else{
                    this.drawText(ctx,pos1);
                    
                }
            }
        },
        draw: function(ctx) {
           if(this.times>0){
               switch(this.drawType){
                   case 1:{
                       this.drawPolygon(ctx);
                       break;
                   }
                   default:
                       this.drawPoint(ctx);
               }
           }
        },
        drawText:function(ctx,pos){
            if(this._alpha<=1){
                var rx=100,ry=-100,sx=pos.x,sy=pos.y,ex=pos.x+rx,ey=pos.y+ry,r=4,lw=100;
                ctx.beginPath();
                ctx.moveTo(sx,sy);
                ctx.arc(sx,sy, r, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fillStyle = 'rgba(103 ,58,183,'+this._alpha+')';
                ctx.fill();
                ctx.strokeStyle = 'rgba(103 ,58,183,'+this._alpha+')';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.setLineDash([15,4]);
                ctx.moveTo(sx,sy);
                ctx.lineTo(ex, ey);
                ctx.lineTo(ex+lw,ey);
                ctx.stroke();
                this._alpha+=0.1;
                if(this._alpha<1){
                    this._map.draw(); 
                }
            }else{
                this.times -=1;
            }
        }
        
      };

    geomap.Ball=Ball;
  })();


(function(global) {

    'use strict';
         
    if (!global.MapProject) {
        global.MapProject = { };
    }
    
    if (global.MapProject.Icons) {
    geomap.warn('MapProject.ICON is already defined.');
    return;
    }

    MapProject.Icons={refLine:'<svg t="1619677851087" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="19960" width="12" height="12"><path d="M277.333333 1024c-11.797333 0-21.333333-9.557333-21.333333-21.333333L256 21.333333c0-11.776 9.536-21.333333 21.333333-21.333333s21.333333 9.557333 21.333333 21.333333l0 981.333333C298.666667 1014.442667 289.130667 1024 277.333333 1024z" p-id="19961"></path><path d="M512 1024c-11.797333 0-21.333333-9.557333-21.333333-21.333333L490.666667 21.333333c0-11.776 9.536-21.333333 21.333333-21.333333s21.333333 9.557333 21.333333 21.333333l0 981.333333C533.333333 1014.442667 523.797333 1024 512 1024z" p-id="19962"></path><path d="M746.666667 1024c-11.797333 0-21.333333-9.557333-21.333333-21.333333L725.333333 21.333333c0-11.776 9.536-21.333333 21.333333-21.333333s21.333333 9.557333 21.333333 21.333333l0 981.333333C768 1014.442667 758.464 1024 746.666667 1024z" p-id="19963"></path><path d="M1002.666667 298.666667 21.333333 298.666667c-11.797333 0-21.333333-9.557333-21.333333-21.333333s9.536-21.333333 21.333333-21.333333l981.333333 0c11.797333 0 21.333333 9.557333 21.333333 21.333333S1014.464 298.666667 1002.666667 298.666667z" p-id="19964"></path><path d="M1002.666667 533.333333 21.333333 533.333333c-11.797333 0-21.333333-9.557333-21.333333-21.333333s9.536-21.333333 21.333333-21.333333l981.333333 0c11.797333 0 21.333333 9.557333 21.333333 21.333333S1014.464 533.333333 1002.666667 533.333333z" p-id="19965"></path><path d="M1002.666667 768 21.333333 768c-11.797333 0-21.333333-9.557333-21.333333-21.333333s9.536-21.333333 21.333333-21.333333l981.333333 0c11.797333 0 21.333333 9.557333 21.333333 21.333333S1014.464 768 1002.666667 768z" p-id="19966"></path></svg>',
        layerInfo:'<svg t="1619426085418" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1848" width="12" height="12"><path d="M512 78.769231l433.230769 315.076923-433.230769 315.076923L78.769231 393.846154 512 78.769231z m352 492.307692L945.230769 630.153846 512 945.230769 78.769231 630.153846l81.230769-59.076923L512 827.076923l352-256z" fill="#333333" p-id="1849"></path></svg>',
        query:'<svg t="1619668960772" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1404" width="12" height="12"><path d="M654.1 608.9c20.4-24.7 37-52.1 49.5-81.7 17.3-40.9 26.1-84.4 26.1-129.1s-8.8-88.2-26.1-129.1c-16.7-39.5-40.6-75-71.1-105.4-30.5-30.5-65.9-54.4-105.4-71.1C486.2 75 442.8 66.2 398 66.2S309.8 75 268.8 92.3c-39.5 16.7-75 40.6-105.4 71.1-30.5 30.5-54.4 65.9-71.1 105.4-17.3 41-26.1 84.4-26.1 129.2s8.8 88.2 26.1 129.1c16.7 39.5 40.6 75 71.1 105.4 30.5 30.5 65.9 54.4 105.4 71.1 40.9 17.3 84.4 26.1 129.1 26.1s88.2-8.8 129.1-26.1c29.7-12.5 57-29.2 81.7-49.5l296.8 296.8 22.6-22.6 22.6-22.6-296.6-296.8zM665.8 398c0 147.6-120.1 267.8-267.8 267.8-147.6 0-267.8-120.1-267.8-267.8 0-147.6 120.1-267.8 267.8-267.8 147.6 0 267.8 120.1 267.8 267.8z" p-id="1405"></path></svg>',
        queryRect:'<svg t="1619669003834" class="icon" viewBox="0 0 1170 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1730" width="12" height="12"><path d="M550.4 268.8c155.52 0 281.6 126.08 281.6 281.6 0 63.9104-21.2992 122.8544-57.1776 170.112l103.3472 103.3472a38.4 38.4 0 0 1-52.4672 56.0384l-1.8432-1.728-103.3344-103.3472A280.3584 280.3584 0 0 1 550.4 832c-155.52 0-281.6-126.08-281.6-281.6s126.08-281.6 281.6-281.6z m0 76.8c-113.1136 0-204.8 91.6864-204.8 204.8s91.6864 204.8 204.8 204.8 204.8-91.6864 204.8-204.8-91.6864-204.8-204.8-204.8z" fill="#2c2c2c" p-id="1731"></path><path d="M806.4 0a89.6 89.6 0 0 1 89.5488 86.528L896 89.6v145.0624a38.4 38.4 0 0 1-76.736 2.2656L819.2 234.6624V89.6a12.8 12.8 0 0 0-11.3024-12.7104L806.4 76.8H89.6a12.8 12.8 0 0 0-12.7104 11.3024L76.8 89.6v716.8a12.8 12.8 0 0 0 11.3024 12.7104L89.6 819.2h120.2432a38.4 38.4 0 0 1 2.2528 76.736l-2.2528 0.064H89.6a89.6 89.6 0 0 1-89.5488-86.528L0 806.4V89.6a89.6 89.6 0 0 1 86.528-89.5488L89.6 0h716.8z" fill="#2c2c2c" p-id="1732"></path></svg>',
        query2:'<svg t="1619677276831" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3496" width="12" height="12"><path d="M910.1312 102.912h-195.4304a33.4336 33.4336 0 0 0 0 66.816h162.0992V331.776a33.4336 33.4336 0 0 0 66.816 0V136.192a33.536 33.536 0 0 0-33.4848-33.3824zM136.6528 365.1584c18.432 0 33.4336-15.0016 33.4336-33.3824V169.728h162.0992a33.4336 33.4336 0 0 0 0-66.8672H136.6528a33.4336 33.4336 0 0 0-33.3824 33.4336V331.776c0 18.432 14.848 33.3824 33.3824 33.3824z m195.4304 534.784H170.0864v-162.0992a33.4336 33.4336 0 0 0-66.816 0v195.5328c0 18.432 15.0016 33.4336 33.3824 33.4336h195.5328a33.4336 33.4336 0 1 0-0.1024-66.8672z m578.048-195.4816a33.4336 33.4336 0 0 0-33.4336 33.3824v162.0992H714.752a33.4336 33.4336 0 0 0 0 66.8672h195.5328c18.432 0 33.3824-15.0016 33.3824-33.4336v-195.5328a33.536 33.536 0 0 0-33.4848-33.3824z m-141.312 100.2496a33.3312 33.3312 0 0 0 23.04-57.6l-84.224-80.384a245.248 245.248 0 1 0-445.7472-156.16 245.3504 245.3504 0 0 0 400.3328 205.1584l83.5072 79.7184a33.28 33.28 0 0 0 23.0912 9.216z m-83.8656-267.6224a177.92 177.92 0 0 1-56.1664 119.1424 177.5616 177.5616 0 0 1-133.2736 47.8208 177.3056 177.3056 0 0 1-122.7776-60.1088 177.7664 177.7664 0 0 1-44.288-129.28 177.92 177.92 0 0 1 56.1664-119.1424 177.5616 177.5616 0 0 1 133.12-47.8208c47.6672 2.9696 91.1872 24.32 122.8288 60.16 31.6928 35.6864 47.4112 81.6128 44.3904 129.2288z" p-id="3497"></path></svg>',
        draw:'<svg t="1619677506373" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="13383" width="12" height="12"><path d="M942.654832 687.605483L519.250636 435.700243c-15.44783-9.18929-25.37697-2.171456-22.100344 15.59007l90.028433 487.136729c3.28379 17.756409 14.403035 20.215414 24.74252 5.442966 0 0 57.520041-82.45699 104.696504-132.795469l90.49813 134.79194c8.637728 12.8384 26.065655 16.188704 38.752606 7.466042l30.379915-20.999267c12.669554-8.740058 15.966647-26.434046 7.351431-39.299051l-90.458221-134.697795c60.47842-25.067932 145.927557-46.214555 145.927557-46.214555 17.426905-4.300956 19.038612-15.331173 3.585665-24.51637z" fill="" p-id="13384"></path><path d="M511.999488 887.554398l-0.290619 0.167822-324.629565-187.749058 0.288573-375.021255L512.290107 137.688919l324.629565 187.759291-0.185218 250.299673h64.100924l0.210801-287.259446L512.344343 63.671135 123.294582 287.893896l-0.342807 449.039039 388.702859 224.808093 0.344854-0.198522z" fill="" p-id="13385"></path></svg>'
    };
 
   

})(typeof exports !== 'undefined' ? exports : this);


var MapProject = MapProject || { version: '1.0.0' };
if (typeof exports !== 'undefined') {
  exports.MapProject = MapProject;
} 

else if (typeof define === 'function' && define.amd) {
  define([], function() { return MapProject; });
}

(function(global) {

  'use strict';
   
    if (!global.MapProject) {
      global.MapProject = { };
    }
  
    if (global.MapProject.Map) {
      geomap.warn('MapProject.Map is already defined.');
      return;
    }
   
    
    var Util=geomap.util,Request=geomap.request,Template=Util.template,toPoint=Util.toPoint;
    var extend = Util.object.extend;
    var Point=geomap.Point;
 
    MapProject.Map = geomap.Class(geomap.Map, {
      mapId:undefined,
      server:{project:"",
              mapInfo:"",
              display:"",
              tile:"",
              addLayer:"",
              deleteLayer:"",
              orderChange:"",
              addParking:"",
              queryParking:"",
              deleteParking:"",
              },
      _server:{},
      _server_layers:[],
      codeOk:0,
      reqHead:{},
      _mapInfo:{},
      _projectMap:[],
      _init_map_status:false,
      drawType:"Rect",
      mapQuery:null,
      mapDraw:null,
      title:"",
      initialize: function(container, options) {
        var mapContainer;
        if(typeof container === 'string'){
             mapContainer=document.getElementById(container)
        }else{
             mapContainer=container;
        }
        this.callSuper('initialize',mapContainer,options); 
        this._init_reqcb();
        this._init_fireEv();
        this._reset_map_conf();
        this.loadProject();
      },
      _init_reqcb:function(){
        this._clearDrawGeometry=this.clearDrawGeometry.bind(this);
        this._drawMapGeom=this.__drawMapGeom.bind(this);
        this._queryCoordData=this.__queryCoordData.bind(this);
        this._reqcb_queryCoordData=this.__reqcb_queryCoordData.bind(this);
        this._reqcb_loadProject=this.__reqcb_loadProject.bind(this);
        this._reqcb_loadServerLayers=this.__reqcb_loadServerLayers.bind(this);
      },
      _init_fireEv:function(){
        this.on("req_project_ok",this._reqcb_loadProject_ok.bind(this));
      },
      loadProject:function(){
        Request(this._server.project,{method:"POST",header:this.reqHead,onComplete:this._reqcb_loadProject});
        this.loadServerLayers();
      },
      __reqcb_loadProject:function(xhr){
        var status=xhr.status;
        if(status==200){ 
          var result=JSON.parse(xhr.response);
          if(result.code === this.codeOk){
            var  rdata=result.data;
              
              if(rdata.projectMap){
                this._projectMap=rdata.projectMap;
              }
              if(rdata.mapInfo){
                this._mapInfo=rdata.mapInfo;
                this.fire("req_project_ok",rdata.mapInfo);
                return ;
              }
          }
          this.fire("req_project_fail");
        }else{
          this.fire("req_error",xhr);
        }
      },
      _reqcb_loadProject_ok:function(){
        this.loadMapInfo(this._mapInfo);
      },
      _reset_server:function(){
        var mapId=this.mapId;
        for(var key in this.server){
          var url=this.server[key];
          this._server[key]=Template(url,{mapId:mapId}); 
       }
      },
      __queryCoordData:function(p){
        // this.vectorLayer.clearData();
        var mq=this.get("mapQuery");
        if(mq){
          var url=Template(mq.url,{mapId:this.mapId});
          Request(url,{method:"POST",body:"p="+p,header:this.reqHead,onComplete:this._reqcb_queryCoordData});
        }
      },
      __reqcb_queryCoordData:function(xhr){
        var res=xhr.response,status=xhr.status; 
        // this.vectorLayer.clearData();
        if( status==200   ){ 
          var mq=this.get("mapQuery");
          var featureCollection=null;
          var result=JSON.parse(xhr.response);
          if(result.code === this.codeOk){
             //featureCollection=result.data;
             if(mq){  
              featureCollection={type:"FeatureCollection","features":result.data};
              mq.fire("coord_data",featureCollection);
            }
              
          }else{
            var myself=this;
            this.fire("request_faile",{target:myself,result:result,tag:"mapQuery"});
          }

          // if(res.length>0 && res.indexOf("{")==0)
          // {
          //    featureCollection=JSON.parse(res);
          // }
          // if(mq){  
          //   mq.fire("coord_data",featureCollection);
          // }
            
          //  if(featureCollection && featureCollection.type=="FeatureCollection"){
          //   this.vectorLayer.addData(featureCollection,{style:{fillStyle:"rgba(0,0,200,0.5)",strokeStyle:"#fff",lineWidth:2},_fill:true,lineDash:[4,2]});
          //   this.fire("drawmap");
          //  }
        }
      },
      __drawMapGeom:function(geo){
        var md=this.get("mapDraw");
        if(md){
          var myself=this;
          var arg={geometry:geo,layer:this.paletteLayer,clearDraw:this._clearDrawGeometry,map:myself};
          md.fire("geom_data",arg);
        }
      },
      clearDrawGeometry:function(){
        this.paletteLayer.clearGeometry();
      },
      _reset_map_conf:function(){
        this._reset_server();
         if(!this._init_map_status){
           this._init_map_status=true;
           var parkingLayer=new geomap.TileLayer({url:this._server.tile,headers:this.reqHead});
           this.parkingLayer=parkingLayer;
          //  var vectorLayer=new geomap.VectorLayer();
          //  this.vectorLayer=vectorLayer;
           var featrueLayer=new geomap.FeatureLayer();
           this.featrueLayer=featrueLayer;
           var paletteLayer=new geomap.PaletteLayer({drawType:this.drawType});
           this.paletteLayer=paletteLayer;
          //  var drawCallbackFn=function(geo){
          //   this.fire("geometry_change",geo);
          //  }.bind(this);
           paletteLayer.on("geometry_change",this._drawMapGeom);;
           this.addLayer(parkingLayer);
          //  this.addLayer(vectorLayer);
           this.addLayer(featrueLayer);
           this.addLayer(paletteLayer);
           var queryCallback=this._queryCoordData;
           this.on("pointcoord",function(e){
               var p=e.coord.x+","+e.coord.y;
               queryCallback(p);});
           this.on("rectcoord",function(e){
               var p=e.minx+","+e.miny+","+e.maxx+","+e.maxy;
               queryCallback(p);
              // console.log("[ccwmap.js]rectcoord="+e.minx+","+e.miny+","+e.maxx+","+e.maxy);
           });
           
         }else{
          this.parkingLayer.url=this._server.tile;
          this.parkingLayer.refreshCache();
          this.featrueLayer.clear();
          this.fire("drawmap");
         }
         this.fire("map_complete",this);

      },
      loadServerLayers:function(){
        Request(this._server.mapInfo,{method:"POST",header:this.reqHead,onComplete:this._reqcb_loadServerLayers});
      },
      __reqcb_loadServerLayers:function(xhr){
        var status=xhr.status;
        if(status==200){ 
          var result=JSON.parse(xhr.response);
          if(result.code === this.codeOk){
            var  rdata=result.data;
              if(rdata.layers){
                this._server_layers=rdata.layers;
                this.fire("server_layer_ok",this._server_layers);
                return ;
              }
          }else{
            var myself=this;
            this.fire("request_faile",{target:myself,result:result,url:this._server.mapInfo,tag:"loadServerLayers"});
          }
          this.fire("req_project_fail");
        }else{
          this.fire("req_error",xhr);
        }
      },
      loadMapInfo:function(mapInfo){
        if(mapInfo){
          this._mapInfo=mapInfo;
          this.mapId=mapInfo.mapId;
          this.set("title",mapInfo.title);
          this._reset_map_conf();
        }
        this.fire("loadmapinfo_end",mapInfo);
      },
      mapChange:function(index){ 
        if(this._projectMap &&  this._projectMap.length > index){
            var mapInfo=  this._projectMap[index];
            this.loadMapInfo(mapInfo); 
            this.loadProject();
        } 
    },
    orderChangeFn:function (oldIndex,newIndex) {
      var myself=this;
      Request(this._server.orderChange,{method:"JSON",body:{oldIndex:oldIndex,newIndex:newIndex},header:myself.reqHead,onComplete:function(xhr){
          var body=xhr.response,status=xhr.status; 
          if(status==200){ 
              myself.refresh();
          }
      }});
  },
    displayServerLayer:function (layerId,display) {
      var myself=this;
      var url=this._server.displayLayer;
      Request(url,{method:"JSON",body:{layerId:layerId,display:display},header:myself.reqHead,onComplete:function(xhr){
          var body=xhr.response,status=xhr.status; 
          if(status==200){ 
            var result=JSON.parse(body);
            if(result.code === myself.codeOk){
                myself.refresh();
            }else{
              myself.fire("request_faile",{target:myself,result:result,url:url,tag:"displayServerLayer"});
              alert(result.msg);
            }
          }
      }}); 
  },
  deleteServerLayer:function (layerId) {
    var myself=this;
    var url=this._server.deleteLayer;
    Request(url,{method:"JSON",body:{id:layerId},header:myself.reqHead,onComplete:function(xhr){
        var body=xhr.response,status=xhr.status; 
        if(status==200){ 
          var result=JSON.parse(body);
          if(result.code === myself.codeOk){
              myself.refresh();
          }else{
            myself.fire("request_faile",{target:myself,result:result,url:url,tag:"deleteServerLayer"});
            alert(result.msg);
          }
        }
    }}); 
},
addServerLayer:function (param) {
  var myself=this;
  var url=this._server.addLayer;
  Request(url,{method:"JSON",body:param,header:myself.reqHead,onComplete:function(xhr){
      var body=xhr.response,status=xhr.status; 
      if(status==200){ 
        var result=JSON.parse(body);
        if(result.code === myself.codeOk){
            myself.refresh();
        }else{
          myself.fire("request_faile",{target:myself,result:result,url:url,tag:"addServerLayer"});
          alert(result.msg);
        }
      }
  }}); 
},
setMapQuery:function(mq){
  this.set("mapQuery",mq);
},
setMapDraw:function(md){
  this.set("mapDraw",md);
  this.paletteLayer.setType(md.drawType,md.fill);
},
// drawGeom:function(data,option){
//   this.vectorLayer.addData(data,option);
//   this.fire("drawmap");
// },
setFeatures:function(data,option){
  this.featrueLayer.setFeatures(data,option);
  this.fire("drawmap");
},
jsonReq:function(url,data,fn,opt){
  var mapurl=Template(url,{mapId:this.mapId}); 
  if(opt=== undefined){
    opt={};
  }
  var param={method:"JSON",body:data,header:this.reqHead,onComplete:fn};
  extend(param,opt);
  Request(mapurl,param); 
},
      toggleReferenceLine:function(){
        this.paletteLayer.toggleReferenceLine();
      },
      refresh:function(){
        this.loadProject(); 
      }
    });

})(typeof exports !== 'undefined' ? exports : this);

(function(global) {

    'use strict';
         
    if (!global.MapProject) {
    global.MapProject = { };
    }
    
    if (global.MapProject.LayerInfo) {
    geomap.warn('MapProject.Menu is already defined.');
    return;
    }
         
           
    var Util=geomap.util,Request=geomap.request,Template=Util.template,toPoint=Util.toPoint,Element=geomap.element;
    var extend = Util.object.extend;
    var Point=geomap.Point;
     
    MapProject.LayerInfo = geomap.Class(geomap.CommonMethods, geomap.Observable, {
        map:undefined,
        root:undefined, 
        toolBar:undefined,
        tbOpt:{"className":"toolBar"},
        tbStyle:{"width":"100%","height":"50px"},
        layers:[],
        menu:undefined,
        title:"图层信息",
        type:"layerInfo",
        id:0,
        icon:null,
        initialize: function(options) {
            options || (options = { });  
            this.id= +new Date();
            this.icon=MapProject.Icons.layerInfo;
            this._setOptions(options);
            this.root=Element.create("div");
            this.toolBar=Element.create("div",this.tbOpt,this.tbStyle);
            this.tableDiv=Element.create("div");
            this.detailDiv=Element.create("div",{},{"padding":"20px"});
            this.root.appendChild(this.toolBar);
            this.root.appendChild(this.tableDiv);
            this.root.appendChild(this.detailDiv);
            this.addToolBar();
            if(this.map!=undefined){
                this.setMap(this.map);
            }
        },
        setMap:function(map){
            this.map=map; 
            this.createMapLayerTable();
            this.map.on("server_layer_ok",this._loadMapLayer.bind(this));
        },
        addToMenu:function(menu){
            this.menu=menu;
            this.menu.on("menu_click",this.menuClick.bind(this));
            this.menu.addMenu({mapMenu:true,type:this.type,text:this.title,icon:this.icon,id:this.id});
        },
        menuClick:function(arg){
            var menu=arg.menu,menuItem=menu.data;
            if(menuItem.mapMenu && menuItem.type=== this.type && menuItem.id && menuItem.id === this.id){
                if(this.viewFrame){
                    this.viewFrame.show();
                }else{
                    this.viewFrame=new geomap.view.Frame(document.body,{title:this.title, body:this.getElement(),w:600,h:450,closeType:2});
                }
            }
        },
        getElement:function(){
            return this.root;
        },
        addToolBar:function(){
            var editFormFn=this.editForm.bind(this);
            var addBtn=Element.create("input",{"value":"添加","type":"button","className":"btn"});
            eventjs.add(addBtn,"click",editFormFn); 
            this.toolBar.appendChild(addBtn);
        },
        _loadMapLayer:function(){
            this.layers=this.map._server_layers;
            this.createMapLayerTable();
        },
        createMapLayerTable:function(){ 
            var extHead={opt:"操作"};
            var extBody=[{"text":"删除","tag":"a","id":"delete","style":{"cursor": "pointer"}},{"text":"显隐","tag":"a","id":"display"}];
            var headV={layerOrder:"序号",layerType:"类型",display:"状态",title:"图层说明",layerSource:"图层源"};
            var thead=document.createElement("thead");
            {
                var tr=document.createElement("tr");
                for(var key in headV){
                    var td=document.createElement("td");
                    td.innerText=headV[key];
                    tr.appendChild(td);
                }
                for(var key in extHead){
                    var td=document.createElement("td");
                    td.innerText=extHead[key];
                    tr.appendChild(td);
                }
                thead.appendChild(tr);
            }
            var tbody=document.createElement("tbody");
            if(this.layers!=undefined && this.layers.length>0){
                for(var i=0,k=this.layers.length;i<k;i++){
                    var layer=this.layers[i];
                    var tr=document.createElement("tr");
                    for(var key in headV){
                        var td=document.createElement("td");
                        td.innerText=layer[key];
                        tr.appendChild(td);
                    }
                    if(extBody.length>0){
                        var td=document.createElement("td");
                        tr.appendChild(td);
                        for(var j=0,jk=extBody.length;j<jk;j++){
                            var item=extBody[j];
                            var el=Element.create(item.tag,{},item.style||{"paddingLeft":"10px","cursor": "pointer"});
                            el.innerText=item.text;
                            el._rowIndex=i;
                            el._data=item;
                            el._myself=this;
                            eventjs.add(el,"click",function(event,self){ 
                                eventjs.cancel(event);
                                this.eventFn(event,self);
                            }.bind(this));
                            td.appendChild(el);
                        }
                    }
                    
                    tbody.appendChild(tr);
                    
                }
            }
            
            if(!this.table){
                this.table=document.createElement("table");
                //=== 测试
                eventjs.add(this.table,"drag",this.dragTableEvent.bind(this));
                eventjs.add(this.table,"mouseOver",this.mouseOverEvent.bind(this));
                this.tableDiv.appendChild(this.table);
            }
            this.table.innerHTML="";
            this.table.appendChild(thead);
            this.table.appendChild(tbody); 
        },
        dragTableEvent:function(event,self){
            var target1=self.target,target2=event.target;
            if(self.state === 'down'){
                eventjs.cancel(event);
                var trEl=target2;
                if(target2.nodeName =='TD'){
                    trEl=target2.parentElement || target2.parentNode;
                    this._drag_tr=trEl;
                    this._drag_rowIndex=trEl.rowIndex;
    
                }
            }else if(self.state === 'up'){
                if(this._drag_on_tr && this._drag_tr!=undefined){
                    if(this._drag_on_tr.rowIndex ==this._drag_rowIndex){
                    //  geomap.debug("原来位置了－－－");
                    }else　if(this._drag_tr.querySelectorAll){
                        var cells=this._drag_tr.querySelectorAll("td");
                        
                        this.table.deleteRow(this._drag_rowIndex);
                        var row=null;
                        var oldIndex=this._drag_rowIndex;
                        var newIndex=this._drag_on_tr.rowIndex;
                        if(this._drag_rowIndex < this._drag_on_tr.rowIndex){
                            newIndex+=1;
                            row=this.table.insertRow(newIndex);
                        }else{
                            row=this.table.insertRow(newIndex);
                        }
                        for(var i=0,k=cells.length;i<k;i++){
                            row.appendChild(cells[i]);
                        } 
                        this.orderChangeFn(oldIndex-1,newIndex-1);
                        // geomap.debug("放到=="+this._drag_on_tr.rowIndex);
                    }
                }
                this._drag_tr=undefined;
           
            }
        },
        mouseOverEvent:function (event,self) {
            var target2=event.target; 
                var trEl=target2;
                if(target2.nodeName =='TD'){
                    trEl=target2.parentElement || target2.parentNode;
                    this._drag_on_tr=trEl;
                    var tr_arrary=this.table.querySelectorAll("tr.selected");
                    for(var i=0,k=tr_arrary.length;i<k;i++){
                        var tr=tr_arrary[i];
                        Element.removeClass(tr,"selected");
                    }
                    if(this._drag_tr){
                    Element.addClass(this._drag_on_tr,"selected");
                    } 
                }
          
        },
        editForm:function () {
            var addLayerFn=this.addLayerFn.bind(this);
           var forms={name:"车位",id:"form_edit_parking",properties:[{id:"title",type:"text",title:"图层说明",value:"",required:false}
                ,{id:"layerSource",type:"text",title:"数据源",value:"",required:false}
                ,{id:"layerType",type:"radio",title:"类型",value:"POLYGON",option:{"POLYGON":"面","POINT":"点","RASTER":"栅格图    "},required:false}
                ,{id:"display",type:"radio",title:"状态",value:"1",option:{"1":"可见","2":"不可见"},required:true}
                ,{id:"styleId",type:"text",title:"样式编号",value:"parking_polygon",required:true}
            ],buttons:[{title:"确定",type:"button",value:"确定",click:addLayerFn}]};
            var formEl=Element.parseToForm(forms);
            this.addFormEl=formEl;
            this.detailDiv.innerHTML="";
            this.detailDiv.appendChild(formEl);
        },
        orderChangeFn:function (oldIndex,newIndex) {
            var myself=this;
            myself.map.orderChangeFn(oldIndex,newIndex);
        },
        addLayerFn:function(){
            var obj=Element.formToJson(this.addFormEl);
            var myself=this;
            myself.map.addServerLayer(obj);
        },
        eventFn:function (event,self) {
            var el=self.target,myself=el._myself,data=el._data,index=el._rowIndex;
            if(data.id =='delete'){
                var i=typeof index ==='string' ?Number(index):index;
                if(myself.layers.length>i){
                    var layer=myself.layers[i];
                    myself.map.deleteServerLayer(layer.id);
                }
            }else if(data.id=="display"){
                var i=typeof index ==='string' ?Number(index):index;
                if(myself.layers.length>i){
                    var layer=myself.layers[i];
                    var display=layer.display==1?0:1; 
                    myself.map.displayServerLayer(layer.id,display);
                }
            }
            // myself.detail(tr._rowIndex); 
        },
        
    });
    
       
    
    })(typeof exports !== 'undefined' ? exports : this);


(function(global) {

'use strict';
     
if (!global.MapProject) {
global.MapProject = { };
}

if (global.MapProject.Menu) {
geomap.warn('MapProject.Menu is already defined.');
return;
}
     
       
var Util=geomap.util,Request=geomap.request,Template=Util.template,toPoint=Util.toPoint,Element=geomap.element;
var extend = Util.object.extend;
var Point=geomap.Point;
 
/**
 *  一、空菜单
 *      var menu=new MapProject.Menu("toolPane",{map:map}); 
        menu.on("menu_click",mapProjectMenuEvent);
    二、有菜单项
        var menu=new MapProject.Menu("toolPane",{map:map,menu:[{text:'菜单名',icon:'图标html',mapMenu:false,type:'分类',id:1,onlyIcon:false}]}); 
        menu.on("menu_click",mapProjectMenuEvent);
 */
MapProject.Menu = geomap.Class(geomap.CommonMethods, geomap.Observable, {
    map:undefined,
    container:undefined,
    toolBar:undefined,
    tbOpt:{"className":"menu-nav"},
    tbStyle:{},
    memuOpt:{"className":"menu-item"},
    menu:[],
    mapmenu:[{mapMenu:true,type:"reference_line",icon:MapProject.Icons.refLine,text:"参考线",id:"map_reference_Line"}],
    _mapmenu:[],
    initialize: function(container, options) {
        options || (options = { });  
        this._setOptions(options);
        if(typeof container === 'string'){
                this.container=document.getElementById(container)
        }else{
            this.container=container;
        } 
        this.toolBar=Element.create("ul",this.tbOpt,this.tbStyle);
        eventjs.add(this.toolBar,"click",this._ev_menu_item);
        this.container.appendChild(this.toolBar);
        this._init_handle_ev();
        if(this.map!=undefined){
            this.setMap(this.map);
        }
        this._init_menu();
    },
    _init_handle_ev:function(){
        this._init_map_menu=this.__init_map_menu.bind(this);
    },
    setMap:function(map){
        this.map=map;
        this.__init_map_menu();
        this.map.on("map_complete",this._init_map_menu);
    },
    addMenu:function(menuItem){
        this.menu.push(menuItem);
        this.__init_map_menu();
    },
    __init_map_menu:function(){
        this._mapmenu=[];
        var m=this.mapmenu;
        for(var i=0,k=m.length;i<k;i++){
            var item=m[i]; 
            this._mapmenu.push(item);
        }
        if(this.map && this.map._projectMap){
            var pmap=this.map._projectMap;
            for(var i=0,k=pmap.length;i<k;i++){
                var mapInfo=pmap[i];
                var menuId="map_"+i;
                this._mapmenu.push({mapMenu:true,type:"layer",id:menuId,text:mapInfo.subTitle,layerIndex:i});
            } 
        }
        this._init_menu();
    },
    _init_menu:function(){
        this.toolBar.innerHTML="";
        for(var i=0,k=this._mapmenu.length;i<k;i++){
            var item=this._mapmenu[i];
            var el=this._create_menu_item(item);
            this.toolBar.appendChild(el);
        }
        for(var i=0,k=this.menu.length;i<k;i++){
            var item=this.menu[i];
            var el=this._create_menu_item(item);
            this.toolBar.appendChild(el);
        }
    },
    _create_menu_item:function(item){
        var li=Element.create("li",this.memuOpt);
        var label=Element.create("a");
        var txt="";
        if(item.icon!=undefined && item.icon !=''){
            txt=item.icon;
        } 
        if(!item.onlyIcon){
            txt+=("&nbsp;"+ item.text);
        }
        label.innerHTML=txt;
        
        var myself=this;
        li.__menu_item=true;
        li._data={data:item,target:myself};
        li.appendChild(label);
       
        return li;
    },
    _ev_menu_item:function (event,self) {
        var obj=event.target;
        if(obj != undefined){
            var mel=obj;
            while(mel.__menu_item == undefined && mel.nodeName != 'BODY'){
                mel=mel.parentElement || mel.parentNode;
            }
            if(mel._data && mel._data.target &&  mel._data.target._ev_menu_map(mel._data)){
                var myself=mel._data.target;
                var newEvent={event:event,self:self,menu:{target:mel,data:mel._data.data,self:myself}};
                myself.fire("menu_click",newEvent);
             }

        }
    },
    _ev_menu_map:function(arg){
        var result=true,myself=arg.target,data=arg.data;
        if(myself && myself.map && data.id ){
            if(data.mapMenu){
                if(data.type=== "layer"){
                    if(data.layerIndex !=undefined){
                        myself.map.mapChange(data.layerIndex);
                        result=false;
                    }
                    
                }else if(data.type==='reference_line'){
                    myself.map.toggleReferenceLine();
                    result=false;
                }
            }
            
        }
        return result;
    }

});

   

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

    'use strict';
         
    if (!global.MapProject) {
    global.MapProject = { };
    }
    
    if (global.MapProject.MapQuery) {
    geomap.warn('MapProject.MapQuery is already defined.');
    return;
    }
         
           
    var Util=geomap.util,Request=geomap.request,Template=Util.template,toPoint=Util.toPoint,Element=geomap.element;
    var extend = Util.object.extend;
    var Point=geomap.Point;
     
    MapProject.MapQuery = geomap.Class(geomap.CommonMethods, geomap.Observable, {
        type:"MapQuery",
        id:0,
        title:"查询结果",
        icon:null,
        onlyIcon:false,
        url:undefined,
        root:undefined,
        width:600,
        height:400,
        tbOpt:{},
        tbStyle:{width:"100%"},
        map:undefined,
        table:undefined,
        buttons:[{text:"删除",tag:"a",style:{cursor:"pointer"}}],
        menu:undefined,
        geomOption:{},
        initialize: function( options) {
            options || (options = { });  
            this.id=+new Date();
            this._setOptions(options);
            this.root=Element.create("div");
            this._eventFn=this.eventFn.bind(this);
            this.on("coord_data",this.coord_data.bind(this));
        },
        addToMenu:function(menu){
            this.menu=menu;
            this.menu.on("menu_click",this.menuClick.bind(this));
            this.menu.addMenu({mapMenu:true,type:this.type,text:this.title,icon:this.icon,id:this.id,onlyIcon:this.onlyIcon});
        },
        menuClick:function(arg){
            var menu=arg.menu,menuItem=menu.data;
            if(menuItem.mapMenu && menuItem.type=== this.type && menuItem.id && menuItem.id === this.id){
               this.map.setMapQuery(this);
            }
        },
        coord_data:function(data){
            this.viewData(data);
            this.showFrame();
        },
        viewData:function(featureData){
            var rows=[],features=null;
            if(!this.table){
                this.table=Element.create("table",this.tbOpt,this.tbStyle);
                this.root.appendChild(this.table);
            }
            this.table.innerHTML="";
            this.map.setFeatures([],this.geomOption);
            if(featureData && featureData.type=="FeatureCollection"){
                    var geomNum=featureData.features.length;
                    for(var i=0;i<geomNum;i++){
                        var feature=featureData.features[i];
                        var properties=feature.properties;
                        var fid=feature.id.split(".");
                        if(fid.length>1){
                            properties.id=fid[1]
                        }else{
                            properties.id=feature.id;
                        } 
                        rows.push(properties);
                    }
                    features=featureData.features;
                }else if(featureData.type=="Feature"){
                    var properties=featureData.properties;
                    var fid=featureData.id.split(".");
                        if(fid.length>1){
                            properties.id=fid[1]
                        }else{
                            properties.id=featureData.id;
                        }
                    rows.push(properties);
                    features=[featureData];
                }
                
                if(rows.length>0){
                    //先绘图
                    if(featureData && featureData.type=="FeatureCollection"){
                        this.map.setFeatures(featureData,this.geomOption);
                    }
                    //做表格
                    var table=this.table;
                    var thead=Element.create("thead");
                    
                    table.appendChild(thead);
                    var thead_tr=Element.create("tr");
                    thead.appendChild(thead_tr);
                    for(var item in rows[0]){
                        var th=Element.create("th");
                        th.innerText=item;
                        thead_tr.appendChild(th);
                    }
                    if(this.buttons.length>0){
                        var th_opt=Element.create("th");
                        th_opt.innerText="操作";
                        thead_tr.appendChild(th_opt);
                    }
                    var tbody=Element.create("tbody");
                    table.appendChild(tbody);
                    for(var i=0,k=rows.length;i<k;i++){
                        var tr=Element.create("tr");
                        tbody.appendChild(tr);
                        for(var item in rows[0]){
                        // for(var item in rows[i]){
                            var th=Element.create("td");
                            rows[i][item] !=undefined ?( th.innerText=rows[i][item] ):"";
                            tr.appendChild(th);
                        }
                        if(this.buttons.length>0){
                            var td=Element.create("td");
                            tr.appendChild(td);
                            for(var j=0,jk=this.buttons.length;j<jk;j++){
                                var button=this.buttons[j];
                                var el=Element.create(button.tag,button.opt|| {},button.style ||{});
                                el.innerText=button.text;
                                el._data=rows[i];
                                el._features=features[i]
                                el.self=button;
                                eventjs.add(el, "click",this._eventFn);
                                td.appendChild(el);
                            }
                        }
                       
                    }
                } 
               
        },
        eventFn:function(event,self){
            var td=self.target,data=td._data,button=td.self;
            console.log("td===,id="+data.parking_id);
            if(button && button.fn){
                var newself={data:data,self:button,target:td,features:td._features};
                button.fn(event,newself);
            }
        },
        removeRow:function(el){
            var tr=el;
            while(tr && tr.tagName.toString() != "TR" && tr.tagName.toString() != "tr"){
                tr=tr.parentElement || tr.parentNode;
            }
            if(tr && tr.tagName == 'TR'){
                tr.remove();
            }
        },
        showFrame:function(){
            if(this.viewFrame){
                this.viewFrame.show();
            }else{
                this.viewFrame=new geomap.view.Frame(document.body,{title:this.title, body:this.root,w:this.width,h:this.height,closeType:2,pos:'rc'});
            }
        }
    
    });
    
       
    
    })(typeof exports !== 'undefined' ? exports : this);


(function(global) {

    'use strict';
         
    if (!global.MapProject) {
    global.MapProject = { };
    }
    
    if (global.MapProject.MapDraw) {
    geomap.warn('MapProject.MapDraw is already defined.');
    return;
    }
         
           
    var Util=geomap.util,Request=geomap.request,Template=Util.template,toPoint=Util.toPoint,Element=geomap.element;
    var extend = Util.object.extend;
    var Point=geomap.Point;
     
    MapProject.MapDraw = geomap.Class(geomap.CommonMethods, geomap.Observable, {
        type:"MapDraw",
        id:0,
        title:"绘图",
        icon:null,
        onlyIcon:false,
        url:undefined,
        root:undefined,
        toolEl:undefined,
        formEl:undefined,
        width:600,
        height:400,
        tbOpt:{},
        tbStyle:{width:"100%"},
        map:undefined,
        table:undefined,
        drawType:"Rect",
        fill:true,
        buttons:[{text:"删除",tag:"a",style:{cursor:"pointer"}}],
        form:{},
        menu:undefined,
        initialize: function( options) {
            options || (options = { });  
            this.set("id",+new Date());
            this._setOptions(options);
            this._saveGeomEv=this.saveGeomEv.bind(this);
            this._closeFrameEv=this.closeFrameEv.bind(this);
            this.root=Element.create("div");
            this.on("geom_data",this.geomDataCallback.bind(this));
            var toolEl=Element.create("div",{className:"tooldiv"},{margin:"20px"});
            this.toolEl=toolEl;
            this.formEl=Element.create("div");
            this.root.appendChild(this.toolEl);
            this.root.appendChild(this.formEl);
            this.creatTools();
        },
        creatTools:function(){
            var styleOpt={width:"80px"};
           var xnumEl=Element.create("input",{type:"text" ,id:"tool_xnum"},styleOpt);
           var ynumEl=Element.create("input",{type:"text" ,id:"tool_ynum"},styleOpt);
           var pnumEl=Element.create("input",{type:"text" ,id:"tool_pnum"},styleOpt);
           var btn=Element.create("input",{type:"button",value:"确定" ,id:"tool_btn"},{marginLeft:"10px"});
           this.geomInfoDiv=Element.create("div",{},{color:"gray"});
          
           this._xnumEl=xnumEl;
           this._ynumEl=ynumEl;
           this._pnumEl=pnumEl;

           var layerStyleOpt={display:"initial"};
           var titlelayer=Element.create("div",{},layerStyleOpt);titlelayer.innerHTML="拆分矩行操作<br>";
           var xlayer=Element.create("div",{},layerStyleOpt);xlayer.innerText="水平:";
           var ylayer=Element.create("div",{},layerStyleOpt);ylayer.innerText="垂直:";
           var player=Element.create("div",{},layerStyleOpt);player.innerText="间距:";

           this.toolEl.appendChild(titlelayer)
           this.toolEl.appendChild(xlayer);
           this.toolEl.appendChild(xnumEl);
           this.toolEl.appendChild(ylayer);
           this.toolEl.appendChild(ynumEl);
           this.toolEl.appendChild(player);
           this.toolEl.appendChild(pnumEl);
           this.toolEl.appendChild(btn);
           this.toolEl.appendChild(this.geomInfoDiv);
           eventjs.add(btn,"click",this.editGeometry.bind(this));
        },
        editGeometry:function(){
            if(this._group){
                var value=this._xnumEl.value;
                var ynum=this._ynumEl.value;
                var pnum=this._pnumEl.value;
                this._group.split(Number(value),Number(ynum),Number(pnum));
                this.map.drawMap();
            }
        },
        addToMenu:function(menu){
            this.menu=menu;
            this.menu.on("menu_click",this.menuClick.bind(this));
            this.menu.addMenu({mapMenu:true,type:this.type,text:this.title,icon:this.icon,onlyIcon:this.onlyIcon,id:this.id});
        },
        menuClick:function(arg){
            var menu=arg.menu,menuItem=menu.data;
            if(menuItem.mapMenu && menuItem.type=== this.type && menuItem.id && menuItem.id === this.id){
               this.map.setMapDraw(this);
            }
        },
        closeFrameEv:function(event,self){
            this.map.clearDrawGeometry();
        },
        saveGeomEv:function(){
            if(this.form && this.form.id && this._group){
                var properties=Element.formToJson(document.getElementById(this.form.id));
                // var geomText=this._data_geom.getText();
                var geoms=this._group.getData();
                var geomText=null;
                if(geoms.length==0){
                    
                
                    return;
                }
               
                var featureId="";
                for(var key in properties){
                    if(key === 'id'){
                        featureId=properties[key];
                        delete properties[key];
                    }
                }
                var reqData=[],idNum=Number(featureId);
                for(var i=0,k=geoms.length;i<k;i++){
                    var geomText=JSON.stringify(geoms[i]); 
                    reqData.push({geometry:geomText,properties:properties,id:idNum});
                    idNum+=1; 
                }
                
                var myself=this;
                // myself.map.jsonReq(this.url,{geometry:geomText,properties:properties,id:featureId},function(xhr){
                    myself.map.jsonReq(this.url,reqData,function(xhr){
                    var body=xhr.response,status=xhr.status; 
                    if(status == 200){
                        var result=JSON.parse(body);
                        if(result.code === myself.map.codeOk){
                            myself.map.clearDrawGeometry();
                            myself.map.refresh();
                            myself.hideFrame();
                        }else{
                            alert(result.msg);
                        }
                        // myself.map.refresh();
                        // myself.hideFrame();
                    }
                });
                 
            }
        },
        getViewForm:function(){
            var bodyForm=this.form;
            var formId= bodyForm.id;
            bodyForm.buttons=[{id:"ok",type:"button",title:"",value:"确定",click:this._saveGeomEv}];
            var form=Element.parseToForm(bodyForm);
            this.formEl.appendChild(form);
            return this.root;
        },
        geomDataCallback:function(arg){
            var group=arg.geometry;
            this._group=group;
            var geomNum=this._group.getSize();
            if(geomNum>0){
                if(this._group.getPaths().length==1){
                    var p=this._group.getPaths()[0].bounds().getSize();
                    this.geomInfoDiv.innerText="Size="+p.x+","+p.y;
                } 
                this.showFrame();
            }
            // group.split(4,4);

            // var geometry=arg.geometry,layer=arg.layer,clearDraw=arg.clearDraw;
            // var myself=this;
            // this._data_geom=geometry;
            // if(clearDraw){clearDraw();}
            // if(geometry._coordinates.length<1){
            //     return;
            // }
             
           
        },
        showFrame:function(){
            if(this.viewFrame){
                this.viewFrame.show();
            }else{
                this.viewFrame=new geomap.view.Frame(document.body,{title:this.title, body:this.getViewForm(),w:this.width,h:this.height,closeType:2});
                this.viewFrame.on("hide",this._closeFrameEv);
            }
        },
        hideFrame:function(){
            if(this.viewFrame){
                this.viewFrame.hide();
            }
        }
    
    });
    
       
    
    })(typeof exports !== 'undefined' ? exports : this);


(function(global) {

    'use strict';
         
    if (!global.MapProject) {
    global.MapProject = { };
    }
    
    if (global.MapProject.DataListFrame) {
    geomap.warn('MapProject.MapQuery is already defined.');
    return;
    }
         
           
    var Util=geomap.util,Request=geomap.request,Template=Util.template,toPoint=Util.toPoint,Element=geomap.element;
    var extend = Util.object.extend;
    var Point=geomap.Point;
     
    MapProject.DataListFrame = geomap.Class(geomap.CommonMethods, geomap.Observable, {
        type:"DataListFrame",
        id:100,
        title:"数据列表",
        icon:null,
        onlyIcon:false,
        url:undefined,
        root:undefined,
        width:200,
        height:400,
        framePos:"rb",
        tbOpt:{"className":"datalist"},
        tbStyle:{width:"100%"},
        map:undefined,
        table:undefined,
        buttons:[],
        paramData:{},
        headColumn:[],
        menu:undefined,
        elOpt:{"className":"datalist"},
        elStyle:{},
        geomOption:{style:{fillStyle:"rgba(0,0,200,0.5)",strokeStyle:"#fff",lineWidth:2},_fill:true,lineDash:[4,2]},
        initialize: function( options) {
            options || (options = { });  
            this.id=+new Date();
            this._setOptions(options);
            this.root=Element.create("div",this.elOpt,this.elStyle);
            this._eventFn=this.eventFn.bind(this);
        },
        addToMenu:function(menu){
            this.menu=menu;
            this.menu.on("menu_click",this.menuClick.bind(this));
            this.menu.addMenu({mapMenu:true,type:this.type,text:this.title,icon:this.icon,id:this.id,onlyIcon:this.onlyIcon});
        },
        menuClick:function(arg){
            var menu=arg.menu,menuItem=menu.data;
            if(menuItem.mapMenu && menuItem.type=== this.type && menuItem.id && menuItem.id === this.get("id")){
               var self=this;
               self.map.jsonReq(this.url,this.paramData,function(xhr){
                    if(xhr.status==200){
                        var result=JSON.parse(xhr.response);
                                if(result.code === self.map.codeOk){
                                    self.showData(result.data);
                                }else{
                                    alert(result.msg);
                                }
                            
                        
                    }
                });
            }
        },
        showData:function(data){
            this.viewData(data);
            this.showFrame();
        },
        viewData:function(data){
            var rows=data,features=null;
            if(!this.table){
                this.table=Element.create("table",this.tbOpt,this.tbStyle);
                this.root.appendChild(this.table);
            }
            this.table.innerHTML="";
             
                if(data && this.headColumn.length>0){ 
                    //做表格
                    var column=[];
                    for(var i=0,k=this.headColumn.length;i<k;i++){
                        var item=extend({text:'',type:'text',fn:null,id:''},this.headColumn[i]);
                        column.push(item);
                    }
                    // var column=this.headColumn;
                    
                    var table=this.table;
                    var thead=Element.create("thead"); 
                    table.appendChild(thead);
                    var thead_tr=Element.create("tr");
                    thead.appendChild(thead_tr);
                    for(var i=0,k=column.length;i<k;i++){
                        var th=Element.create("th");
                        th.innerText=column[i].text;
                        thead_tr.appendChild(th);
                    }
                   
                    if(this.buttons.length>0){
                        var th_opt=Element.create("th");
                        th_opt.innerText="操作";
                        thead_tr.appendChild(th_opt);
                    }
                    var tbody=Element.create("tbody");
                    table.appendChild(tbody);
                    for(var i=0,k=rows.length;i<k;i++){
                        var tr=Element.create("tr");
                        tbody.appendChild(tr);
                        // for(var item in column){
                        for(var j=0,jk=column.length;j<jk;j++){
                        // for(var item in rows[i]){
                            var th=Element.create("td");
                            if(column[j].type == 'fn'){
                                var value=column[j].fn(rows[i]);
                                if(typeof value !=undefined ){
                                    if(typeof value === 'string'){
                                        th.innerHTML=value;
                                    }else{
                                        th.appendChild(value);
                                    }
                                    
                                }
                                
                            }else{
                                var key=column[j].id
                                if(rows[i].properties){
                                    rows[i].properties[key] !=undefined ?( th.innerText=rows[i].properties[key] ):"";
                                }else{
                                    rows[i][key] !=undefined ?( th.innerText=rows[i][key] ):"";
                                }
                            }
                            tr.appendChild(th);
                        }
                        if(this.buttons.length>0){
                            var td=Element.create("td");
                            tr.appendChild(td);
                            for(var j=0,jk=this.buttons.length;j<jk;j++){
                                var button=this.buttons[j];
                                var el=Element.create(button.tag,button.opt|| {},button.style ||{});
                                el.innerText=button.text;
                                el._data=rows[i];
                                el._features=features[i]
                                el.self=button;
                                eventjs.add(el, "click",this._eventFn);
                                td.appendChild(el);
                            }
                        }
                       
                    }
                } 
               
        },
        eventFn:function(event,self){
            var td=self.target,data=td._data,button=td.self;
            console.log("td===,id="+data.parking_id);
            if(button && button.fn){
                var newself={data:data,self:button,target:td,features:td._features};
                button.fn(event,newself);
            }
        },
        removeRow:function(el){
            var tr=el;
            while(tr && tr.tagName.toString() != "TR" && tr.tagName.toString() != "tr"){
                tr=tr.parentElement || tr.parentNode;
            }
            if(tr && tr.tagName == 'TR'){
                tr.remove();
            }
        },
        showFrame:function(){
            if(this.viewFrame){
                this.viewFrame.show();
            }else{
                this.viewFrame=new geomap.view.Frame(document.body,{title:this.title, body:this.root,w:this.width,h:this.height,closeType:2,pos:this.framePos});
            }
        }
    
    });
    
       
    
    })(typeof exports !== 'undefined' ? exports : this);
