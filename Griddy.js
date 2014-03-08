var Griddy = function(data, bounds, width, height, extent, canvas){

  this.data = data;
  this.canvas = canvas;
  this.extent = extent;
  this.orig_bounds = bounds;

  this.minx = this.deg2rad(extent[0][0]);
  this.maxx = this.deg2rad(extent[1][0]);
  this.miny = this.deg2rad(extent[0][1]);
  this.maxy = this.deg2rad(extent[1][1]);
  this.bounds = this.buildBounds( bounds, width, height );
  //this.build( this.interpolateField( this.render() ) ); 

  this.context = canvas.getContext("2d");
    this.context.fillStyle = "rgba(255, 0, 0, 1)";
    //this.context.fillRect(0,0,500,500);
    //this.context.fill();

  //console.log(0, 0, width, height)
  this.imageData = this.context.getImageData(0, 0, width, height);

  return this;
}

Griddy.prototype.render = function(){
  //console.log('render', this.imageData);
  this.canvas.getContext("2d").putImageData(this.imageData, 0, 0);
};

Griddy.prototype.bilinearInterpolateScalar = function(x, y, g00, g10, g01, g11){
  var rx = (1 - x);
  var ry = (1 - y);
  return g00 * rx * ry + g10 * x * ry + g01 * rx * y + g11 * x * y;
};


Griddy.prototype.interpolate = function(λ, φ) {
  var λ0 = 0, //this.extent[0][0], 
    φ0 = this.extent[1][1];
  var Δλ = 1, Δφ = 1;
  var ni = Math.abs(this.extent[1][0] - this.extent[0][0])/Δλ,
    nj = 181;//Math.abs(this.extent[1][1] - this.extent[0][1])/Δφ;

  var i = this.floorMod(λ - λ0, 360) / Δλ;  // calculate longitude index in wrapped range [0, 360)
  var j = (φ0 - φ) / Δφ;                 // calculate latitude index in direction +90 to -90

  var fi = Math.floor(i), ci = fi + 1;
  var fj = Math.floor(j), cj = fj + 1;
 
  //console.log(cj)

  var row;
  if ((row = this.grid[fj])) {
      var g00 = row[fi];
      var g10 = row[ci];
      //console.log(this.isValue(g00), this.isValue(g10), this.grid[cj].length)
      if (this.isValue(g00) && this.isValue(g10) && (row = this.grid[cj])) {
          var g01 = row[fi];
          var g11 = row[ci];
          //console.log('\t', row[fi], row[fj])
          if (this.isValue(g01) && this.isValue(g11)) {
              // All four points found, so interpolate the value.
              return this.bilinearInterpolateScalar(i - fi, j - fj, g00, g10, g01, g11);
          }
      }
  }
  return null;
};

/**
 * @returns {Boolean} true if the specified value is not null and not undefined.
 */
Griddy.prototype.isValue = function(x) {
    return x !== null && x !== undefined;
};

/**
 * @returns {Number} returns remainder of floored division, i.e., floor(a / n). Useful for consistent modulo
 *          of negative numbers. See http://en.wikipedia.org/wiki/Modulo_operation.
 */
Griddy.prototype.floorMod = function(a, n) {
    return a - n * Math.floor(a / n);
}

/**
 * @returns {Number} the value x clamped to the range [low, high].
 */
Griddy.prototype.clamp = function(x, range) {
    return Math.max(range[0], Math.min(x, range[1]));
};


Griddy.prototype.proportion = function(i, bounds) {
    return (this.clamp(i, bounds) - bounds[0]) / (bounds[1] - bounds[0]);
}

Griddy.prototype.buildBounds = function( bounds, width, height ) {
  var upperLeft = bounds[0];
  var lowerRight = bounds[1];
  var x = Math.round(upperLeft[0]);// Math.max(Math.floor(upperLeft[0], 0), 0); //Math.round(upperLeft[0]); 
  var y = Math.max(Math.floor(upperLeft[1], 0), 0);
  var xMax = Math.min(Math.ceil(lowerRight[0], width), width - 1);
  var yMax = Math.min(Math.ceil(lowerRight[1], height), height - 1);
  return {x: x, y: y, xMax: width, yMax: height, width: width, height: height};
};

