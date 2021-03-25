
var geomap = geomap || { version: '1.0.0' };
if (typeof exports !== 'undefined') {
  exports.geomap = geomap;
}
/* _AMD_START_ */
else if (typeof define === 'function' && define.amd) {
  define([], function() { return geomap; });
}
/* _AMD_END_ */
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