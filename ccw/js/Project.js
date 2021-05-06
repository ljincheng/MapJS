
var Project = Project || { version: '1.0.0' };
if (typeof exports !== 'undefined') {
  exports.Project = Project;
} 

else if (typeof define === 'function' && define.amd) {
  define([], function() { return Project; });
}
(function(global) {

  Project.Events={};
  Project.Frames={};
  geomap.util.object.extend(  Project.Events, geomap.Observable);
})(typeof exports !== 'undefined' ? exports : this);