Griddy.prototype.build = function(callback){
  var λ0 = 0, //this.extent[0][0], 
    φ0 = this.extent[1][1]; 
  var Δλ = 1, Δφ = 1; 
  var ni = 360,//(Math.abs(this.extent[1][0] - this.extent[0][0])/Δλ), 
    nj = 181; //Math.abs(this.extent[1][1] - this.extent[0][1])/Δφ + 1;

  console.log(λ0, φ0, ni, nj)

  // Scan mode 0 assumed. Longitude increases from λ0, and latitude decreases from φ0.
  // http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_table3-4.shtml
  this.grid = [], p = 0;
  var isContinuous = Math.floor(ni * Δλ) >= 360;
  for (var j = 0; j < nj; j++) {
      var row = [];
      for (var i = 0; i < ni; i++, p++) {
          row[i] = this.data[i];
      }
      if (isContinuous) {
          // For wrapped grids, duplicate first column as last column to simplify interpolation logic
          row.push(row[0]);
      }
      this.grid[j] = row;
  }

  console.log(this.grid[0].length, this.grid.length); 
  callback(this.grid);

};

Griddy.prototype.deg2rad = function( deg ){
  return (deg / 180) * Math.PI;
};

Griddy.prototype.rad2deg = function( ang ){
  return ang / (Math.PI/180.0);
};

Griddy.prototype.invert = function(x, y){
  var mapLonDelta = this.maxx - this.minx;
  var worldMapRadius = this.bounds.width / this.rad2deg(mapLonDelta) * 360/(2 * Math.PI);
  var mapOffsetY = ( worldMapRadius / 2 * Math.log( (1 + Math.sin(this.miny) ) / (1 - Math.sin(this.miny))  ));
  var equatorY = this.bounds.height + mapOffsetY;
  var a = (equatorY-y)/worldMapRadius
  //console.log(mapOffsetY,  (worldMapRadius / 2 * Math.log((1+Math.sin(this.miny))/(1 - Math.sin(this.miny)))) );
  var lat = 180/Math.PI * (2 * Math.atan(Math.exp(a)) - Math.PI/2);
  var lon = this.rad2deg(this.minx) + x / this.bounds.width * this.rad2deg(mapLonDelta);
  //console.log(x,y,lon,lat)
  return [lon, lat];
};

Griddy.prototype.mercY = function( lat ) {
  return Math.log( Math.tan( lat / 2 + Math.PI / 4 ) );
};


Griddy.prototype.project = function( lat, lon ) { // both in radians, use deg2rad if neccessary
  var ymin = this.mercY(this.miny);
  var ymax = this.mercY(this.maxy);
  var xFactor = this.bounds.width / ( this.bounds.maxx - this.bounds.minx );
  var yFactor = this.bounds.height / ( ymax - ymin );

  var y = this.mercY( this.deg2rad(lat) );
  var x = (this.deg2rad(lon) - this.bounds.minx) * xFactor;
  var y = (ymax - y) * yFactor; // y points south
  return [x, y];
};

/**
 * Calculate distortion of the wind vector caused by the shape of the projection at point (x, y). The wind
 * vector is modified in place and returned by this function.
 */
Griddy.prototype.distort = function(λ, φ, x, y, scale, wind) {
    var u = wind[0] * scale;
    var v = wind[1] * scale;
    var d = this.distortion(λ, φ, x, y);

    // Scale distortion vectors by u and v, then add.
    wind[0] = d[0] * u + d[2] * v;
    wind[1] = d[1] * u + d[3] * v;
    return wind;
};

Griddy.prototype.distortion = function(λ, φ, x, y) {
    var τ = 2 * Math.PI;
    var H = Math.pow(10, -5.2);
    var hλ = λ < 0 ? H : -H;
    var hφ = φ < 0 ? H : -H;

    var pλ = this.project(φ, λ + hλ);
    var pφ = this.project(φ + hφ, λ);

    // Meridian scale factor (see Snyder, equation 4-3), where R = 1. This handles issue where length of 1º λ
    // changes depending on φ. Without this, there is a pinching effect at the poles.
    var k = Math.cos(φ / 360 * τ);
    return [
        (pλ[0] - x) / hλ / k,
        (pλ[1] - y) / hλ / k,
        (pφ[0] - x) / hφ,
        (pφ[1] - y) / hφ
    ];
};


