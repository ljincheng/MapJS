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
    initialize: function(options) {
          options || (options = { }); 
          this._setOptions(options);  
          this.image=window.document.createElement('img');
          this._onloadHandle=this.onLoad.bind(this);
          this.image.onload=this._onloadHandle;
       //  this.setElement(element);
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
        this.ctx.drawImage(this.image,this.left,this.top);
        var other=this;
        this.fire("drawend",this);
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
    //   var other=this;
    //   var img=this.image;
    //     var e={img:img,target:other};
        this.fire("onload");
    },
    setSrc:function(url){ 
      // if(this.loaded && this.image.src === url){
      //   this.onLoad(this.image);
      // }else{
        this.loaded=false;
        this.image.src=url;
      // this.loaded=false;
      // }
      //this.getElement().src=url;
    },
    getSrc:function(){
      return this.image.src;
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
        var isPoint=geomap.util.isPoint,hasXY=geomap.util.hasXY;
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
      }, 
      rootFrameClickEv:function(event,self){
        eventjs.cancel(event);
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
        transformtion2:new geomap.Transformtion(1,0,1,0),
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
        },
        toTransformScreen:function(point,scale){
            return this.transformtion2.transform(point,scale);
        }

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
                this._wheel_delta=0;
                this._wheel_d0=0;
                this._wheel_d1=0;
                this._wheel_d2=0;
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
                if(this._animMoveFn){
                    this._animMoveFn.stop();
                }else{
                    this._animMoveFn=new geomap.PosAnimation({easeLinearity:0.1});
                    this._animMoveFn.on("end",function(){ 
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
                this._animMoveFn.run(this,function(pos,e){ 
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
        this.on("drawmap",this.OnDrawMap.bind(this));
        this.on("drawCanvas",this.RedrawingCanvasTag.bind(this));
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
      OnDrawMap:function(){
          this.fire("viewreset");
          this._redrawing=true;
      },
      RedrawingCanvasTag:function(){
        this._redrawing=true;
      },
      _loadLayer:function(layer){
        layer.on("drawCanvas",this.RedrawingCanvasTag.bind(this));
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
       animMove:function(coord){
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
              }
            
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
  

(function() {

     
     
    
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
    //var toPoint =geomap.util.toPoint;
  
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
       initialize: function( options) {
        this.callSuper('initialize',options);
        this.on("initLayer",this.OnInitLayer.bind(this));
        this._drawCallbackID=this.drawCallback.bind(this);
      }, 
      OnInitLayer:function(){
       
        this.getCanavsSize();
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
           
        var cells=Math.round(offsetSize.x  /tsize)+2;
        var rows=Math.round(offsetSize.y /tsize)+2;
  
        var startTile=this.OriginTileInfo(res,bounds.min);
        var cell=startTile.cell;
        var row=startTile.row;
        var left=startTile.left;
        var top=startTile.top;
  
        this._drawLock=lock; 
        for(var key in this._tiles){
          this._tiles[key]=null;
        }
        this._tiles={};
        this.canvasCtx.clearRect(0,0,canvasSize.x,canvasSize.y);
        // for(var c=-cells,k=cells*2;c<k;c++){
          // for(var r=-rows,k2=rows*2;r<k2;r++){
          for(var c=-0,k=cells;c<k;c++){
            for(var r=-0,k2=rows;r<k2;r++){
                var  x=1*cell + c;
                var y=1*row + r;
                var l=Math.floor(left+tsize*c)+offsetSize.x;
                var t=Math.floor(top+tsize*r)+offsetSize.y;
                if( x>=0 && y>=0 ){
                    // var imgUrl=geomap.util.template(this.url,{z:z,x:x,y:y});
                    // this.FromURL(imgUrl,{left:l,top:t,lock:lock,drawLock:1});  
                    // this.loadTile(c,r,l,t,z,x,y);
                    var tileId="cr-"+c+"-"+r;
                    var tile={x:x,y:y,z:z,left:l,top:t,col:c,row:r,cacheTime:this.cacheTime,ctx:this.canvasCtx,tag:0,tileId:tileId};
                    if(this._tiles[tileId]){
                      this._tiles[tileId]=null;
                      delete this._tiles[tileId];
                    }
                    this._tiles[tileId]=tile;
                }
          }
        }
        this.loadTileSource();
        // this.fire("drawCanvas");
      },
      loadTileSource:function(){
        if(!this._tileImageMap){
          this._tileImageMap=[];
        }
        for(var i=0,k=this._tileImageMap.length;i<k;i++){
          var img=this._tileImageMap[i];
            img.tag=0;
        }
        //=== 第一次匹配成功
        this._tileImageMap2=[];
        for(var tileId in this._tiles){
          var tile=this._tiles[tileId];
          for(var i=0,k=this._tileImageMap.length;i<k;i++){
            var img=this._tileImageMap[i];
            if(img.isTile(tile)){
              img.loadTile(this.url,tile,this._drawCallbackID);
              img.tag=1;
              tile.tag=1;
              i=k;
            }
          } 
        }
        for(var tileId in this._tiles){
          var tile=this._tiles[tileId];
        　if(tile.tag==0){

          for(var i=0,k=this._tileImageMap.length;i<k;i++){
            var img=this._tileImageMap[i];
              if(img.tag==0){
                img.on("drawend",this._drawCallbackID);
                img.loadTile(this.url,tile);
                img.tag=1;
                tile.tag=1;
                i=k;
              }
          }

          if(tile.tag==0){
            var img=new geomap.Image(tile);
            img.on("drawend",this._drawCallbackID);
            img.loadTile(this.url,tile);
            tile.tag=1;
            img.tag=1;
            this._tileImageMap.push(img);
          }
          }
        }
      },
      drawCallback:function (tileImg){
        this.fire("drawCanvas");
        var tile=this._tiles[tileImg.tileId];
        if(tile){
          this._tiles[tileImg.tileId]=null;
          delete this._tiles[tileImg.tileId];
          //geomap.debug("###=====delete tileImg="+tileImg.tileId);
        }
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
  
    if (global.geomap.Palette) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }
   
    geomap.VectorLayer = geomap.Class(geomap.Layer,  {
      type: 'VectorLayer',
      paths:[],
      drawType:0,
      fill:true,
      loopRender:false,
      _enabled:true,
      initialize: function(options) {
        // options || (options = { }); 
        // this._setOptions(options);
        this.callSuper('initialize',options);
        this.on("initLayer",this.OnInitLayer.bind(this));
      }, 
      OnInitLayer:function(){ 
        this.transformtion.setOrigin(0,0);
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
      addData:function(featureData,options){

        if(featureData.type=="FeatureCollection"){
            var geomNum=featureData.features.length;
            for(var i=0;i<geomNum;i++){
                var geometry=featureData.features[i].geometry;
                 var path=new geomap.Path(this._map,options);
                 path.setData(geometry);
                this.paths.push(path);
            }
        }else if(featureData.type=="Feature"){
            var geometry=featureData.geometry;
            var path=new geomap.Path(this._map,options);
            path.setData(geometry);
            this.paths.push(path);
        }else{
            this.paths.push(featureData);
        }
        this.ViewReset();
      },
      clearData:function(){
        this.paths=[];
        this.ViewReset();
      },
      OnLoopTime:function(){ 
        if(this.loopRender && (this._canvasScale==1 || this._canvasScale == undefined )){
          this._dragOffset=null;//实时重绘canvas，不需要拖拽偏移量。
           this.ViewReset();
        }
      },
      ViewReset:function(){ 
        if(!this.wheelZoomChanage && (this._canvasScale==1 || this._canvasScale == undefined )){
          this.canvasCtx.clearRect(0,0,this.width,this.height);
            this._canvasScale=1;
            var z=this._map.zoom,bounds=this._map.getBounds(),res=this._map.resolution(z);
            this.loopRender=false;
            if(this.paths.length>0){
                for(var i=0,k=this.paths.length;i<k;i++){
                    var path=this.paths[i];
                    this.canvasCtx.setLineDash([]);
                    path.render(this.canvasCtx);
                    if(path.loopRender){
                      this.loopRender=true;
                    }
                }
            }
            if(this._pathing && this._pathing != null){
                this._pathing.render(this.canvasCtx);
            }
            this.fire("drawCanvas");
        }
      } 
       
      
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  


(function(global) {
    'use strict';
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Palette) {
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
      initialize: function(options) {
        this.callSuper('initialize',options);
        this.on("initLayer",this.OnInitLayer.bind(this));
      }, 
      OnInitLayer:function(){
        this._map.on("mousedown",this.OnMouseDown.bind(this));
        this._map.on("mousemove",this.OnMouseMove.bind(this));
        this._map.on("mouseup",this.OnMouseUp.bind(this));
        this.transformtion.setOrigin(0,0);
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
        this.ViewReset();
      },
      PathEnd:function(e,p){
        if(this._pathing && this._pathing!=null){
            this._pathing.end();

            this.fire("geometry_change",this._pathing);
            this.paths.push(this._pathing);
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
  
