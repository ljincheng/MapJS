var fs = require('fs'),
    exec = require('child_process').exec;

var buildArgs = process.argv.slice(2),
    buildArgsAsObject = { },
    rootPath = process.cwd();

buildArgs.forEach(function(arg) {
  var key = arg.split('=')[0],
      value = arg.split('=')[1];

  buildArgsAsObject[key] = value;
});
var outputFile='geomap.js';
var modulesToInclude = buildArgsAsObject.modules ? buildArgsAsObject.modules.split(',') : [];
var modulesToExclude = buildArgsAsObject.exclude ? buildArgsAsObject.exclude.split(',') : [];

var distributionPath = buildArgsAsObject.dest || 'dist/';
var minifier = buildArgsAsObject.minifier || 'yui';
var mininfierCmd;

var noStrict = 'no-strict' in buildArgsAsObject;
var requirejs = 'requirejs' in buildArgsAsObject ? 'requirejs' : false;
var sourceMap = 'sourcemap' in buildArgsAsObject;
var buildFast = 'fast' in buildArgsAsObject;
// set amdLib var to encourage later support of other AMD systems
var amdLib = requirejs;


if (minifier === 'yui') {
    mininfierCmd = 'java -jar ' + rootPath + '/lib/yuicompressor-2.4.6.jar  geomap.js -o geomap.min.js';
  }
  else {
    mininfierCmd = 'java -jar ' + rootPath + '/lib/google_closure_compiler.jar --js geomap.js --js_output_file geomap.min.js' + sourceMapFlags;
  }

var distFileContents =
  '/* build: `node build.js modules=' +
    modulesToInclude.join(',') +
    (modulesToExclude.length ? (' exclude=' + modulesToExclude.join(',')) : '') +
    (noStrict ? ' no-strict' : '') +
    (requirejs ? ' requirejs' : '') +
    (sourceMap ? ' sourcemap' : '') +
    ' minifier=' + minifier +
  '` */';

function appendFileContents(fileNames, callback) {

  (function readNextFile() {

    if (fileNames.length <= 0) {
      return callback();
    }

    var fileName = fileNames.shift();

    if (!fileName) {
      return readNextFile();
    }

    fs.readFile(__dirname + '/' + fileName, function (err, data) {
      if (err) throw err;
      var strData = String(data);
      if (fileName === 'src/HEADER.js' && amdLib === false) {
        strData = strData.replace(/\/\* _AMD_START_ \*\/[\s\S]*?\/\* _AMD_END_ \*\//g, '');
      }
      if (noStrict) {
        strData = strData.replace(/"use strict";?\n?/, '');
      }
      distFileContents += ('\n' + strData + '\n');
      readNextFile();
    });

  })();
}
 
var filesToInclude = [
    'src/HEADER.js',
    'src/globalGeomap.js',
    'src/lib/event.js',
    'src/core/Observable.js',
    'src/core/util.js',
    'src/core/CommonMethods.js',
    'src/core/util_object.js',
    'src/core/util_element.js',
    'src/core/util_event.js',
    'src/core/Class.js',
    'src/core/Animation.js',
    'src/core/Image.js',
    'src/core/Request.js',
    'src/geo/Point.js',
    'src/geo/Transformtion.js',
    'src/event/Event.js',
   'src/geo/Bounds.js',
    'src/geo/Model.js',
    'src/geo/Caliper.js',
    'src/geo/MapEvent.js',
    'src/geo/MapRectSelect.js',
    'src/geo/layer/FrameLayer.js',
    'src/geo/Map.js',
    'src/geometry/Geometry.js',
    'src/geometry/Path.js',
    'src/geometry/Polygon.js',
    'src/geometry/Marker.js',
    'src/geo/Layer.js',
    'src/geo/layer/TileLayer.js',
    'src/geo/layer/VectorLayer.js',
    'src/geo/layer/PaletteLayer.js'
  ];

  process.chdir(distributionPath);

  appendFileContents(filesToInclude, function() {
    fs.writeFile('geomap.js', distFileContents, function (err) {
      if (err) {
        console.log(err);
        throw err;
      }
      if (buildFast) {
        process.exit(0);
      }

      if (amdLib !== false) {
        console.log('Built distribution to ' + distributionPath + 'geomap.js (' + amdLib + '-compatible)');
      } else {
        console.log('Built distribution to ' + distributionPath + 'geomap.js');
      }

      exec(mininfierCmd, function (error, output) {
        if (error) {
          console.error('Minification failed using', minifier, 'with', mininfierCmd);
          console.error('Minifier error output:\n' + error);
          process.exit(1);
        }
        console.log('Minified using', minifier, 'to ' + distributionPath + 'geomap.min.js');

        // exec('gzip -c geomap.min.js > geomap.min.js.gz', function (error, output) {
        //   console.log('Gzipped to ' + distributionPath + 'geomap.min.js.gz');
        // });
      });

    });
  });