Griddy.prototype.interpolateField = function( callback ){

    var columns = [];
    var point = [];
    var x = 0; this.bounds.x;
    var scale = { bounds: this.bounds }; //grid.recipe.scale; //, gradient = scale.gradient;
    var bounds = this.bounds;
    var self = this;

    var gradient = this.segmentedColorScale([
      [193,     [37, 4, 42]],
      [206,     [41, 10, 130]],
      [219,     [81, 40, 40]],
      [233.15,  [192, 37, 149]],  // -40 C/F
      [255.372, [70, 215, 215]],  // 0 F
      [273.15,  [21, 84, 187]],   // 0 C
      [275.15,  [24, 132, 14]],   // just above 0 C
      [291,     [247, 251, 59]],
      [298,     [235, 167, 21]],
      [311,     [230, 71, 39]],
      [328,     [88, 27, 67]]
    ]);

    function interpolateColumn(x) {
        var column = [];
        for (var y = 0; y <= bounds.height; y += 2) {
                var coord = self.invert(x,y);
                //console.log(x,y, coord)
                var color = [255, 255, 255, 255];
                if (coord) {
                    var λ = coord[0], φ = coord[1];
                    if (isFinite(λ)) {
                        var val = self.interpolate(λ, φ);
                        //console.log(val)
                        if (val) {
                          //val = self.distort(λ, φ, x, y, bounds.height*(1/70000), val);
                          //color = self.sinebowColor(self.proportion(val-272.15, [0, 60]), Math.floor(0.4*255));
                          color = gradient(val, Math.floor(0.4*255));
                          //console.log(val, color);
                        }
                    }
                }
                self.setColor(x, y, color);
                self.setColor(x+1, y, color);
                self.setColor(x, y+1, color);
                self.setColor(x+1, y+1, color);
        }
    }

    (function batchInterpolate() {
        try {
                var start = Date.now();
                console.log('batch interp', bounds.width);
                while (x < bounds.width) {
                    interpolateColumn(x);
                    x += 2;
                    if ((Date.now() - start) > 400) { 
                        // Interpolation is taking too long. Schedule the next batch for later and yield.
                        //report.progress((x - bounds.x) / (bounds.xMax - bounds.x));
                        setTimeout(batchInterpolate, 25);
                        return;
                    }
                }
          //self.render();
          callback(self.imageData);
          //this.createField(columns, callback);
        }
        catch (e) {
            console.log('error in batch interp', e);
        }
    })();
};

Griddy.prototype.segmentedColorScale = function(segments) {

    var colorInterpolator = function(start, end) {
      var r = start[0], g = start[1], b = start[2];
      var Δr = end[0] - r, Δg = end[1] - g, Δb = end[2] - b;
      return function(i, a) {
          return [Math.floor(r + i * Δr), Math.floor(g + i * Δg), Math.floor(b + i * Δb), a];
      };
    };

    var points = [], interpolators = [], ranges = [], self;
    for (var i = 0; i < segments.length - 1; i++) {
        points.push(segments[i+1][0]);
        interpolators.push(colorInterpolator(segments[i][1], segments[i+1][1]));
        ranges.push([segments[i][0], segments[i+1][0]]);
    }

    var clamp = function(x, low, high) {
        return Math.max(low, Math.min(x, high));
    }
    
    var proportion = function(x, low, high) {
        return (clamp(x, low, high) - low) / (high - low);
    }

    return function(point, alpha) {
        var i;
        for (i = 0; i < points.length - 1; i++) {
            if (point <= points[i]) {
                break;
            }
        }
        var range = ranges[i];
        return interpolators[i](proportion(point, range[0], range[1]), alpha);
    };
}


Griddy.prototype.setColor = function(x, y, rgba) {
  var i = (y * 256 + x) * 4;
  this.imageData.data[i    ] = rgba[0];
  this.imageData.data[i + 1] = rgba[1];
  this.imageData.data[i + 2] = rgba[2];
  this.imageData.data[i + 3] = rgba[3];
};


Griddy.prototype.colorInterpolator = function(start, end) {
  var r = start[0], g = start[1], b = start[2];
  var Δr = end[0] - r, Δg = end[1] - g, Δb = end[2] - b;
  return function(i, a) {
      return [Math.floor(r + i * Δr), Math.floor(g + i * Δg), Math.floor(b + i * Δb), a];
  };
};


/**
 * Produces a color style in a rainbow-like trefoil color space. Not quite HSV, but produces a nice
 * spectrum. See http://krazydad.com/tutorials/makecolors.php.
 *
 * @param hue the hue rotation in the range [0, 1]
 * @param a the alpha value in the range [0, 255]
 * @returns {Array} [r, g, b, a]
 */
Griddy.prototype.sinebowColor = function(hue, a) {
  var τ = 2 * Math.PI;
  // Map hue [0, 1] to radians [0, 5/6τ]. Don't allow a full rotation because that keeps hue == 0 and
  // hue == 1 from mapping to the same color.
  var rad = hue * τ * 5/6;
  rad *= 0.75;  // increase frequency to 2/3 cycle per rad

  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var r = Math.floor(Math.max(0, -c) * 255);
  var g = Math.floor(Math.max(s, 0) * 255);
  var b = Math.floor(Math.max(c, 0, -s) * 255);
  return [r, g, b, a];
}


//if (typeof(module) !== undefined){
//  module.exports = Griddy;
//}
