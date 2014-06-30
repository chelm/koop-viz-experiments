! function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = "function" == typeof require && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                throw new Error("Cannot find module '" + o + "'")
            }
            var f = n[o] = {
                exports: {}
            };
            t[o][0].call(f.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, f, f.exports, e, t, n, r)
        }
        return n[o].exports
    }
    for (var i = "function" == typeof require && require, o = 0; o < r.length; o++) s(r[o]);
    return s
}({
    1: [
        function(require, module) {
            "use strict";

            function Glyphs(buffer, end) {
                this.stacks = {}, this._buffer = buffer;
                var val, tag;
                for ("undefined" == typeof end && (end = buffer.length); buffer.pos < end;)
                    if (val = buffer.readVarint(), tag = val >> 3, 1 == tag) {
                        var fontstack = this.readFontstack();
                        this.stacks[fontstack.name] = fontstack
                    } else buffer.skip(val)
            }
            module.exports = Glyphs, Glyphs.prototype.readFontstack = function() {
                for (var val, tag, buffer = this._buffer, fontstack = {
                        glyphs: {}
                    }, bytes = buffer.readVarint(), end = buffer.pos + bytes; buffer.pos < end;)
                    if (val = buffer.readVarint(), tag = val >> 3, 1 == tag) fontstack.name = buffer.readString();
                    else if (2 == tag) {
                    var range = buffer.readString();
                    fontstack.range = range
                } else if (3 == tag) {
                    var glyph = this.readGlyph();
                    fontstack.glyphs[glyph.id] = glyph
                } else buffer.skip(val);
                return fontstack
            }, Glyphs.prototype.readGlyph = function() {
                for (var val, tag, buffer = this._buffer, glyph = {}, bytes = buffer.readVarint(), end = buffer.pos + bytes; buffer.pos < end;) val = buffer.readVarint(), tag = val >> 3, 1 == tag ? glyph.id = buffer.readVarint() : 2 == tag ? glyph.bitmap = buffer.readBuffer() : 3 == tag ? glyph.width = buffer.readVarint() : 4 == tag ? glyph.height = buffer.readVarint() : 5 == tag ? glyph.left = buffer.readSVarint() : 6 == tag ? glyph.top = buffer.readSVarint() : 7 == tag ? glyph.advance = buffer.readVarint() : buffer.skip(val);
                return glyph
            }
        }, {}
    ],
    2: [
        function(require, module) {
            "use strict";

            function VectorTile(buffer, end) {
                this.layers = {}, this._buffer = buffer;
                var val, tag;
                for ("undefined" == typeof end && (end = buffer.length); buffer.pos < end;)
                    if (val = buffer.readVarint(), tag = val >> 3, 3 == tag) {
                        var layer = this.readLayer();
                        layer.length && (this.layers[layer.name] = layer)
                    } else buffer.skip(val)
            }
            var VectorTileLayer = require("./vectortilelayer");
            module.exports = VectorTile, VectorTile.prototype.readLayer = function() {
                var buffer = this._buffer,
                    bytes = buffer.readVarint(),
                    end = buffer.pos + bytes,
                    layer = new VectorTileLayer(buffer, end);
                return buffer.pos = end, layer
            }
        }, {
            "./vectortilelayer": 4
        }
    ],
    3: [
        function(require, module) {
            "use strict";

            function VectorTileFeature(buffer, end, extent, keys, values) {
                this._extent = extent, this._type = 0, this._buffer = buffer, this._geometry = -1, "undefined" == typeof end && (end = buffer.length);
                for (var val, tag; buffer.pos < end;)
                    if (val = buffer.readVarint(), tag = val >> 3, 1 == tag) this._id = buffer.readVarint();
                    else if (2 == tag)
                    for (var tag_end = buffer.pos + buffer.readVarint(); buffer.pos < tag_end;) {
                        var key = keys[buffer.readVarint()],
                            value = values[buffer.readVarint()];
                        this[key] = value
                    } else 3 == tag ? this._type = buffer.readVarint() : 4 == tag ? (this._geometry = buffer.pos, buffer.skip(val)) : buffer.skip(val)
            }
            var Point = require("../geometry/point.js");
            module.exports = VectorTileFeature, VectorTileFeature.Unknown = 0, VectorTileFeature.Point = 1, VectorTileFeature.LineString = 2, VectorTileFeature.Polygon = 3, VectorTileFeature.mapping = [], VectorTileFeature.mapping[VectorTileFeature.Point] = "point", VectorTileFeature.mapping[VectorTileFeature.LineString] = "line", VectorTileFeature.mapping[VectorTileFeature.Polygon] = "fill", VectorTileFeature.prototype.loadGeometry = function() {
                var buffer = this._buffer;
                buffer.pos = this._geometry;
                for (var bytes = buffer.readVarint(), end = buffer.pos + bytes, cmd = 1, length = 0, x = 0, y = 0, lines = [], line = null; buffer.pos < end;) {
                    if (!length) {
                        var cmd_length = buffer.readVarint();
                        cmd = 7 & cmd_length, length = cmd_length >> 3
                    }
                    if (length--, 1 == cmd || 2 == cmd) x += buffer.readSVarint(), y += buffer.readSVarint(), 1 == cmd && (line && lines.push(line), line = []), line.push(new Point(x, y));
                    else {
                        if (7 != cmd) throw new Error("unknown command " + cmd);
                        line.push(line[0])
                    }
                }
                return line && lines.push(line), lines
            }, VectorTileFeature.prototype.bbox = function() {
                var buffer = this._buffer;
                buffer.pos = this._geometry;
                for (var bytes = buffer.readVarint(), end = buffer.pos + bytes, cmd = 1, length = 0, x = 0, y = 0, x1 = 1 / 0, x2 = -1 / 0, y1 = 1 / 0, y2 = -1 / 0; buffer.pos < end;) {
                    if (!length) {
                        var cmd_length = buffer.readVarint();
                        cmd = 7 & cmd_length, length = cmd_length >> 3
                    }
                    if (length--, 1 == cmd || 2 == cmd) x += buffer.readSVarint(), y += buffer.readSVarint(), x1 > x && (x1 = x), x > x2 && (x2 = x), y1 > y && (y1 = y), y > y2 && (y2 = y);
                    else if (7 != cmd) throw new Error("unknown command " + cmd)
                }
                return [x1, y1, x2, y2]
            }
        }, {
            "../geometry/point.js": 18
        }
    ],
    4: [
        function(require, module) {
            "use strict";

            function VectorTileLayer(buffer, end) {
                this.version = 1, this.name = null, this.extent = 4096, this.length = 0, this.shaping = {}, this.faces = [], this._buffer = buffer, this._keys = [], this._values = [], this._features = [];
                var val, tag, stack_index = [],
                    labels = [];
                for ("undefined" == typeof end && (end = buffer.length); buffer.pos < end;) val = buffer.readVarint(), tag = val >> 3, 15 == tag ? this.version = buffer.readVarint() : 1 == tag ? this.name = buffer.readString() : 5 == tag ? this.extent = buffer.readVarint() : 2 == tag ? (this.length++, this._features.push(buffer.pos), buffer.skip(val)) : 3 == tag ? this._keys.push(buffer.readString()) : 4 == tag ? this._values.push(this.readFeatureValue()) : 7 == tag ? this.faces.push(buffer.readString()) : 8 == tag ? labels.push(this.readLabel()) : 9 == tag ? stack_index.push(buffer.readString()) : buffer.skip(val);
                for (var shaping = this.shaping, i = 0; i < labels.length; i++) {
                    var label = labels[i],
                        text = this._values[label.text],
                        stack = stack_index[label.stack];
                    stack in shaping || (shaping[stack] = {}), shaping[stack][text] = label.glyphs
                }
            }
            var VectorTileFeature = require("./vectortilefeature.js");
            module.exports = VectorTileLayer, VectorTileLayer.prototype.readFeatureValue = function() {
                for (var val, tag, buffer = this._buffer, value = null, bytes = buffer.readVarint(), end = buffer.pos + bytes; buffer.pos < end;)
                    if (val = buffer.readVarint(), tag = val >> 3, 1 == tag) value = buffer.readString();
                    else {
                        if (2 == tag) throw new Error("read float");
                        if (3 == tag) value = buffer.readDouble();
                        else if (4 == tag) value = buffer.readVarint();
                        else {
                            if (5 == tag) throw new Error("read uint");
                            6 == tag ? value = buffer.readSVarint() : 7 == tag ? value = Boolean(buffer.readVarint()) : buffer.skip(val)
                        }
                    }
                return value
            }, VectorTileLayer.prototype.readLabel = function() {
                for (var faces, glyphs, x, y, val, tag, label = {
                        glyphs: []
                    }, buffer = this._buffer, bytes = buffer.readVarint(), end = buffer.pos + bytes; buffer.pos < end;) val = buffer.readVarint(), tag = val >> 3, 1 == tag ? label.text = buffer.readVarint() : 2 == tag ? label.stack = buffer.readVarint() : 3 == tag ? faces = buffer.readPacked("Varint") : 4 == tag ? glyphs = buffer.readPacked("Varint") : 5 == tag ? x = buffer.readPacked("Varint") : 6 == tag ? y = buffer.readPacked("Varint") : buffer.skip(val);
                if (glyphs)
                    for (var i = 0; i < glyphs.length; i++) label.glyphs.push({
                        face: faces[i],
                        glyph: glyphs[i],
                        x: x[i],
                        y: y[i]
                    });
                return label
            }, VectorTileLayer.prototype.feature = function(i) {
                if (0 > i || i >= this._features.length) throw new Error("feature index out of bounds");
                this._buffer.pos = this._features[i];
                var end = this._buffer.readVarint() + this._buffer.pos;
                return new VectorTileFeature(this._buffer, end, this.extent, this._keys, this._values)
            }
        }, {
            "./vectortilefeature.js": 3
        }
    ],
    5: [
        function(require, module) {
            "use strict";

            function Anchor(x, y, angle, scale, segment) {
                this.x = x, this.y = y, this.angle = angle, this.scale = scale, void 0 !== segment && (this.segment = segment)
            }
            var Point = require("./point.js");
            module.exports = Anchor, Anchor.prototype = Object.create(Point.prototype), Anchor.prototype.clone = function() {
                return new Anchor(this.x, this.y, this.angle, this.scale, this.segment)
            }
        }, {
            "./point.js": 18
        }
    ],
    6: [
        function(require, module) {
            "use strict";

            function Bucket(info, geometry, placement, indices) {
                this.info = info, this.geometry = geometry, this.placement = placement, this.indices = indices, info.text ? this.addFeature = this.addText : info.point ? (this.addFeature = this.addPoint, this.size = info["point-size"], this.spacing = info["point-spacing"], this.padding = info["point-padding"] || 2) : info.line ? this.addFeature = this.addLine : info.fill && (this.addFeature = this.addFill), this.compare = bucketFilter(this, ["source", "feature_type"])
            }
            module.exports = Bucket;
            var interpolate = require("./interpolate.js"),
                bucketFilter = require("../style/bucket-filter.js");
            Bucket.prototype.start = function() {
                var geometry = this.geometry;
                this.indices = {
                    lineBufferIndex: geometry.lineBufferIndex,
                    lineVertexIndex: geometry.lineVertex.index,
                    lineElementIndex: geometry.lineElement.index,
                    fillBufferIndex: geometry.fillBufferIndex,
                    fillVertexIndex: geometry.fillVertex.index,
                    fillElementsIndex: geometry.fillElements.index,
                    glyphVertexIndex: geometry.glyphVertex.index,
                    pointVertexIndex: geometry.pointVertex.index
                }
            }, Bucket.prototype.end = function() {
                var geometry = this.geometry,
                    indices = this.indices;
                indices.lineBufferIndexEnd = geometry.lineBufferIndex, indices.lineVertexIndexEnd = geometry.lineVertex.index, indices.lineElementIndexEnd = geometry.lineElement.index, indices.fillBufferIndexEnd = geometry.fillBufferIndex, indices.fillVertexIndexEnd = geometry.fillVertex.index, indices.fillElementsIndexEnd = geometry.fillElements.index, indices.glyphVertexIndexEnd = geometry.glyphVertex.index, indices.pointVertexIndexEnd = geometry.pointVertex.index
            }, Bucket.prototype.toJSON = function() {
                return {
                    indices: this.indices
                }
            }, Bucket.prototype.addLine = function(lines) {
                for (var info = this.info, i = 0; i < lines.length; i++) this.geometry.addLine(lines[i], info["line-join"], info["line-cap"], info["line-miter-limit"], info["line-round-limit"])
            }, Bucket.prototype.addFill = function(lines) {
                for (var i = 0; i < lines.length; i++) this.geometry.addFill(lines[i])
            }, Bucket.prototype.addPoint = function(lines, imagePos) {
                for (var i = 0; i < lines.length; i++) {
                    var points = lines[i];
                    if (this.spacing && (points = interpolate(points, this.spacing, 1, 1)), this.size)
                        for (var ratio = 8, x = this.size[0] / 2 * ratio, y = this.size[1] / 2 * ratio, k = 0; k < points.length; k++) {
                            var point = points[k],
                                glyphs = [{
                                    box: {
                                        x1: -x,
                                        x2: x,
                                        y1: -y,
                                        y2: y
                                    },
                                    minScale: 1,
                                    anchor: point
                                }],
                                placement = this.placement.collision.place(glyphs, point, 1, 16, this.padding);
                            placement && this.geometry.addPoints([point], placement, imagePos)
                        } else this.geometry.addPoints(points, null, imagePos)
                }
            }, Bucket.prototype.addText = function(lines, faces, shaping) {
                for (var i = 0; i < lines.length; i++) this.placement.addFeature(lines[i], this.info, faces, shaping)
            }
        }, {
            "../style/bucket-filter.js": 32,
            "./interpolate.js": 13
        }
    ],
    7: [
        function(require, module) {
            "use strict";

            function Buffer(buffer) {
                buffer ? (this.array = buffer.array, this.pos = buffer.pos) : (this.array = new ArrayBuffer(this.defaultLength), this.length = this.defaultLength, this.setupViews())
            }
            module.exports = Buffer, Buffer.prototype = {
                pos: 0,
                itemSize: 4,
                defaultLength: 8192,
                arrayType: "ARRAY_BUFFER",
                get index() {
                    return this.pos / this.itemSize
                },
                setupViews: function() {
                    this.ubytes = new Uint8Array(this.array), this.bytes = new Int8Array(this.array), this.ushorts = new Uint16Array(this.array), this.shorts = new Int16Array(this.array)
                },
                bind: function(gl) {
                    var type = gl[this.arrayType];
                    this.buffer ? gl.bindBuffer(type, this.buffer) : (this.buffer = gl.createBuffer(), gl.bindBuffer(type, this.buffer), gl.bufferData(type, new DataView(this.array, 0, this.pos), gl.STATIC_DRAW), this.array = null)
                },
                destroy: function(gl) {
                    this.buffer && gl.deleteBuffer(this.buffer)
                },
                resize: function() {
                    if (this.length < this.pos + this.itemSize) {
                        for (; this.length < this.pos + this.itemSize;) this.length = 2 * Math.round(1.5 * this.length / 2);
                        this.array = new ArrayBuffer(this.length);
                        var ubytes = new Uint8Array(this.array);
                        ubytes.set(this.ubytes), this.setupViews()
                    }
                }
            }
        }, {}
    ],
    8: [
        function(require, module) {
            "use strict";

            function FeatureTree(getGeometry, getType) {
                this.getGeometry = getGeometry, this.getType = getType, this.rtree = rbush(9), this.toBeInserted = []
            }

            function geometryContainsPoint(rings, type, p, radius) {
                return "point" === type ? pointContainsPoint(rings, p, radius) : "line" === type ? lineContainsPoint(rings, p, radius) : "fill" === type ? polyContainsPoint(rings, p) ? !0 : lineContainsPoint(rings, p, radius) : !1
            }

            function distToSegmentSquared(p, v, w) {
                var l2 = v.distSqr(w);
                if (0 === l2) return p.distSqr(v);
                var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
                return p.distSqr(0 > t ? v : t > 1 ? w : w.sub(v)._mult(t)._add(v))
            }

            function lineContainsPoint(rings, p, radius) {
                for (var r = radius * radius, i = 0; i < rings.length; i++)
                    for (var ring = rings[i], j = 1; j < ring.length; j++) {
                        var v = ring[j - 1],
                            w = ring[j];
                        if (distToSegmentSquared(p, v, w) < r) return !0
                    }
                return !1
            }

            function polyContainsPoint(rings, p) {
                for (var ring, p1, p2, c = !1, k = 0; k < rings.length; k++) {
                    ring = rings[k];
                    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) p1 = ring[i], p2 = ring[j], p1.y > p.y != p2.y > p.y && p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x && (c = !c)
                }
                return c
            }

            function pointContainsPoint(rings, p, radius) {
                for (var r = radius * radius, i = 0; i < rings.length; i++)
                    for (var ring = rings[i], j = 0; j < ring.length; j++)
                        if (ring[j].distSqr(p) <= r) return !0;
                return !1
            }
            var rbush = require("rbush"),
                Point = require("../geometry/point.js");
            module.exports = FeatureTree, FeatureTree.prototype.insert = function(bbox, bucket_name, feature) {
                bbox.bucket = bucket_name, bbox.feature = feature, this.toBeInserted.push(bbox)
            }, FeatureTree.prototype._load = function() {
                this.rtree.load(this.toBeInserted), this.toBeInserted = []
            }, FeatureTree.prototype.query = function(args, callback) {
                this.toBeInserted.length && this._load();
                var radius = 0;
                "radius" in args.params && (radius = args.params.radius), radius *= 4096 / args.scale;
                var x = args.x,
                    y = args.y,
                    matching = this.rtree.search([x - radius, y - radius, x + radius, y + radius]);
                args.params.buckets ? this.queryBuckets(matching, x, y, radius, args.params, callback) : this.queryFeatures(matching, x, y, radius, args.params, callback)
            }, FeatureTree.prototype.queryFeatures = function(matching, x, y, radius, params, callback) {
                for (var result = [], i = 0; i < matching.length; i++) {
                    var feature = matching[i].feature,
                        type = this.getType(feature),
                        geometry = this.getGeometry(feature);
                    if (!(params.bucket && matching[i].bucket !== params.bucket || params.type && type !== params.type || !geometryContainsPoint(geometry, type, new Point(x, y), radius))) {
                        var props = {
                            _bucket: matching[i].bucket,
                            _type: type
                        };
                        params.geometry && (props._geometry = geometry);
                        for (var key in feature) feature.hasOwnProperty(key) && "_" !== key[0] && (props[key] = feature[key]);
                        result.push(props)
                    }
                }
                callback(null, result)
            }, FeatureTree.prototype.queryBuckets = function(matching, x, y, radius, params, callback) {
                for (var buckets = [], i = 0; i < matching.length; i++)
                    if (!(buckets.indexOf(matching[i].bucket) >= 0)) {
                        var feature = matching[i].feature,
                            type = this.getType(feature),
                            geometry = this.getGeometry(feature);
                        geometryContainsPoint(geometry, type, new Point(x, y), radius) && buckets.push(matching[i].bucket)
                    }
                callback(null, buckets)
            }
        }, {
            "../geometry/point.js": 18,
            rbush: 75
        }
    ],
    9: [
        function(require, module) {
            "use strict";

            function FillElementsBuffer(buffer) {
                Buffer.call(this, buffer)
            }
            var Buffer = require("./buffer.js");
            module.exports = FillElementsBuffer, FillElementsBuffer.prototype = Object.create(Buffer.prototype), FillElementsBuffer.prototype.itemSize = 6, FillElementsBuffer.prototype.arrayType = "ELEMENT_ARRAY_BUFFER", FillElementsBuffer.prototype.add = function(a, b, c) {
                var pos2 = this.pos / 2;
                this.resize(), this.ushorts[pos2 + 0] = a, this.ushorts[pos2 + 1] = b, this.ushorts[pos2 + 2] = c, this.pos += this.itemSize
            }
        }, {
            "./buffer.js": 7
        }
    ],
    10: [
        function(require, module) {
            "use strict";

            function FillVertexBuffer(buffer) {
                Buffer.call(this, buffer)
            }
            var Buffer = require("./buffer.js");
            module.exports = FillVertexBuffer, FillVertexBuffer.prototype = Object.create(Buffer.prototype), FillVertexBuffer.prototype.itemSize = 4, FillVertexBuffer.prototype.add = function(x, y) {
                var pos2 = this.pos / 2;
                this.resize(), this.shorts[pos2 + 0] = x, this.shorts[pos2 + 1] = y, this.pos += this.itemSize
            }, FillVertexBuffer.prototype.addDegenerate = function() {
                this.add(32767, 0)
            }
        }, {
            "./buffer.js": 7
        }
    ],
    11: [
        function(require, module) {
            "use strict";

            function Geometry() {
                this.glyphVertex = new GlyphVertexBuffer, this.pointVertex = new PointVertexBuffer, this.lineBuffers = [], this.lineBufferIndex = -1, this.lineVertex = null, this.lineElement = null, this.swapLineBuffers(0), this.fillBuffers = [], this.fillBufferIndex = -1, this.fillVertex = null, this.fillElements = null, this.swapFillBuffers(0)
            }
            var LineVertexBuffer = require("./linevertexbuffer.js"),
                LineElementBuffer = require("./lineelementbuffer.js"),
                FillVertexBuffer = require("./fillvertexbuffer.js"),
                FillElementsBuffer = require("./fillelementsbuffer.js"),
                GlyphVertexBuffer = require("./glyphvertexbuffer.js"),
                PointVertexBuffer = require("./pointvertexbuffer.js");
            module.exports = Geometry, Geometry.prototype.bufferList = function() {
                for (var buffers = [this.glyphVertex.array, this.pointVertex.array], k = 0, linelen = this.lineBuffers.length; linelen > k; k++) buffers.push(this.lineBuffers[k].vertex.array, this.lineBuffers[k].element.array);
                for (var i = 0, len = this.fillBuffers.length; len > i; i++) buffers.push(this.fillBuffers[i].vertex.array, this.fillBuffers[i].elements.array);
                return buffers
            }, Geometry.prototype.swapFillBuffers = function(vertexCount) {
                (!this.fillVertex || this.fillVertex.index + vertexCount >= 65536) && (this.fillVertex = new FillVertexBuffer, this.fillElements = new FillElementsBuffer, this.fillBuffers.push({
                    vertex: this.fillVertex,
                    elements: this.fillElements
                }), this.fillBufferIndex++)
            }, Geometry.prototype.swapLineBuffers = function(vertexCount) {
                (!this.lineVertex || this.lineVertex.index + vertexCount >= 65536) && (this.lineVertex = new LineVertexBuffer, this.lineElement = new LineElementBuffer, this.lineBuffers.push({
                    vertex: this.lineVertex,
                    element: this.lineElement
                }), this.lineBufferIndex++)
            }, Geometry.prototype.addPoints = function(vertices, place, image) {
                var fullRange = [2 * Math.PI, 0];
                image = image || {
                    tl: [0, 0],
                    br: [0, 0]
                };
                for (var i = 0; i < vertices.length; i++) {
                    var point = vertices[i];
                    if (place) this.pointVertex.add(point.x, point.y, image.tl, image.br, 0, place.zoom, place.rotationRange);
                    else {
                        var zoom = point.scale && Math.log(point.scale) / Math.LN2;
                        this.pointVertex.add(point.x, point.y, image.tl, image.br, point.angle || 0, zoom || 0, fullRange)
                    }
                }
            }, Geometry.prototype.addLine = function(vertices, join, cap, miterLimit, roundLimit) {
                function addCurrentVertex(normal, endBox, round) {
                    var extrude, tx = round ? 1 : 0;
                    extrude = normal.mult(flip), endBox && extrude._sub(normal.perp()._mult(endBox)), e3 = lineVertex.add(currentVertex, extrude, tx, 0, distance), e1 >= 0 && e2 >= 0 && lineElement.add(e1, e2, e3), e1 = e2, e2 = e3, extrude = normal.mult(-flip), endBox && extrude._sub(normal.perp()._mult(endBox)), e3 = lineVertex.add(currentVertex, extrude, tx, 1, distance), e1 >= 0 && e2 >= 0 && lineElement.add(e1, e2, e3), e1 = e2, e2 = e3
                }
                if (!(vertices.length < 2)) {
                    var len = vertices.length,
                        firstVertex = vertices[0],
                        lastVertex = vertices[len - 1],
                        closed = firstVertex.equals(lastVertex);
                    this.swapLineBuffers(4 * len);
                    var lineVertex = this.lineVertex,
                        lineElement = this.lineElement;
                    if (2 != len || !closed) {
                        join = join || "miter", cap = cap || "butt", miterLimit = miterLimit || 2, roundLimit = roundLimit || 1;
                        var currentVertex, prevVertex, nextVertex, prevNormal, nextNormal, e1, e2, e3, beginCap = cap,
                            endCap = closed ? "butt" : cap,
                            flip = 1,
                            distance = 0;
                        closed && (currentVertex = vertices[len - 2], nextNormal = firstVertex.sub(currentVertex)._unit()._perp());
                        for (var i = 0; len > i; i++)
                            if (nextVertex = closed && i === len - 1 ? vertices[1] : vertices[i + 1], !nextVertex || !vertices[i].equals(nextVertex)) {
                                nextNormal && (prevNormal = nextNormal), currentVertex && (prevVertex = currentVertex), currentVertex = vertices[i], prevVertex && (distance += currentVertex.dist(prevVertex)), nextNormal = nextVertex ? nextVertex.sub(currentVertex)._unit()._perp() : prevNormal, prevNormal = prevNormal || nextNormal;
                                var joinNormal = prevNormal.add(nextNormal)._unit(),
                                    cosHalfAngle = joinNormal.x * nextNormal.x + joinNormal.y * nextNormal.y,
                                    miterLength = 1 / cosHalfAngle,
                                    startOfLine = void 0 === e1 || void 0 === e2,
                                    currentJoin = prevVertex && nextVertex ? join : nextVertex ? beginCap : endCap;
                                if ("round" === currentJoin && roundLimit > miterLength && (currentJoin = "miter"), "miter" === currentJoin && miterLength > miterLimit && miterLength < Math.SQRT2 && (currentJoin = "bevel"), "miter" === currentJoin) {
                                    if (miterLength > 100) flip = -flip, joinNormal = nextNormal;
                                    else if (miterLength > miterLimit) {
                                        flip = -flip;
                                        var bevelLength = miterLength * prevNormal.add(nextNormal).mag() / prevNormal.sub(nextNormal).mag();
                                        joinNormal._perp()._mult(flip * bevelLength)
                                    } else joinNormal._mult(miterLength);
                                    addCurrentVertex(joinNormal, 0, !1)
                                } else startOfLine || addCurrentVertex(prevNormal, "square" === currentJoin ? 1 : 0, !1), startOfLine || "round" !== currentJoin || addCurrentVertex(prevNormal, 1, !0), (startOfLine || "bevel" !== currentJoin) && (e1 = e2 = -1, flip = 1), startOfLine && "round" === beginCap && addCurrentVertex(nextNormal, -1, !0), nextVertex && addCurrentVertex(nextNormal, "square" === currentJoin ? -1 : 0, !1)
                            }
                    }
                }
            }, Geometry.prototype.addFill = function(vertices) {
                if (!(vertices.length < 3)) {
                    var len = vertices.length;
                    this.swapFillBuffers(len + 1), this.fillVertex.addDegenerate();
                    for (var prevIndex, currentIndex, currentVertex, firstIndex = this.fillVertex.index, i = 0; i < vertices.length; i++) currentIndex = this.fillVertex.index, currentVertex = vertices[i], this.fillVertex.add(currentVertex.x, currentVertex.y), i >= 2 && (currentVertex.x !== vertices[0].x || currentVertex.y !== vertices[0].y) && this.fillElements.add(firstIndex, prevIndex, currentIndex), prevIndex = currentIndex
                }
            }, Geometry.prototype.addGlyphs = function(glyphs, placementZoom, placementRange, zoom) {
                var glyphVertex = this.glyphVertex;
                placementZoom += zoom;
                for (var k = 0; k < glyphs.length; k++) {
                    var glyph = glyphs[k],
                        tl = glyph.tl,
                        tr = glyph.tr,
                        bl = glyph.bl,
                        br = glyph.br,
                        tex = glyph.tex,
                        angle = glyph.angle,
                        anchor = glyph.anchor,
                        minZoom = Math.max(zoom + Math.log(glyph.minScale) / Math.LN2, placementZoom),
                        maxZoom = Math.min(zoom + Math.log(glyph.maxScale) / Math.LN2, 25);
                    minZoom >= maxZoom || (minZoom === placementZoom && (minZoom = 0), glyphVertex.add(anchor.x, anchor.y, tl.x, tl.y, tex.x, tex.y, angle, minZoom, placementRange, maxZoom, placementZoom), glyphVertex.add(anchor.x, anchor.y, tr.x, tr.y, tex.x + tex.w, tex.y, angle, minZoom, placementRange, maxZoom, placementZoom), glyphVertex.add(anchor.x, anchor.y, bl.x, bl.y, tex.x, tex.y + tex.h, angle, minZoom, placementRange, maxZoom, placementZoom), glyphVertex.add(anchor.x, anchor.y, tr.x, tr.y, tex.x + tex.w, tex.y, angle, minZoom, placementRange, maxZoom, placementZoom), glyphVertex.add(anchor.x, anchor.y, bl.x, bl.y, tex.x, tex.y + tex.h, angle, minZoom, placementRange, maxZoom, placementZoom), glyphVertex.add(anchor.x, anchor.y, br.x, br.y, tex.x + tex.w, tex.y + tex.h, angle, minZoom, placementRange, maxZoom, placementZoom))
                }
            }
        }, {
            "./fillelementsbuffer.js": 9,
            "./fillvertexbuffer.js": 10,
            "./glyphvertexbuffer.js": 12,
            "./lineelementbuffer.js": 16,
            "./linevertexbuffer.js": 17,
            "./pointvertexbuffer.js": 19
        }
    ],
    12: [
        function(require, module) {
            "use strict";

            function GlyphVertexBuffer(buffer) {
                Buffer.call(this, buffer)
            }
            var Buffer = require("./buffer.js");
            module.exports = GlyphVertexBuffer, GlyphVertexBuffer.prototype = Object.create(Buffer.prototype), GlyphVertexBuffer.prototype.defaultLength = 32768, GlyphVertexBuffer.prototype.itemSize = 16, GlyphVertexBuffer.angleFactor = 128 / Math.PI, GlyphVertexBuffer.prototype.add = function(x, y, ox, oy, tx, ty, angle, minzoom, range, maxzoom, labelminzoom) {
                var pos = this.pos,
                    pos2 = pos / 2,
                    angleFactor = GlyphVertexBuffer.angleFactor;
                this.resize(), this.shorts[pos2 + 0] = x, this.shorts[pos2 + 1] = y, this.shorts[pos2 + 2] = Math.round(64 * ox), this.shorts[pos2 + 3] = Math.round(64 * oy), this.ubytes[pos + 8] = Math.floor(tx / 4), this.ubytes[pos + 9] = Math.floor(ty / 4), this.ubytes[pos + 10] = Math.floor(10 * (labelminzoom || 0)), this.ubytes[pos + 11] = Math.floor(10 * (minzoom || 0)), this.ubytes[pos + 12] = Math.floor(10 * Math.min(maxzoom || 25, 25)), this.ubytes[pos + 13] = Math.round(angle * angleFactor) % 256, this.ubytes[pos + 14] = Math.max(Math.round(range[0] * angleFactor), 0) % 256, this.ubytes[pos + 15] = Math.min(Math.round(range[1] * angleFactor), 255) % 256, this.pos += this.itemSize
            }
        }, {
            "./buffer.js": 7
        }
    ],
    13: [
        function(require, module) {
            "use strict";

            function interpolate(vertices, spacing, minScale, start) {
                void 0 === minScale && (minScale = 0);
                for (var distance = 0, markedDistance = 0, added = start || 0, points = [], i = 0; i < vertices.length - 1; i++) {
                    for (var a = vertices[i], b = vertices[i + 1], segmentDist = a.dist(b), angle = b.angleTo(a); distance + segmentDist > markedDistance + spacing;) {
                        markedDistance += spacing;
                        var t = (markedDistance - distance) / segmentDist,
                            x = util.interp(a.x, b.x, t),
                            y = util.interp(a.y, b.y, t),
                            s = added % 8 === 0 ? minScale : added % 4 === 0 ? 2 : added % 2 === 0 ? 4 : 8;
                        x >= 0 && 4096 > x && y >= 0 && 4096 > y && points.push(new Anchor(x, y, angle, s, i)), added++
                    }
                    distance += segmentDist
                }
                return points
            }
            var util = require("../util/util.js"),
                Anchor = require("../geometry/anchor.js");
            module.exports = interpolate
        }, {
            "../geometry/anchor.js": 5,
            "../util/util.js": 64
        }
    ],
    14: [
        function(require, module) {
            "use strict";

            function LatLng(lat, lng) {
                if (isNaN(lat) || isNaN(lng)) throw new Error("Invalid LatLng object: (" + lat + ", " + lng + ")");
                this.lat = +lat, this.lng = +lng
            }
            module.exports = LatLng, LatLng.convert = function(a) {
                return a instanceof LatLng ? a : Array.isArray(a) ? new LatLng(a[0], a[1]) : a
            }
        }, {}
    ],
    15: [
        function(require, module) {
            "use strict";

            function LatLngBounds(sw, ne) {
                if (sw)
                    for (var latlngs = ne ? [sw, ne] : sw, i = 0, len = latlngs.length; len > i; i++) this.extend(latlngs[i])
            }
            module.exports = LatLngBounds;
            var LatLng = require("./latlng.js");
            LatLngBounds.prototype = {
                extend: function(obj) {
                    var sw2, ne2, sw = this._sw,
                        ne = this._ne;
                    if (obj instanceof LatLng) sw2 = obj, ne2 = obj;
                    else {
                        if (!(obj instanceof LatLngBounds)) return obj ? this.extend(LatLng.convert(obj) || LatLngBounds.convert(obj)) : this;
                        if (sw2 = obj._sw, ne2 = obj._ne, !sw2 || !ne2) return this
                    }
                    return sw || ne ? (sw.lat = Math.min(sw2.lat, sw.lat), sw.lng = Math.min(sw2.lng, sw.lng), ne.lat = Math.max(ne2.lat, ne.lat), ne.lng = Math.max(ne2.lng, ne.lng)) : (this._sw = new LatLng(sw2.lat, sw2.lng), this._ne = new LatLng(ne2.lat, ne2.lng)), this
                },
                getCenter: function() {
                    return new LatLng((this._sw.lat + this._ne.lat) / 2, (this._sw.lng + this._ne.lng) / 2)
                },
                getSouthWest: function() {
                    return this._sw
                },
                getNorthEast: function() {
                    return this._ne
                },
                getNorthWest: function() {
                    return new LatLng(this.getNorth(), this.getWest())
                },
                getSouthEast: function() {
                    return new LatLng(this.getSouth(), this.getEast())
                },
                getWest: function() {
                    return this._sw.lng
                },
                getSouth: function() {
                    return this._sw.lat
                },
                getEast: function() {
                    return this._ne.lng
                },
                getNorth: function() {
                    return this._ne.lat
                }
            }, LatLngBounds.convert = function(a) {
                return !a || a instanceof LatLngBounds ? a : new LatLngBounds(a)
            }
        }, {
            "./latlng.js": 14
        }
    ],
    16: [
        function(require, module) {
            "use strict";

            function LineElementBuffer(buffer) {
                Buffer.call(this, buffer)
            }
            var Buffer = require("./buffer.js");
            module.exports = LineElementBuffer, LineElementBuffer.prototype = Object.create(Buffer.prototype), LineElementBuffer.prototype.itemSize = 6, LineElementBuffer.prototype.arrayType = "ELEMENT_ARRAY_BUFFER", LineElementBuffer.prototype.add = function(a, b, c) {
                var pos2 = this.pos / 2;
                this.resize(), this.ushorts[pos2 + 0] = a, this.ushorts[pos2 + 1] = b, this.ushorts[pos2 + 2] = c, this.pos += this.itemSize
            }
        }, {
            "./buffer.js": 7
        }
    ],
    17: [
        function(require, module) {
            "use strict";

            function LineVertexBuffer(buffer) {
                Buffer.call(this, buffer)
            }
            var Buffer = require("./buffer.js");
            module.exports = LineVertexBuffer, LineVertexBuffer.extrudeScale = 63, LineVertexBuffer.prototype = Object.create(Buffer.prototype), LineVertexBuffer.prototype.itemSize = 8, LineVertexBuffer.prototype.defaultLength = 32768, LineVertexBuffer.prototype.add = function(point, extrude, tx, ty, linesofar) {
                var pos = this.pos,
                    pos2 = pos / 2,
                    index = this.index,
                    extrudeScale = LineVertexBuffer.extrudeScale;
                return this.resize(), this.shorts[pos2 + 0] = 2 * Math.floor(point.x) | tx, this.shorts[pos2 + 1] = 2 * Math.floor(point.y) | ty, this.shorts[pos2 + 2] = Math.round(linesofar || 0), this.bytes[pos + 6] = Math.round(extrudeScale * extrude.x), this.bytes[pos + 7] = Math.round(extrudeScale * extrude.y), this.pos += this.itemSize, index
            }
        }, {
            "./buffer.js": 7
        }
    ],
    18: [
        function(require, module) {
            "use strict";

            function Point(x, y) {
                this.x = x, this.y = y
            }
            module.exports = Point, Point.prototype = {
                clone: function() {
                    return new Point(this.x, this.y)
                },
                add: function(p) {
                    return this.clone()._add(p)
                },
                sub: function(p) {
                    return this.clone()._sub(p)
                },
                mult: function(k) {
                    return this.clone()._mult(k)
                },
                div: function(k) {
                    return this.clone()._div(k)
                },
                rotate: function(a) {
                    return this.clone()._rotate(a)
                },
                matMult: function(m) {
                    return this.clone()._matMult(m)
                },
                unit: function() {
                    return this.clone()._unit()
                },
                perp: function() {
                    return this.clone()._perp()
                },
                round: function() {
                    return this.clone()._round()
                },
                mag: function() {
                    return Math.sqrt(this.x * this.x + this.y * this.y)
                },
                equals: function(p) {
                    return this.x === p.x && this.y === p.y
                },
                dist: function(p) {
                    return Math.sqrt(this.distSqr(p))
                },
                distSqr: function(p) {
                    var dx = p.x - this.x,
                        dy = p.y - this.y;
                    return dx * dx + dy * dy
                },
                angle: function() {
                    return Math.atan2(this.y, this.x)
                },
                angleTo: function(b) {
                    return Math.atan2(this.y - b.y, this.x - b.x)
                },
                angleWith: function(b) {
                    return this.angleWithSep(b.x, b.y)
                },
                angleWithSep: function(x, y) {
                    return Math.atan2(this.x * y - this.y * x, this.x * x + this.y * y)
                },
                _matMult: function(m) {
                    var x = m[0] * this.x + m[1] * this.y,
                        y = m[2] * this.x + m[3] * this.y;
                    return this.x = x, this.y = y, this
                },
                _add: function(p) {
                    return this.x += p.x, this.y += p.y, this
                },
                _sub: function(p) {
                    return this.x -= p.x, this.y -= p.y, this
                },
                _mult: function(k) {
                    return this.x *= k, this.y *= k, this
                },
                _div: function(k) {
                    return this.x /= k, this.y /= k, this
                },
                _unit: function() {
                    return this._div(this.mag()), this
                },
                _perp: function() {
                    var y = this.y;
                    return this.y = this.x, this.x = -y, this
                },
                _rotate: function(angle) {
                    var cos = Math.cos(angle),
                        sin = Math.sin(angle),
                        x = cos * this.x - sin * this.y,
                        y = sin * this.x + cos * this.y;
                    return this.x = x, this.y = y, this
                },
                _round: function() {
                    return this.x = Math.round(this.x), this.y = Math.round(this.y), this
                }
            }, Point.convert = function(a) {
                return a instanceof Point ? a : Array.isArray(a) ? new Point(a[0], a[1]) : a
            }
        }, {}
    ],
    19: [
        function(require, module) {
            "use strict";

            function PointVertexBuffer(buffer) {
                Buffer.call(this, buffer)
            }
            var Buffer = require("./buffer.js");
            module.exports = PointVertexBuffer, PointVertexBuffer.prototype = Object.create(Buffer.prototype), PointVertexBuffer.prototype.defaultLength = 32768, PointVertexBuffer.prototype.itemSize = 16, PointVertexBuffer.angleFactor = 128 / Math.PI, PointVertexBuffer.prototype.add = function(x, y, tl, br, angle, pointminzoom, angleRange) {
                var pos = this.pos,
                    pos2 = pos / 2,
                    angleFactor = PointVertexBuffer.angleFactor;
                this.resize(), this.shorts[pos2 + 0] = x, this.shorts[pos2 + 1] = y, this.shorts[pos2 + 2] = tl[0], this.shorts[pos2 + 3] = tl[1], this.shorts[pos2 + 4] = br[0], this.shorts[pos2 + 5] = br[1], this.ubytes[pos + 12] = Math.floor(10 * (pointminzoom || 0)), this.ubytes[pos + 13] = Math.floor((angle + 2 * Math.PI) % (2 * Math.PI) * angleFactor) % 256, this.ubytes[pos + 14] = Math.floor(angleRange[0] * angleFactor) % 256, this.ubytes[pos + 15] = Math.floor(angleRange[1] * angleFactor) % 256, this.pos += this.itemSize
            }
        }, {
            "./buffer.js": 7
        }
    ],
    20: [
        function(require, module, exports) {
            ! function(e) {
                "use strict";
                var t = {};
                "undefined" == typeof exports ? "function" == typeof define && "object" == typeof define.amd && define.amd ? (t.exports = {}, define(function() {
                    return t.exports
                })) : t.exports = "undefined" != typeof window ? window : e : t.exports = exports,
                function(e) {
                    if (!t) var t = 1e-6;
                    if (!n) var n = "undefined" != typeof Float32Array ? Float32Array : Array;
                    if (!r) var r = Math.random;
                    var i = {};
                    i.setMatrixArrayType = function(e) {
                        n = e
                    }, "undefined" != typeof e && (e.glMatrix = i);
                    var s = {};
                    s.create = function() {
                        var e = new n(2);
                        return e[0] = 0, e[1] = 0, e
                    }, s.clone = function(e) {
                        var t = new n(2);
                        return t[0] = e[0], t[1] = e[1], t
                    }, s.fromValues = function(e, t) {
                        var r = new n(2);
                        return r[0] = e, r[1] = t, r
                    }, s.copy = function(e, t) {
                        return e[0] = t[0], e[1] = t[1], e
                    }, s.set = function(e, t, n) {
                        return e[0] = t, e[1] = n, e
                    }, s.add = function(e, t, n) {
                        return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e
                    }, s.subtract = function(e, t, n) {
                        return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e
                    }, s.sub = s.subtract, s.multiply = function(e, t, n) {
                        return e[0] = t[0] * n[0], e[1] = t[1] * n[1], e
                    }, s.mul = s.multiply, s.divide = function(e, t, n) {
                        return e[0] = t[0] / n[0], e[1] = t[1] / n[1], e
                    }, s.div = s.divide, s.min = function(e, t, n) {
                        return e[0] = Math.min(t[0], n[0]), e[1] = Math.min(t[1], n[1]), e
                    }, s.max = function(e, t, n) {
                        return e[0] = Math.max(t[0], n[0]), e[1] = Math.max(t[1], n[1]), e
                    }, s.scale = function(e, t, n) {
                        return e[0] = t[0] * n, e[1] = t[1] * n, e
                    }, s.scaleAndAdd = function(e, t, n, r) {
                        return e[0] = t[0] + n[0] * r, e[1] = t[1] + n[1] * r, e
                    }, s.distance = function(e, t) {
                        var n = t[0] - e[0],
                            r = t[1] - e[1];
                        return Math.sqrt(n * n + r * r)
                    }, s.dist = s.distance, s.squaredDistance = function(e, t) {
                        var n = t[0] - e[0],
                            r = t[1] - e[1];
                        return n * n + r * r
                    }, s.sqrDist = s.squaredDistance, s.length = function(e) {
                        var t = e[0],
                            n = e[1];
                        return Math.sqrt(t * t + n * n)
                    }, s.len = s.length, s.squaredLength = function(e) {
                        var t = e[0],
                            n = e[1];
                        return t * t + n * n
                    }, s.sqrLen = s.squaredLength, s.negate = function(e, t) {
                        return e[0] = -t[0], e[1] = -t[1], e
                    }, s.normalize = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = n * n + r * r;
                        return i > 0 && (i = 1 / Math.sqrt(i), e[0] = t[0] * i, e[1] = t[1] * i), e
                    }, s.dot = function(e, t) {
                        return e[0] * t[0] + e[1] * t[1]
                    }, s.cross = function(e, t, n) {
                        var r = t[0] * n[1] - t[1] * n[0];
                        return e[0] = e[1] = 0, e[2] = r, e
                    }, s.lerp = function(e, t, n, r) {
                        var i = t[0],
                            s = t[1];
                        return e[0] = i + r * (n[0] - i), e[1] = s + r * (n[1] - s), e
                    }, s.random = function(e, t) {
                        t = t || 1;
                        var n = 2 * r() * Math.PI;
                        return e[0] = Math.cos(n) * t, e[1] = Math.sin(n) * t, e
                    }, s.transformMat2 = function(e, t, n) {
                        var r = t[0],
                            i = t[1];
                        return e[0] = n[0] * r + n[2] * i, e[1] = n[1] * r + n[3] * i, e
                    }, s.transformMat2d = function(e, t, n) {
                        var r = t[0],
                            i = t[1];
                        return e[0] = n[0] * r + n[2] * i + n[4], e[1] = n[1] * r + n[3] * i + n[5], e
                    }, s.transformMat3 = function(e, t, n) {
                        var r = t[0],
                            i = t[1];
                        return e[0] = n[0] * r + n[3] * i + n[6], e[1] = n[1] * r + n[4] * i + n[7], e
                    }, s.transformMat4 = function(e, t, n) {
                        var r = t[0],
                            i = t[1];
                        return e[0] = n[0] * r + n[4] * i + n[12], e[1] = n[1] * r + n[5] * i + n[13], e
                    }, s.forEach = function() {
                        var e = s.create();
                        return function(t, n, r, i, s, o) {
                            var u, a;
                            for (n || (n = 2), r || (r = 0), a = i ? Math.min(i * n + r, t.length) : t.length, u = r; a > u; u += n) e[0] = t[u], e[1] = t[u + 1], s(e, e, o), t[u] = e[0], t[u + 1] = e[1];
                            return t
                        }
                    }(), s.str = function(e) {
                        return "vec2(" + e[0] + ", " + e[1] + ")"
                    }, "undefined" != typeof e && (e.vec2 = s);
                    var o = {};
                    o.create = function() {
                        var e = new n(3);
                        return e[0] = 0, e[1] = 0, e[2] = 0, e
                    }, o.clone = function(e) {
                        var t = new n(3);
                        return t[0] = e[0], t[1] = e[1], t[2] = e[2], t
                    }, o.fromValues = function(e, t, r) {
                        var i = new n(3);
                        return i[0] = e, i[1] = t, i[2] = r, i
                    }, o.copy = function(e, t) {
                        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e
                    }, o.set = function(e, t, n, r) {
                        return e[0] = t, e[1] = n, e[2] = r, e
                    }, o.add = function(e, t, n) {
                        return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e[2] = t[2] + n[2], e
                    }, o.subtract = function(e, t, n) {
                        return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e[2] = t[2] - n[2], e
                    }, o.sub = o.subtract, o.multiply = function(e, t, n) {
                        return e[0] = t[0] * n[0], e[1] = t[1] * n[1], e[2] = t[2] * n[2], e
                    }, o.mul = o.multiply, o.divide = function(e, t, n) {
                        return e[0] = t[0] / n[0], e[1] = t[1] / n[1], e[2] = t[2] / n[2], e
                    }, o.div = o.divide, o.min = function(e, t, n) {
                        return e[0] = Math.min(t[0], n[0]), e[1] = Math.min(t[1], n[1]), e[2] = Math.min(t[2], n[2]), e
                    }, o.max = function(e, t, n) {
                        return e[0] = Math.max(t[0], n[0]), e[1] = Math.max(t[1], n[1]), e[2] = Math.max(t[2], n[2]), e
                    }, o.scale = function(e, t, n) {
                        return e[0] = t[0] * n, e[1] = t[1] * n, e[2] = t[2] * n, e
                    }, o.scaleAndAdd = function(e, t, n, r) {
                        return e[0] = t[0] + n[0] * r, e[1] = t[1] + n[1] * r, e[2] = t[2] + n[2] * r, e
                    }, o.distance = function(e, t) {
                        var n = t[0] - e[0],
                            r = t[1] - e[1],
                            i = t[2] - e[2];
                        return Math.sqrt(n * n + r * r + i * i)
                    }, o.dist = o.distance, o.squaredDistance = function(e, t) {
                        var n = t[0] - e[0],
                            r = t[1] - e[1],
                            i = t[2] - e[2];
                        return n * n + r * r + i * i
                    }, o.sqrDist = o.squaredDistance, o.length = function(e) {
                        var t = e[0],
                            n = e[1],
                            r = e[2];
                        return Math.sqrt(t * t + n * n + r * r)
                    }, o.len = o.length, o.squaredLength = function(e) {
                        var t = e[0],
                            n = e[1],
                            r = e[2];
                        return t * t + n * n + r * r
                    }, o.sqrLen = o.squaredLength, o.negate = function(e, t) {
                        return e[0] = -t[0], e[1] = -t[1], e[2] = -t[2], e
                    }, o.normalize = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2],
                            s = n * n + r * r + i * i;
                        return s > 0 && (s = 1 / Math.sqrt(s), e[0] = t[0] * s, e[1] = t[1] * s, e[2] = t[2] * s), e
                    }, o.dot = function(e, t) {
                        return e[0] * t[0] + e[1] * t[1] + e[2] * t[2]
                    }, o.cross = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = n[0],
                            u = n[1],
                            a = n[2];
                        return e[0] = i * a - s * u, e[1] = s * o - r * a, e[2] = r * u - i * o, e
                    }, o.lerp = function(e, t, n, r) {
                        var i = t[0],
                            s = t[1],
                            o = t[2];
                        return e[0] = i + r * (n[0] - i), e[1] = s + r * (n[1] - s), e[2] = o + r * (n[2] - o), e
                    }, o.random = function(e, t) {
                        t = t || 1;
                        var n = 2 * r() * Math.PI,
                            i = 2 * r() - 1,
                            s = Math.sqrt(1 - i * i) * t;
                        return e[0] = Math.cos(n) * s, e[1] = Math.sin(n) * s, e[2] = i * t, e
                    }, o.transformMat4 = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2];
                        return e[0] = n[0] * r + n[4] * i + n[8] * s + n[12], e[1] = n[1] * r + n[5] * i + n[9] * s + n[13], e[2] = n[2] * r + n[6] * i + n[10] * s + n[14], e
                    }, o.transformMat3 = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2];
                        return e[0] = r * n[0] + i * n[3] + s * n[6], e[1] = r * n[1] + i * n[4] + s * n[7], e[2] = r * n[2] + i * n[5] + s * n[8], e
                    }, o.transformQuat = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = n[0],
                            u = n[1],
                            a = n[2],
                            f = n[3],
                            l = f * r + u * s - a * i,
                            c = f * i + a * r - o * s,
                            h = f * s + o * i - u * r,
                            p = -o * r - u * i - a * s;
                        return e[0] = l * f + p * -o + c * -a - h * -u, e[1] = c * f + p * -u + h * -o - l * -a, e[2] = h * f + p * -a + l * -u - c * -o, e
                    }, o.forEach = function() {
                        var e = o.create();
                        return function(t, n, r, i, s, o) {
                            var u, a;
                            for (n || (n = 3), r || (r = 0), a = i ? Math.min(i * n + r, t.length) : t.length, u = r; a > u; u += n) e[0] = t[u], e[1] = t[u + 1], e[2] = t[u + 2], s(e, e, o), t[u] = e[0], t[u + 1] = e[1], t[u + 2] = e[2];
                            return t
                        }
                    }(), o.str = function(e) {
                        return "vec3(" + e[0] + ", " + e[1] + ", " + e[2] + ")"
                    }, "undefined" != typeof e && (e.vec3 = o);
                    var u = {};
                    u.create = function() {
                        var e = new n(4);
                        return e[0] = 0, e[1] = 0, e[2] = 0, e[3] = 0, e
                    }, u.clone = function(e) {
                        var t = new n(4);
                        return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t
                    }, u.fromValues = function(e, t, r, i) {
                        var s = new n(4);
                        return s[0] = e, s[1] = t, s[2] = r, s[3] = i, s
                    }, u.copy = function(e, t) {
                        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e
                    }, u.set = function(e, t, n, r, i) {
                        return e[0] = t, e[1] = n, e[2] = r, e[3] = i, e
                    }, u.add = function(e, t, n) {
                        return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e[2] = t[2] + n[2], e[3] = t[3] + n[3], e
                    }, u.subtract = function(e, t, n) {
                        return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e[2] = t[2] - n[2], e[3] = t[3] - n[3], e
                    }, u.sub = u.subtract, u.multiply = function(e, t, n) {
                        return e[0] = t[0] * n[0], e[1] = t[1] * n[1], e[2] = t[2] * n[2], e[3] = t[3] * n[3], e
                    }, u.mul = u.multiply, u.divide = function(e, t, n) {
                        return e[0] = t[0] / n[0], e[1] = t[1] / n[1], e[2] = t[2] / n[2], e[3] = t[3] / n[3], e
                    }, u.div = u.divide, u.min = function(e, t, n) {
                        return e[0] = Math.min(t[0], n[0]), e[1] = Math.min(t[1], n[1]), e[2] = Math.min(t[2], n[2]), e[3] = Math.min(t[3], n[3]), e
                    }, u.max = function(e, t, n) {
                        return e[0] = Math.max(t[0], n[0]), e[1] = Math.max(t[1], n[1]), e[2] = Math.max(t[2], n[2]), e[3] = Math.max(t[3], n[3]), e
                    }, u.scale = function(e, t, n) {
                        return e[0] = t[0] * n, e[1] = t[1] * n, e[2] = t[2] * n, e[3] = t[3] * n, e
                    }, u.scaleAndAdd = function(e, t, n, r) {
                        return e[0] = t[0] + n[0] * r, e[1] = t[1] + n[1] * r, e[2] = t[2] + n[2] * r, e[3] = t[3] + n[3] * r, e
                    }, u.distance = function(e, t) {
                        var n = t[0] - e[0],
                            r = t[1] - e[1],
                            i = t[2] - e[2],
                            s = t[3] - e[3];
                        return Math.sqrt(n * n + r * r + i * i + s * s)
                    }, u.dist = u.distance, u.squaredDistance = function(e, t) {
                        var n = t[0] - e[0],
                            r = t[1] - e[1],
                            i = t[2] - e[2],
                            s = t[3] - e[3];
                        return n * n + r * r + i * i + s * s
                    }, u.sqrDist = u.squaredDistance, u.length = function(e) {
                        var t = e[0],
                            n = e[1],
                            r = e[2],
                            i = e[3];
                        return Math.sqrt(t * t + n * n + r * r + i * i)
                    }, u.len = u.length, u.squaredLength = function(e) {
                        var t = e[0],
                            n = e[1],
                            r = e[2],
                            i = e[3];
                        return t * t + n * n + r * r + i * i
                    }, u.sqrLen = u.squaredLength, u.negate = function(e, t) {
                        return e[0] = -t[0], e[1] = -t[1], e[2] = -t[2], e[3] = -t[3], e
                    }, u.normalize = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2],
                            s = t[3],
                            o = n * n + r * r + i * i + s * s;
                        return o > 0 && (o = 1 / Math.sqrt(o), e[0] = t[0] * o, e[1] = t[1] * o, e[2] = t[2] * o, e[3] = t[3] * o), e
                    }, u.dot = function(e, t) {
                        return e[0] * t[0] + e[1] * t[1] + e[2] * t[2] + e[3] * t[3]
                    }, u.lerp = function(e, t, n, r) {
                        var i = t[0],
                            s = t[1],
                            o = t[2],
                            u = t[3];
                        return e[0] = i + r * (n[0] - i), e[1] = s + r * (n[1] - s), e[2] = o + r * (n[2] - o), e[3] = u + r * (n[3] - u), e
                    }, u.random = function(e, t) {
                        return t = t || 1, e[0] = r(), e[1] = r(), e[2] = r(), e[3] = r(), u.normalize(e, e), u.scale(e, e, t), e
                    }, u.transformMat4 = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3];
                        return e[0] = n[0] * r + n[4] * i + n[8] * s + n[12] * o, e[1] = n[1] * r + n[5] * i + n[9] * s + n[13] * o, e[2] = n[2] * r + n[6] * i + n[10] * s + n[14] * o, e[3] = n[3] * r + n[7] * i + n[11] * s + n[15] * o, e
                    }, u.transformQuat = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = n[0],
                            u = n[1],
                            a = n[2],
                            f = n[3],
                            l = f * r + u * s - a * i,
                            c = f * i + a * r - o * s,
                            h = f * s + o * i - u * r,
                            p = -o * r - u * i - a * s;
                        return e[0] = l * f + p * -o + c * -a - h * -u, e[1] = c * f + p * -u + h * -o - l * -a, e[2] = h * f + p * -a + l * -u - c * -o, e
                    }, u.forEach = function() {
                        var e = u.create();
                        return function(t, n, r, i, s, o) {
                            var u, a;
                            for (n || (n = 4), r || (r = 0), a = i ? Math.min(i * n + r, t.length) : t.length, u = r; a > u; u += n) e[0] = t[u], e[1] = t[u + 1], e[2] = t[u + 2], e[3] = t[u + 3], s(e, e, o), t[u] = e[0], t[u + 1] = e[1], t[u + 2] = e[2], t[u + 3] = e[3];
                            return t
                        }
                    }(), u.str = function(e) {
                        return "vec4(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ")"
                    }, "undefined" != typeof e && (e.vec4 = u);
                    var a = {};
                    a.create = function() {
                        var e = new n(4);
                        return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 1, e
                    }, a.clone = function(e) {
                        var t = new n(4);
                        return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t
                    }, a.copy = function(e, t) {
                        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e
                    }, a.identity = function(e) {
                        return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 1, e
                    }, a.transpose = function(e, t) {
                        if (e === t) {
                            var n = t[1];
                            e[1] = t[2], e[2] = n
                        } else e[0] = t[0], e[1] = t[2], e[2] = t[1], e[3] = t[3];
                        return e
                    }, a.invert = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2],
                            s = t[3],
                            o = n * s - i * r;
                        return o ? (o = 1 / o, e[0] = s * o, e[1] = -r * o, e[2] = -i * o, e[3] = n * o, e) : null
                    }, a.adjoint = function(e, t) {
                        var n = t[0];
                        return e[0] = t[3], e[1] = -t[1], e[2] = -t[2], e[3] = n, e
                    }, a.determinant = function(e) {
                        return e[0] * e[3] - e[2] * e[1]
                    }, a.multiply = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = n[0],
                            a = n[1],
                            f = n[2],
                            l = n[3];
                        return e[0] = r * u + i * f, e[1] = r * a + i * l, e[2] = s * u + o * f, e[3] = s * a + o * l, e
                    }, a.mul = a.multiply, a.rotate = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = Math.sin(n),
                            a = Math.cos(n);
                        return e[0] = r * a + i * u, e[1] = r * -u + i * a, e[2] = s * a + o * u, e[3] = s * -u + o * a, e
                    }, a.scale = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = n[0],
                            a = n[1];
                        return e[0] = r * u, e[1] = i * a, e[2] = s * u, e[3] = o * a, e
                    }, a.str = function(e) {
                        return "mat2(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ")"
                    }, "undefined" != typeof e && (e.mat2 = a);
                    var f = {};
                    f.create = function() {
                        var e = new n(6);
                        return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 1, e[4] = 0, e[5] = 0, e
                    }, f.clone = function(e) {
                        var t = new n(6);
                        return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t[4] = e[4], t[5] = e[5], t
                    }, f.copy = function(e, t) {
                        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[4] = t[4], e[5] = t[5], e
                    }, f.identity = function(e) {
                        return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 1, e[4] = 0, e[5] = 0, e
                    }, f.invert = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2],
                            s = t[3],
                            o = t[4],
                            u = t[5],
                            a = n * s - r * i;
                        return a ? (a = 1 / a, e[0] = s * a, e[1] = -r * a, e[2] = -i * a, e[3] = n * a, e[4] = (i * u - s * o) * a, e[5] = (r * o - n * u) * a, e) : null
                    }, f.determinant = function(e) {
                        return e[0] * e[3] - e[1] * e[2]
                    }, f.multiply = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = t[4],
                            a = t[5],
                            f = n[0],
                            l = n[1],
                            c = n[2],
                            h = n[3],
                            p = n[4],
                            d = n[5];
                        return e[0] = r * f + i * c, e[1] = r * l + i * h, e[2] = s * f + o * c, e[3] = s * l + o * h, e[4] = f * u + c * a + p, e[5] = l * u + h * a + d, e
                    }, f.mul = f.multiply, f.rotate = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = t[4],
                            a = t[5],
                            f = Math.sin(n),
                            l = Math.cos(n);
                        return e[0] = r * l + i * f, e[1] = -r * f + i * l, e[2] = s * l + o * f, e[3] = -s * f + l * o, e[4] = l * u + f * a, e[5] = l * a - f * u, e
                    }, f.scale = function(e, t, n) {
                        var r = n[0],
                            i = n[1];
                        return e[0] = t[0] * r, e[1] = t[1] * i, e[2] = t[2] * r, e[3] = t[3] * i, e[4] = t[4] * r, e[5] = t[5] * i, e
                    }, f.translate = function(e, t, n) {
                        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[4] = t[4] + n[0], e[5] = t[5] + n[1], e
                    }, f.str = function(e) {
                        return "mat2d(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ", " + e[4] + ", " + e[5] + ")"
                    }, "undefined" != typeof e && (e.mat2d = f);
                    var l = {};
                    l.create = function() {
                        var e = new n(9);
                        return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 1, e[5] = 0, e[6] = 0, e[7] = 0, e[8] = 1, e
                    }, l.fromMat4 = function(e, t) {
                        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[4], e[4] = t[5], e[5] = t[6], e[6] = t[8], e[7] = t[9], e[8] = t[10], e
                    }, l.clone = function(e) {
                        var t = new n(9);
                        return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t[4] = e[4], t[5] = e[5], t[6] = e[6], t[7] = e[7], t[8] = e[8], t
                    }, l.copy = function(e, t) {
                        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[4] = t[4], e[5] = t[5], e[6] = t[6], e[7] = t[7], e[8] = t[8], e
                    }, l.identity = function(e) {
                        return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 1, e[5] = 0, e[6] = 0, e[7] = 0, e[8] = 1, e
                    }, l.transpose = function(e, t) {
                        if (e === t) {
                            var n = t[1],
                                r = t[2],
                                i = t[5];
                            e[1] = t[3], e[2] = t[6], e[3] = n, e[5] = t[7], e[6] = r, e[7] = i
                        } else e[0] = t[0], e[1] = t[3], e[2] = t[6], e[3] = t[1], e[4] = t[4], e[5] = t[7], e[6] = t[2], e[7] = t[5], e[8] = t[8];
                        return e
                    }, l.invert = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2],
                            s = t[3],
                            o = t[4],
                            u = t[5],
                            a = t[6],
                            f = t[7],
                            l = t[8],
                            c = l * o - u * f,
                            h = -l * s + u * a,
                            p = f * s - o * a,
                            d = n * c + r * h + i * p;
                        return d ? (d = 1 / d, e[0] = c * d, e[1] = (-l * r + i * f) * d, e[2] = (u * r - i * o) * d, e[3] = h * d, e[4] = (l * n - i * a) * d, e[5] = (-u * n + i * s) * d, e[6] = p * d, e[7] = (-f * n + r * a) * d, e[8] = (o * n - r * s) * d, e) : null
                    }, l.adjoint = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2],
                            s = t[3],
                            o = t[4],
                            u = t[5],
                            a = t[6],
                            f = t[7],
                            l = t[8];
                        return e[0] = o * l - u * f, e[1] = i * f - r * l, e[2] = r * u - i * o, e[3] = u * a - s * l, e[4] = n * l - i * a, e[5] = i * s - n * u, e[6] = s * f - o * a, e[7] = r * a - n * f, e[8] = n * o - r * s, e
                    }, l.determinant = function(e) {
                        var t = e[0],
                            n = e[1],
                            r = e[2],
                            i = e[3],
                            s = e[4],
                            o = e[5],
                            u = e[6],
                            a = e[7],
                            f = e[8];
                        return t * (f * s - o * a) + n * (-f * i + o * u) + r * (a * i - s * u)
                    }, l.multiply = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = t[4],
                            a = t[5],
                            f = t[6],
                            l = t[7],
                            c = t[8],
                            h = n[0],
                            p = n[1],
                            d = n[2],
                            v = n[3],
                            m = n[4],
                            g = n[5],
                            y = n[6],
                            b = n[7],
                            w = n[8];
                        return e[0] = h * r + p * o + d * f, e[1] = h * i + p * u + d * l, e[2] = h * s + p * a + d * c, e[3] = v * r + m * o + g * f, e[4] = v * i + m * u + g * l, e[5] = v * s + m * a + g * c, e[6] = y * r + b * o + w * f, e[7] = y * i + b * u + w * l, e[8] = y * s + b * a + w * c, e
                    }, l.mul = l.multiply, l.translate = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = t[4],
                            a = t[5],
                            f = t[6],
                            l = t[7],
                            c = t[8],
                            h = n[0],
                            p = n[1];
                        return e[0] = r, e[1] = i, e[2] = s, e[3] = o, e[4] = u, e[5] = a, e[6] = h * r + p * o + f, e[7] = h * i + p * u + l, e[8] = h * s + p * a + c, e
                    }, l.rotate = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = t[4],
                            a = t[5],
                            f = t[6],
                            l = t[7],
                            c = t[8],
                            h = Math.sin(n),
                            p = Math.cos(n);
                        return e[0] = p * r + h * o, e[1] = p * i + h * u, e[2] = p * s + h * a, e[3] = p * o - h * r, e[4] = p * u - h * i, e[5] = p * a - h * s, e[6] = f, e[7] = l, e[8] = c, e
                    }, l.scale = function(e, t, n) {
                        var r = n[0],
                            i = n[1];
                        return e[0] = r * t[0], e[1] = r * t[1], e[2] = r * t[2], e[3] = i * t[3], e[4] = i * t[4], e[5] = i * t[5], e[6] = t[6], e[7] = t[7], e[8] = t[8], e
                    }, l.fromMat2d = function(e, t) {
                        return e[0] = t[0], e[1] = t[1], e[2] = 0, e[3] = t[2], e[4] = t[3], e[5] = 0, e[6] = t[4], e[7] = t[5], e[8] = 1, e
                    }, l.fromQuat = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2],
                            s = t[3],
                            o = n + n,
                            u = r + r,
                            a = i + i,
                            f = n * o,
                            l = n * u,
                            c = n * a,
                            h = r * u,
                            p = r * a,
                            d = i * a,
                            v = s * o,
                            m = s * u,
                            g = s * a;
                        return e[0] = 1 - (h + d), e[3] = l + g, e[6] = c - m, e[1] = l - g, e[4] = 1 - (f + d), e[7] = p + v, e[2] = c + m, e[5] = p - v, e[8] = 1 - (f + h), e
                    }, l.normalFromMat4 = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2],
                            s = t[3],
                            o = t[4],
                            u = t[5],
                            a = t[6],
                            f = t[7],
                            l = t[8],
                            c = t[9],
                            h = t[10],
                            p = t[11],
                            d = t[12],
                            v = t[13],
                            m = t[14],
                            g = t[15],
                            y = n * u - r * o,
                            b = n * a - i * o,
                            w = n * f - s * o,
                            E = r * a - i * u,
                            S = r * f - s * u,
                            x = i * f - s * a,
                            T = l * v - c * d,
                            N = l * m - h * d,
                            C = l * g - p * d,
                            k = c * m - h * v,
                            L = c * g - p * v,
                            A = h * g - p * m,
                            O = y * A - b * L + w * k + E * C - S * N + x * T;
                        return O ? (O = 1 / O, e[0] = (u * A - a * L + f * k) * O, e[1] = (a * C - o * A - f * N) * O, e[2] = (o * L - u * C + f * T) * O, e[3] = (i * L - r * A - s * k) * O, e[4] = (n * A - i * C + s * N) * O, e[5] = (r * C - n * L - s * T) * O, e[6] = (v * x - m * S + g * E) * O, e[7] = (m * w - d * x - g * b) * O, e[8] = (d * S - v * w + g * y) * O, e) : null
                    }, l.str = function(e) {
                        return "mat3(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ", " + e[4] + ", " + e[5] + ", " + e[6] + ", " + e[7] + ", " + e[8] + ")"
                    }, "undefined" != typeof e && (e.mat3 = l);
                    var c = {};
                    c.create = function() {
                        var e = new n(16);
                        return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 1, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, e
                    }, c.clone = function(e) {
                        var t = new n(16);
                        return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t[4] = e[4], t[5] = e[5], t[6] = e[6], t[7] = e[7], t[8] = e[8], t[9] = e[9], t[10] = e[10], t[11] = e[11], t[12] = e[12], t[13] = e[13], t[14] = e[14], t[15] = e[15], t
                    }, c.copy = function(e, t) {
                        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[4] = t[4], e[5] = t[5], e[6] = t[6], e[7] = t[7], e[8] = t[8], e[9] = t[9], e[10] = t[10], e[11] = t[11], e[12] = t[12], e[13] = t[13], e[14] = t[14], e[15] = t[15], e
                    }, c.identity = function(e) {
                        return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 1, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, e
                    }, c.transpose = function(e, t) {
                        if (e === t) {
                            var n = t[1],
                                r = t[2],
                                i = t[3],
                                s = t[6],
                                o = t[7],
                                u = t[11];
                            e[1] = t[4], e[2] = t[8], e[3] = t[12], e[4] = n, e[6] = t[9], e[7] = t[13], e[8] = r, e[9] = s, e[11] = t[14], e[12] = i, e[13] = o, e[14] = u
                        } else e[0] = t[0], e[1] = t[4], e[2] = t[8], e[3] = t[12], e[4] = t[1], e[5] = t[5], e[6] = t[9], e[7] = t[13], e[8] = t[2], e[9] = t[6], e[10] = t[10], e[11] = t[14], e[12] = t[3], e[13] = t[7], e[14] = t[11], e[15] = t[15];
                        return e
                    }, c.invert = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2],
                            s = t[3],
                            o = t[4],
                            u = t[5],
                            a = t[6],
                            f = t[7],
                            l = t[8],
                            c = t[9],
                            h = t[10],
                            p = t[11],
                            d = t[12],
                            v = t[13],
                            m = t[14],
                            g = t[15],
                            y = n * u - r * o,
                            b = n * a - i * o,
                            w = n * f - s * o,
                            E = r * a - i * u,
                            S = r * f - s * u,
                            x = i * f - s * a,
                            T = l * v - c * d,
                            N = l * m - h * d,
                            C = l * g - p * d,
                            k = c * m - h * v,
                            L = c * g - p * v,
                            A = h * g - p * m,
                            O = y * A - b * L + w * k + E * C - S * N + x * T;
                        return O ? (O = 1 / O, e[0] = (u * A - a * L + f * k) * O, e[1] = (i * L - r * A - s * k) * O, e[2] = (v * x - m * S + g * E) * O, e[3] = (h * S - c * x - p * E) * O, e[4] = (a * C - o * A - f * N) * O, e[5] = (n * A - i * C + s * N) * O, e[6] = (m * w - d * x - g * b) * O, e[7] = (l * x - h * w + p * b) * O, e[8] = (o * L - u * C + f * T) * O, e[9] = (r * C - n * L - s * T) * O, e[10] = (d * S - v * w + g * y) * O, e[11] = (c * w - l * S - p * y) * O, e[12] = (u * N - o * k - a * T) * O, e[13] = (n * k - r * N + i * T) * O, e[14] = (v * b - d * E - m * y) * O, e[15] = (l * E - c * b + h * y) * O, e) : null
                    }, c.adjoint = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2],
                            s = t[3],
                            o = t[4],
                            u = t[5],
                            a = t[6],
                            f = t[7],
                            l = t[8],
                            c = t[9],
                            h = t[10],
                            p = t[11],
                            d = t[12],
                            v = t[13],
                            m = t[14],
                            g = t[15];
                        return e[0] = u * (h * g - p * m) - c * (a * g - f * m) + v * (a * p - f * h), e[1] = -(r * (h * g - p * m) - c * (i * g - s * m) + v * (i * p - s * h)), e[2] = r * (a * g - f * m) - u * (i * g - s * m) + v * (i * f - s * a), e[3] = -(r * (a * p - f * h) - u * (i * p - s * h) + c * (i * f - s * a)), e[4] = -(o * (h * g - p * m) - l * (a * g - f * m) + d * (a * p - f * h)), e[5] = n * (h * g - p * m) - l * (i * g - s * m) + d * (i * p - s * h), e[6] = -(n * (a * g - f * m) - o * (i * g - s * m) + d * (i * f - s * a)), e[7] = n * (a * p - f * h) - o * (i * p - s * h) + l * (i * f - s * a), e[8] = o * (c * g - p * v) - l * (u * g - f * v) + d * (u * p - f * c), e[9] = -(n * (c * g - p * v) - l * (r * g - s * v) + d * (r * p - s * c)), e[10] = n * (u * g - f * v) - o * (r * g - s * v) + d * (r * f - s * u), e[11] = -(n * (u * p - f * c) - o * (r * p - s * c) + l * (r * f - s * u)), e[12] = -(o * (c * m - h * v) - l * (u * m - a * v) + d * (u * h - a * c)), e[13] = n * (c * m - h * v) - l * (r * m - i * v) + d * (r * h - i * c), e[14] = -(n * (u * m - a * v) - o * (r * m - i * v) + d * (r * a - i * u)), e[15] = n * (u * h - a * c) - o * (r * h - i * c) + l * (r * a - i * u), e
                    }, c.determinant = function(e) {
                        var t = e[0],
                            n = e[1],
                            r = e[2],
                            i = e[3],
                            s = e[4],
                            o = e[5],
                            u = e[6],
                            a = e[7],
                            f = e[8],
                            l = e[9],
                            c = e[10],
                            h = e[11],
                            p = e[12],
                            d = e[13],
                            v = e[14],
                            m = e[15],
                            g = t * o - n * s,
                            y = t * u - r * s,
                            b = t * a - i * s,
                            w = n * u - r * o,
                            E = n * a - i * o,
                            S = r * a - i * u,
                            x = f * d - l * p,
                            T = f * v - c * p,
                            N = f * m - h * p,
                            C = l * v - c * d,
                            k = l * m - h * d,
                            L = c * m - h * v;
                        return g * L - y * k + b * C + w * N - E * T + S * x
                    }, c.multiply = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = t[4],
                            a = t[5],
                            f = t[6],
                            l = t[7],
                            c = t[8],
                            h = t[9],
                            p = t[10],
                            d = t[11],
                            v = t[12],
                            m = t[13],
                            g = t[14],
                            y = t[15],
                            b = n[0],
                            w = n[1],
                            E = n[2],
                            S = n[3];
                        return e[0] = b * r + w * u + E * c + S * v, e[1] = b * i + w * a + E * h + S * m, e[2] = b * s + w * f + E * p + S * g, e[3] = b * o + w * l + E * d + S * y, b = n[4], w = n[5], E = n[6], S = n[7], e[4] = b * r + w * u + E * c + S * v, e[5] = b * i + w * a + E * h + S * m, e[6] = b * s + w * f + E * p + S * g, e[7] = b * o + w * l + E * d + S * y, b = n[8], w = n[9], E = n[10], S = n[11], e[8] = b * r + w * u + E * c + S * v, e[9] = b * i + w * a + E * h + S * m, e[10] = b * s + w * f + E * p + S * g, e[11] = b * o + w * l + E * d + S * y, b = n[12], w = n[13], E = n[14], S = n[15], e[12] = b * r + w * u + E * c + S * v, e[13] = b * i + w * a + E * h + S * m, e[14] = b * s + w * f + E * p + S * g, e[15] = b * o + w * l + E * d + S * y, e
                    }, c.mul = c.multiply, c.translate = function(e, t, n) {
                        var o, u, a, f, l, c, h, p, d, v, m, g, r = n[0],
                            i = n[1],
                            s = n[2];
                        return t === e ? (e[12] = t[0] * r + t[4] * i + t[8] * s + t[12], e[13] = t[1] * r + t[5] * i + t[9] * s + t[13], e[14] = t[2] * r + t[6] * i + t[10] * s + t[14], e[15] = t[3] * r + t[7] * i + t[11] * s + t[15]) : (o = t[0], u = t[1], a = t[2], f = t[3], l = t[4], c = t[5], h = t[6], p = t[7], d = t[8], v = t[9], m = t[10], g = t[11], e[0] = o, e[1] = u, e[2] = a, e[3] = f, e[4] = l, e[5] = c, e[6] = h, e[7] = p, e[8] = d, e[9] = v, e[10] = m, e[11] = g, e[12] = o * r + l * i + d * s + t[12], e[13] = u * r + c * i + v * s + t[13], e[14] = a * r + h * i + m * s + t[14], e[15] = f * r + p * i + g * s + t[15]), e
                    }, c.scale = function(e, t, n) {
                        var r = n[0],
                            i = n[1],
                            s = n[2];
                        return e[0] = t[0] * r, e[1] = t[1] * r, e[2] = t[2] * r, e[3] = t[3] * r, e[4] = t[4] * i, e[5] = t[5] * i, e[6] = t[6] * i, e[7] = t[7] * i, e[8] = t[8] * s, e[9] = t[9] * s, e[10] = t[10] * s, e[11] = t[11] * s, e[12] = t[12], e[13] = t[13], e[14] = t[14], e[15] = t[15], e
                    }, c.rotate = function(e, n, r, i) {
                        var f, l, c, h, p, d, v, m, g, y, b, w, E, S, x, T, N, C, k, L, A, O, M, _, s = i[0],
                            o = i[1],
                            u = i[2],
                            a = Math.sqrt(s * s + o * o + u * u);
                        return Math.abs(a) < t ? null : (a = 1 / a, s *= a, o *= a, u *= a, f = Math.sin(r), l = Math.cos(r), c = 1 - l, h = n[0], p = n[1], d = n[2], v = n[3], m = n[4], g = n[5], y = n[6], b = n[7], w = n[8], E = n[9], S = n[10], x = n[11], T = s * s * c + l, N = o * s * c + u * f, C = u * s * c - o * f, k = s * o * c - u * f, L = o * o * c + l, A = u * o * c + s * f, O = s * u * c + o * f, M = o * u * c - s * f, _ = u * u * c + l, e[0] = h * T + m * N + w * C, e[1] = p * T + g * N + E * C, e[2] = d * T + y * N + S * C, e[3] = v * T + b * N + x * C, e[4] = h * k + m * L + w * A, e[5] = p * k + g * L + E * A, e[6] = d * k + y * L + S * A, e[7] = v * k + b * L + x * A, e[8] = h * O + m * M + w * _, e[9] = p * O + g * M + E * _, e[10] = d * O + y * M + S * _, e[11] = v * O + b * M + x * _, n !== e && (e[12] = n[12], e[13] = n[13], e[14] = n[14], e[15] = n[15]), e)
                    }, c.rotateX = function(e, t, n) {
                        var r = Math.sin(n),
                            i = Math.cos(n),
                            s = t[4],
                            o = t[5],
                            u = t[6],
                            a = t[7],
                            f = t[8],
                            l = t[9],
                            c = t[10],
                            h = t[11];
                        return t !== e && (e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[12] = t[12], e[13] = t[13], e[14] = t[14], e[15] = t[15]), e[4] = s * i + f * r, e[5] = o * i + l * r, e[6] = u * i + c * r, e[7] = a * i + h * r, e[8] = f * i - s * r, e[9] = l * i - o * r, e[10] = c * i - u * r, e[11] = h * i - a * r, e
                    }, c.rotateY = function(e, t, n) {
                        var r = Math.sin(n),
                            i = Math.cos(n),
                            s = t[0],
                            o = t[1],
                            u = t[2],
                            a = t[3],
                            f = t[8],
                            l = t[9],
                            c = t[10],
                            h = t[11];
                        return t !== e && (e[4] = t[4], e[5] = t[5], e[6] = t[6], e[7] = t[7], e[12] = t[12], e[13] = t[13], e[14] = t[14], e[15] = t[15]), e[0] = s * i - f * r, e[1] = o * i - l * r, e[2] = u * i - c * r, e[3] = a * i - h * r, e[8] = s * r + f * i, e[9] = o * r + l * i, e[10] = u * r + c * i, e[11] = a * r + h * i, e
                    }, c.rotateZ = function(e, t, n) {
                        var r = Math.sin(n),
                            i = Math.cos(n),
                            s = t[0],
                            o = t[1],
                            u = t[2],
                            a = t[3],
                            f = t[4],
                            l = t[5],
                            c = t[6],
                            h = t[7];
                        return t !== e && (e[8] = t[8], e[9] = t[9], e[10] = t[10], e[11] = t[11], e[12] = t[12], e[13] = t[13], e[14] = t[14], e[15] = t[15]), e[0] = s * i + f * r, e[1] = o * i + l * r, e[2] = u * i + c * r, e[3] = a * i + h * r, e[4] = f * i - s * r, e[5] = l * i - o * r, e[6] = c * i - u * r, e[7] = h * i - a * r, e
                    }, c.fromRotationTranslation = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = r + r,
                            a = i + i,
                            f = s + s,
                            l = r * u,
                            c = r * a,
                            h = r * f,
                            p = i * a,
                            d = i * f,
                            v = s * f,
                            m = o * u,
                            g = o * a,
                            y = o * f;
                        return e[0] = 1 - (p + v), e[1] = c + y, e[2] = h - g, e[3] = 0, e[4] = c - y, e[5] = 1 - (l + v), e[6] = d + m, e[7] = 0, e[8] = h + g, e[9] = d - m, e[10] = 1 - (l + p), e[11] = 0, e[12] = n[0], e[13] = n[1], e[14] = n[2], e[15] = 1, e
                    }, c.fromQuat = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2],
                            s = t[3],
                            o = n + n,
                            u = r + r,
                            a = i + i,
                            f = n * o,
                            l = n * u,
                            c = n * a,
                            h = r * u,
                            p = r * a,
                            d = i * a,
                            v = s * o,
                            m = s * u,
                            g = s * a;
                        return e[0] = 1 - (h + d), e[1] = l + g, e[2] = c - m, e[3] = 0, e[4] = l - g, e[5] = 1 - (f + d), e[6] = p + v, e[7] = 0, e[8] = c + m, e[9] = p - v, e[10] = 1 - (f + h), e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, e
                    }, c.frustum = function(e, t, n, r, i, s, o) {
                        var u = 1 / (n - t),
                            a = 1 / (i - r),
                            f = 1 / (s - o);
                        return e[0] = 2 * s * u, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 2 * s * a, e[6] = 0, e[7] = 0, e[8] = (n + t) * u, e[9] = (i + r) * a, e[10] = (o + s) * f, e[11] = -1, e[12] = 0, e[13] = 0, e[14] = o * s * 2 * f, e[15] = 0, e
                    }, c.perspective = function(e, t, n, r, i) {
                        var s = 1 / Math.tan(t / 2),
                            o = 1 / (r - i);
                        return e[0] = s / n, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = s, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = (i + r) * o, e[11] = -1, e[12] = 0, e[13] = 0, e[14] = 2 * i * r * o, e[15] = 0, e
                    }, c.ortho = function(e, t, n, r, i, s, o) {
                        var u = 1 / (t - n),
                            a = 1 / (r - i),
                            f = 1 / (s - o);
                        return e[0] = -2 * u, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = -2 * a, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 2 * f, e[11] = 0, e[12] = (t + n) * u, e[13] = (i + r) * a, e[14] = (o + s) * f, e[15] = 1, e
                    }, c.lookAt = function(e, n, r, i) {
                        var s, o, u, a, f, l, h, p, d, v, m = n[0],
                            g = n[1],
                            y = n[2],
                            b = i[0],
                            w = i[1],
                            E = i[2],
                            S = r[0],
                            x = r[1],
                            T = r[2];
                        return Math.abs(m - S) < t && Math.abs(g - x) < t && Math.abs(y - T) < t ? c.identity(e) : (h = m - S, p = g - x, d = y - T, v = 1 / Math.sqrt(h * h + p * p + d * d), h *= v, p *= v, d *= v, s = w * d - E * p, o = E * h - b * d, u = b * p - w * h, v = Math.sqrt(s * s + o * o + u * u), v ? (v = 1 / v, s *= v, o *= v, u *= v) : (s = 0, o = 0, u = 0), a = p * u - d * o, f = d * s - h * u, l = h * o - p * s, v = Math.sqrt(a * a + f * f + l * l), v ? (v = 1 / v, a *= v, f *= v, l *= v) : (a = 0, f = 0, l = 0), e[0] = s, e[1] = a, e[2] = h, e[3] = 0, e[4] = o, e[5] = f, e[6] = p, e[7] = 0, e[8] = u, e[9] = l, e[10] = d, e[11] = 0, e[12] = -(s * m + o * g + u * y), e[13] = -(a * m + f * g + l * y), e[14] = -(h * m + p * g + d * y), e[15] = 1, e)
                    }, c.str = function(e) {
                        return "mat4(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ", " + e[4] + ", " + e[5] + ", " + e[6] + ", " + e[7] + ", " + e[8] + ", " + e[9] + ", " + e[10] + ", " + e[11] + ", " + e[12] + ", " + e[13] + ", " + e[14] + ", " + e[15] + ")"
                    }, "undefined" != typeof e && (e.mat4 = c);
                    var h = {};
                    h.create = function() {
                        var e = new n(4);
                        return e[0] = 0, e[1] = 0, e[2] = 0, e[3] = 1, e
                    }, h.rotationTo = function() {
                        var e = o.create(),
                            t = o.fromValues(1, 0, 0),
                            n = o.fromValues(0, 1, 0);
                        return function(r, i, s) {
                            var u = o.dot(i, s);
                            return -.999999 > u ? (o.cross(e, t, i), o.length(e) < 1e-6 && o.cross(e, n, i), o.normalize(e, e), h.setAxisAngle(r, e, Math.PI), r) : u > .999999 ? (r[0] = 0, r[1] = 0, r[2] = 0, r[3] = 1, r) : (o.cross(e, i, s), r[0] = e[0], r[1] = e[1], r[2] = e[2], r[3] = 1 + u, h.normalize(r, r))
                        }
                    }(), h.setAxes = function() {
                        var e = l.create();
                        return function(t, n, r, i) {
                            return e[0] = r[0], e[3] = r[1], e[6] = r[2], e[1] = i[0], e[4] = i[1], e[7] = i[2], e[2] = n[0], e[5] = n[1], e[8] = n[2], h.normalize(t, h.fromMat3(t, e))
                        }
                    }(), h.clone = u.clone, h.fromValues = u.fromValues, h.copy = u.copy, h.set = u.set, h.identity = function(e) {
                        return e[0] = 0, e[1] = 0, e[2] = 0, e[3] = 1, e
                    }, h.setAxisAngle = function(e, t, n) {
                        n *= .5;
                        var r = Math.sin(n);
                        return e[0] = r * t[0], e[1] = r * t[1], e[2] = r * t[2], e[3] = Math.cos(n), e
                    }, h.add = u.add, h.multiply = function(e, t, n) {
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = n[0],
                            a = n[1],
                            f = n[2],
                            l = n[3];
                        return e[0] = r * l + o * u + i * f - s * a, e[1] = i * l + o * a + s * u - r * f, e[2] = s * l + o * f + r * a - i * u, e[3] = o * l - r * u - i * a - s * f, e
                    }, h.mul = h.multiply, h.scale = u.scale, h.rotateX = function(e, t, n) {
                        n *= .5;
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = Math.sin(n),
                            a = Math.cos(n);
                        return e[0] = r * a + o * u, e[1] = i * a + s * u, e[2] = s * a - i * u, e[3] = o * a - r * u, e
                    }, h.rotateY = function(e, t, n) {
                        n *= .5;
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = Math.sin(n),
                            a = Math.cos(n);
                        return e[0] = r * a - s * u, e[1] = i * a + o * u, e[2] = s * a + r * u, e[3] = o * a - i * u, e
                    }, h.rotateZ = function(e, t, n) {
                        n *= .5;
                        var r = t[0],
                            i = t[1],
                            s = t[2],
                            o = t[3],
                            u = Math.sin(n),
                            a = Math.cos(n);
                        return e[0] = r * a + i * u, e[1] = i * a - r * u, e[2] = s * a + o * u, e[3] = o * a - s * u, e
                    }, h.calculateW = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2];
                        return e[0] = n, e[1] = r, e[2] = i, e[3] = -Math.sqrt(Math.abs(1 - n * n - r * r - i * i)), e
                    }, h.dot = u.dot, h.lerp = u.lerp, h.slerp = function(e, t, n, r) {
                        var h, p, d, v, m, i = t[0],
                            s = t[1],
                            o = t[2],
                            u = t[3],
                            a = n[0],
                            f = n[1],
                            l = n[2],
                            c = n[3];
                        return p = i * a + s * f + o * l + u * c, 0 > p && (p = -p, a = -a, f = -f, l = -l, c = -c), 1 - p > 1e-6 ? (h = Math.acos(p), d = Math.sin(h), v = Math.sin((1 - r) * h) / d, m = Math.sin(r * h) / d) : (v = 1 - r, m = r), e[0] = v * i + m * a, e[1] = v * s + m * f, e[2] = v * o + m * l, e[3] = v * u + m * c, e
                    }, h.invert = function(e, t) {
                        var n = t[0],
                            r = t[1],
                            i = t[2],
                            s = t[3],
                            o = n * n + r * r + i * i + s * s,
                            u = o ? 1 / o : 0;
                        return e[0] = -n * u, e[1] = -r * u, e[2] = -i * u, e[3] = s * u, e
                    }, h.conjugate = function(e, t) {
                        return e[0] = -t[0], e[1] = -t[1], e[2] = -t[2], e[3] = t[3], e
                    }, h.length = u.length, h.len = h.length, h.squaredLength = u.squaredLength, h.sqrLen = h.squaredLength, h.normalize = u.normalize, h.fromMat3 = function() {
                        var e = "undefined" != typeof Int8Array ? new Int8Array([1, 2, 0]) : [1, 2, 0];
                        return function(t, n) {
                            var i, r = n[0] + n[4] + n[8];
                            if (r > 0) i = Math.sqrt(r + 1), t[3] = .5 * i, i = .5 / i, t[0] = (n[7] - n[5]) * i, t[1] = (n[2] - n[6]) * i, t[2] = (n[3] - n[1]) * i;
                            else {
                                var s = 0;
                                n[4] > n[0] && (s = 1), n[8] > n[3 * s + s] && (s = 2);
                                var o = e[s],
                                    u = e[o];
                                i = Math.sqrt(n[3 * s + s] - n[3 * o + o] - n[3 * u + u] + 1), t[s] = .5 * i, i = .5 / i, t[3] = (n[3 * u + o] - n[3 * o + u]) * i, t[o] = (n[3 * o + s] + n[3 * s + o]) * i, t[u] = (n[3 * u + s] + n[3 * s + u]) * i
                            }
                            return t
                        }
                    }(), h.str = function(e) {
                        return "quat(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ")"
                    }, "undefined" != typeof e && (e.quat = h)
                }(t.exports)
            }(this)
        }, {}
    ],
    21: [
        function(require, module) {
            "use strict";
            if ("undefined" == typeof window) require("./worker/worker.js");
            else {
                var llmr = module.exports = window.llmr = {};
                llmr.Map = require("./ui/map.js"), llmr.Navigation = require("./ui/navigation.js"), llmr.Source = require("./ui/source.js"), llmr.GeoJSONSource = require("./ui/geojsonsource"), llmr.Style = require("./style/style.js"), llmr.StyleDeclaration = require("./style/styledeclaration.js"), llmr.LatLng = require("./geometry/latlng.js"), llmr.LatLngBounds = require("./geometry/latlngbounds.js"), llmr.Point = require("./geometry/point.js"), llmr.Tile = require("./ui/tile.js"), llmr.Evented = require("./util/evented.js"), llmr.util = require("./util/util.js")
            }
        }, {
            "./geometry/latlng.js": 14,
            "./geometry/latlngbounds.js": 15,
            "./geometry/point.js": 18,
            "./style/style.js": 34,
            "./style/styledeclaration.js": 35,
            "./ui/geojsonsource": 46,
            "./ui/map.js": 51,
            "./ui/navigation.js": 52,
            "./ui/source.js": 54,
            "./ui/tile.js": 55,
            "./util/evented.js": 61,
            "./util/util.js": 64,
            "./worker/worker.js": 66
        }
    ],
    22: [
        function(require, module) {
            "use strict";

            function drawComposited(gl, painter, buckets, layerStyle, params, style, layer) {
                var texture = painter.namedRenderTextures[layer.id];
                return texture ? (gl.disable(gl.STENCIL_TEST), gl.stencilMask(0), gl.switchShader(painter.compositeShader, painter.projectionMatrix), gl.activeTexture(gl.TEXTURE0), gl.bindTexture(gl.TEXTURE_2D, texture), gl.uniform1i(painter.compositeShader.u_image, 0), gl.uniform1f(painter.compositeShader.u_opacity, layerStyle.opacity), gl.bindBuffer(gl.ARRAY_BUFFER, painter.backgroundBuffer), gl.vertexAttribPointer(painter.compositeShader.a_pos, 2, gl.SHORT, !1, 0, 0), gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4), gl.enable(gl.STENCIL_TEST), void painter.freeRenderTexture(name)) : void 0
            }
            module.exports = drawComposited
        }, {}
    ],
    23: [
        function(require, module) {
            "use strict";

            function drawFill(gl, painter, bucket, layerStyle, posMatrix, params, imageSprite, background) {
                "object" != typeof layerStyle["fill-color"];
                var buffer, vertex, elements, begin, end, color = layerStyle["fill-color"],
                    evenodd = !1;
                if (!background) {
                    for (gl.stencilMask(63), gl.clear(gl.STENCIL_BUFFER_BIT), gl.stencilFunc(gl.NOTEQUAL, 128, 128), evenodd ? gl.stencilOp(gl.INVERT, gl.KEEP, gl.KEEP) : (gl.stencilOpSeparate(gl.FRONT, gl.INCR_WRAP, gl.KEEP, gl.KEEP), gl.stencilOpSeparate(gl.BACK, gl.DECR_WRAP, gl.KEEP, gl.KEEP)), gl.colorMask(!1, !1, !1, !1), gl.switchShader(painter.fillShader, posMatrix, painter.tile.exMatrix), buffer = bucket.indices.fillBufferIndex; buffer <= bucket.indices.fillBufferIndexEnd;) vertex = bucket.geometry.fillBuffers[buffer].vertex, vertex.bind(gl), elements = bucket.geometry.fillBuffers[buffer].elements, elements.bind(gl), begin = buffer == bucket.indices.fillBufferIndex ? bucket.indices.fillElementsIndex : 0, end = buffer == bucket.indices.fillBufferIndexEnd ? bucket.indices.fillElementsIndexEnd : elements.index, gl.vertexAttribPointer(painter.fillShader.a_pos, vertex.itemSize / 2, gl.SHORT, !1, 0, 0), gl.drawElements(gl.TRIANGLES, 3 * (end - begin), gl.UNSIGNED_SHORT, 6 * begin), buffer++;
                    if (gl.colorMask(!0, !0, !0, !0), gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP), gl.stencilMask(0), void 0 === layerStyle["fill-antialias"] || layerStyle["fill-antialias"] === !0 && params.antialiasing) {
                        gl.switchShader(painter.outlineShader, posMatrix, painter.tile.exMatrix), gl.lineWidth(2 * window.devicePixelRatio);
                        var strokeColor = layerStyle["stroke-color"];
                        for (strokeColor ? gl.stencilFunc(gl.EQUAL, 128, 128) : gl.stencilFunc(gl.EQUAL, 128, 191), gl.uniform2f(painter.outlineShader.u_world, gl.drawingBufferWidth, gl.drawingBufferHeight), gl.uniform4fv(painter.outlineShader.u_color, strokeColor ? strokeColor : color), buffer = bucket.indices.fillBufferIndex; buffer <= bucket.indices.fillBufferIndexEnd;) vertex = bucket.geometry.fillBuffers[buffer].vertex, vertex.bind(gl), begin = buffer == bucket.indices.fillBufferIndex ? bucket.indices.fillVertexIndex : 0, end = buffer == bucket.indices.fillBufferIndexEnd ? bucket.indices.fillVertexIndexEnd : vertex.index, gl.vertexAttribPointer(painter.outlineShader.a_pos, 2, gl.SHORT, !1, 0, 0), gl.drawArrays(gl.LINE_STRIP, begin, end - begin), buffer++
                    }
                }
                var imagePos = layerStyle.image && imageSprite.getPosition(layerStyle.image, !0);
                if (imagePos) {
                    var factor = 8 / Math.pow(2, painter.transform.tileZoom - params.z),
                        mix = painter.transform.zoomFraction,
                        imageSize = [imagePos.size[0] * factor, imagePos.size[1] * factor],
                        offset = [4096 * params.x % imageSize[0], 4096 * params.y % imageSize[1]];
                    gl.switchShader(painter.patternShader, painter.tile.posMatrix, painter.tile.exMatrix), gl.uniform1i(painter.patternShader.u_image, 0), gl.uniform2fv(painter.patternShader.u_pattern_size, imageSize), gl.uniform2fv(painter.patternShader.u_offset, offset), gl.uniform2fv(painter.patternShader.u_pattern_tl, imagePos.tl), gl.uniform2fv(painter.patternShader.u_pattern_br, imagePos.br), gl.uniform4fv(painter.patternShader.u_color, color), gl.uniform1f(painter.patternShader.u_mix, mix), imageSprite.bind(gl, !0)
                } else gl.switchShader(painter.fillShader, painter.tile.posMatrix, painter.tile.exMatrix), gl.uniform4fv(painter.fillShader.u_color, color);
                background ? gl.stencilFunc(gl.EQUAL, 128, 128) : gl.stencilFunc(gl.NOTEQUAL, 0, 63), gl.bindBuffer(gl.ARRAY_BUFFER, painter.tileExtentBuffer), gl.vertexAttribPointer(painter.fillShader.a_pos, painter.bufferProperties.tileExtentItemSize, gl.SHORT, !1, 0, 0), gl.drawArrays(gl.TRIANGLE_STRIP, 0, painter.bufferProperties.tileExtentNumItems), gl.stencilMask(0), gl.stencilFunc(gl.EQUAL, 128, 128)
            }
            module.exports = drawFill
        }, {}
    ],
    24: [
        function(require, module) {
            "use strict";
            module.exports = function(gl, painter, bucket, layerStyle, posMatrix, params, imageSprite) {
                "object" != typeof layerStyle["line-color"];
                var width = layerStyle["line-width"];
                if (null !== width) {
                    var shader, offset = (layerStyle["line-offset"] || 0) / 2,
                        inset = Math.max(-1, offset - width / 2 - .5) + 1,
                        outset = offset + width / 2 + .5,
                        imagePos = layerStyle["line-image"] && imageSprite.getPosition(layerStyle["line-image"]);
                    if (imagePos) {
                        var factor = 8 / Math.pow(2, painter.transform.tileZoom - params.z);
                        imageSprite.bind(gl, !0), shader = painter.linepatternShader, gl.switchShader(shader, posMatrix, painter.tile.exMatrix), gl.uniform2fv(shader.u_pattern_size, [imagePos.size[0] * factor, imagePos.size[1]]), gl.uniform2fv(shader.u_pattern_tl, imagePos.tl), gl.uniform2fv(shader.u_pattern_br, imagePos.br), gl.uniform1f(shader.u_fade, painter.transform.zoomFraction)
                    } else shader = painter.lineShader, gl.switchShader(shader, posMatrix, painter.tile.exMatrix), gl.uniform2fv(shader.u_dasharray, layerStyle["line-dasharray"] || [1, -1]);
                    var tilePixelRatio = painter.transform.scale / (1 << params.z) / 8;
                    gl.uniform2fv(shader.u_linewidth, [outset, inset]), gl.uniform1f(shader.u_ratio, tilePixelRatio), gl.uniform1f(shader.u_gamma, window.devicePixelRatio), gl.uniform1f(shader.u_blur, void 0 === layerStyle["line-blur"] ? 1 : layerStyle["line-blur"]);
                    var color = layerStyle["line-color"];
                    params.antialiasing || (color = color.slice(), color[3] = 1 / 0), gl.uniform4fv(shader.u_color, color);
                    for (var buffer = bucket.indices.lineBufferIndex; buffer <= bucket.indices.lineBufferIndexEnd;) {
                        var vertex = bucket.geometry.lineBuffers[buffer].vertex;
                        vertex.bind(gl);
                        var elements = bucket.geometry.lineBuffers[buffer].element;
                        elements.bind(gl), gl.vertexAttribPointer(shader.a_pos, 4, gl.SHORT, !1, 8, 0), gl.vertexAttribPointer(shader.a_extrude, 2, gl.BYTE, !1, 8, 6), gl.vertexAttribPointer(shader.a_linesofar, 2, gl.SHORT, !1, 8, 4);
                        var begin = buffer == bucket.indices.lineBufferIndex ? bucket.indices.lineElementIndex : 0,
                            end = buffer == bucket.indices.lineBufferIndexEnd ? bucket.indices.lineElementIndexEnd : elements.index;
                        gl.drawElements(gl.TRIANGLES, 3 * (end - begin), gl.UNSIGNED_SHORT, 6 * begin), buffer++
                    }
                }
            }
        }, {}
    ],
    25: [
        function(require, module) {
            "use strict";
            var mat2 = require("../lib/glmatrix.js").mat2;
            module.exports = function(gl, painter, bucket, layerStyle, posMatrix, params, imageSprite) {
                var type = bucket.info["point-image"] ? "point" : "circle",
                    begin = bucket.indices.pointVertexIndex,
                    count = bucket.indices.pointVertexIndexEnd - begin,
                    shader = "point" === type ? painter.pointShader : painter.dotShader,
                    opacity = layerStyle["point-opacity"];
                if (0 !== opacity)
                    if (opacity = opacity || 1, bucket.geometry.pointVertex.bind(gl), gl.switchShader(shader, posMatrix, painter.tile.exMatrix), gl.uniform4fv(shader.u_color, layerStyle["point-color"] || [opacity, opacity, opacity, opacity]), gl.uniform2f(shader.u_texsize, imageSprite.img.width, imageSprite.img.height), "circle" === type) {
                        var diameter = (2 * layerStyle["point-radius"] || 8) * window.devicePixelRatio;
                        gl.uniform1f(shader.u_size, diameter), gl.uniform1f(shader.u_blur, (layerStyle["point-blur"] || 1.5) / diameter), gl.vertexAttribPointer(shader.a_pos, 4, gl.SHORT, !1, 16, 0), gl.drawArrays(gl.POINTS, begin, count)
                    } else {
                        var size = bucket.info["point-size"] || [12, 12],
                            ratio = window.devicePixelRatio;
                        gl.uniform2fv(shader.u_size, [size[0] * ratio, size[1] * ratio]), gl.uniform1i(shader.u_invert, layerStyle["point-invert"]), gl.uniform1f(shader.u_zoom, 10 * (painter.transform.zoom - params.z)), gl.uniform1i(shader.u_image, 0);
                        var rotate = layerStyle["point-alignment"] && "screen" !== layerStyle["point-alignment"],
                            rotationMatrix = rotate ? mat2.clone(painter.tile.rotationMatrix) : mat2.create();
                        layerStyle["point-rotate"] && mat2.rotate(rotationMatrix, rotationMatrix, layerStyle["point-rotate"]), gl.uniformMatrix2fv(shader.u_rotationmatrix, !1, rotationMatrix), gl.activeTexture(gl.TEXTURE0), imageSprite.bind(gl, rotate || params.rotating || params.zooming), gl.vertexAttribPointer(shader.a_pos, 4, gl.SHORT, !1, 16, 0), gl.vertexAttribPointer(shader.a_tl, 4, gl.SHORT, !1, 16, 4), gl.vertexAttribPointer(shader.a_br, 4, gl.SHORT, !1, 16, 8), gl.vertexAttribPointer(shader.a_minzoom, 1, gl.BYTE, !1, 16, 12), gl.vertexAttribPointer(shader.a_angle, 1, gl.BYTE, !1, 16, 13), gl.drawArrays(gl.POINTS, begin, count)
                    }
            }
        }, {
            "../lib/glmatrix.js": 20
        }
    ],
    26: [
        function(require, module) {
            "use strict";

            function drawRaster(gl, painter, tile, layerStyle) {
                var shader = painter.rasterShader;
                gl.switchShader(shader, painter.tile.posMatrix, painter.tile.exMatrix), gl.uniform1f(shader.u_brightness_low, layerStyle["raster-brightness-low"] || 0), gl.uniform1f(shader.u_brightness_high, layerStyle["raster-brightness-high"] || 1), gl.uniform1f(shader.u_saturation_factor, saturationFactor(layerStyle["raster-saturation"] || 0)), gl.uniform1f(shader.u_contrast_factor, contrastFactor(layerStyle["raster-contrast"] || 0)), gl.uniform3fv(shader.u_spin_weights, spinWeights(layerStyle["raster-spin"] || 0));
                var parentScaleBy, parentTL, parentTile = findParent(tile),
                    opacities = getOpacities(tile, parentTile);
                if (gl.activeTexture(gl.TEXTURE0), tile.bind(gl), parentTile) {
                    gl.activeTexture(gl.TEXTURE1), parentTile.bind(gl);
                    var tilePos = Tile.fromID(tile.id),
                        parentPos = parentTile && Tile.fromID(parentTile.id);
                    parentScaleBy = Math.pow(2, parentPos.z - tilePos.z), parentTL = [tilePos.x * parentScaleBy % 1, tilePos.y * parentScaleBy % 1]
                } else opacities[1] = 0;
                gl.uniform2fv(shader.u_tl_parent, parentTL || [0, 0]), gl.uniform1f(shader.u_scale_parent, parentScaleBy || 1), gl.uniform1f(shader.u_opacity0, opacities[0]), gl.uniform1f(shader.u_opacity1, opacities[1]), gl.uniform1i(shader.u_image0, 0), gl.uniform1i(shader.u_image1, 1), gl.bindBuffer(gl.ARRAY_BUFFER, painter.tileExtentBuffer), gl.vertexAttribPointer(shader.a_pos, painter.bufferProperties.backgroundItemSize, gl.SHORT, !1, 0, 0), gl.drawArrays(gl.TRIANGLE_STRIP, 0, painter.bufferProperties.backgroundNumItems)
            }

            function findParent(tile) {
                var source = tile.source,
                    parentTiles = {};
                return source._findLoadedParent(tile.id, source.minTileZoom, parentTiles), source.tiles[Object.keys(parentTiles)[0]]
            }

            function clamp(n, min, max) {
                return Math.max(min, Math.min(max, n))
            }

            function spinWeights(spin) {
                var angle = spin * Math.PI,
                    s = Math.sin(angle),
                    c = Math.cos(angle);
                return [(2 * c + 1) / 3, (-Math.sqrt(3) * s - c + 1) / 3, (Math.sqrt(3) * s - c + 1) / 3]
            }

            function contrastFactor(contrast) {
                return contrast > 0 ? 1 / (1 - contrast) : 1 + contrast
            }

            function saturationFactor(saturation) {
                return saturation > 0 ? 1 - 1 / (1.001 - saturation) : -saturation
            }

            function getOpacities(tile, parentTile) {
                var now = (new Date).getTime(),
                    fadeDuration = tile.source.map.style.rasterFadeDuration,
                    sinceTile = (now - tile.timeAdded) / fadeDuration,
                    sinceParent = parentTile ? (now - parentTile.timeAdded) / fadeDuration : -1,
                    tilePos = Tile.fromID(tile.id),
                    parentPos = parentTile && Tile.fromID(parentTile.id),
                    idealZ = tile.source._coveringZoomLevel(tile.source._getZoom()),
                    parentFurther = parentTile ? Math.abs(parentPos.z - idealZ) > Math.abs(tilePos.z - idealZ) : !1,
                    opacity = [];
                return !parentTile || parentFurther ? (opacity[0] = clamp(sinceTile, 0, 1), opacity[1] = 1 - opacity[0]) : (opacity[0] = clamp(1 - sinceParent, 0, 1), opacity[1] = 1 - opacity[0]), opacity
            }
            var Tile = require("../ui/tile.js");
            module.exports = drawRaster
        }, {
            "../ui/tile.js": 55
        }
    ],
    27: [
        function(require, module) {
            "use strict";

            function drawText(gl, painter, bucket, layerStyle, posMatrix) {
                var exMatrix = mat4.clone(painter.projectionMatrix);
                "curve" == bucket.info["text-path"] && mat4.rotateZ(exMatrix, exMatrix, painter.transform.angle);
                var rotate = layerStyle["text-rotate"] || 0;
                rotate && mat4.rotateZ(exMatrix, exMatrix, rotate);
                var fontSize = layerStyle["text-size"] || bucket.info["text-max-size"];
                mat4.scale(exMatrix, exMatrix, [fontSize / 24, fontSize / 24, 1]);
                var shader = painter.sdfShader;
                gl.switchShader(shader, posMatrix, exMatrix), gl.activeTexture(gl.TEXTURE0), painter.glyphAtlas.updateTexture(gl), gl.uniform1i(shader.u_image, 0), gl.uniform2f(shader.u_texsize, painter.glyphAtlas.width, painter.glyphAtlas.height), bucket.geometry.glyphVertex.bind(gl);
                var ubyte = gl.UNSIGNED_BYTE;
                gl.vertexAttribPointer(shader.a_pos, 2, gl.SHORT, !1, 16, 0), gl.vertexAttribPointer(shader.a_offset, 2, gl.SHORT, !1, 16, 4), gl.vertexAttribPointer(shader.a_tex, 2, ubyte, !1, 16, 8), gl.vertexAttribPointer(shader.a_labelminzoom, 1, ubyte, !1, 16, 10), gl.vertexAttribPointer(shader.a_minzoom, 1, ubyte, !1, 16, 11), gl.vertexAttribPointer(shader.a_maxzoom, 1, ubyte, !1, 16, 12), gl.vertexAttribPointer(shader.a_angle, 1, ubyte, !1, 16, 13), gl.vertexAttribPointer(shader.a_rangeend, 1, ubyte, !1, 16, 14), gl.vertexAttribPointer(shader.a_rangestart, 1, ubyte, !1, 16, 15);
                var angle = Math.round((painter.transform.angle + rotate) / Math.PI * 128),
                    zoomAdjust = Math.log(fontSize / bucket.info["text-max-size"]) / Math.LN2;
                gl.uniform1f(shader.u_angle, (angle + 256) % 256), gl.uniform1f(shader.u_flip, "curve" === bucket.info["text-path"] ? 1 : 0), gl.uniform1f(shader.u_zoom, 10 * (painter.transform.zoom - zoomAdjust));
                for (var duration = 300, currentTime = (new Date).getTime(); frameHistory.length > 3 && frameHistory[1].time + duration < currentTime;) frameHistory.shift();
                frameHistory[1].time + duration < currentTime && (frameHistory[0].z = frameHistory[1].z);
                var frameLen = frameHistory.length,
                    startingZ = frameHistory[0].z,
                    lastFrame = frameHistory[frameLen - 1],
                    endingZ = lastFrame.z,
                    lowZ = Math.min(startingZ, endingZ),
                    highZ = Math.max(startingZ, endingZ),
                    zoomDiff = lastFrame.z - frameHistory[1].z,
                    timeDiff = lastFrame.time - frameHistory[1].time,
                    fadedist = zoomDiff / (timeDiff / duration);
                isNaN(fadedist);
                var bump = (currentTime - lastFrame.time) / duration * fadedist;
                gl.uniform1f(shader.u_fadedist, 10 * fadedist), gl.uniform1f(shader.u_minfadezoom, Math.floor(10 * lowZ)), gl.uniform1f(shader.u_maxfadezoom, Math.floor(10 * highZ)), gl.uniform1f(shader.u_fadezoom, 10 * (painter.transform.zoom + bump)), gl.uniform1f(shader.u_gamma, 2.5 / bucket.info["text-max-size"] / window.devicePixelRatio), gl.uniform4fv(shader.u_color, layerStyle["text-color"]), gl.uniform1f(shader.u_buffer, .75);
                var begin = bucket.indices.glyphVertexIndex,
                    len = bucket.indices.glyphVertexIndexEnd - begin;
                gl.drawArrays(gl.TRIANGLES, begin, len), layerStyle["text-halo-color"] && (gl.uniform1f(shader.u_gamma, 2.5 * (layerStyle["text-halo-blur"] || 1) / bucket.info["text-max-size"] / window.devicePixelRatio), gl.uniform4fv(shader.u_color, layerStyle["text-halo-color"]), gl.uniform1f(shader.u_buffer, void 0 === layerStyle["text-halo-width"] ? .25 : layerStyle["text-halo-width"]), gl.drawArrays(gl.TRIANGLES, begin, len))
            }
            var mat4 = require("../lib/glmatrix.js").mat4;
            module.exports = drawText;
            var frameHistory = [];
            drawText.frame = function(painter) {
                var currentTime = (new Date).getTime();
                frameHistory.length || frameHistory.push({
                    time: 0,
                    z: painter.transform.zoom
                }, {
                    time: 0,
                    z: painter.transform.zoom
                }), (2 === frameHistory.length || frameHistory[frameHistory.length - 1].z !== painter.transform.zoom) && frameHistory.push({
                    time: currentTime,
                    z: painter.transform.zoom
                })
            }
        }, {
            "../lib/glmatrix.js": 20
        }
    ],
    28: [
        function(require) {
            "use strict";
            var shaders = require("./shaders.js"),
                WebGLRenderingContext = window.WebGLRenderingContext;
            WebGLRenderingContext && (WebGLRenderingContext.prototype.getShader = function(name, type) {
                var kind = type == this.FRAGMENT_SHADER ? "fragment" : "vertex";
                if (!shaders[name] || !shaders[name][kind]) throw new Error("Could not find shader " + name);
                var shader = this.createShader(type);
                if (this.shaderSource(shader, shaders[name][kind]), this.compileShader(shader), !this.getShaderParameter(shader, this.COMPILE_STATUS)) throw new Error(this.getShaderInfoLog(shader));
                return shader
            }, WebGLRenderingContext.prototype.initializeShader = function(name, attributes, uniforms) {
                var shader = {
                    program: this.createProgram(),
                    fragment: this.getShader(name, this.FRAGMENT_SHADER),
                    vertex: this.getShader(name, this.VERTEX_SHADER),
                    attributes: []
                };
                if (this.attachShader(shader.program, shader.vertex), this.attachShader(shader.program, shader.fragment), this.linkProgram(shader.program), this.getProgramParameter(shader.program, this.LINK_STATUS)) {
                    for (var i = 0; i < attributes.length; i++) shader[attributes[i]] = this.getAttribLocation(shader.program, attributes[i]), shader.attributes.push(shader[attributes[i]]);
                    for (var k = 0; k < uniforms.length; k++) shader[uniforms[k]] = this.getUniformLocation(shader.program, uniforms[k])
                } else alert("Could not initialize shader " + name);
                return shader
            }, WebGLRenderingContext.prototype.switchShader = function(shader, posMatrix, exMatrix) {
                if (this.currentShader !== shader) {
                    this.useProgram(shader.program);
                    for (var enabled = this.currentShader ? this.currentShader.attributes : [], required = shader.attributes, i = 0; i < enabled.length; i++) required.indexOf(enabled[i]) < 0 && this.disableVertexAttribArray(enabled[i]);
                    for (var j = 0; j < required.length; j++) enabled.indexOf(required[j]) < 0 && this.enableVertexAttribArray(required[j]);
                    this.currentShader = shader
                }
                shader.posMatrix !== posMatrix && (this.uniformMatrix4fv(shader.u_posmatrix, !1, posMatrix), shader.posMatrix = posMatrix), exMatrix && shader.exMatrix !== exMatrix && shader.u_exmatrix && (this.uniformMatrix4fv(shader.u_exmatrix, !1, exMatrix), shader.exMatrix = exMatrix)
            })
        }, {
            "./shaders.js": 30
        }
    ],
    29: [
        function(require, module) {
            "use strict";

            function GLPainter(gl, transform) {
                this.gl = gl, this.transform = transform, this.bufferProperties = {}, this.framebufferObject = null, this.renderTextures = [], this.namedRenderTextures = {}, this.tileExtent = 4096, this.setup()
            }
            require("./glutil.js");
            var GlyphAtlas = require("../text/glyphatlas.js"),
                glmatrix = require("../lib/glmatrix.js"),
                mat4 = glmatrix.mat4,
                drawText = require("./drawtext.js"),
                drawLine = require("./drawline.js"),
                drawFill = require("./drawfill.js"),
                drawPoint = require("./drawpoint.js"),
                drawRaster = require("./drawraster.js"),
                drawDebug = require("./drawdebug.js"),
                drawComposited = require("./drawcomposited.js"),
                drawVertices = require("./drawvertices.js");
            module.exports = GLPainter, GLPainter.prototype.resize = function(width, height) {
                var gl = this.gl;
                this.projectionMatrix = mat4.create(), mat4.ortho(this.projectionMatrix, 0, width, height, 0, 0, -1), this.width = width * window.devicePixelRatio, this.height = height * window.devicePixelRatio, gl.viewport(0, 0, this.width, this.height);
                for (var i = this.renderTextures.length - 1; i >= 0; i--) gl.deleteTexture(this.renderTextures.pop());
                this.stencilBuffer && (gl.deleteRenderbuffer(this.stencilBuffer), delete this.stencilBuffer)
            }, GLPainter.prototype.setup = function() {
                var gl = this.gl;
                gl.verbose = !0, gl.enable(gl.BLEND), gl.blendFunc(gl.ONE_MINUS_DST_ALPHA, gl.ONE), gl.enable(gl.STENCIL_TEST), this.glyphAtlas = new GlyphAtlas(1024, 1024), this.glyphAtlas.bind(gl), this.debugShader = gl.initializeShader("debug", ["a_pos"], ["u_posmatrix", "u_pointsize", "u_color"]), this.compositeShader = gl.initializeShader("composite", ["a_pos"], ["u_posmatrix", "u_opacity"]), this.rasterShader = gl.initializeShader("raster", ["a_pos"], ["u_posmatrix", "u_brightness_low", "u_brightness_high", "u_saturation_factor", "u_spin_weights", "u_contrast_factor", "u_opacity0", "u_opacity1", "u_image0", "u_image1", "u_tl_parent", "u_scale_parent"]), this.lineShader = gl.initializeShader("line", ["a_pos", "a_extrude", "a_linesofar"], ["u_posmatrix", "u_exmatrix", "u_linewidth", "u_color", "u_debug", "u_ratio", "u_dasharray", "u_gamma", "u_blur"]), this.linepatternShader = gl.initializeShader("linepattern", ["a_pos", "a_extrude", "a_linesofar"], ["u_posmatrix", "u_exmatrix", "u_linewidth", "u_color", "u_debug", "u_ratio", "u_pattern_size", "u_pattern_tl", "u_pattern_br", "u_point", "u_gamma", "u_fade"]), this.labelShader = gl.initializeShader("label", ["a_pos", "a_offset", "a_tex"], ["u_texsize", "u_sampler", "u_posmatrix", "u_resizematrix", "u_color"]), this.pointShader = gl.initializeShader("point", ["a_pos", "a_angle", "a_minzoom", "a_tl", "a_br"], ["u_posmatrix", "u_rotationmatrix", "u_color", "u_invert", "u_zoom", "u_texsize", "u_size"]), this.dotShader = gl.initializeShader("dot", ["a_pos"], ["u_posmatrix", "u_size", "u_color", "u_blur"]), this.sdfShader = gl.initializeShader("sdf", ["a_pos", "a_tex", "a_offset", "a_angle", "a_minzoom", "a_maxzoom", "a_rangeend", "a_rangestart", "a_labelminzoom"], ["u_posmatrix", "u_exmatrix", "u_texture", "u_texsize", "u_color", "u_gamma", "u_buffer", "u_angle", "u_zoom", "u_flip", "u_fadedist", "u_minfadezoom", "u_maxfadezoom", "u_fadezoom"]), this.outlineShader = gl.initializeShader("outline", ["a_pos"], ["u_posmatrix", "u_color", "u_world"]), this.patternShader = gl.initializeShader("pattern", ["a_pos"], ["u_posmatrix", "u_color", "u_pattern_tl", "u_pattern_br", "u_pattern_size", "u_offset", "u_mix"]), this.fillShader = gl.initializeShader("fill", ["a_pos"], ["u_posmatrix", "u_color"]);
                var background = [-32768, -32768, 32766, -32768, -32768, 32766, 32766, 32766],
                    backgroundArray = new Int16Array(background);
                this.backgroundBuffer = gl.createBuffer(), this.bufferProperties.backgroundItemSize = 2, this.bufferProperties.backgroundNumItems = background.length / this.bufferProperties.backgroundItemSize, gl.bindBuffer(gl.ARRAY_BUFFER, this.backgroundBuffer), gl.bufferData(gl.ARRAY_BUFFER, backgroundArray, gl.STATIC_DRAW);
                var t = this.tileExtent,
                    tileExtentArray = new Int16Array([0, 0, t, 0, 0, t, t, t]);
                this.tileExtentBuffer = gl.createBuffer(), this.bufferProperties.tileExtentItemSize = 2, this.bufferProperties.tileExtentNumItems = 4, gl.bindBuffer(gl.ARRAY_BUFFER, this.tileExtentBuffer), gl.bufferData(gl.ARRAY_BUFFER, tileExtentArray, gl.STATIC_DRAW);
                var debug = [0, 0, 4095, 0, 4095, 4095, 0, 4095, 0, 0],
                    debugArray = new Int16Array(debug);
                this.debugBuffer = gl.createBuffer(), this.bufferProperties.debugItemSize = 2, this.bufferProperties.debugNumItems = debug.length / this.bufferProperties.debugItemSize, gl.bindBuffer(gl.ARRAY_BUFFER, this.debugBuffer), gl.bufferData(gl.ARRAY_BUFFER, debugArray, gl.STATIC_DRAW), this.debugTextBuffer = gl.createBuffer(), this.bufferProperties.debugTextItemSize = 2
            }, GLPainter.prototype.clearColor = function() {
                var gl = this.gl;
                gl.clearColor(0, 0, 0, 0), gl.clear(gl.COLOR_BUFFER_BIT)
            }, GLPainter.prototype.clearStencil = function() {
                var gl = this.gl;
                gl.clearStencil(0), gl.stencilMask(255), gl.clear(gl.STENCIL_BUFFER_BIT)
            }, GLPainter.prototype.drawClippingMask = function() {
                var gl = this.gl;
                gl.switchShader(this.fillShader, this.tile.posMatrix, this.tile.exMatrix), gl.colorMask(!1, !1, !1, !1), gl.clearStencil(0), gl.stencilMask(191), gl.clear(gl.STENCIL_BUFFER_BIT), gl.stencilFunc(gl.EQUAL, 192, 64), gl.stencilMask(192), gl.stencilOp(gl.REPLACE, gl.KEEP, gl.KEEP), gl.bindBuffer(gl.ARRAY_BUFFER, this.tileExtentBuffer), gl.vertexAttribPointer(this.fillShader.a_pos, this.bufferProperties.tileExtentItemSize, gl.SHORT, !1, 0, 0), gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.bufferProperties.tileExtentNumItems), gl.stencilFunc(gl.EQUAL, 128, 128), gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE), gl.stencilMask(0), gl.colorMask(!0, !0, !0, !0)
            }, GLPainter.prototype.bindRenderTexture = function(name) {
                var gl = this.gl;
                if (name) {
                    if (this.framebufferObject || (this.framebufferObject = gl.createFramebuffer()), !this.stencilBuffer) {
                        var stencil = this.stencilBuffer = gl.createRenderbuffer();
                        gl.bindRenderbuffer(gl.RENDERBUFFER, stencil), gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, gl.drawingBufferWidth, gl.drawingBufferHeight), this.stencilClippingMaskDirty = !0
                    }
                    var texture = this.renderTextures.pop();
                    texture || (texture = gl.createTexture(), gl.bindTexture(gl.TEXTURE_2D, texture), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST), gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)), this.namedRenderTextures[name] = texture, gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebufferObject), gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.stencilBuffer), gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
                } else gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                this.clearColor()
            }, GLPainter.prototype.freeRenderTexture = function(name) {
                this.renderTextures.push(this.namedRenderTextures[name]), delete this.namedRenderTextures[name]
            }, GLPainter.prototype.draw = function(tile, style, layers, params) {
                this.tile = tile, tile && (this.drawClippingMask(), this.stencilClippingMaskDirty = !0), !Array.isArray(layers), drawText.frame(this);
                for (var i = 0, len = layers.length; len > i; i++) this.applyStyle(layers[i], style, tile && tile.buckets, params);
                params.debug && drawDebug(this.gl, this, tile, params)
            }, GLPainter.prototype.applyStyle = function(layer, style, buckets, params) {
                var gl = this.gl,
                    layerStyle = style.computed[layer.id];
                if (layerStyle && !layerStyle.hidden)
                    if (layer.layers) drawComposited(gl, this, buckets, layerStyle, params, style, layer);
                    else if ("background" === layer.id) drawFill(gl, this, void 0, layerStyle, this.tile.posMatrix, params, style.sprite, !0);
                else {
                    var bucket = buckets[layer.bucket];
                    if (!bucket || !bucket.indices) return;
                    var translatedMatrix, info = bucket.info,
                        translate = info.text ? layerStyle["text-translate"] : info.fill ? layerStyle["fill-translate"] : info.line ? layerStyle["line-translate"] : info.point ? layerStyle["point-translate"] : null;
                    if (translate) {
                        var tilePixelRatio = this.transform.scale / (1 << params.z) / 8,
                            translation = [translate[0] / tilePixelRatio, translate[1] / tilePixelRatio, 0];
                        translatedMatrix = new Float32Array(16), mat4.translate(translatedMatrix, this.tile.posMatrix, translation)
                    }
                    var draw = info.text ? drawText : info.fill ? drawFill : info.line ? drawLine : info.point ? drawPoint : info.raster ? drawRaster : null;
                    draw && draw(gl, this, bucket, layerStyle, translatedMatrix || this.tile.posMatrix, params, style.sprite), params.vertices && !layer.layers && drawVertices(gl, this, bucket)
                }
            }, GLPainter.prototype.drawBackground = function(color) {
                var gl = this.gl;
                gl.switchShader(this.fillShader, this.projectionMatrix), gl.disable(gl.STENCIL_TEST), gl.stencilMask(1 == color[3] ? 128 : 0), gl.uniform4fv(this.fillShader.u_color, color), gl.bindBuffer(gl.ARRAY_BUFFER, this.backgroundBuffer), gl.vertexAttribPointer(this.fillShader.a_pos, this.bufferProperties.backgroundItemSize, gl.SHORT, !1, 0, 0), gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.bufferProperties.backgroundNumItems), gl.enable(gl.STENCIL_TEST), gl.stencilMask(0)
            }, GLPainter.prototype.drawStencilBuffer = function() {
                var gl = this.gl;
                gl.switchShader(this.fillShader, this.projectionMatrix), gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA), gl.stencilMask(0), gl.stencilFunc(gl.EQUAL, 128, 128), gl.bindBuffer(gl.ARRAY_BUFFER, this.backgroundBuffer), gl.vertexAttribPointer(this.fillShader.a_pos, this.bufferProperties.backgroundItemSize, gl.SHORT, !1, 0, 0), gl.uniform4fv(this.fillShader.u_color, [0, 0, 0, .5]), gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.bufferProperties.backgroundNumItems), gl.blendFunc(gl.ONE_MINUS_DST_ALPHA, gl.ONE)
            }
        }, {
            "../lib/glmatrix.js": 20,
            "../text/glyphatlas.js": 39,
            "./drawcomposited.js": 22,
            "./drawdebug.js": 68,
            "./drawfill.js": 23,
            "./drawline.js": 24,
            "./drawpoint.js": 25,
            "./drawraster.js": 26,
            "./drawtext.js": 27,
            "./drawvertices.js": 68,
            "./glutil.js": 28
        }
    ],
    30: [
        function(require, module) {
            "use strict";
            module.exports = {
                composite: {
                    vertex: "attribute vec2 a_pos;\nuniform mat4 u_posmatrix;\nvarying highp vec2 a;\nvoid main ()\n{\n  vec4 tmpvar_1;\n  tmpvar_1.zw = vec2(0.0, 1.0);\n  tmpvar_1.xy = a_pos;\n  vec4 tmpvar_2;\n  tmpvar_2 = (u_posmatrix * tmpvar_1);\n  gl_Position = tmpvar_2;\n  a = ((tmpvar_2.xy / 2.0) + 0.5);\n}\n\n",
                    fragment: "precision mediump float;\nuniform sampler2D u_image;\nuniform float u_opacity;\nvarying vec2 a;\nvoid main ()\n{\n  lowp vec4 tmpvar_1;\n  tmpvar_1 = (texture2D (u_image, a) * u_opacity);\n  gl_FragColor = tmpvar_1;\n}\n\n"
                },
                debug: {
                    vertex: "precision mediump float;\nattribute vec2 a_pos;\nuniform float u_pointsize;\nuniform mat4 u_posmatrix;\nvoid main ()\n{\n  vec4 tmpvar_1;\n  tmpvar_1.w = 1.0;\n  tmpvar_1.xy = a_pos;\n  tmpvar_1.z = float((a_pos.x >= 32767.0));\n  gl_Position = (u_posmatrix * tmpvar_1);\n  gl_PointSize = u_pointsize;\n}\n\n",
                    fragment: "precision mediump float;\nuniform vec4 u_color;\nvoid main ()\n{\n  gl_FragColor = u_color;\n}\n\n"
                },
                dot: {
                    vertex: "precision mediump float;\nuniform mat4 u_posmatrix;\nuniform float u_size;\nattribute vec2 a_pos;\nvoid main ()\n{\n  vec4 tmpvar_1;\n  tmpvar_1.zw = vec2(0.0, 1.0);\n  tmpvar_1.xy = a_pos;\n  gl_Position = (u_posmatrix * tmpvar_1);\n  gl_PointSize = u_size;\n}\n\n",
                    fragment: "precision mediump float;\nuniform vec4 u_color;\nuniform float u_blur;\nvoid main ()\n{\n  mediump vec2 x_1;\n  x_1 = (gl_PointCoord - 0.5);\n  mediump float tmpvar_2;\n  tmpvar_2 = clamp (((\n    sqrt(dot (x_1, x_1))\n   - 0.5) / (\n    (0.5 - u_blur)\n   - 0.5)), 0.0, 1.0);\n  gl_FragColor = (u_color * (tmpvar_2 * (tmpvar_2 * \n    (3.0 - (2.0 * tmpvar_2))\n  )));\n}\n\n"
                },
                fill: {
                    vertex: "precision mediump float;\nattribute vec2 a_pos;\nuniform mat4 u_posmatrix;\nvoid main ()\n{\n  vec4 tmpvar_1;\n  tmpvar_1.zw = vec2(0.0, 1.0);\n  tmpvar_1.xy = a_pos;\n  gl_Position = (u_posmatrix * tmpvar_1);\n  gl_PointSize = 2.0;\n}\n\n",
                    fragment: "precision mediump float;\nuniform vec4 u_color;\nvoid main ()\n{\n  gl_FragColor = u_color;\n}\n\n"
                },
                label: {
                    vertex: "precision mediump float;\nattribute vec2 a_pos;\nattribute vec2 a_offset;\nattribute vec2 a_tex;\nuniform vec2 u_texsize;\nuniform mat4 u_posmatrix;\nuniform mat4 u_resizematrix;\nvarying vec2 a;\nvoid main ()\n{\n  vec4 tmpvar_1;\n  tmpvar_1.zw = vec2(0.0, 1.0);\n  tmpvar_1.xy = a_pos;\n  vec4 tmpvar_2;\n  tmpvar_2.zw = vec2(0.0, 1.0);\n  tmpvar_2.xy = a_offset;\n  gl_Position = ((u_posmatrix * tmpvar_1) + (u_resizematrix * tmpvar_2));\n  a = (a_tex / u_texsize);\n}\n\n",
                    fragment: "precision mediump float;\nuniform sampler2D u_sampler;\nuniform vec4 u_color;\nvarying vec2 a;\nvoid main ()\n{\n  lowp vec4 tmpvar_1;\n  tmpvar_1.xyz = u_color.xyz;\n  tmpvar_1.w = (u_color.w * texture2D (u_sampler, a).w);\n  gl_FragColor = tmpvar_1;\n}\n\n"
                },
                line: {
                    vertex: "precision mediump float;\nattribute vec2 a_pos;\nattribute vec2 a_extrude;\nattribute float a_linesofar;\nuniform mat4 u_posmatrix;\nuniform mat4 u_exmatrix;\nuniform float u_ratio;\nuniform vec2 u_linewidth;\nvarying vec2 a;\nvarying float b;\nvoid main ()\n{\n  vec2 c_1;\n  vec2 tmpvar_2;\n  tmpvar_2 = (vec2(mod (a_pos, 2.0)));\n  c_1.x = tmpvar_2.x;\n  c_1.y = sign((tmpvar_2.y - 0.5));\n  a = c_1;\n  vec4 tmpvar_3;\n  tmpvar_3.zw = vec2(0.0, 1.0);\n  tmpvar_3.xy = floor((a_pos / 2.0));\n  vec4 tmpvar_4;\n  tmpvar_4.zw = vec2(0.0, 0.0);\n  tmpvar_4.xy = (u_linewidth.x * (a_extrude / 63.0));\n  gl_Position = ((u_posmatrix * tmpvar_3) + (u_exmatrix * tmpvar_4));\n  b = (a_linesofar * u_ratio);\n}\n\n",
                    fragment: "precision mediump float;\nuniform float u_debug;\nuniform float u_gamma;\nuniform float u_blur;\nuniform vec2 u_linewidth;\nuniform vec2 u_dasharray;\nuniform vec4 u_color;\nvarying vec2 a;\nvarying float b;\nvoid main ()\n{\n  float tmpvar_1;\n  tmpvar_1 = (sqrt(dot (a, a)) * u_linewidth.x);\n  float tmpvar_2;\n  tmpvar_2 = (float(mod (b, (u_dasharray.x + u_dasharray.y))));\n  gl_FragColor = (u_color * (clamp (\n    ((min ((tmpvar_1 - \n      (u_linewidth.y - u_blur)\n    ), (u_linewidth.x - tmpvar_1)) / u_blur) * u_gamma)\n  , 0.0, 1.0) * max (\n    float((-(u_dasharray.y) >= 0.0))\n  , \n    clamp (min (tmpvar_2, (u_dasharray.x - tmpvar_2)), 0.0, 1.0)\n  )));\n  if ((u_debug > 0.0)) {\n    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n  };\n}\n\n"
                },
                linepattern: {
                    vertex: "precision mediump float;\nattribute vec2 a_pos;\nattribute vec2 a_extrude;\nattribute float a_linesofar;\nuniform mat4 u_posmatrix;\nuniform mat4 u_exmatrix;\nuniform float u_point;\nuniform vec2 u_linewidth;\nvarying vec2 a;\nvarying float b;\nvoid main ()\n{\n  vec2 c_1;\n  vec2 tmpvar_2;\n  tmpvar_2 = (vec2(mod (a_pos, 2.0)));\n  c_1.x = tmpvar_2.x;\n  c_1.y = sign((tmpvar_2.y - 0.5));\n  a = c_1;\n  vec4 tmpvar_3;\n  tmpvar_3.zw = vec2(0.0, 1.0);\n  tmpvar_3.xy = floor((a_pos / 2.0));\n  vec4 tmpvar_4;\n  tmpvar_4.w = 0.0;\n  tmpvar_4.xy = ((u_linewidth.x * (a_extrude / 63.0)) * (1.0 - u_point));\n  tmpvar_4.z = (float((a_pos.x >= 32767.0)) + (u_point * float(\n    (c_1.y >= 1.0)\n  )));\n  gl_Position = ((u_posmatrix * tmpvar_3) + (u_exmatrix * tmpvar_4));\n  b = a_linesofar;\n  gl_PointSize = ((2.0 * u_linewidth.x) - 1.0);\n}\n\n",
                    fragment: "precision mediump float;\nuniform float u_debug;\nuniform float u_point;\nuniform float u_gamma;\nuniform float u_fade;\nuniform vec2 u_linewidth;\nuniform vec2 u_pattern_size;\nuniform vec2 u_pattern_tl;\nuniform vec2 u_pattern_br;\nuniform vec4 u_color;\nuniform sampler2D u_image;\nvarying vec2 a;\nvarying float b;\nvoid main ()\n{\n  mediump vec2 x_1;\n  x_1 = ((gl_PointCoord * 2.0) - 1.0);\n  mediump float tmpvar_2;\n  tmpvar_2 = (((\n    sqrt(dot (a, a))\n   * \n    (1.0 - u_point)\n  ) + (u_point * \n    sqrt(dot (x_1, x_1))\n  )) * u_linewidth.x);\n  float tmpvar_3;\n  tmpvar_3 = (float(mod ((b / u_pattern_size.x), 1.0)));\n  float tmpvar_4;\n  tmpvar_4 = (0.5 + ((a.y * u_linewidth.x) / u_pattern_size.y));\n  vec2 tmpvar_5;\n  tmpvar_5.x = tmpvar_3;\n  tmpvar_5.y = tmpvar_4;\n  vec2 tmpvar_6;\n  tmpvar_6.x = (float(mod ((tmpvar_3 * 2.0), 1.0)));\n  tmpvar_6.y = tmpvar_4;\n  lowp vec4 tmpvar_7;\n  tmpvar_7 = ((texture2D (u_image, mix (u_pattern_tl, u_pattern_br, tmpvar_5)) * (1.0 - u_fade)) + (u_fade * texture2D (u_image, mix (u_pattern_tl, u_pattern_br, tmpvar_6))));\n  gl_FragColor = ((tmpvar_7 * u_color.w) * clamp ((\n    min ((tmpvar_2 - (u_linewidth.y - 1.0)), (u_linewidth.x - tmpvar_2))\n   * u_gamma), 0.0, 1.0));\n  if ((u_debug > 0.0)) {\n    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n  };\n}\n\n"
                },
                outline: {
                    vertex: "precision mediump float;\nattribute vec2 a_pos;\nuniform mat4 u_posmatrix;\nuniform vec2 u_world;\nvarying highp vec2 a;\nvoid main ()\n{\n  vec4 tmpvar_1;\n  tmpvar_1.w = 1.0;\n  tmpvar_1.xy = a_pos;\n  tmpvar_1.z = float((a_pos.x >= 32767.0));\n  vec4 tmpvar_2;\n  tmpvar_2 = (u_posmatrix * tmpvar_1);\n  gl_Position = tmpvar_2;\n  a = (((tmpvar_2.xy + 1.0) / 2.0) * u_world);\n}\n\n",
                    fragment: "precision mediump float;\nuniform vec4 u_color;\nvarying vec2 a;\nvoid main ()\n{\n  highp vec2 x_1;\n  x_1 = (a - gl_FragCoord.xy);\n  highp float tmpvar_2;\n  tmpvar_2 = clamp (((\n    sqrt(dot (x_1, x_1))\n   - 1.0) / -1.0), 0.0, 1.0);\n  highp vec4 tmpvar_3;\n  tmpvar_3 = (u_color * (tmpvar_2 * (tmpvar_2 * \n    (3.0 - (2.0 * tmpvar_2))\n  )));\n  gl_FragColor = tmpvar_3;\n}\n\n"
                },
                pattern: {
                    vertex: "precision mediump float;\nuniform mat4 u_posmatrix;\nattribute vec2 a_pos;\nvarying vec2 a;\nvoid main ()\n{\n  a = a_pos;\n  vec4 tmpvar_1;\n  tmpvar_1.zw = vec2(0.0, 1.0);\n  tmpvar_1.xy = a_pos;\n  gl_Position = (u_posmatrix * tmpvar_1);\n}\n\n",
                    fragment: "precision mediump float;\nuniform vec4 u_color;\nuniform vec2 u_offset;\nuniform vec2 u_pattern_size;\nuniform vec2 u_pattern_tl;\nuniform vec2 u_pattern_br;\nuniform float u_mix;\nuniform sampler2D u_image;\nvarying vec2 a;\nvoid main ()\n{\n  vec2 tmpvar_1;\n  tmpvar_1 = (vec2(mod (((a + u_offset) / u_pattern_size), 1.0)));\n  lowp vec4 tmpvar_2;\n  tmpvar_2 = mix (texture2D (u_image, mix (u_pattern_tl, u_pattern_br, tmpvar_1)), texture2D (u_image, mix (u_pattern_tl, u_pattern_br, (vec2(mod (\n    (tmpvar_1 * 2.0)\n  , 1.0))))), u_mix);\n  lowp vec4 tmpvar_3;\n  tmpvar_3 = (tmpvar_2 + (u_color * (1.0 - tmpvar_2.w)));\n  gl_FragColor = tmpvar_3;\n}\n\n"
                },
                point: {
                    vertex: "precision mediump float;\nuniform mat4 u_posmatrix;\nuniform vec2 u_size;\nuniform vec2 u_texsize;\nuniform mat2 u_rotationmatrix;\nuniform float u_zoom;\nattribute vec2 a_pos;\nattribute vec2 a_tl;\nattribute vec2 a_br;\nattribute float a_angle;\nattribute float a_minzoom;\nvarying mat2 a;\nvarying vec2 b;\nvarying vec2 c;\nvoid main ()\n{\n  vec4 tmpvar_1;\n  tmpvar_1.zw = vec2(0.0, 1.0);\n  tmpvar_1.xy = a_pos;\n  vec4 tmpvar_2;\n  tmpvar_2 = (u_posmatrix * tmpvar_1);\n  gl_Position.xyw = tmpvar_2.xyw;\n  gl_PointSize = (u_size.x * 1.42);\n  gl_Position.z = (tmpvar_2.z + (1.0 - float(\n    (u_zoom >= a_minzoom)\n  )));\n  float tmpvar_3;\n  tmpvar_3 = ((6.28319 * a_angle) / 256.0);\n  mat2 tmpvar_4;\n  tmpvar_4[0].x = cos(tmpvar_3);\n  tmpvar_4[0].y = -(sin(tmpvar_3));\n  tmpvar_4[1].x = sin(tmpvar_3);\n  tmpvar_4[1].y = cos(tmpvar_3);\n  a = (tmpvar_4 * u_rotationmatrix);\n  b = (a_tl / u_texsize);\n  c = (a_br / u_texsize);\n}\n\n",
                    fragment: "precision mediump float;\nuniform sampler2D u_image;\nuniform vec4 u_color;\nuniform bool u_invert;\nvarying mat2 a;\nvarying vec2 b;\nvarying vec2 c;\nvoid main ()\n{\n  mediump vec4 f_1;\n  mediump vec2 tmpvar_2;\n  tmpvar_2 = (((\n    (a * ((gl_PointCoord * 2.0) - 1.0))\n   * 1.42) / 2.0) + 0.5);\n  mediump vec2 tmpvar_3;\n  tmpvar_3 = mix (b, c, tmpvar_2);\n  lowp vec4 tmpvar_4;\n  tmpvar_4 = texture2D (u_image, tmpvar_3);\n  mediump vec4 tmpvar_5;\n  tmpvar_5 = (tmpvar_4 * ((\n    (float((tmpvar_2.x >= 0.0)) * float((tmpvar_2.y >= 0.0)))\n   * \n    (1.0 - float((tmpvar_2.x >= 1.0)))\n  ) * (1.0 - \n    float((tmpvar_2.y >= 1.0))\n  )));\n  f_1 = tmpvar_5;\n  if (u_invert) {\n    f_1.xyz = (1.0 - tmpvar_5.xyz);\n  };\n  f_1.xyz = (f_1.xyz * tmpvar_5.w);\n  gl_FragColor = (u_color * f_1);\n}\n\n"
                },
                raster: {
                    vertex: "precision mediump float;\nuniform mat4 u_posmatrix;\nuniform vec2 u_tl_parent;\nuniform float u_scale_parent;\nattribute vec2 a_pos;\nvarying vec2 a;\nvarying vec2 b;\nvoid main ()\n{\n  vec4 tmpvar_1;\n  tmpvar_1.zw = vec2(0.0, 1.0);\n  tmpvar_1.xy = a_pos;\n  gl_Position = (u_posmatrix * tmpvar_1);\n  vec2 tmpvar_2;\n  tmpvar_2 = (a_pos / 4096.0);\n  a = tmpvar_2;\n  b = ((tmpvar_2 * u_scale_parent) + u_tl_parent);\n}\n\n",
                    fragment: "precision mediump float;\nuniform float u_opacity0;\nuniform float u_opacity1;\nuniform float u_brightness_low;\nuniform float u_brightness_high;\nuniform float u_saturation_factor;\nuniform float u_contrast_factor;\nuniform sampler2D u_image0;\nuniform sampler2D u_image1;\nvarying vec2 a;\nvarying vec2 b;\nuniform vec3 u_spin_weights;\nvoid main ()\n{\n  lowp vec4 tmpvar_1;\n  tmpvar_1 = ((texture2D (u_image0, a) * u_opacity0) + (texture2D (u_image1, b) * u_opacity1));\n  lowp vec3 tmpvar_2;\n  tmpvar_2.x = dot (tmpvar_1.xyz, u_spin_weights);\n  tmpvar_2.y = dot (tmpvar_1.xyz, u_spin_weights.zxy);\n  tmpvar_2.z = dot (tmpvar_1.xyz, u_spin_weights.yzx);\n  lowp vec4 tmpvar_3;\n  tmpvar_3.xyz = mix (vec3(u_brightness_low), vec3(u_brightness_high), ((\n    ((tmpvar_2 + ((\n      (((tmpvar_1.x + tmpvar_1.y) + tmpvar_1.z) / 3.0)\n     - tmpvar_2) * u_saturation_factor)) - 0.5)\n   * u_contrast_factor) + 0.5));\n  tmpvar_3.w = tmpvar_1.w;\n  gl_FragColor = tmpvar_3;\n}\n\n"
                },
                sdf: {
                    vertex: "precision mediump float;\nattribute vec2 a_pos;\nattribute vec2 a_offset;\nattribute vec2 a_tex;\nattribute float a_angle;\nattribute float a_minzoom;\nattribute float a_maxzoom;\nattribute float a_rangeend;\nattribute float a_rangestart;\nattribute float a_labelminzoom;\nuniform mat4 u_posmatrix;\nuniform mat4 u_exmatrix;\nuniform float u_angle;\nuniform float u_zoom;\nuniform float u_flip;\nuniform float u_fadedist;\nuniform float u_minfadezoom;\nuniform float u_maxfadezoom;\nuniform float u_fadezoom;\nuniform vec2 u_texsize;\nvarying vec2 a;\nvarying float b;\nvoid main ()\n{\n  float d_1;\n  d_1 = 0.0;\n  float tmpvar_2;\n  tmpvar_2 = (float(mod ((a_angle + u_angle), 256.0)));\n  if ((((u_flip > 0.0) && (tmpvar_2 >= 64.0)) && (tmpvar_2 < 192.0))) {\n    d_1 = 1.0;\n  };\n  float tmpvar_3;\n  tmpvar_3 = (((2.0 - \n    float((u_zoom >= a_minzoom))\n  ) - (1.0 - \n    float((u_zoom >= a_maxzoom))\n  )) + d_1);\n  float tmpvar_4;\n  tmpvar_4 = clamp (((u_fadezoom - a_labelminzoom) / u_fadedist), 0.0, 1.0);\n  if ((u_fadedist >= 0.0)) {\n    b = tmpvar_4;\n  } else {\n    b = (1.0 - tmpvar_4);\n  };\n  if ((u_maxfadezoom < a_labelminzoom)) {\n    b = 0.0;\n  };\n  if ((u_minfadezoom >= a_labelminzoom)) {\n    b = 1.0;\n  };\n  vec4 tmpvar_5;\n  tmpvar_5.zw = vec2(0.0, 1.0);\n  tmpvar_5.xy = a_pos;\n  vec4 tmpvar_6;\n  tmpvar_6.w = 0.0;\n  tmpvar_6.xy = (a_offset / 64.0);\n  tmpvar_6.z = ((tmpvar_3 + float(\n    (0.0 >= b)\n  )) + (float(\n    (u_angle >= a_rangeend)\n  ) * (1.0 - \n    float((u_angle >= a_rangestart))\n  )));\n  gl_Position = ((u_posmatrix * tmpvar_5) + (u_exmatrix * tmpvar_6));\n  a = ((a_tex * 4.0) / u_texsize);\n}\n\n",
                    fragment: "precision mediump float;\nuniform sampler2D u_texture;\nuniform vec4 u_color;\nuniform float u_buffer;\nuniform float u_gamma;\nvarying vec2 a;\nvarying float b;\nvoid main ()\n{\n  float edge0_1;\n  edge0_1 = (u_buffer - u_gamma);\n  lowp float tmpvar_2;\n  tmpvar_2 = clamp (((texture2D (u_texture, a).w - edge0_1) / (\n    (u_buffer + u_gamma)\n   - edge0_1)), 0.0, 1.0);\n  lowp vec4 tmpvar_3;\n  tmpvar_3 = (u_color * ((tmpvar_2 * \n    (tmpvar_2 * (3.0 - (2.0 * tmpvar_2)))\n  ) * b));\n  gl_FragColor = tmpvar_3;\n}\n\n"
                }
            }
        }, {}
    ],
    31: [
        function(require, module) {
            "use strict";

            function AnimationLoop() {
                this.n = 0, this.times = []
            }
            module.exports = AnimationLoop, AnimationLoop.prototype.stopped = function() {
                return this.times = this.times.filter(function(t) {
                    return t.time >= (new Date).getTime()
                }), !this.times.length
            }, AnimationLoop.prototype.set = function(t) {
                return this.times.push({
                    id: this.n,
                    time: t + (new Date).getTime()
                }), this.n++
            }, AnimationLoop.prototype.cancel = function(n) {
                this.times = this.times.filter(function(t) {
                    return t.id != n
                })
            }
        }, {}
    ],
    32: [
        function(require, module) {
            "use strict";
            module.exports = function(bucket, excludes) {
                function keyValue(v) {
                    return {
                        key: key,
                        value: v
                    }
                }
                if ("filter" in bucket) {
                    var key, value, filters = [];
                    for (key in bucket.filter) excludes && -1 !== excludes.indexOf(key) || (value = bucket.filter[key], Array.isArray(value) ? filters.push.apply(filters, value.map(keyValue)) : filters.push({
                        key: key,
                        value: value
                    }));
                    if (filters.length) return new Function("f", "return " + filters.map(function(f) {
                        return "f[" + JSON.stringify(f.key) + "] == " + JSON.stringify(f.value)
                    }).join(" || ") + ";")
                }
            }
        }, {}
    ],
    33: [
        function(require, module) {
            "use strict";

            function ImageSprite(base) {
                var sprite = this;
                this.base = base, this.retina = window.devicePixelRatio > 1;
                var xhr = new XMLHttpRequest;
                xhr.open("GET", sprite.base + (sprite.retina ? "@2x" : "") + ".json", !0), xhr.onload = function() {
                    xhr.status >= 200 && xhr.status < 300 && xhr.response && (sprite.data = JSON.parse(xhr.response), sprite.img.complete && sprite.fire("loaded"))
                }, xhr.send(), sprite.img = new Image, sprite.img.onload = function() {
                    sprite.data && sprite.fire("loaded")
                }, this.img.src = sprite.base + (sprite.retina ? "@2x.png" : ".png")
            }
            var Evented = require("../util/evented.js");
            module.exports = ImageSprite, ImageSprite.prototype = Object.create(Evented), ImageSprite.prototype.toJSON = function() {
                return this.base
            }, ImageSprite.prototype.resize = function(gl) {
                var sprite = this;
                if (window.devicePixelRatio > 1 !== sprite.retina) {
                    var newSprite = new ImageSprite(sprite.base);
                    newSprite.on("loaded", function() {
                        sprite.img = newSprite.img, sprite.data = newSprite.data, sprite.retina = newSprite.retina, sprite.texture && (gl.deleteTexture(sprite.texture), delete sprite.texture)
                    })
                }
            }, ImageSprite.prototype.bind = function(gl, linear) {
                var sprite = this;
                sprite.texture ? gl.bindTexture(gl.TEXTURE_2D, sprite.texture) : (sprite.texture = gl.createTexture(), gl.bindTexture(gl.TEXTURE_2D, sprite.texture), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE), gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sprite.img));
                var filter = linear ? gl.LINEAR : gl.NEAREST;
                filter !== sprite.filter && (gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter))
            }, ImageSprite.prototype.getPosition = function(name, repeating) {
                repeating = repeating === !0 ? 1 : 0;
                var pos = this.data && this.data[name];
                if (pos && this.img.complete) {
                    var width = this.img.width,
                        height = this.img.height;
                    return {
                        size: [pos.width, pos.height],
                        tl: [(pos.x + repeating) / width, (pos.y + repeating) / height],
                        br: [(pos.x + pos.width - 2 * repeating) / width, (pos.y + pos.height - 2 * repeating) / height]
                    }
                }
            }
        }, {
            "../util/evented.js": 61
        }
    ],
    34: [
        function(require, module) {
            "use strict";

            function Style(stylesheet, animationLoop) {
                "object" != typeof stylesheet.buckets, !Array.isArray(stylesheet.layers), this.classes = {
                    "default": !0
                }, this.stylesheet = stylesheet, this.animationLoop = animationLoop, this.layers = {}, this.computed = {}, this.sources = {}, this.cascade(), this.fire("change:buckets"), stylesheet.sprite && this.setSprite(stylesheet.sprite)
            }

            function premultiplyLayer(layer, type) {
                var colorProp = type + "-color",
                    color = layer[colorProp],
                    opacity = layer[type + "-opacity"];
                color && 0 === opacity ? layer.hidden = !0 : color && opacity && (layer[colorProp] = util.premultiply([color[0], color[1], color[2], opacity]))
            }
            var Evented = require("../util/evented.js"),
                StyleTransition = require("./styletransition.js"),
                StyleDeclaration = require("./styledeclaration.js"),
                ImageSprite = require("./imagesprite.js"),
                util = require("../util/util.js");
            module.exports = Style, Style.prototype = Object.create(Evented), Style.prototype.recalculate = function(z) {
                function groupLayers(layers) {
                    for (var i = layers.length - 1, groups = []; i >= 0;) {
                        var layer = layers[i],
                            bucket = buckets[layer.bucket],
                            source = bucket && bucket.filter.source,
                            group = [];
                        for (group.dependencies = {}, group.source = source, group.composited = layer.layers; i >= 0;) {
                            layer = layers[i], bucket = buckets[layer.bucket], source = bucket && bucket.filter.source;
                            var style = layerValues[layer.id];
                            if (style && !style.hidden) {
                                if (source !== group.source && "background" !== layer.id) break;
                                layer.layers ? group.dependencies[layer.id] = groupLayers(layer.layers) : source && (sources[source] = !0), group.push(layer), i--
                            } else i--
                        }
                        groups.push(group)
                    }
                    return groups
                }
                var layers = this.layers,
                    layerValues = {};
                this.rasterFadeDuration = 300;
                for (var name in layers) {
                    var layer = layers[name],
                        appliedLayer = layerValues[name] = {};
                    for (var rule in layer) {
                        var transition = layer[rule];
                        appliedLayer[rule] = transition.at(z)
                    }
                    premultiplyLayer(appliedLayer, "line"), premultiplyLayer(appliedLayer, "fill"), premultiplyLayer(appliedLayer, "stroke"), premultiplyLayer(appliedLayer, "point"), appliedLayer["raster-fade"] && (this.rasterFadeDuration = Math.max(this.rasterFadeDuration, appliedLayer["raster-fade"]))
                }
                var buckets = this.stylesheet.buckets,
                    sources = this.sources = {};
                this.layerGroups = groupLayers(this.stylesheet.layers), this.computed = layerValues, this.z = z, this.fire("zoom")
            }, Style.prototype.cascade = function() {
                var name, prop, layer, newStyle = {}, sheetClasses = this.stylesheet.styles,
                    transitions = {};
                if (sheetClasses) {
                    for (var className in sheetClasses)
                        if (this.classes[className])
                            for (name in sheetClasses[className]) {
                                layer = sheetClasses[className][name], newStyle[name] = newStyle[name] || {}, transitions[name] = transitions[name] || {};
                                for (prop in layer) 0 !== prop.indexOf("transition-") && (newStyle[name][prop] = layer[prop]);
                                for (prop in layer) 0 === prop.indexOf("transition-") ? transitions[name][prop.replace("transition-", "")] = layer[prop] : StyleTransition.prototype.interpolators[prop] && (transitions[name][prop] = {
                                    delay: 0,
                                    duration: 300
                                })
                            }
                        var layers = {};
                    for (name in newStyle) {
                        layer = newStyle[name], "undefined" == typeof layers[name] && (layers[name] = {});
                        for (prop in layer) {
                            var newDeclaration = new StyleDeclaration(prop, layer[prop], this.stylesheet.constants),
                                oldTransition = this.layers[name] && this.layers[name][prop],
                                transition = transitions[name][prop];
                            if (oldTransition && oldTransition.declaration.json === newDeclaration.json) layers[name][prop] = oldTransition;
                            else {
                                var newTransition = new StyleTransition(newDeclaration, oldTransition, transition);
                                layers[name][prop] = newTransition, newTransition.loopID = this.animationLoop.set(newTransition.endTime - (new Date).getTime()), oldTransition && this.animationLoop.cancel(oldTransition.loopID)
                            }
                        }
                    }
                    this.layers = layers, this.fire("change")
                }
            }, Style.prototype.setSprite = function(sprite) {
                var style = this;
                this.sprite = new ImageSprite(sprite), this.sprite.on("loaded", function() {
                    style.fire("change"), style.fire("change:sprite")
                })
            }, Style.prototype.getDefaultClass = function() {
                var klass = this.getClass("default");
                return klass
            }, Style.prototype.getClass = function(name) {
                for (var classes = this.stylesheet.styles, i = 0; i < classes.length; i++)
                    if (classes[i].name === name) return classes[i]
            }, Style.prototype.addClass = function(n) {
                this.classes[n] || (this.classes[n] = !0, this.cascade())
            }, Style.prototype.removeClass = function(n) {
                this.classes[n] && (delete this.classes[n], this.cascade())
            }, Style.prototype.hasClass = function(n) {
                return !!this.classes[n]
            }, Style.prototype.setClassList = function(l) {
                this.classes = {
                    "default": !0
                };
                for (var i = 0; i < l.length; i++) this.classes[l[i]] = !0;
                this.cascade()
            }, Style.prototype.getClassList = function() {
                return Object.keys(this.classes).filter(function(d) {
                    return "default" !== d
                })
            }
        }, {
            "../util/evented.js": 61,
            "../util/util.js": 64,
            "./imagesprite.js": 33,
            "./styledeclaration.js": 35,
            "./styletransition.js": 36
        }
    ],
    35: [
        function(require, module) {
            "use strict";

            function StyleDeclaration(prop, value, constants) {
                var parser = this.parsers[prop];
                parser && (this.prop = prop, "object" == typeof constants && value in constants && (value = constants[value]), this.value = parser(value), this.constants = constants, this.json = JSON.stringify(value))
            }

            function constant(x) {
                return x
            }

            function parseWidth(width) {
                width = parseFunction(width);
                var value = +width;
                return isNaN(value) ? width : value
            }

            function parseWidthArray(array) {
                var widths = array.map(parseWidth);
                return function(z) {
                    for (var result = [], i = 0; i < widths.length; i++) result.push("function" == typeof widths[i] ? widths[i](z) : widths[i]);
                    return result
                }
            }

            function parseColor(value) {
                if (Array.isArray(value)) return util.premultiply(value.slice());
                if (colorCache[value]) return colorCache[value];
                var canvas = document.createElement("canvas"),
                    ctx = canvas.getContext("2d");
                canvas.width = 1, canvas.height = 1, ctx.fillStyle = value, ctx.fillRect(0, 0, 1, 1);
                var c = ctx.getImageData(0, 0, 1, 1).data,
                    color = util.premultiply([c[0] / 255, c[1] / 255, c[2] / 255, c[3] / 255]);
                return colorCache[value] = color, color
            }

            function parseFunction(fn) {
                if (fn.fn) {
                    if (!functionParsers[fn.fn]) throw new Error('The function "' + fn.fn + '" does not exist');
                    return functionParsers[fn.fn](fn)
                }
                return fn
            }

            function linear(params) {
                var z_base = +params.z || 0,
                    val = +params.val || 0,
                    slope = +params.slope || 0,
                    min = +params.min || 0,
                    max = +params.max || 1 / 0;
                return function(z) {
                    return Math.min(Math.max(min, val + (z - z_base) * slope), max)
                }
            }

            function exponential(params) {
                var z_base = +params.z || 0,
                    val = +params.val || 0,
                    slope = +params.slope || 0,
                    min = +params.min || 0,
                    max = +params.max || 1 / 0,
                    base = +params.base || 1.75;
                return function(z) {
                    return Math.min(Math.max(min, val + Math.pow(base, z - z_base) * slope), max)
                }
            }

            function min(params) {
                var min_z = +params.min || 0;
                return function(z) {
                    return z >= min_z
                }
            }

            function stopsFn(params) {
                var stops = params.stops;
                return function(z) {
                    z += 1;
                    for (var smaller = null, larger = null, i = 0; i < stops.length; i++) {
                        var stop = stops[i];
                        stop[0] <= z && (!smaller || smaller[0] < stop[0]) && (smaller = stop), stop[0] >= z && (!larger || larger[0] > stop[0]) && (larger = stop)
                    }
                    if (smaller && larger) {
                        if (larger[0] == smaller[0] || larger[1] == smaller[1]) return smaller[1];
                        var factor = (z - smaller[0]) / (larger[0] - smaller[0]);
                        return 0 === smaller[1] ? factor * larger[1] : smaller[1] * Math.pow(larger[1] / smaller[1], factor)
                    }
                    return larger || smaller ? smaller ? smaller[1] : larger[1] : 1
                }
            }
            var util = require("../util/util.js");
            module.exports = StyleDeclaration, StyleDeclaration.prototype.calculate = function(z) {
                return "function" == typeof this.value ? this.value(z) : this.value
            }, StyleDeclaration.prototype.parsers = {
                hidden: parseFunction,
                opacity: parseFunction,
                "fill-opacity": parseFunction,
                "line-opacity": parseFunction,
                "point-opacity": parseFunction,
                "line-color": parseColor,
                "fill-color": parseColor,
                "stroke-color": parseColor,
                "point-color": parseColor,
                "text-color": parseColor,
                "text-halo-color": parseColor,
                "fill-antialias": constant,
                "point-antialias": constant,
                "line-antialias": constant,
                "line-width": parseWidth,
                "line-offset": parseWidth,
                "line-blur": parseWidth,
                "point-radius": parseWidth,
                "point-blur": parseWidth,
                "point-rotate": parseWidth,
                "text-size": parseWidth,
                "text-halo-width": parseWidth,
                "text-halo-blur": parseWidth,
                "line-dasharray": parseWidthArray,
                "line-translate": parseWidthArray,
                "fill-translate": parseWidthArray,
                "text-translate": parseWidthArray,
                "point-image": constant,
                "point-size": constant,
                "point-alignment": constant,
                "raster-spin": constant,
                "raster-brightness-low": constant,
                "raster-brightness-high": constant,
                "raster-saturation": constant,
                "raster-contrast": constant,
                "raster-fade": constant
            };
            var colorCache = {}, functionParsers = StyleDeclaration.functionParsers = {
                    linear: linear,
                    exponential: exponential,
                    min: min,
                    stops: stopsFn
                }
        }, {
            "../util/util.js": 64
        }
    ],
    36: [
        function(require, module) {
            "use strict";

            function StyleTransition(declaration, oldTransition, value) {
                this.declaration = declaration, this.interp = this.interpolators[declaration.prop], this.startTime = this.endTime = (new Date).getTime();
                var instant = !oldTransition || !this.interp || !value || 0 === value.duration && 0 === value.delay;
                instant || (this.endTime = this.startTime + (value.duration || 0) + (value.delay || 0), this.duration = value.duration, this.delay = value.delay, this.ease = util.easeCubicInOut, this.oldTransition = oldTransition), oldTransition && oldTransition.endTime <= this.startTime && delete oldTransition.oldTransition
            }

            function interpNumberArray(from, to, t) {
                return from.map(function(d, i) {
                    return interpNumber(d, to[i], t)
                })
            }

            function interpColor(from, to, t) {
                return [interpNumber(from[0], to[0], t), interpNumber(from[1], to[1], t), interpNumber(from[2], to[2], t), interpNumber(from[3], to[3], t)]
            }
            var util = require("../util/util.js");
            module.exports = StyleTransition, StyleTransition.prototype.at = function(z, t) {
                "undefined" == typeof t && (t = (new Date).getTime());
                var calculatedValue = this.declaration.calculate(z, t);
                if (t < this.endTime) {
                    var oldCalculatedValue = this.oldTransition.at(z, this.startTime),
                        eased = this.ease((t - this.startTime - this.delay) / this.duration);
                    calculatedValue = this.interp(oldCalculatedValue, calculatedValue, eased)
                }
                return calculatedValue
            };
            var interpNumber = util.interp;
            StyleTransition.prototype.interpolators = {
                "fill-opacity": interpNumber,
                "line-opacity": interpNumber,
                "point-opacity": interpNumber,
                opacity: interpNumber,
                "fill-color": interpColor,
                "line-color": interpColor,
                "stroke-color": interpColor,
                "text-color": interpColor,
                "text-halo-color": interpColor,
                "line-width": interpNumber,
                "line-offset": interpNumber,
                "point-radius": interpNumber,
                "point-blur": interpNumber,
                "line-blur": interpNumber,
                "fade-dist": interpNumber,
                "text-halo-width": interpNumber,
                "line-dasharray": interpNumberArray,
                "raster-brightness-low": interpNumber,
                "raster-brightness-high": interpNumber,
                "raster-saturation": interpNumber
            }
        }, {
            "../util/util.js": 64
        }
    ],
    37: [
        function(require, module) {
            "use strict";

            function BinPack(width, height) {
                this.width = width, this.height = height, this.free = [{
                    x: 0,
                    y: 0,
                    w: width,
                    h: height
                }]
            }
            module.exports = BinPack, BinPack.prototype.release = function(rect) {
                for (var i = 0; i < this.free.length; i++) {
                    var free = this.free[i];
                    if (free.y == rect.y && free.h == rect.h && free.x + free.w == rect.x) free.w += rect.w;
                    else if (free.x == rect.x && free.w == rect.w && free.y + free.h == rect.y) free.h += rect.h;
                    else if (rect.y == free.y && rect.h == free.h && rect.x + rect.w == free.x) free.x = rect.x, free.w += rect.w;
                    else {
                        if (rect.x != free.x || rect.w != free.w || rect.y + rect.h != free.y) continue;
                        free.y = rect.y, free.h += rect.h
                    }
                    return this.free.splice(i, 1), void this.release(free)
                }
                this.free.push(rect)
            }, BinPack.prototype.allocate = function(width, height) {
                for (var rect = {
                    x: 1 / 0,
                    y: 1 / 0,
                    w: 1 / 0,
                    h: 1 / 0
                }, smallest = -1, i = 0; i < this.free.length; i++) {
                    var ref = this.free[i];
                    width <= ref.w && height <= ref.h && ref.y <= rect.y && ref.x <= rect.x && (rect = ref, smallest = i)
                }
                return 0 > smallest ? {
                    x: -1,
                    y: -1
                } : (this.free.splice(smallest, 1), rect.w < rect.h ? (rect.w > width && this.free.push({
                    x: rect.x + width,
                    y: rect.y,
                    w: rect.w - width,
                    h: height
                }), rect.h > height && this.free.push({
                    x: rect.x,
                    y: rect.y + height,
                    w: rect.w,
                    h: rect.h - height
                })) : (rect.w > width && this.free.push({
                    x: rect.x + width,
                    y: rect.y,
                    w: rect.w - width,
                    h: rect.h
                }), rect.h > height && this.free.push({
                    x: rect.x,
                    y: rect.y + height,
                    w: width,
                    h: rect.h - height
                })), {
                    x: rect.x,
                    y: rect.y,
                    w: width,
                    h: height
                })
            }
        }, {}
    ],
    38: [
        function(require, module) {
            "use strict";

            function Collision() {
                this.hTree = rbush(), this.cTree = rbush();
                var m = 4096;
                this.insert([{
                    box: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 8 * m
                    },
                    minScale: 0
                }, {
                    box: {
                        x1: 0,
                        y1: 0,
                        x2: 8 * m,
                        y2: 0
                    },
                    minScale: 0
                }], new Point(0, 0), 1, [2 * Math.PI, 0], !1, 2), this.insert([{
                    box: {
                        x1: 8 * -m,
                        y1: 0,
                        x2: 0,
                        y2: 0
                    },
                    minScale: 0
                }, {
                    box: {
                        x1: 0,
                        y1: 8 * -m,
                        x2: 0,
                        y2: 0
                    },
                    minScale: 0
                }], new Point(m, m), 1, [2 * Math.PI, 0], !1, 2)
            }

            function getMergedGlyphs(glyphs, anchor) {
                for (var mergedglyphs = {
                    box: {
                        x1: 1 / 0,
                        y1: 1 / 0,
                        x2: -1 / 0,
                        y2: -1 / 0
                    },
                    anchor: anchor,
                    minScale: 0
                }, box = mergedglyphs.box, m = 0; m < glyphs.length; m++) {
                    var gbox = glyphs[m].box;
                    box.x1 = Math.min(box.x1, gbox.x1), box.y1 = Math.min(box.y1, gbox.y1), box.x2 = Math.max(box.x2, gbox.x2), box.y2 = Math.max(box.y2, gbox.y2), mergedglyphs.minScale = Math.max(mergedglyphs.minScale, glyphs[m].minScale)
                }
                return mergedglyphs
            }
            var rbush = require("rbush"),
                rotationRange = require("./rotationrange.js"),
                Point = require("../geometry/point.js");
            module.exports = Collision, Collision.prototype.place = function(boxes, anchor, minPlacementScale, maxPlacementScale, padding, horizontal, alwaysVisible) {
                for (var minScale = 1 / 0, m = 0; m < boxes.length; m++) minScale = Math.min(minScale, boxes[m].minScale);
                if (minPlacementScale = Math.max(minPlacementScale, minScale), horizontal) {
                    boxes = [getMergedGlyphs(boxes, anchor)];
                    var box = boxes[0].box,
                        x12 = box.x1 * box.x1,
                        y12 = box.y1 * box.y1,
                        x22 = box.x2 * box.x2,
                        y22 = box.y2 * box.y2,
                        diag = Math.sqrt(Math.max(x12 + y12, x12 + y22, x22 + y12, x22 + y22));
                    boxes[0].hBox = {
                        x1: -diag,
                        y1: -diag,
                        x2: diag,
                        y2: diag
                    }
                }
                var scale = alwaysVisible ? minPlacementScale : this.getPlacementScale(boxes, minPlacementScale, maxPlacementScale, padding);
                if (null === scale) return null;
                var rotationRange = alwaysVisible ? [2 * Math.PI, 0] : this.getPlacementRange(boxes, scale, horizontal);
                this.insert(boxes, anchor, scale, rotationRange, horizontal, padding);
                var zoom = Math.log(scale) / Math.LN2;
                return {
                    zoom: zoom,
                    rotationRange: rotationRange
                }
            }, Collision.prototype.getPlacementScale = function(glyphs, minPlacementScale, maxPlacementScale, pad) {
                for (var k = 0; k < glyphs.length; k++) {
                    var glyph = glyphs[k],
                        box = glyph.box,
                        bbox = glyph.hBox || box,
                        anchor = glyph.anchor;
                    if (anchor.x < 0 || anchor.x > 4096 || anchor.y < 0 || anchor.y > 4096) return null;
                    var minScale = Math.max(minPlacementScale, glyph.minScale),
                        maxScale = glyph.maxScale || 1 / 0;
                    if (!(minScale >= maxScale)) {
                        var searchBox = [anchor.x + bbox.x1 / minScale, anchor.y + bbox.y1 / minScale, anchor.x + bbox.x2 / minScale, anchor.y + bbox.y2 / minScale],
                            blocking = this.hTree.search(searchBox).concat(this.cTree.search(searchBox));
                        if (blocking.length)
                            for (var na = anchor, nb = box, l = 0; l < blocking.length; l++) {
                                var oa = blocking[l].anchor,
                                    ob = blocking[l].box;
                                if (na.equals(oa)) return null;
                                var padding = 8 * Math.max(pad, blocking[l].padding),
                                    s1 = (ob.x1 - nb.x2 - padding) / (na.x - oa.x),
                                    s2 = (ob.x2 - nb.x1 + padding) / (na.x - oa.x),
                                    s3 = (ob.y1 - nb.y2 - padding) / (na.y - oa.y),
                                    s4 = (ob.y2 - nb.y1 + padding) / (na.y - oa.y);
                                (isNaN(s1) || isNaN(s2)) && (s1 = s2 = 1), (isNaN(s3) || isNaN(s4)) && (s3 = s4 = 1);
                                var collisionFreeScale = Math.min(Math.max(s1, s2), Math.max(s3, s4));
                                if (collisionFreeScale > minPlacementScale && collisionFreeScale > minScale && maxScale > collisionFreeScale && collisionFreeScale < blocking[l].maxScale && (minPlacementScale = collisionFreeScale), minPlacementScale > maxPlacementScale) return null
                            }
                    }
                }
                return minPlacementScale
            }, Collision.prototype.getPlacementRange = function(glyphs, placementScale, horizontal) {
                for (var placementRange = [2 * Math.PI, 0], k = 0; k < glyphs.length; k++) {
                    var glyph = glyphs[k],
                        bbox = glyph.hBox || glyph.box,
                        anchor = glyph.anchor,
                        minPlacedX = anchor.x + bbox.x1 / placementScale,
                        minPlacedY = anchor.y + bbox.y1 / placementScale,
                        maxPlacedX = anchor.x + bbox.x2 / placementScale,
                        maxPlacedY = anchor.y + bbox.y2 / placementScale,
                        searchBox = [minPlacedX, minPlacedY, maxPlacedX, maxPlacedY],
                        blocking = this.hTree.search(searchBox);
                    horizontal && (blocking = blocking.concat(this.cTree.search(searchBox)));
                    for (var l = 0; l < blocking.length; l++) {
                        var x1, x2, y1, y2, intersectX, intersectY, b = blocking[l],
                            bbox2 = b.hBox || b.box;
                        if (placementScale > b.placementScale ? (x1 = b.anchor.x + bbox2.x1 / placementScale, y1 = b.anchor.y + bbox2.y1 / placementScale, x2 = b.anchor.x + bbox2.x2 / placementScale, y2 = b.anchor.y + bbox2.y2 / placementScale, intersectX = maxPlacedX > x1 && x2 > minPlacedX, intersectY = maxPlacedY > y1 && y2 > minPlacedY) : (x1 = anchor.x + bbox.x1 / b.placementScale, y1 = anchor.y + bbox.y1 / b.placementScale, x2 = anchor.x + bbox.x2 / b.placementScale, y2 = anchor.y + bbox.y2 / b.placementScale, intersectX = x1 < b[2] && x2 > b[0], intersectY = y1 < b[3] && y2 > b[1]), intersectX && intersectY) {
                            var scale = Math.max(placementScale, b.placementScale),
                                range = rotationRange.rotationRange(glyph, b, scale);
                            placementRange[0] = Math.min(placementRange[0], range[0]), placementRange[1] = Math.max(placementRange[1], range[1])
                        }
                    }
                }
                return placementRange
            }, Collision.prototype.insert = function(glyphs, anchor, placementScale, placementRange, horizontal, padding) {
                for (var allBounds = [], k = 0; k < glyphs.length; k++) {
                    var glyph = glyphs[k],
                        bbox = glyph.hBox || glyph.box,
                        minScale = Math.max(placementScale, glyph.minScale),
                        bounds = [anchor.x + bbox.x1 / minScale, anchor.y + bbox.y1 / minScale, anchor.x + bbox.x2 / minScale, anchor.y + bbox.y2 / minScale];
                    bounds.anchor = anchor, bounds.box = glyph.box, glyph.hBox && (glyph.hBox = bbox), bounds.placementRange = placementRange, bounds.placementScale = minScale, bounds.maxScale = glyph.maxScale || 1 / 0, bounds.padding = padding, allBounds.push(bounds)
                }(horizontal ? this.hTree : this.cTree).load(allBounds)
            }
        }, {
            "../geometry/point.js": 18,
            "./rotationrange.js": 43,
            rbush: 75
        }
    ],
    39: [
        function(require, module) {
            "use strict";

            function GlyphAtlas(width, height) {
                this.width = width, this.height = height, this.bin = new BinPack(width, height), this.index = {}, this.ids = {}, this.data = new Uint8Array(width * height)
            }
            var BinPack = require("./binpack.js");
            module.exports = GlyphAtlas, GlyphAtlas.prototype = {
                get debug() {
                    return "canvas" in this
                }, set debug(value) {
                    value && !this.canvas ? (this.canvas = document.createElement("canvas"), this.canvas.width = this.width, this.canvas.height = this.height, document.body.appendChild(this.canvas), this.ctx = this.canvas.getContext("2d")) : !value && this.canvas && (this.canvas.parentNode.removeChild(this.canvas), delete this.ctx, delete this.canvas)
                }
            }, GlyphAtlas.prototype.getGlyphs = function() {
                var split, name, id, glyphs = {};
                for (var key in this.ids) split = key.split("#"), name = split[0], id = split[1], glyphs[name] || (glyphs[name] = []), glyphs[name].push(id);
                return glyphs
            }, GlyphAtlas.prototype.getRects = function() {
                var split, name, id, rects = {};
                for (var key in this.ids) split = key.split("#"), name = split[0], id = split[1], rects[name] || (rects[name] = {}), rects[name][id] = this.index[key];
                return rects
            }, GlyphAtlas.prototype.removeGlyphs = function(id) {
                for (var key in this.ids) {
                    var ids = this.ids[key],
                        pos = ids.indexOf(id);
                    if (pos >= 0 && ids.splice(pos, 1), this.ids[key] = ids, !ids.length) {
                        for (var rect = this.index[key], target = this.data, y = 0; y < rect.h; y++)
                            for (var y1 = this.width * (rect.y + y) + rect.x, x = 0; x < rect.w; x++) target[y1 + x] = 0;
                        this.dirty = !0, this.bin.release(rect), delete this.index[key], delete this.ids[key]
                    }
                }
                this.updateTexture(this.gl)
            }, GlyphAtlas.prototype.addGlyph = function(id, name, glyph, buffer) {
                if (!glyph) return null;
                var key = name + "#" + glyph.id;
                if (this.index[key]) return this.ids[key].indexOf(id) < 0 && this.ids[key].push(id), this.index[key];
                if (!glyph.bitmap) return null;
                var buffered_width = glyph.width + 2 * buffer,
                    buffered_height = glyph.height + 2 * buffer,
                    pack_width = buffered_width,
                    pack_height = buffered_height;
                pack_width += 4 - pack_width % 4, pack_height += 4 - pack_height % 4;
                var rect = this.bin.allocate(pack_width, pack_height);
                if (rect.x < 0) return {
                    glyph: glyph,
                    rect: null
                };
                rect.l = glyph.left, rect.t = glyph.top, this.index[key] = rect, this.ids[key] = [id];
                for (var target = this.data, source = glyph.bitmap, y = 0; buffered_height > y; y++)
                    for (var y1 = this.width * (rect.y + y) + rect.x, y2 = buffered_width * y, x = 0; buffered_width > x; x++) target[y1 + x] = source[y2 + x];
                return this.dirty = !0, rect
            }, GlyphAtlas.prototype.bind = function(gl) {
                this.gl = gl, this.texture ? gl.bindTexture(gl.TEXTURE_2D, this.texture) : (this.texture = gl.createTexture(), gl.bindTexture(gl.TEXTURE_2D, this.texture), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE))
            }, GlyphAtlas.prototype.updateTexture = function(gl) {
                if (this.bind(gl), this.dirty) {
                    if (gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, this.width, this.height, 0, gl.ALPHA, gl.UNSIGNED_BYTE, this.data), this.ctx) {
                        for (var data = this.ctx.getImageData(0, 0, this.width, this.height), i = 0, j = 0; i < this.data.length; i++, j += 4) data.data[j] = this.data[i], data.data[j + 1] = this.data[i], data.data[j + 2] = this.data[i], data.data[j + 3] = 255;
                        this.ctx.putImageData(data, 0, 0), this.ctx.strokeStyle = "red";
                        for (var k = 0; k < this.bin.free.length; k++) {
                            var free = this.bin.free[k];
                            this.ctx.strokeRect(free.x, free.y, free.w, free.h)
                        }
                    }
                    this.dirty = !1
                }
            }
        }, {
            "./binpack.js": 37
        }
    ],
    40: [
        function(require, module) {
            "use strict";

            function rangeLoaded(fontstack, ranges, callback) {
                return function() {
                    for (var numRanges = ranges.length, i = 0; i < ranges.length; i++) stacks[fontstack] && stacks[fontstack].ranges[ranges[i]] && (numRanges -= 1);
                    0 === numRanges && callback()
                }
            }

            function glyphUrl(fontstack, range, url, subdomains) {
                return subdomains = subdomains || "abc", url.replace("{s}", subdomains[fontstack.length % subdomains.length]).replace("{fontstack}", fontstack).replace("{range}", range)
            }

            function loadGlyphRange(tile, fontstack, range, callback) {
                loading[fontstack] = loading[fontstack] || {}, loading[fontstack][range] = !0, onload[fontstack] = onload[fontstack] || {}, onload[fontstack][range] = [callback];
                var url = glyphUrl(fontstack, range, tile.glyphs);
                new GlyphTile(url, function(err, glyphs) {
                    if (!err) {
                        stacks[fontstack] = stacks[fontstack] || {
                            ranges: {},
                            glyphs: {}
                        }, stacks[fontstack].ranges[range] = !0;
                        for (var id in glyphs) stacks[fontstack].glyphs[id] = glyphs[id]
                    }
                    onload[fontstack][range].forEach(function(cb) {
                        cb(err)
                    }), delete loading[fontstack][range], 0 === Object.keys(loading[fontstack]).length && delete loading[fontstack], delete onload[fontstack][range], 0 === Object.keys(onload[fontstack]).length && delete onload[fontstack]
                })
            }

            function ready(tile, fontstack, ranges, callback) {
                for (var range, loaded = rangeLoaded(fontstack, ranges, callback), i = 0; i < ranges.length; i++) range = ranges[i], stacks[fontstack] && stacks[fontstack].ranges[range] ? loaded() : loading[fontstack] && loading[fontstack][range] ? onload[fontstack][range].push(loaded) : loadGlyphRange(tile, fontstack, range, loaded);
                ranges.length || callback()
            }
            var GlyphTile = require("../worker/glyphtile.js");
            module.exports = {
                whenLoaded: ready
            };
            var stacks = module.exports.stacks = {}, loading = {}, onload = {}
        }, {
            "../worker/glyphtile.js": 65
        }
    ],
    41: [
        function(require, module) {
            "use strict";

            function Placement(geometry, zoom, tileSize) {
                this.geometry = geometry, this.zoom = zoom, this.collision = new Collision, this.tileSize = tileSize, this.zOffset = Math.log(256 / this.tileSize) / Math.LN2, this.tileExtent = 4096, this.glyphSize = 24, this.maxPlacementScale = Math.exp(Math.LN2 * Math.min(25.5 - this.zoom, 3))
            }

            function byScale(a, b) {
                return a.scale - b.scale
            }

            function getGlyphs(anchor, origin, shaping, faces, fontScale, horizontal, line, maxAngleDelta, rotate, slant) {
                for (var glyphs = [], boxes = [], buffer = 3, k = 0; k < shaping.length; k++) {
                    var shape = shaping[k],
                        fontstack = faces[shape.fontstack],
                        glyph = fontstack.glyphs[shape.glyph],
                        rect = fontstack.rects[shape.glyph];
                    if (glyph && rect && rect.w > 0 && rect.h > 0) {
                        var glyphInstances, x = (origin.x + shape.x + glyph.left - buffer + rect.w / 2) * fontScale;
                        void 0 !== anchor.segment ? (glyphInstances = [], getSegmentGlyphs(glyphInstances, anchor, x, line, anchor.segment, 1, maxAngleDelta), getSegmentGlyphs(glyphInstances, anchor, x, line, anchor.segment, -1, maxAngleDelta)) : glyphInstances = [{
                            anchor: anchor,
                            offset: 0,
                            angle: 0,
                            maxScale: 1 / 0,
                            minScale: minScale
                        }];
                        var x1 = origin.x + shape.x + glyph.left - buffer,
                            y1 = origin.y + shape.y - glyph.top - buffer,
                            x2 = x1 + rect.w,
                            y2 = y1 + rect.h,
                            otl = new Point(x1, y1),
                            otr = new Point(x2, y1),
                            obl = new Point(x1, y2),
                            obr = new Point(x2, y2);
                        slant && (otl.x -= otl.y * slant, otr.x -= otr.y * slant, obl.x -= obl.y * slant, obr.x -= obr.y * slant);
                        for (var obox = {
                            x1: fontScale * x1,
                            y1: fontScale * y1,
                            x2: fontScale * x2,
                            y2: fontScale * y2
                        }, i = 0; i < glyphInstances.length; i++) {
                            var instance = glyphInstances[i],
                                tl = otl,
                                tr = otr,
                                bl = obl,
                                br = obr,
                                box = obox,
                                angle = instance.angle + rotate;
                            if (angle) {
                                var sin = Math.sin(angle),
                                    cos = Math.cos(angle),
                                    matrix = [cos, -sin, sin, cos];
                                tl = tl.matMult(matrix), tr = tr.matMult(matrix), bl = bl.matMult(matrix), br = br.matMult(matrix)
                            }
                            var glyphMinScale = Math.max(instance.minScale, anchor.scale);
                            glyphs.push({
                                tl: tl,
                                tr: tr,
                                bl: bl,
                                br: br,
                                tex: rect,
                                angle: (anchor.angle + rotate + instance.offset + 2 * Math.PI) % (2 * Math.PI),
                                anchor: instance.anchor,
                                minScale: glyphMinScale,
                                maxScale: instance.maxScale
                            }), instance.offset || (angle && (box = {
                                x1: fontScale * Math.min(tl.x, tr.x, bl.x, br.x),
                                y1: fontScale * Math.min(tl.y, tr.y, bl.y, br.y),
                                x2: fontScale * Math.max(tl.x, tr.x, bl.x, br.x),
                                y2: fontScale * Math.max(tl.y, tr.y, bl.y, br.y)
                            }), boxes.push({
                                box: box,
                                anchor: instance.anchor,
                                minScale: glyphMinScale,
                                maxScale: instance.maxScale
                            }))
                        }
                    }
                }
                return {
                    glyphs: glyphs,
                    boxes: boxes
                }
            }

            function getSegmentGlyphs(glyphs, anchor, offset, line, segment, direction, maxAngleDelta) {
                var upsideDown = 0 > direction;
                0 > offset && (direction *= -1), direction > 0 && segment++;
                var prevAngle, newAnchor = anchor,
                    end = line[segment],
                    prevscale = 1 / 0;
                offset = Math.abs(offset);
                var placementScale = anchor.scale;
                segment_loop: for (;;) {
                    var dist = newAnchor.dist(end),
                        scale = offset / dist,
                        angle = -Math.atan2(end.x - newAnchor.x, end.y - newAnchor.y) + direction * Math.PI / 2;
                    upsideDown && (angle += Math.PI);
                    var angleDiff = (angle - prevAngle) % (2 * Math.PI);
                    if (prevAngle && Math.abs(angleDiff) > maxAngleDelta) {
                        anchor.scale = prevscale;
                        break
                    }
                    if (glyphs.push({
                        anchor: newAnchor,
                        offset: upsideDown ? Math.PI : 0,
                        minScale: scale,
                        maxScale: prevscale,
                        angle: (angle + 2 * Math.PI) % (2 * Math.PI)
                    }), placementScale >= scale) break;
                    for (newAnchor = end; newAnchor.equals(end);)
                        if (segment += direction, end = line[segment], !end) {
                            anchor.scale = scale;
                            break segment_loop
                        }
                    var unit = end.sub(newAnchor)._unit();
                    newAnchor = newAnchor.sub(unit._mult(dist)), prevscale = scale, prevAngle = angle
                }
            }
            var interpolate = require("../geometry/interpolate.js"),
                Anchor = require("../geometry/anchor.js"),
                Point = require("../geometry/point.js"),
                Collision = require("./collision.js");
            module.exports = Placement;
            var minScale = .5;
            Placement.prototype.addFeature = function(line, info, faces, shaping) {
                var anchors, horizontal = "horizontal" === info["text-path"],
                    padding = info["text-padding"] || 2,
                    maxAngleDelta = info["text-max-angle"] || Math.PI,
                    textMinDistance = info["text-min-distance"] || 250,
                    rotate = info["text-rotate"] || 0,
                    slant = info["text-slant"],
                    fontScale = this.tileExtent / this.tileSize / (this.glyphSize / info["text-max-size"]),
                    origin = new Point(0, -17);
                1 === line.length ? anchors = [new Anchor(line[0].x, line[0].y, 0, minScale)] : (anchors = interpolate(line, textMinDistance, minScale), anchors.sort(byScale));
                for (var j = 0, len = anchors.length; len > j; j++) {
                    var anchor = anchors[j],
                        glyphs = getGlyphs(anchor, origin, shaping, faces, fontScale, horizontal, line, maxAngleDelta, rotate, slant),
                        place = this.collision.place(glyphs.boxes, anchor, anchor.scale, this.maxPlacementScale, padding, horizontal, info["text-always-visible"]);
                    place && this.geometry.addGlyphs(glyphs.glyphs, place.zoom, place.rotationRange, this.zoom - this.zOffset)
                }
            }
        }, {
            "../geometry/anchor.js": 5,
            "../geometry/interpolate.js": 13,
            "../geometry/point.js": 18,
            "./collision.js": 38
        }
    ],
    42: [
        function(require, module) {
            "use strict";

            function getRanges(features, info) {
                for (var text_features = [], ranges = [], codepoints = [], i = 0, fl = features.length; fl > i; i++) {
                    var text = resolveTokens(features[i], info["text-field"]),
                        hastext = !1;
                    if (text) {
                        text = text.toString();
                        for (var j = 0, jl = text.length; jl > j; j++) text.charCodeAt(j) <= 65533 && (codepoints.push(text.charCodeAt(j)), hastext = !0);
                        hastext && text_features.push({
                            text: text,
                            geometry: features[i].loadGeometry()
                        })
                    }
                }
                codepoints = uniq(codepoints);
                for (var start, end, codepoint, k = 0, cl = codepoints.length; cl > k; k++) codepoint = codepoints[k], (void 0 === start || codepoint - start > 255) && (start = Math.min(65280, 256 * Math.floor(codepoint / 256)), end = Math.min(65533, start + 255), ranges.push(start + "-" + end));
                return {
                    ranges: ranges,
                    text_features: text_features,
                    codepoints: codepoints
                }
            }

            function uniq(ids) {
                var last, u = [];
                ids.sort(sortNumbers);
                for (var i = 0; i < ids.length; i++) ids[i] !== last && (last = ids[i], u.push(ids[i]));
                return u
            }

            function sortNumbers(a, b) {
                return a - b
            }
            var resolveTokens = require("../util/token.js");
            module.exports = getRanges
        }, {
            "../util/token.js": 63
        }
    ],
    43: [
        function(require, module) {
            "use strict";

            function rotationRange(inserting, blocker, scale) {
                var collisions, box, a = inserting,
                    b = blocker,
                    relativeAnchor = new Point((b.anchor.x - a.anchor.x) * scale, (b.anchor.y - a.anchor.y) * scale);
                return a.hBox && b.hBox ? collisions = rotatingRotatingCollisions(a.box, b.box, relativeAnchor) : a.hBox ? (box = {
                    x1: b.box.x1 + relativeAnchor.x,
                    y1: b.box.y1 + relativeAnchor.y,
                    x2: b.box.x2 + relativeAnchor.x,
                    y2: b.box.y2 + relativeAnchor.y
                }, collisions = rotatingFixedCollisions(a.box, box)) : b.hBox ? (box = {
                    x1: a.box.x1 - relativeAnchor.x,
                    y1: a.box.y1 - relativeAnchor.y,
                    x2: a.box.x2 - relativeAnchor.x,
                    y2: a.box.y2 - relativeAnchor.y
                }, collisions = rotatingFixedCollisions(b.box, box)) : collisions = [], mergeCollisions(collisions, blocker.placementRange)
            }

            function mergeCollisions(collisions, ignoreRange) {
                for (var min = 2 * Math.PI, max = 0, i = 0; i < collisions.length; i++) {
                    var collision = collisions[i],
                        entryOutside = ignoreRange[0] <= collision[0] && collision[0] <= ignoreRange[1],
                        exitOutside = ignoreRange[0] <= collision[1] && collision[1] <= ignoreRange[1];
                    entryOutside && exitOutside || (entryOutside ? (min = Math.min(min, ignoreRange[1]), max = Math.max(max, collision[1])) : exitOutside ? (min = Math.min(min, collision[0]), max = Math.max(max, ignoreRange[0])) : (min = Math.min(min, collision[0]), max = Math.max(max, collision[1])))
                }
                return [min, max]
            }

            function rotatingRotatingCollisions(a, b, anchorToAnchor) {
                var k, d = anchorToAnchor.mag(),
                    angleBetweenAnchors = anchorToAnchor.angleWith(horizontal),
                    c = [],
                    collisions = [];
                c[0] = Math.asin((a.y2 - b.y1) / d), c[1] = Math.asin((a.y2 - b.y1) / d) + Math.PI, c[2] = 2 * Math.PI - Math.asin((-a.y1 + b.y2) / d), c[3] = Math.PI - Math.asin((-a.y1 + b.y2) / d), c[4] = 2 * Math.PI - Math.acos((a.x2 - b.x1) / d), c[5] = Math.acos((a.x2 - b.x1) / d), c[6] = Math.PI - Math.acos((-a.x1 + b.x2) / d), c[7] = Math.PI + Math.acos((-a.x1 + b.x2) / d);
                var rl = a.x2 - b.x1,
                    lr = -a.x1 + b.x2,
                    tb = a.y2 - b.y1,
                    bt = -a.y1 + b.y2,
                    e = [];
                for (e[0] = rl * rl + tb * tb, e[1] = lr * lr + tb * tb, e[2] = rl * rl + bt * bt, e[3] = lr * lr + bt * bt, e[4] = rl * rl + tb * tb, e[5] = rl * rl + bt * bt, e[6] = lr * lr + bt * bt, e[7] = lr * lr + tb * tb, c = c.filter(function(x, i) {
                    return !isNaN(x) && d * d <= e[i]
                }).map(function(x) {
                    return (x + angleBetweenAnchors + 2 * Math.PI) % (2 * Math.PI)
                }), c.sort(), k = 0; k < c.length; k += 2) collisions.push([c[k], c[k + 1]]);
                return collisions
            }

            function rotatingFixedCollisions(rotating, fixed) {
                for (var cornersR = getCorners(rotating), cornersF = getCorners(fixed), collisions = [], i = 0; 4 > i; i++) cornerBoxCollisions(collisions, cornersR[i], cornersF), cornerBoxCollisions(collisions, cornersF[i], cornersR, !0);
                return collisions
            }

            function cornerBoxCollisions(collisions, corner, boxCorners, flip) {
                for (var radius = corner.mag(), angles = [], i = 0, j = 3; 4 > i; j = i++) circleEdgeCollisions(angles, corner, radius, boxCorners[j], boxCorners[i]);
                if (angles.length % 2 !== 0) throw "expecting an even number of intersections";
                angles.sort();
                for (var k = 0; k < angles.length; k += 2) collisions[k / 2] = flip ? [2 * Math.PI - angles[k + 1], 2 * Math.PI - angles[k]] : [angles[k], angles[k + 1]];
                return collisions
            }

            function circleEdgeCollisions(angles, corner, radius, p1, p2) {
                var edgeX = p2.x - p1.x,
                    edgeY = p2.y - p1.y,
                    a = edgeX * edgeX + edgeY * edgeY,
                    b = 2 * (edgeX * p1.x + edgeY * p1.y),
                    c = p1.x * p1.x + p1.y * p1.y - radius * radius,
                    discriminant = b * b - 4 * a * c;
                if (discriminant > 0) {
                    var x1 = (-b - Math.sqrt(discriminant)) / (2 * a),
                        x2 = (-b + Math.sqrt(discriminant)) / (2 * a);
                    x1 > 0 && 1 > x1 && angles.push(getAngle(p1, p2, x1, corner)), x2 > 0 && 1 > x2 && angles.push(getAngle(p1, p2, x2, corner))
                }
                return angles
            }

            function getAngle(p1, p2, d, corner) {
                return (-corner.angleWithSep(util.interp(p1.x, p2.x, d), util.interp(p1.y, p2.y, d)) + 2 * Math.PI) % (2 * Math.PI)
            }

            function getCorners(a) {
                return [new Point(a.x1, a.y1), new Point(a.x1, a.y2), new Point(a.x2, a.y2), new Point(a.x2, a.y1)]
            }
            var util = require("../util/util.js"),
                Point = require("../geometry/point.js");
            module.exports = {
                rotationRange: rotationRange,
                mergeCollisions: mergeCollisions,
                rotatingFixedCollisions: rotatingFixedCollisions,
                rotatingRotatingCollisions: rotatingRotatingCollisions,
                cornerBoxCollisions: cornerBoxCollisions,
                circleEdgeCollisions: circleEdgeCollisions,
                getCorners: getCorners
            };
            var horizontal = new Point(1, 0)
        }, {
            "../geometry/point.js": 18,
            "../util/util.js": 64
        }
    ],
    44: [
        function(require, module) {
            "use strict";

            function shape(text, name, stacks, maxWidth, lineHeight, alignment, spacing) {
                for (var glyph, id, glyphs = stacks[name].glyphs, shaping = [], x = 0, y = 0, i = 0; i < text.length; i++) id = text.charCodeAt(i), glyph = glyphs[id], 0 !== id && glyph && (shaping.push({
                    fontstack: name,
                    glyph: id,
                    x: x,
                    y: y
                }), x += glyph.advance + spacing);
                return shaping.length ? shaping = linewrap(shaping, glyphs, lineHeight, maxWidth, alignment) : !1
            }

            function linewrap(shaping, glyphs, lineHeight, maxWidth, alignment) {
                for (var lastSafeBreak = null, lengthBeforeCurrentLine = 0, lineStartIndex = 0, line = 0, i = 0; i < shaping.length; i++) {
                    var shape = shaping[i];
                    if (shape.x -= lengthBeforeCurrentLine, shape.y += lineHeight * line, shape.x > maxWidth && null !== lastSafeBreak) {
                        for (var lineLength = shaping[lastSafeBreak + 1].x, k = lastSafeBreak + 1; i >= k; k++) shaping[k].y += lineHeight, shaping[k].x -= lineLength;
                        alignment && horizontalAlign(shaping, glyphs, lineStartIndex, lastSafeBreak - 1, alignment), lineStartIndex = lastSafeBreak + 1, lastSafeBreak = null, lengthBeforeCurrentLine += lineLength, line++
                    }
                    breakable[shape.glyph] && (lastSafeBreak = i)
                }
                return horizontalAlign(shaping, glyphs, lineStartIndex, shaping.length - 1, alignment), shaping
            }

            function horizontalAlign(shaping, glyphs, start, end, alignment) {
                for (var lastAdvance = glyphs[shaping[end].glyph].advance, lineIndent = (shaping[end].x + lastAdvance) * alignment, j = start; end >= j; j++) shaping[j].x -= lineIndent
            }
            module.exports = {
                shape: shape
            };
            var breakable = {
                32: !0
            }
        }, {}
    ],
    45: [
        function(require, module, exports) {
            "use strict";
            var util = require("../util/util.js"),
                LatLng = require("../geometry/latlng.js"),
                LatLngBounds = require("../geometry/latlngbounds.js"),
                Point = require("../geometry/point.js");
            util.extend(exports, {
                stop: function() {
                    return this._stopFn && this._stopFn(), this
                },
                panBy: function(offset, options) {
                    this.stop(), offset = Point.convert(offset), options = util.extend({
                        duration: 500,
                        easing: util.ease
                    }, options);
                    var tr = this.transform,
                        fromX = tr.x,
                        fromY = tr.y;
                    return options.animate === !1 && (options.duration = 0), this._stopFn = util.timed(function(t) {
                        this.transform.center = new LatLng(tr.yLat(fromY + offset.y * options.easing(t)), tr.xLng(fromX + offset.x * options.easing(t))), this.update().fire("pan").fire("move")
                    }, options.duration, this), this
                },
                panTo: function(latlng, options) {
                    this.stop(), latlng = LatLng.convert(latlng), options = util.extend({
                        duration: 500,
                        easing: util.ease,
                        offset: [0, 0]
                    }, options);
                    var offset = Point.convert(options.offset),
                        tr = this.transform,
                        fromY = tr.y,
                        fromX = tr.x,
                        toY = tr.latY(latlng.lat) - offset.y,
                        toX = tr.lngX(latlng.lng) - offset.x;
                    return options.animate === !1 && (options.duration = 0), this._stopFn = util.timed(function(t) {
                        this.transform.center = new LatLng(tr.yLat(util.interp(fromY, toY, options.easing(t))), tr.xLng(util.interp(fromX, toX, options.easing(t)))), this.update().fire("pan").fire("move")
                    }, options.duration, this), this
                },
                zoomTo: function(zoom, options) {
                    this.stop(), options = util.extend({
                        duration: 500,
                        offset: [0, 0]
                    }, options);
                    var center = this.transform.centerPoint.add(Point.convert(options.offset)),
                        easing = this._updateEasing(options.duration, zoom, options.easing),
                        startZoom = this.transform.zoom;
                    return options.animate === !1 && (options.duration = 0), this.zooming = !0, this._stopFn = util.timed(function(t) {
                        this.transform.zoomAroundTo(util.interp(startZoom, zoom, easing(t)), center), 1 === t && (this.ease = null, options.duration >= 200 && (this.zooming = !1)), this.style.animationLoop.set(300), this.update(!0), this.fire("zoom", {
                            scale: this.transform.scale
                        }).fire("move")
                    }, options.duration, this), options.duration < 200 && (window.clearTimeout(this._onZoomEnd), this._onZoomEnd = window.setTimeout(function() {
                        this.zooming = !1, this._rerender()
                    }.bind(this), 200)), this
                },
                scaleTo: function(scale, options) {
                    return options = util.extend({
                        duration: 500
                    }, options), this.zoomTo(this.transform.scaleZoom(scale), options)
                },
                rotateTo: function(angle, options) {
                    this.stop(), options = util.extend({
                        duration: 500,
                        easing: util.ease
                    }, options), options.animate === !1 && (options.duration = 0);
                    var start = this.transform.angle;
                    return this.rotating = !0, this._stopFn = util.timed(function(t) {
                        1 === t && (this.rotating = !1), this.setAngle(util.interp(start, angle, options.easing(t)), options.offset)
                    }, options.duration, this), this
                },
                resetNorth: function(options) {
                    return this.rotateTo(0, util.extend({
                        duration: 1e3
                    }, options))
                },
                fitBounds: function(bounds, options) {
                    options = util.extend({
                        padding: 0,
                        offset: [0, 0],
                        maxZoom: 1 / 0
                    }, options), bounds = LatLngBounds.convert(bounds);
                    var offset = Point.convert(options.offset),
                        tr = this.transform,
                        x1 = tr.lngX(bounds.getWest()),
                        x2 = tr.lngX(bounds.getEast()),
                        y1 = tr.latY(bounds.getNorth()),
                        y2 = tr.latY(bounds.getSouth()),
                        x = (x1 + x2) / 2,
                        y = (y1 + y2) / 2,
                        center = [tr.yLat(y), tr.xLng(x)],
                        scaleX = (tr.width - 2 * options.padding - 2 * Math.abs(offset.x)) / (x2 - x1),
                        scaleY = (tr.height - 2 * options.padding - 2 * Math.abs(offset.y)) / (y2 - y1),
                        zoom = Math.min(this.transform.scaleZoom(this.transform.scale * Math.min(scaleX, scaleY)), options.maxZoom);
                    return this.zoomPanTo(center, zoom, 0, options)
                },
                zoomPanTo: function(latlng, zoom, angle, options) {
                    function r(i) {
                        var b = (w1 * w1 - w0 * w0 + (i ? -1 : 1) * rho2 * rho2 * u1 * u1) / (2 * (i ? w1 : w0) * rho2 * u1);
                        return Math.log(Math.sqrt(b * b + 1) - b)
                    }

                    function sinh(n) {
                        return (Math.exp(n) - Math.exp(-n)) / 2
                    }

                    function cosh(n) {
                        return (Math.exp(n) + Math.exp(-n)) / 2
                    }

                    function tanh(n) {
                        return sinh(n) / cosh(n)
                    }
                    options = util.extend({
                        offset: [0, 0],
                        speed: 1.2,
                        curve: 1.42
                    }, options), latlng = LatLng.convert(latlng);
                    var offset = Point.convert(options.offset),
                        tr = this.transform,
                        startZoom = this.transform.zoom,
                        startAngle = this.transform.angle;
                    zoom = void 0 === zoom ? startZoom : zoom, angle = void 0 === angle ? startAngle : angle;
                    var scale = tr.zoomScale(zoom - startZoom),
                        fromX = tr.x,
                        fromY = tr.y,
                        toX = tr.lngX(latlng.lng) - offset.x / scale,
                        toY = tr.latY(latlng.lat) - offset.y / scale;
                    if (options.animate === !1) return this.setPosition(latlng, zoom, angle);
                    var dx = toX - fromX,
                        dy = toY - fromY,
                        startWorldSize = tr.worldSize,
                        rho = options.curve,
                        V = options.speed,
                        w0 = Math.max(tr.width, tr.height),
                        w1 = w0 / scale,
                        u1 = Math.sqrt(dx * dx + dy * dy),
                        rho2 = rho * rho,
                        r0 = r(0),
                        w = function(s) {
                            return w0 * (cosh(r0) / cosh(r0 + rho * s))
                        }, u = function(s) {
                            return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2
                        }, S = (r(1) - r0) / rho;
                    if (Math.abs(u1) < 1e-6) {
                        if (Math.abs(w0 - w1) < 1e-6) return;
                        var k = w0 > w1 ? -1 : 1;
                        S = Math.abs(Math.log(w1 / w0)) / rho, u = function() {
                            return 0
                        }, w = function(s) {
                            return w0 * Math.exp(k * rho * s)
                        }
                    }
                    var duration = 1e3 * S / V;
                    return this.zooming = !0, startAngle != angle && (this.rotating = !0), this._stopFn = util.timed(function(t) {
                        var k = util.ease(t),
                            s = k * S,
                            us = u(s) / u1;
                        tr.zoom = startZoom + tr.scaleZoom(w0 / w(s)), tr.center = new LatLng(tr.yLat(util.interp(fromY, toY, us), startWorldSize), tr.xLng(util.interp(fromX, toX, us), startWorldSize)), startAngle != angle && (tr.angle = util.interp(startAngle, angle, k)), 1 === t && (this.zooming = !1, this.rotating = !1), this.style.animationLoop.set(300), this.update(!0), this.fire("pan").fire("zoom").fire("move")
                    }, duration, this), this
                },
                _updateEasing: function(duration, zoom, bezier) {
                    var easing;
                    if (this.ease) {
                        var ease = this.ease,
                            t = (Date.now() - ease.start) / ease.duration,
                            speed = ease.easing(t + .01) - ease.easing(t),
                            x = .27 / Math.sqrt(speed * speed + 1e-4) * .01,
                            y = Math.sqrt(.0729 - x * x);
                        easing = util.bezier(x, y, .25, 1)
                    } else easing = bezier ? util.bezier.apply(util, bezier) : util.ease;
                    return this.ease = {
                        start: (new Date).getTime(),
                        to: Math.pow(2, zoom),
                        duration: duration,
                        easing: easing
                    }, easing
                }
            })
        }, {
            "../geometry/latlng.js": 14,
            "../geometry/latlngbounds.js": 15,
            "../geometry/point.js": 18,
            "../util/util.js": 64
        }
    ],
    46: [
        function(require, module) {
            "use strict";

            function edgeDist(point, extent) {
                var d, x = point.x / extent,
                    y = point.y / extent;
                return d = Math.abs(y - .5) >= Math.abs(x - .5) ? 2 * Math.round(y) + (.5 > y ? x : 1 - x) : 2 * Math.round(1 - x) + (x > .5 ? y : 1 - y) + 1, d % 4
            }
            var rewind = require("geojson-rewind"),
                Source = require("./source.js"),
                Tile = require("./tile.js"),
                Transform = require("./transform.js"),
                GeoJSONTile = require("./geojsontile.js"),
                Point = require("../geometry/point.js"),
                LatLng = require("../geometry/latlng.js"),
                GeoJSONSource = module.exports = function(geojson) {
                    this.tiles = {}, this.alltiles = {}, this.enabled = !0, this.tileSize = 512, this.tileExtent = 4096, this.padding = .01, this.paddedExtent = this.tileExtent * (1 + 2 * this.padding), this.zooms = [1, 5, 9, 13], this.minTileZoom = this.zooms[0], this.maxTileZoom = this.zooms[this.zooms.length - 1], this.geojson = rewind(geojson), this.transforms = [];
                    for (var i = 0; i < this.zooms.length; i++) this.transforms[i] = new Transform(this.tileSize), this.transforms[i].zoom = this.zooms[i];
                    this.loadNewTiles = !0, this._tileGeoJSON(this.geojson)
                };
            GeoJSONSource.prototype = Object.create(Source.prototype), GeoJSONSource.prototype._addTile = function(id) {
                var tile = this.alltiles[id];
                return tile && (tile._load(), this.tiles[id] = tile, this.fire("tile.add", {
                    tile: tile
                })), tile || {}
            }, GeoJSONSource.prototype._tileGeoJSON = function(geojson) {
                for (var k = 0; k < this.transforms.length; k++) {
                    var transform = this.transforms[k];
                    if ("FeatureCollection" === geojson.type)
                        for (var i = 0; i < geojson.features.length; i++) this._tileFeature(geojson.features[i], transform);
                    else {
                        if ("Feature" !== geojson.type) throw "Unrecognized geojson type";
                        this._tileFeature(geojson, transform)
                    }
                }
                for (var id in this.alltiles) this.alltiles[id] = new GeoJSONTile(id, this, this.alltiles[id])
            }, GeoJSONSource.prototype._tileFeature = function(feature, transform) {
                var tiled, coords = feature.geometry.coordinates,
                    type = feature.geometry.type;
                if ("Point" === type) tiled = this._tileLineString([coords], transform);
                else if ("LineString" === type || "MultiPoint" === type) tiled = this._tileLineString(coords, transform);
                else {
                    if ("Polygon" !== type && "MultiLineString" !== type) throw "MultiPolygon" === type ? "todo" : "unrecognized geometry type";
                    tiled = {};
                    for (var i = 0; i < coords.length; i++) {
                        var tiled_ = this._tileLineString(coords[i], transform, "Polygon" === type);
                        for (var tileID in tiled_) tiled[tileID] || (tiled[tileID] = []), tiled[tileID] = (tiled[tileID] || []).concat(tiled_[tileID])
                    }
                }
                for (var id in tiled) this.alltiles[id] = this.alltiles[id] || [], this.alltiles[id].push({
                    properties: feature.properties,
                    coords: tiled[id],
                    type: typeMapping[feature.geometry.type]
                })
            }, GeoJSONSource.prototype._tileLineString = function(coords, transform, rejoin) {
                for (var prevCoord, padding = this.padding, tileExtent = this.tileExtent, coord = transform.locationCoordinate(new LatLng(coords[0][1], coords[0][0])), tiles = {}, i = 0; i < coords.length; i++) {
                    prevCoord = coord, coord = transform.locationCoordinate(new LatLng(coords[i][1], coords[i][0]));
                    for (var dx = coord.column - prevCoord.column || Number.MIN_VALUE, dy = coord.row - prevCoord.row || Number.MIN_VALUE, dirX = dx / Math.abs(dx), dirY = dy / Math.abs(dy), startTileX = Math.floor(prevCoord.column - dirX * padding), endTileX = Math.floor(coord.column + dirX * padding), startTileY = Math.floor(prevCoord.row - dirY * padding), endTileY = Math.floor(coord.row + dirY * padding), x = startTileX; 0 >= (x - endTileX) * dirX; x += dirX)
                        for (var leftX = (x - padding - prevCoord.column) / dx, rightX = (x + 1 + padding - prevCoord.column) / dx, y = startTileY; 0 >= (y - endTileY) * dirY; y += dirY) {
                            var point, topY = (y - padding - prevCoord.row) / dy,
                                bottomY = (y + 1 + padding - prevCoord.row) / dy,
                                enter = Math.max(Math.min(leftX, rightX), Math.min(topY, bottomY)),
                                exit = Math.min(Math.max(leftX, rightX), Math.max(topY, bottomY)),
                                tileID = Tile.toID(transform.tileZoom, x, y),
                                tile = tiles[tileID];
                            enter >= 0 && 1 > enter && (point = new Point((prevCoord.column + enter * dx - x) * tileExtent, (prevCoord.row + enter * dy - y) * tileExtent), point.continues = !0, tile || (tiles[tileID] = tile = []), tile.push([point])), exit >= 0 && 1 > exit ? (point = new Point((prevCoord.column + exit * dx - x) * tileExtent, (prevCoord.row + exit * dy - y) * tileExtent), point.continues = !0, tile[tile.length - 1].push(point)) : (point = new Point((coord.column - x) * tileExtent, (coord.row - y) * tileExtent), tile ? tile[tile.length - 1].push(point) : tiles[tileID] = tile = [
                                [point]
                            ])
                        }
                }
                if (rejoin)
                    for (var id in tiles) {
                        var segments = tiles[id];
                        if (!segments[0][0].continues && segments.length > 1) {
                            var last = segments.pop();
                            Array.prototype.unshift.apply(segments[0], last.slice(0, last.length - 1))
                        }
                        for (var start = edgeDist(segments[0][0], tileExtent, padding), k = 0; k < segments.length; k++)
                            for (var thisExit = edgeDist(segments[k][segments[k].length - 1], this.paddedExtent), nextEntry = edgeDist(segments[(k + 1) % segments.length][0], this.paddedExtent), startToExit = (thisExit - start + 4) % 4, startToNextEntry = (nextEntry - start + 4) % 4, direction = thisExit === nextEntry || startToNextEntry > startToExit ? 1 : -1, roundFn = direction > 0 ? Math.ceil : Math.floor, c = roundFn(thisExit) % 4; c != roundFn(nextEntry) % 4; c = (c + direction + 4) % 4) {
                                var corner = corners[c];
                                segments[k].push(new Point((corner.x + (corner.x - .5 > 0 ? 1 : -1) * padding) * tileExtent, (corner.y + (corner.y - .5 > 0 ? 1 : -1) * padding) * tileExtent))
                            }
                        tiles[id] = [Array.prototype.concat.apply([], segments)]
                    }
                return tiles
            };
            var typeMapping = {
                Point: "point",
                LineString: "line",
                Polygon: "fill"
            }, corners = [new Point(0, 0), new Point(1, 0), new Point(1, 1), new Point(0, 1)]
        }, {
            "../geometry/latlng.js": 14,
            "../geometry/point.js": 18,
            "./geojsontile.js": 47,
            "./source.js": 54,
            "./tile.js": 55,
            "./transform.js": 56,
            "geojson-rewind": 69
        }
    ],
    47: [
        function(require, module) {
            "use strict";

            function GeoJSONTile(id, source, features) {
                this.id = id, this.source = source, this.features = features, this.geometry = new Geometry, this.featureTree = new FeatureTree(getGeometry, getType)
            }

            function getGeometry(feature) {
                return feature.coords
            }

            function getType(feature) {
                return feature.type
            }

            function getbbox(rings) {
                for (var x1 = 1 / 0, x2 = -1 / 0, y1 = 1 / 0, y2 = -1 / 0, i = 0; i < rings.length; i++)
                    for (var ring = rings[i], j = 0; j < ring.length; j++) {
                        var coord = ring[j];
                        x1 = Math.min(x1, coord.x), x2 = Math.max(x2, coord.x), y1 = Math.min(y1, coord.y), y2 = Math.max(y2, coord.y)
                    }
                return [x1, y1, x2, y2]
            }
            var Tile = require("./tile.js"),
                Geometry = require("../geometry/geometry.js"),
                FeatureTree = require("../geometry/featuretree.js"),
                Bucket = require("../geometry/bucket.js"),
                Placement = require("../text/placement.js");
            module.exports = GeoJSONTile, GeoJSONTile.prototype = Object.create(Tile), GeoJSONTile.prototype.sortFeaturesIntoBuckets = function() {
                var mapping = this.source.map.style.stylesheet.buckets,
                    buckets = {};
                for (var name in mapping) "geojson" === mapping[name].filter.source && (buckets[name] = new Bucket(mapping[name], this.geometry, this.placement), buckets[name].features = []);
                for (var i = 0; i < this.features.length; i++) {
                    var feature = this.features[i];
                    for (var key in buckets)(!buckets[key].compare || buckets[key].compare(feature.properties)) && (feature.type === mapping[key].filter.feature_type || mapping[key][feature.type]) && buckets[key].features.push(feature)
                }
                return buckets
            }, GeoJSONTile.prototype._parse = function() {
                this.buckets = {}, this.placement = new Placement(this.geometry, this.zoom);
                var buckets = this.sortFeaturesIntoBuckets(this.features);
                for (var name in buckets) {
                    var bucket = buckets[name];
                    if (bucket.features.length) {
                        bucket.start();
                        for (var i = 0; i < bucket.features.length; i++) {
                            var feature = bucket.features[i];
                            bucket.addFeature(feature.coords);
                            var bbox = getbbox(feature.coords);
                            this.featureTree.insert(bbox, name, feature)
                        }
                        bucket.end()
                    }
                }
                this.buckets = buckets
            }, GeoJSONTile.prototype._load = function() {
                this.loaded || (this._parse(this.features), this.loaded = !0)
            }, GeoJSONTile.prototype.abort = function() {}, GeoJSONTile.prototype.remove = function() {}, GeoJSONTile.prototype.featuresAt = function(pos, params, callback) {
                this.featureTree.query({
                    id: this.id,
                    x: pos.x,
                    y: pos.y,
                    scale: pos.scale,
                    params: params
                }, callback)
            }
        }, {
            "../geometry/bucket.js": 6,
            "../geometry/featuretree.js": 8,
            "../geometry/geometry.js": 11,
            "../text/placement.js": 41,
            "./tile.js": 55
        }
    ],
    48: [
        function(require, module) {
            "use strict";

            function Handlers(map) {
                var rotateEnd;
                this.interaction = new Interaction(map.container).on("click", function(e) {
                    map.fire("click", e)
                }).on("hover", function(e) {
                    map.fire("hover", e)
                }).on("resize", function() {
                    map.stop(), map.resize(), map.update()
                }).on("pan", function(e) {
                    map.stop(), map.transform.panBy(e.offset), map.update(), map.fire("pan").fire("move")
                }).on("panend", function(e) {
                    map._stopFn = util.timed(function(t) {
                        map.transform.panBy(e.inertia.mult(1 - t).round()), map.update(), map.fire("pan").fire("move")
                    }, 500)
                }).on("zoom", function(e) {
                    var scale = 2 / (1 + Math.exp(-Math.abs(e.delta / 100)));
                    e.delta < 0 && 0 !== scale && (scale = 1 / scale);
                    var fromScale = map.ease && isFinite(e.delta) ? map.ease.to : map.transform.scale,
                        duration = isFinite(e.delta) ? "trackpad" == e.source ? 0 : 300 : 800;
                    map.scaleTo(fromScale * scale, {
                        duration: duration,
                        offset: e.point.sub(map.transform.centerPoint)
                    })
                }).on("rotate", function(e) {
                    var center = map.transform.centerPoint,
                        startToCenter = e.start.sub(center),
                        startToCenterDist = startToCenter.mag();
                    200 > startToCenterDist && (center = e.start.add(new Point(-200, 0)._rotate(startToCenter.angle()))), map.setAngle(map.transform.angle + e.prev.sub(center).angleWith(e.current.sub(center))), map.rotating = !0, window.clearTimeout(rotateEnd), rotateEnd = window.setTimeout(function() {
                        map.rotating = !1, map._rerender()
                    }, 200)
                })
            }
            var Interaction = require("./interaction.js"),
                util = require("../util/util.js"),
                Point = require("../geometry/point.js");
            module.exports = Handlers
        }, {
            "../geometry/point.js": 18,
            "../util/util.js": 64,
            "./interaction.js": 50
        }
    ],
    49: [
        function(require, module) {
            "use strict";

            function Hash(map) {
                this.lastHash = null, this.updateHashTimeout = null, window.addEventListener("hashchange", this.onhash.bind(this), !1), map.on("move", this.updateHash.bind(this)), this.map = map
            }
            module.exports = Hash, Hash.prototype.onhash = function() {
                var loc = this.parseHash();
                return location.hash !== this.lastHash && loc ? (this.map.setPosition([+loc[2], +loc[3]], +loc[1], +loc[4] / 180 * Math.PI), this.map.update(!0), !0) : !1
            }, Hash.prototype.parseHash = function() {
                return location.hash.match(/^#(\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/)
            }, Hash.prototype.updateHash = function() {
                this.updateHashTimeout && window.clearTimeout(this.updateHashTimeout);
                var hash = this,
                    map = this.map;
                this.updateHashTimeout = window.setTimeout(function() {
                    var currentHash = "#" + map.transform.zoom.toFixed(2) + "/" + map.transform.center.lat.toFixed(6) + "/" + map.transform.center.lng.toFixed(6) + "/" + (map.transform.angle / Math.PI * 180).toFixed(1);
                    hash.lastHash = currentHash, location.replace(currentHash), hash.updateHashTimeout = null
                }, 100)
            }
        }, {}
    ],
    50: [
        function(require, module) {
            "use strict";

            function Interaction(el) {
                function mousePos(e) {
                    var rect = el.getBoundingClientRect();
                    return new Point(e.clientX - rect.left - el.clientLeft, e.clientY - rect.top - el.clientTop)
                }

                function zoom(type, delta, point) {
                    interaction.fire("zoom", {
                        source: type,
                        delta: delta,
                        point: point
                    }), inertia = null, now = null
                }

                function click(point) {
                    interaction.fire("click", {
                        point: point
                    })
                }

                function hover(point) {
                    interaction.fire("hover", {
                        point: point
                    })
                }

                function pan(point) {
                    if (pos) {
                        var offset = pos.sub(point);
                        if (interaction.fire("pan", {
                            offset: offset
                        }), inertia) {
                            var speed = Date.now() - now;
                            speed && inertia._mult(.8)._add(offset.div(speed))
                        } else inertia = new Point(0, 0);
                        now = Date.now(), pos = point
                    }
                }

                function resize() {
                    interaction.fire("resize")
                }

                function rotate(point) {
                    pos && (interaction.fire("rotate", {
                        start: firstPos,
                        prev: pos,
                        current: point
                    }), pos = point)
                }

                function onmousedown(ev) {
                    firstPos = pos = mousePos(ev)
                }

                function onmouseup() {
                    panned = pos && firstPos && (pos.x != firstPos.x || pos.y != firstPos.y), rotating = !1, pos = null, now > +new Date - 100 && interaction.fire("panend", {
                        inertia: inertia
                    }), inertia = null, now = null
                }

                function onmousemove(ev) {
                    var point = mousePos(ev);
                    if (rotating) rotate(point);
                    else if (pos) pan(point);
                    else {
                        for (var target = ev.toElement; target != el && target.parentNode;) target = target.parentNode;
                        target == el && hover(point)
                    }
                }

                function onclick(ev) {
                    panned || click(mousePos(ev))
                }

                function ondoubleclick(ev) {
                    zoom("wheel", 1 / 0 * (ev.shiftKey ? -1 : 1), mousePos(ev)), ev.preventDefault()
                }

                function scrollwheel(callback) {
                    function scroll(value, ev) {
                        var stamp = time.now(),
                            timeDelta = stamp - lastEvent;
                        lastEvent = stamp;
                        var point = mousePos(ev);
                        0 !== value && value % 4.000244140625 === 0 ? type = "wheel" : 0 !== value && Math.abs(value) < 4 ? type = "trackpad" : timeDelta > 400 ? (type = null, initialValue = value, typeTimeout = setTimeout(function() {
                            type = "wheel", callback(type, -initialValue, point)
                        }, 40)) : null === type && (type = Math.abs(timeDelta * value) < 200 ? "trackpad" : "wheel", typeTimeout && (clearTimeout(typeTimeout), typeTimeout = null, value += initialValue)), null !== type && callback(type, -value, point)
                    }

                    function wheel(e) {
                        var deltaY = e.deltaY;
                        firefox && e.deltaMode == window.WheelEvent.DOM_DELTA_PIXEL && (deltaY /= window.devicePixelRatio), e.deltaMode == window.WheelEvent.DOM_DELTA_LINE && (deltaY *= 40), scroll(deltaY, e), e.preventDefault()
                    }

                    function mousewheel(e) {
                        var deltaY = -e.wheelDeltaY;
                        safari && (deltaY /= 3), scroll(deltaY, e), e.preventDefault()
                    }
                    var firefox = /Firefox/i.test(navigator.userAgent),
                        safari = /Safari/i.test(navigator.userAgent) && !/Chrom(ium|e)/i.test(navigator.userAgent),
                        time = window.performance || Date;
                    el.addEventListener("wheel", wheel, !1), el.addEventListener("mousewheel", mousewheel, !1);
                    var lastEvent = 0,
                        type = null,
                        typeTimeout = null,
                        initialValue = null
                }
                var interaction = this;
                if (el) {
                    var now, rotating = !1,
                        panned = !1,
                        firstPos = null,
                        pos = null,
                        inertia = null;
                    el.addEventListener("contextmenu", function(ev) {
                        rotating = !0, firstPos = pos = new Point(ev.pageX, ev.pageY), ev.preventDefault()
                    }, !1), el.addEventListener("mousedown", onmousedown, !1), document.addEventListener("mouseup", onmouseup, !1), document.addEventListener("mousemove", onmousemove, !1), el.addEventListener("click", onclick, !1), scrollwheel(zoom), el.addEventListener("dblclick", ondoubleclick, !1), window.addEventListener("resize", resize, !1)
                }
            }
            var Evented = require("../util/evented.js"),
                Point = require("../geometry/point.js");
            module.exports = Interaction, Interaction.prototype = Object.create(Evented)
        }, {
            "../geometry/point.js": 18,
            "../util/evented.js": 61
        }
    ],
    51: [
        function(require, module) {
            "use strict";
            var Dispatcher = require("../util/dispatcher.js"),
                util = require("../util/util.js"),
                Evented = require("../util/evented.js"),
                Style = require("../style/style.js"),
                AnimationLoop = require("../style/animationloop.js"),
                GLPainter = require("../render/painter.js"),
                Transform = require("./transform.js"),
                Hash = require("./hash.js"),
                Handlers = require("./handlers.js"),
                Source = require("./source.js"),
                Easings = require("./easings.js"),
                LatLng = require("../geometry/latlng.js"),
                LatLngBounds = require("../geometry/latlngbounds.js"),
                Point = require("../geometry/point.js"),
                Map = module.exports = function(options) {
                    this.options = Object.create(this.options), options = util.extend(this.options, options), this.tileSize = 256, this.tiles = [], this.animationLoop = new AnimationLoop, this.transform = new Transform(this.tileSize, options.minZoom, options.maxZoom), this.hash = options.hash && new Hash(this), this._onStyleChange = this._onStyleChange.bind(this), this._updateBuckets = this._updateBuckets.bind(this), this.render = this.render.bind(this), this._setupContainer(), this._setupPainter(), this._setupContextHandler(), this.handlers = options.interactive && new Handlers(this), this.dispatcher = new Dispatcher(options.numWorkers, this), this.hash && this.hash.onhash() || this.setPosition(options.center, options.zoom, options.angle), this.sources = {};
                    var sources = options.sources;
                    this.stacks = {};
                    for (var id in sources) sources[id].id = id, this.addSource(id, new Source(sources[id]));
                    this.resize(), this.setStyle(options.style)
                };
            util.extend(Map.prototype, Evented), util.extend(Map.prototype, Easings), util.extend(Map.prototype, {
                options: {
                    center: [0, 0],
                    zoom: 0,
                    angle: 0,
                    minZoom: 0,
                    maxZoom: 20,
                    numWorkers: 7,
                    adjustZoom: !0,
                    minAdjustZoom: 6,
                    maxAdjustZoom: 9,
                    interactive: !0,
                    hash: !1
                },
                addSource: function(id, source) {
                    return this.sources[id] = source, source.id = id, source.onAdd && source.onAdd(this), this.fire("source.add", {
                        source: source
                    })
                },
                removeSource: function(id) {
                    var source = this.sources[id];
                    return source.onRemove && source.onRemove(this), delete this.sources[id], this.fire("source.remove", {
                        source: source
                    })
                },
                setPosition: function(latlng, zoom, angle) {
                    return this.transform.center = LatLng.convert(latlng), this.transform.zoom = +zoom, this.transform.angle = +angle, this.update(!0)
                },
                resize: function() {
                    this.pixelRatio = window.devicePixelRatio || 1;
                    var width = 0,
                        height = 0;
                    return this.container && (width = this.container.offsetWidth || 400, height = this.container.offsetHeight || 300), this.canvas.width = this.pixelRatio * width, this.canvas.height = this.pixelRatio * height, this.canvas.style.width = width + "px", this.canvas.style.height = height + "px", this.transform.width = width, this.transform.height = height, this.style && this.style.sprite && this.style.sprite.resize(this.painter.gl), this.painter.resize(width, height), this
                },
                setAngle: function(angle, offset) {
                    for (; angle > Math.PI;) angle -= 2 * Math.PI;
                    for (; angle < -Math.PI;) angle += 2 * Math.PI;
                    return offset = Point.convert(offset), offset && this.transform.panBy(offset), this.transform.angle = angle, offset && this.transform.panBy(offset.mult(-1)), this.update(), this.fire("rotation").fire("move")
                },
                getBounds: function() {
                    return new LatLngBounds(this.transform.pointLocation(new Point(0, 0)), this.transform.pointLocation(this.transform.size))
                },
                getCenter: function() {
                    return this.transform.center
                },
                getZoom: function() {
                    return this.transform.zoom
                },
                getAngle: function() {
                    return this.transform.angle
                },
                project: function(latlng) {
                    return this.transform.locationPoint(latlng)
                },
                unproject: function(point) {
                    return this.transform.pointLocation(point)
                },
                featuresAt: function(point, params, callback) {
                    var features = [],
                        error = null,
                        map = this;
                    return point = Point.convert(point), util.asyncEach(Object.keys(this.sources), function(id, callback) {
                        var source = map.sources[id];
                        source.featuresAt(point, params, function(err, result) {
                            result && (features = features.concat(result)), err && (error = err), callback()
                        })
                    }, function() {
                        callback(error, features)
                    }), this
                },
                setStyle: function(style) {
                    return this.style && (this.style.off("change", this._onStyleChange), this.style.off("change:buckets", this._updateBuckets)), this.style = style instanceof Style ? style : new Style(style, this.animationLoop), this.style.on("change", this._onStyleChange), this.style.on("change:buckets", this._updateBuckets), this._updateBuckets(), this.update(!0)
                },
                addTile: function(tile) {
                    this.tiles.indexOf(tile) < 0 && this.tiles.push(tile)
                },
                removeTile: function(tile) {
                    var pos = this.tiles.indexOf(tile);
                    pos >= 0 && this.tiles.splice(pos, 1)
                },
                findTile: function(id) {
                    for (var i = 0; i < this.tiles.length; i++)
                        if (this.tiles[i].id === id) return this.tiles[i]
                },
                _setupContainer: function() {
                    var id = this.options.container;
                    this.container = "string" == typeof id ? document.getElementById(id) : id, this.canvas = document.createElement("canvas"), this.canvas.style.position = "absolute", this.container.appendChild(this.canvas)
                },
                _setupPainter: function() {
                    var gl = this.canvas.getContext("experimental-webgl", {
                        antialias: !1,
                        alpha: !0,
                        stencil: !0,
                        depth: !1
                    });
                    return gl ? void(this.painter = new GLPainter(gl, this.transform)) : void alert("Failed to initialize WebGL")
                },
                _setupContextHandler: function() {
                    var map = this;
                    this.canvas.addEventListener("webglcontextlost", function(event) {
                        event.preventDefault(), map._frameId && (window.cancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.webkitCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame)(map._frameId)
                    }, !1), this.canvas.addEventListener("webglcontextrestored", function() {
                        for (var id in map.tiles) map.tiles[id].geometry && map.tiles[id].geometry.unbind();
                        map._setupPainter(), map.resize(), map.update()
                    }, !1)
                },
                "debug message": function(data) {
                    console.log.apply(console, data)
                },
                "alert message": function(data) {
                    alert.apply(window, data)
                },
                "get sprite json": function(params, callback) {
                    callback(null, this.style.sprite && this.style.sprite.data)
                },
                "add glyphs": function(params, callback) {
                    var tile = this.findTile(params.id);
                    if (!tile && -1 != params.id) return void callback("tile does not exist anymore");
                    var glyphAtlas = this.painter.glyphAtlas,
                        rects = glyphAtlas.getRects();
                    for (var name in params.stacks) {
                        var fontstack = params.stacks[name];
                        rects[name] || (rects[name] = {});
                        for (var id in fontstack.glyphs) rects[name][id] = glyphAtlas.addGlyph(params.id, name, fontstack.glyphs[id], 3)
                    }
                    callback(null, rects)
                },
                "add glyph range": function(params, callback) {
                    for (var name in params.stacks) {
                        this.stacks[name] || (this.stacks[name] = {});
                        var fontstack = params.stacks[name];
                        this.stacks[name][fontstack.range] = fontstack.glyphs, callback(null, fontstack.glyphs)
                    }
                },
                update: function(updateStyle) {
                    return this.style ? (this._styleDirty = this._styleDirty || updateStyle, this._tilesDirty = !0, this._rerender(), this) : void 0
                },
                render: function() {
                    if (this._styleDirty && (this._styleDirty = !1, this._updateStyle()), this._tilesDirty) {
                        for (var id in this.sources) this.sources[id].update();
                        this._tilesDirty = !1
                    }
                    this._renderGroups(this.style.layerGroups);
                    var bgColor = this.style.computed.background && this.style.computed.background["fill-color"];
                    return bgColor && this.painter.drawBackground(bgColor), this._frameId = null, (this._repaint || !this.animationLoop.stopped()) && (this._styleDirty = !0, this._rerender()), this
                },
                _renderGroups: function(groups, name) {
                    var i, len, group, source, k;
                    for (i = 0, len = groups.length; len > i; i++) {
                        group = groups[i];
                        for (k in group.dependencies) this._renderGroups(group.dependencies[k], k)
                    }
                    for (this.painter.bindRenderTexture(name), i = 0, len = groups.length; len > i; i++) group = groups[i], source = this.sources[group.source], source ? (this.painter.clearStencil(), source.render(group)) : group.composited && this.painter.draw(void 0, this.style, group, {})
                },
                _rerender: function() {
                    this._frameId || (this._frameId = util.frame(this.render))
                },
                _onStyleChange: function() {
                    this.update(!0)
                },
                getZoomAdjustment: function() {
                    if (!this.options.adjustZoom) return 0;
                    var scale = this.transform.scaleZoom(1 / Math.cos(this.transform.center.lat * Math.PI / 180)),
                        part = Math.min(Math.max(this.transform.zoom - this.options.minAdjustZoom, 0) / (this.options.maxAdjustZoom - this.options.minAdjustZoom), 1);
                    return scale * part
                },
                _updateStyle: function() {
                    this.style && this.style.recalculate(this.transform.zoom + this.getZoomAdjustment())
                },
                _updateBuckets: function() {
                    this.dispatcher.broadcast("set buckets", this.style.stylesheet.buckets);
                    for (var t in this.tiles) this.tiles[t]._load();
                    this.update()
                },
                _debug: !1,
                get debug() {
                    return this._debug
                },
                set debug(value) {
                    this._debug = value, this._rerender()
                },
                _repaint: !1,
                get repaint() {
                    return this._repaint
                },
                set repaint(value) {
                    this._repaint = value, this._rerender()
                },
                _antialiasing: !0,
                get antialiasing() {
                    return this._antialiasing
                },
                set antialiasing(value) {
                    this._antialiasing = value, this._rerender()
                },
                _vertices: !1,
                get vertices() {
                    return this._vertices
                },
                set vertices(value) {
                    this._vertices = value, this._rerender()
                },
                _loadNewTiles: !0,
                get loadNewTiles() {
                    return this._loadNewTiles
                },
                set loadNewTiles(value) {
                    this._loadNewTiles = value, this.update()
                }
            })
        }, {
            "../geometry/latlng.js": 14,
            "../geometry/latlngbounds.js": 15,
            "../geometry/point.js": 18,
            "../render/painter.js": 29,
            "../style/animationloop.js": 31,
            "../style/style.js": 34,
            "../util/dispatcher.js": 60,
            "../util/evented.js": 61,
            "../util/util.js": 64,
            "./easings.js": 45,
            "./handlers.js": 48,
            "./hash.js": 49,
            "./source.js": 54,
            "./transform.js": 56
        }
    ],
    52: [
        function(require, module) {
            "use strict";

            function ce(_, name) {
                var elem = document.createElement(_);
                return elem.className = name, elem
            }
            var Navigation = module.exports = function(map) {
                map && this.onAdd(map)
            };
            Navigation.prototype = {
                onAdd: function(map) {
                    function drawNorth() {
                        var angle = map.transform.angle + Math.PI / 2;
                        northCanvas.width = northCanvas.width, northCtx.beginPath(), northCtx.fillStyle = "#000", northCtx.moveTo(center, center), northCtx.lineTo(center - Math.cos(angle + Math.PI / 2) * width, center - Math.sin(angle + Math.PI / 2) * width), northCtx.lineTo(center - Math.cos(angle) * rad, center - Math.sin(angle) * rad), northCtx.lineTo(center - Math.cos(angle - Math.PI / 2) * width, center - Math.sin(angle - Math.PI / 2) * width), northCtx.fill(), northCtx.beginPath(), northCtx.fillStyle = "#bbb", northCtx.moveTo(center, center), northCtx.lineTo(center + Math.cos(angle + Math.PI / 2) * width, center + Math.sin(angle + Math.PI / 2) * width), northCtx.lineTo(center + Math.cos(angle) * rad, center + Math.sin(angle) * rad), northCtx.lineTo(center + Math.cos(angle - Math.PI / 2) * width, center + Math.sin(angle - Math.PI / 2) * width), northCtx.fill(), northCtx.beginPath(), northCtx.strokeStyle = "#fff", northCtx.lineWidth = 4, northCtx.moveTo(center + Math.cos(angle - Math.PI / 2) * width, center + Math.sin(angle - Math.PI / 2) * width), northCtx.lineTo(center + Math.cos(angle + Math.PI / 2) * width, center + Math.sin(angle + Math.PI / 2) * width), northCtx.stroke()
                    }
                    this._map = map, this._container = ce("div", "map-zoom-control"), this._northButton = this._container.appendChild(ce("a", "north-button")), this._zoomInButton = this._container.appendChild(ce("a", "zoom-in-button")), this._zoomOutButton = this._container.appendChild(ce("a", "zoom-out-button")), this._zoomInButton.addEventListener("click", function() {
                        map.zoomTo(map.transform.zoom + 1)
                    }), this._zoomOutButton.addEventListener("click", function() {
                        map.zoomTo(map.transform.zoom - 1)
                    }), this._northButton.addEventListener("click", function() {
                        map.resetNorth()
                    });
                    var northCanvas = this._northButton.appendChild(ce("canvas", "north-button-canvas"));
                    northCanvas.style.cssText = "width:26px;height:26px;", northCanvas.width = 52, northCanvas.height = 52;
                    var northCtx = northCanvas.getContext("2d");
                    this._map.on("rotation", drawNorth);
                    var rad = 18,
                        width = rad / 2.3,
                        center = 24;
                    drawNorth(), this._map.container.appendChild(this._container)
                }
            }
        }, {}
    ],
    53: [
        function(require, module) {
            "use strict";

            function RasterTile(id, source, url, callback) {
                this.id = id, this.loaded = !1, this.url = url, this.source = source, this.map = source.map, this._load(), this.callback = callback, this.uses = 1, this.buckets = {}, this.info = {
                    raster: !0
                };
                var sheetBuckets = this.map.style.stylesheet.buckets;
                for (var b in sheetBuckets) {
                    var sourceid = sheetBuckets[b].filter && sheetBuckets[b].filter.source;
                    source.id === sourceid && (this.buckets[b] = this)
                }
                this.indices = {}
            }
            var Tile = require("./tile.js");
            module.exports = RasterTile, RasterTile.prototype = Object.create(Tile), RasterTile.prototype._load = function() {
                this.img = new Image, this.img.crossOrigin = "Anonymous", this.img.src = this.url, this.img.onload = this.onTileLoad.bind(this)
            }, RasterTile.prototype.onTileLoad = function() {
                this.bind(this.map.painter.gl), this.loaded = !0, this.callback()
            }, RasterTile.prototype.abort = function() {
                this.aborted = !0, this.img.src = "", delete this.img
            }, RasterTile.prototype.bind = function(gl) {
                this.texture ? gl.bindTexture(gl.TEXTURE_2D, this.texture) : (this.texture = gl.createTexture(), gl.bindTexture(gl.TEXTURE_2D, this.texture), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE), gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img), gl.generateMipmap(gl.TEXTURE_2D))
            }, RasterTile.prototype.remove = function() {
                this.texture && this.map.painter.gl.deleteTexture(this.texture), delete this.map
            }, RasterTile.prototype.featuresAt = function(pos, params, callback) {
                callback(null, [])
            }
        }, {
            "./tile.js": 55
        }
    ],
    54: [
        function(require, module) {
            "use strict";
            var Coordinate = require("../util/coordinate.js"),
                util = require("../util/util.js"),
                Evented = require("../util/evented.js"),
                Cache = require("../util/mrucache.js"),
                Tile = require("./tile.js"),
                VectorTile = require("./vectortile.js"),
                RasterTile = require("./rastertile.js"),
                Point = require("../geometry/point.js"),
                Source = module.exports = function(options) {
                    if (this.options = Object.create(this.options), options = util.extend(this.options, options), this.tiles = {}, this.Tile = "raster" === options.type ? RasterTile : VectorTile, this.type = options.type, this.tileSize = options.tileSize, this.zooms = options.zooms, !this.zooms) {
                        this.zooms = [];
                        for (var i = options.minZoom; i <= options.maxZoom; i++) options.skipZooms && -1 !== options.skipZooms.indexOf(i) || this.zooms.push(i)
                    }
                    this.minTileZoom = this.zooms[0], this.maxTileZoom = this.zooms[this.zooms.length - 1], this.id = options.id, this.cache = new Cache(options.cacheSize, function(tile) {
                        tile.remove()
                    }), this.loadNewTiles = !0, this.enabled = options.enabled
                };
            Source.prototype = Object.create(Evented), util.extend(Source.prototype, {
                options: {
                    enabled: !0,
                    tileSize: 256,
                    cacheSize: 20,
                    subdomains: "abc",
                    minZoom: 0
                },
                onAdd: function(map) {
                    this.map = map, this.painter = map.painter
                },
                update: function() {
                    this.enabled && this._updateTiles()
                },
                render: function(layers) {
                    if (this.enabled) {
                        var order = Object.keys(this.tiles);
                        order.sort(this._z_order);
                        for (var i = 0; i < order.length; i++) {
                            var id = order[i],
                                tile = this.tiles[id];
                            tile.loaded && !this.coveredTiles[id] && this._renderTile(tile, id, layers)
                        }
                    }
                },
                featuresAt: function(point, params, callback) {
                    point = Point.convert(point);
                    var order = Object.keys(this.tiles);
                    order.sort(this._z_order);
                    for (var i = 0; i < order.length; i++) {
                        var id = order[i],
                            tile = this.tiles[id],
                            pos = tile.positionAt(id, point);
                        if (pos && pos.x >= 0 && pos.x < 4096 && pos.y >= 0 && pos.y < 4096) return tile.featuresAt(pos, params, callback)
                    }
                    callback(null, [])
                },
                _getZoom: function() {
                    var zOffset = Math.log(this.map.tileSize / this.tileSize) / Math.LN2;
                    return this.map.transform.zoom + zOffset
                },
                _coveringZoomLevel: function(zoom) {
                    for (var i = this.zooms.length - 1; i >= 0; i--)
                        if (this.zooms[i] <= zoom) {
                            var z = this.zooms[i];
                            if ("raster" === this.type && this.zooms[i + 1]) {
                                var diff = this.zooms[i + 1] - this.zooms[i];
                                z = this.zooms[i] + Math.round((zoom - this.zooms[i]) / diff) * diff
                            }
                            return z
                        }
                    return 0
                },
                _parentZoomLevel: function(zoom) {
                    for (var i = this.zooms.length - 1; i >= 0; i--)
                        if (this.zooms[i] < zoom) return this.zooms[i];
                    return null
                },
                _childZoomLevel: function(zoom) {
                    for (var i = 0; i < this.zooms.length; i++)
                        if (this.zooms[i] > zoom) return this.zooms[i];
                    return null
                },
                _getCoveringTiles: function(zoom) {
                    function fromCenter(a, b) {
                        var ad = Math.abs(a.x - tileCenter.column) + Math.abs(a.y - tileCenter.row),
                            bd = Math.abs(b.x - tileCenter.column) + Math.abs(b.y - tileCenter.row);
                        return ad - bd
                    }

                    function scanLine(x0, x1, y) {
                        var x, wx;
                        if (y >= 0 && tiles >= y)
                            for (x = x0; x1 > x; x++) wx = (x + tiles) % tiles, t[Tile.toID(z, wx, y, Math.floor(x / tiles))] = {
                                x: wx,
                                y: y
                            }
                    }
                    void 0 === zoom && (zoom = this._getZoom());
                    var z = this._coveringZoomLevel(zoom),
                        tiles = 1 << z,
                        tr = this.map.transform,
                        tileCenter = Coordinate.zoomTo(tr.locationCoordinate(tr.center), z),
                        points = [Coordinate.izoomTo(tr.pointCoordinate(tileCenter, {
                            x: 0,
                            y: 0
                        }), z), Coordinate.izoomTo(tr.pointCoordinate(tileCenter, {
                            x: tr.width,
                            y: 0
                        }), z), Coordinate.izoomTo(tr.pointCoordinate(tileCenter, {
                            x: tr.width,
                            y: tr.height
                        }), z), Coordinate.izoomTo(tr.pointCoordinate(tileCenter, {
                            x: 0,
                            y: tr.height
                        }), z)],
                        t = {};
                    return this._scanTriangle(points[0], points[1], points[2], 0, tiles, scanLine), this._scanTriangle(points[2], points[3], points[0], 0, tiles, scanLine), Object.keys(t).sort(fromCenter)
                },
                _renderTile: function(tile, id, layers) {
                    var pos = Tile.fromID(id),
                        z = pos.z,
                        x = pos.x,
                        y = pos.y,
                        w = pos.w;
                    x += w * (1 << z), tile.calculateMatrices(z, x, y, this.map.transform, this.painter), this.painter.draw(tile, this.map.style, layers, {
                        z: z,
                        x: x,
                        y: y,
                        debug: this.map.debug,
                        antialiasing: this.map.antialiasing,
                        vertices: this.map.vertices,
                        rotating: this.map.rotating,
                        zooming: this.map.zooming
                    })
                },
                _findLoadedChildren: function(id, maxCoveringZoom, retain) {
                    for (var complete = !0, z = Tile.fromID(id).z, ids = Tile.children(id), i = 0; i < ids.length; i++) this.tiles[ids[i]] && this.tiles[ids[i]].loaded ? retain[ids[i]] = !0 : (complete = !1, maxCoveringZoom > z && this._findLoadedChildren(ids[i], maxCoveringZoom, retain));
                    return complete
                },
                _findLoadedParent: function(id, minCoveringZoom, retain) {
                    for (var z = Tile.fromID(id).z; z >= minCoveringZoom; z--)
                        if (id = Tile.parent(id), this.tiles[id] && this.tiles[id].loaded) return retain[id] = !0, !0;
                    return !1
                },
                _updateTiles: function() {
                    if (this.map.loadNewTiles && this.loadNewTiles && this.map.style.sources[this.id]) {
                        for (var i, id, complete, tile, zoom = Math.floor(this._getZoom()), required = this._getCoveringTiles().sort(this._centerOut.bind(this)), panTileZoom = Math.max(this.minTileZoom, zoom - 4), panTiles = this._getCoveringTiles(panTileZoom), minCoveringZoom = Math.max(this.minTileZoom, zoom - 10), maxCoveringZoom = this.minTileZoom; zoom + 1 > maxCoveringZoom;) {
                            var level = this._childZoomLevel(maxCoveringZoom);
                            if (null === level) break;
                            maxCoveringZoom = level
                        }
                        var retain = {};
                        this.coveredTiles = {};
                        var fullyComplete = !0;
                        for (i = 0; i < required.length; i++) id = +required[i], retain[id] = !0, tile = this._addTile(id), tile.loaded || (complete = this._findLoadedChildren(id, maxCoveringZoom, retain), complete || (complete = this._findLoadedParent(id, minCoveringZoom, retain)), complete || (fullyComplete = !1));
                        var now = (new Date).getTime(),
                            fadeDuration = this.map.style.rasterFadeDuration;
                        for (id in retain) tile = this.tiles[id], tile && tile.timeAdded > now - fadeDuration && (complete = this._findLoadedChildren(id, maxCoveringZoom, retain), complete ? this.coveredTiles[id] = !0 : this._findLoadedParent(id, minCoveringZoom, retain));
                        for (id in this.coveredTiles) retain[id] = !0;
                        for (i = 0; i < panTiles.length; i++) {
                            var panTile = panTiles[i];
                            retain[panTile] || (retain[panTile] = !0, this._addTile(panTile), fullyComplete && (this.coveredTiles[panTile] = !0))
                        }
                        var remove = util.keysDifference(this.tiles, retain);
                        for (i = 0; i < remove.length; i++) id = +remove[i], this._removeTile(id)
                    }
                },
                _loadTile: function(id) {
                    function tileComplete(err) {
                        err || (layer.fire("tile.load", {
                            tile: tile
                        }), map.update())
                    }
                    var tile, layer = this,
                        map = this.map,
                        pos = Tile.fromID(id);
                    if (0 === pos.w) {
                        var url = Tile.url(id, this.options.url, this.options.subdomains);
                        tile = this.tiles[id] = new this.Tile(id, this, url, tileComplete)
                    } else {
                        var wrapped = Tile.toID(pos.z, pos.x, pos.y, 0);
                        tile = this.tiles[id] = this.tiles[wrapped] || this._addTile(wrapped), tile.uses++
                    }
                    return tile
                },
                _addTile: function(id) {
                    var tile = this.tiles[id];
                    return tile || (tile = this.cache.get(id), tile && (this.tiles[id] = tile)), tile || (tile = this._loadTile(id), this.fire("tile.add", {
                        tile: tile
                    })), tile && tile.loaded && !tile.timeAdded && (tile.timeAdded = (new Date).getTime(), this.map.animationLoop.set(this.map.style.rasterFadeDuration)), this.map.addTile(tile), tile
                },
                _removeTile: function(id) {
                    var tile = this.tiles[id];
                    tile && (tile.uses--, delete this.tiles[id], tile.uses <= 0 && (delete tile.timeAdded, tile.loaded ? this.cache.add(id, tile) : (tile.abort(), tile.remove()), this.map.removeTile(tile), this.fire("tile.remove", {
                        tile: tile
                    })))
                },
                _scanTriangle: function(a, b, c, ymin, ymax, scanLine) {
                    var t, ab = this._edge(a, b),
                        bc = this._edge(b, c),
                        ca = this._edge(c, a);
                    ab.dy > bc.dy && (t = ab, ab = bc, bc = t), ab.dy > ca.dy && (t = ab, ab = ca, ca = t), bc.dy > ca.dy && (t = bc, bc = ca, ca = t), ab.dy && this._scanSpans(ca, ab, ymin, ymax, scanLine), bc.dy && this._scanSpans(ca, bc, ymin, ymax, scanLine)
                },
                _edge: function(a, b) {
                    if (a.row > b.row) {
                        var t = a;
                        a = b, b = t
                    }
                    return {
                        x0: a.column,
                        y0: a.row,
                        x1: b.column,
                        y1: b.row,
                        dx: b.column - a.column,
                        dy: b.row - a.row
                    }
                },
                _scanSpans: function(e0, e1, ymin, ymax, scanLine) {
                    var y0 = Math.max(ymin, Math.floor(e1.y0)),
                        y1 = Math.min(ymax, Math.ceil(e1.y1));
                    if (e0.x0 == e1.x0 && e0.y0 == e1.y0 ? e0.x0 + e1.dy / e0.dy * e0.dx < e1.x1 : e0.x1 - e1.dy / e0.dy * e0.dx < e1.x0) {
                        var t = e0;
                        e0 = e1, e1 = t
                    }
                    for (var m0 = e0.dx / e0.dy, m1 = e1.dx / e1.dy, d0 = e0.dx > 0, d1 = e1.dx < 0, y = y0; y1 > y; y++) {
                        var x0 = m0 * Math.max(0, Math.min(e0.dy, y + d0 - e0.y0)) + e0.x0,
                            x1 = m1 * Math.max(0, Math.min(e1.dy, y + d1 - e1.y0)) + e1.x0;
                        scanLine(Math.floor(x1), Math.ceil(x0), y)
                    }
                },
                _z_order: function(a, b) {
                    return b % 32 - a % 32
                },
                _centerOut: function(a, b) {
                    var tr = this.map.transform,
                        aPos = Tile.fromID(a),
                        bPos = Tile.fromID(b),
                        c = Coordinate.izoomTo(tr.locationCoordinate(tr.center), aPos.z),
                        center = new Point(c.column - .5, c.row - .5);
                    return center.dist(aPos) - center.dist(bPos)
                }
            })
        }, {
            "../geometry/point.js": 18,
            "../util/coordinate.js": 59,
            "../util/evented.js": 61,
            "../util/mrucache.js": 62,
            "../util/util.js": 64,
            "./rastertile.js": 53,
            "./tile.js": 55,
            "./vectortile.js": 57
        }
    ],
    55: [
        function(require, module) {
            "use strict";
            var glmatrix = require("../lib/glmatrix.js"),
                mat2 = glmatrix.mat2,
                mat4 = glmatrix.mat4,
                vec2 = glmatrix.vec2,
                Tile = module.exports = {};
            Tile.tileExtent = 4096, Tile.calculateMatrices = function(z, x, y, transform, painter) {
                var tileScale = Math.pow(2, z),
                    scale = transform.worldSize / tileScale;
                if (this.scale = scale, this.posMatrix = new Float64Array(16), mat4.identity(this.posMatrix), mat4.translate(this.posMatrix, this.posMatrix, [transform.centerPoint.x, transform.centerPoint.y, 0]), mat4.rotateZ(this.posMatrix, this.posMatrix, transform.angle), mat4.translate(this.posMatrix, this.posMatrix, [-transform.x, -transform.y, 0]), mat4.translate(this.posMatrix, this.posMatrix, [scale * x, scale * y, 1]), this.invPosMatrix = new Float64Array(16), mat4.invert(this.invPosMatrix, this.posMatrix), mat4.scale(this.posMatrix, this.posMatrix, [scale / this.tileExtent, scale / this.tileExtent, 1]), mat4.multiply(this.posMatrix, painter.projectionMatrix, this.posMatrix), this.exMatrix = mat4.clone(painter.projectionMatrix), mat4.rotateZ(this.exMatrix, this.exMatrix, transform.angle), this.rotationMatrix = mat2.create(), mat2.rotate(this.rotationMatrix, this.rotationMatrix, transform.angle), this.posMatrix = new Float32Array(this.posMatrix), this.exMatrix = new Float32Array(this.exMatrix), isNaN(this.posMatrix[0])) throw arguments
            }, Tile.positionAt = function(id, point) {
                if (!this.invPosMatrix) return null;
                var pos = vec2.transformMat4([], [point.x, point.y], this.invPosMatrix);
                return vec2.scale(pos, pos, 4096 / this.scale), {
                    x: pos[0],
                    y: pos[1],
                    scale: this.scale
                }
            }, Tile.toID = function(z, x, y, w) {
                w = w || 0, w *= 2, 0 > w && (w = -1 * w - 1);
                var dim = 1 << z;
                return 32 * (dim * dim * w + dim * y + x) + z
            }, Tile.asString = function(id) {
                var pos = Tile.fromID(id);
                return pos.z + "/" + pos.x + "/" + pos.y
            }, Tile.fromID = function(id) {
                var z = id % 32,
                    dim = 1 << z,
                    xy = (id - z) / 32,
                    x = xy % dim,
                    y = (xy - x) / dim % dim,
                    w = Math.floor(xy / (dim * dim));
                return w % 2 !== 0 && (w = -1 * w - 1), w /= 2, {
                    z: z,
                    x: x,
                    y: y,
                    w: w
                }
            }, Tile.zoom = function(id) {
                return id % 32
            }, Tile.url = function(id, template, subdomains) {
                var pos = Tile.fromID(id);
                return subdomains = subdomains || "abc", template.replace("{h}", (pos.x % 16).toString(16) + (pos.y % 16).toString(16)).replace("{s}", subdomains[Math.floor((pos.x + pos.y) % subdomains.length)]).replace("{z}", pos.z.toFixed(0)).replace("{x}", pos.x.toFixed(0)).replace("{y}", pos.y.toFixed(0))
            }, Tile.parent = function(id) {
                var pos = Tile.fromID(id);
                return 0 === pos.z ? id : Tile.toID(pos.z - 1, Math.floor(pos.x / 2), Math.floor(pos.y / 2))
            }, Tile.parentWithZoom = function(id, zoom) {
                for (var pos = Tile.fromID(id); pos.z > zoom;) pos.z--, pos.x = Math.floor(pos.x / 2), pos.y = Math.floor(pos.y / 2);
                return Tile.toID(pos.z, pos.x, pos.y)
            }, Tile.children = function(id) {
                var pos = Tile.fromID(id);
                return pos.z += 1, pos.x *= 2, pos.y *= 2, [Tile.toID(pos.z, pos.x, pos.y), Tile.toID(pos.z, pos.x + 1, pos.y), Tile.toID(pos.z, pos.x, pos.y + 1), Tile.toID(pos.z, pos.x + 1, pos.y + 1)]
            }
        }, {
            "../lib/glmatrix.js": 20
        }
    ],
    56: [
        function(require, module) {
            "use strict";

            function Transform(tileSize, minZoom, maxZoom) {
                this.tileSize = tileSize, this._minZoom = minZoom || 0, this._maxZoom = maxZoom || 22, this.width = 0, this.height = 0, this.zoom = 0, this.center = new LatLng(0, 0), this.angle = 0
            }
            var LatLng = require("../geometry/latlng.js"),
                Point = require("../geometry/point.js");
            module.exports = Transform, Transform.prototype = {
                get minZoom() {
                    return this._minZoom
                }, set minZoom(zoom) {
                    this._minZoom = zoom, this.zoom = Math.max(this.zoom, zoom)
                }, get maxZoom() {
                    return this._maxZoom
                }, set maxZoom(zoom) {
                    this._maxZoom = zoom, this.zoom = Math.min(this.zoom, zoom)
                }, get worldSize() {
                    return this.tileSize * this.scale
                }, get centerPoint() {
                    return this.size._div(2)
                }, get size() {
                    return new Point(this.width, this.height)
                }, get zoom() {
                    return this._zoom
                }, set zoom(zoom) {
                    zoom = Math.min(Math.max(zoom, this.minZoom), this.maxZoom), this._zoom = zoom, this.scale = this.zoomScale(zoom), this.tileZoom = Math.floor(zoom), this.zoomFraction = zoom - this.tileZoom
                }, zoomScale: function(zoom) {
                    return Math.pow(2, zoom)
                },
                scaleZoom: function(scale) {
                    return Math.log(scale) / Math.LN2
                },
                get x() {
                    return this.lngX(this.center.lng)
                },
                get y() {
                    return this.latY(this.center.lat)
                },
                get point() {
                    return new Point(this.x, this.y)
                },
                lngX: function(lon) {
                    return (180 + lon) * this.worldSize / 360
                },
                latY: function(lat) {
                    var y = 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
                    return (180 - y) * this.worldSize / 360
                },
                xLng: function(x, worldSize) {
                    return 360 * x / (worldSize || this.worldSize) - 180
                },
                yLat: function(y, worldSize) {
                    var y2 = 180 - 360 * y / (worldSize || this.worldSize);
                    return 360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90
                },
                panBy: function(offset) {
                    var point = this.centerPoint._add(offset);
                    this.center = this.pointLocation(point)
                },
                zoomAroundTo: function(zoom, p) {
                    var p1 = this.size._sub(p),
                        latlng = this.pointLocation(p1);
                    this.zoom = zoom, this.panBy(p1.sub(this.locationPoint(latlng)))
                },
                locationPoint: function(latlng) {
                    var p = new Point(this.lngX(latlng.lng), this.latY(latlng.lat));
                    return this.centerPoint._sub(this.point._sub(p)._rotate(this.angle))
                },
                pointLocation: function(p) {
                    var p2 = this.centerPoint._sub(p)._rotate(-this.angle);
                    return new LatLng(this.yLat(this.y - p2.y), this.xLng(this.x - p2.x))
                },
                locationCoordinate: function(latlng) {
                    var k = this.zoomScale(this.tileZoom) / this.worldSize;
                    return {
                        column: this.lngX(latlng.lng) * k,
                        row: this.latY(latlng.lat) * k,
                        zoom: this.tileZoom
                    }
                },
                pointCoordinate: function(tileCenter, p) {
                    var zoomFactor = this.zoomScale(this.zoomFraction),
                        kt = this.zoomScale(this.tileZoom - tileCenter.zoom),
                        p2 = this.centerPoint._sub(p)._rotate(-this.angle)._div(this.tileSize * zoomFactor);
                    return {
                        column: tileCenter.column * kt - p2.x,
                        row: tileCenter.row * kt - p2.y,
                        zoom: this.tileZoom
                    }
                }
            }
        }, {
            "../geometry/latlng.js": 14,
            "../geometry/point.js": 18
        }
    ],
    57: [
        function(require, module) {
            "use strict";

            function VectorTile(id, source, url, callback) {
                this.id = id, this.loaded = !1, this.url = url, this.zoom = Tile.fromID(id).z, this.map = source.map, this.source = source, this.id = util.uniqueId(), this._load(), this.callback = callback, this.uses = 1
            }
            var Tile = require("./tile.js"),
                LineVertexBuffer = require("../geometry/linevertexbuffer.js"),
                LineElementBuffer = require("../geometry/lineelementbuffer.js"),
                FillVertexBuffer = require("../geometry/fillvertexbuffer.js"),
                FillElementsBuffer = require("../geometry/fillelementsbuffer.js"),
                GlyphVertexBuffer = require("../geometry/glyphvertexbuffer.js"),
                PointVertexBuffer = require("../geometry/pointvertexbuffer.js"),
                Bucket = require("../geometry/bucket.js"),
                util = require("../util/util.js");
            module.exports = VectorTile, VectorTile.prototype = Object.create(Tile), VectorTile.prototype._load = function() {
                var tile = this;
                this.workerID = this.map.dispatcher.send("load tile", {
                    url: this.url,
                    id: this.id,
                    zoom: this.zoom,
                    tileSize: this.source.tileSize,
                    template: this.source.options.url,
                    glyphs: this.source.options.glyphs
                }, function(err, data) {
                    !err && data && tile.onTileLoad(data), tile.callback(err)
                })
            }, VectorTile.prototype.featuresAt = function(pos, params, callback) {
                this.map.dispatcher.send("query features", {
                    id: this.id,
                    x: pos.x,
                    y: pos.y,
                    scale: pos.scale,
                    params: params
                }, callback, this.workerID)
            }, VectorTile.prototype.onTileLoad = function(data) {
                if (this.map) {
                    this.geometry = data.geometry, this.geometry.glyphVertex = new GlyphVertexBuffer(this.geometry.glyphVertex), this.geometry.pointVertex = new PointVertexBuffer(this.geometry.pointVertex), this.geometry.lineBuffers.forEach(function(d) {
                        d.vertex = new LineVertexBuffer(d.vertex), d.element = new LineElementBuffer(d.element)
                    }), this.geometry.fillBuffers.forEach(function(d) {
                        d.vertex = new FillVertexBuffer(d.vertex), d.elements = new FillElementsBuffer(d.elements)
                    }), this.buckets = {};
                    for (var b in data.buckets) this.buckets[b] = new Bucket(this.map.style.stylesheet.buckets[b], this.geometry, void 0, data.buckets[b].indices);
                    this.loaded = !0
                }
            }, VectorTile.prototype.remove = function() {
                if (this.map.dispatcher.send("remove tile", this.id, null, this.workerID), this.map.painter.glyphAtlas.removeGlyphs(this.id), this.geometry) {
                    var gl = this.map.painter.gl,
                        geometry = this.geometry;
                    geometry.glyphVertex.destroy(gl), geometry.pointVertex.destroy(gl);
                    for (var i = 0; i <= geometry.fillBufferIndex; i++) geometry.fillBuffers[i].vertex.destroy(gl), geometry.fillBuffers[i].elements.destroy(gl);
                    for (var k = 0; k <= geometry.lineBufferIndex; k++) geometry.lineBuffers[k].vertex.destroy(gl), geometry.lineBuffers[k].element.destroy(gl)
                }
                delete this.map
            }, VectorTile.prototype.abort = function() {
                this.map.dispatcher.send("abort tile", this.id, null, this.workerID)
            }
        }, {
            "../geometry/bucket.js": 6,
            "../geometry/fillelementsbuffer.js": 9,
            "../geometry/fillvertexbuffer.js": 10,
            "../geometry/glyphvertexbuffer.js": 12,
            "../geometry/lineelementbuffer.js": 16,
            "../geometry/linevertexbuffer.js": 17,
            "../geometry/pointvertexbuffer.js": 19,
            "../util/util.js": 64,
            "./tile.js": 55
        }
    ],
    58: [
        function(require, module) {
            "use strict";

            function Actor(target, parent) {
                this.target = target, this.parent = parent, this.callbacks = {}, this.callbackID = 0, this.receive = this.receive.bind(this), this.target.addEventListener("message", this.receive, !1)
            }
            module.exports = Actor, Actor.prototype.receive = function(message) {
                var callback, data = message.data;
                if ("<response>" == data.type) callback = this.callbacks[data.id], delete this.callbacks[data.id], callback(data.error || null, data.data);
                else if ("undefined" != typeof data.id) {
                    var id = data.id;
                    this.parent[data.type](data.data, function(err, data, buffers) {
                        message.target.postMessage({
                            type: "<response>",
                            id: String(id),
                            error: err ? String(err) : null,
                            data: data
                        }, buffers)
                    })
                } else this.parent[data.type](data.data)
            }, Actor.prototype.send = function(type, data, callback, buffers) {
                var id = null;
                callback && (this.callbacks[id = this.callbackID++] = callback), this.target.postMessage({
                    type: type,
                    id: String(id),
                    data: data
                }, buffers)
            }
        }, {}
    ],
    59: [
        function(require, module, exports) {
            "use strict";
            exports.zoomTo = function(c, z) {
                var c2 = {
                    column: c.column,
                    row: c.row,
                    zoom: c.zoom
                };
                return exports.izoomTo(c2, z)
            }, exports.izoomTo = function(c, z) {
                return c.column = c.column * Math.pow(2, z - c.zoom), c.row = c.row * Math.pow(2, z - c.zoom), c.zoom = z, c
            }, exports.ifloor = function(c) {
                return c.column = Math.floor(c.column), c.row = Math.floor(c.row), c.zoom = Math.floor(c.zoom), c
            }
        }, {}
    ],
    60: [
        function(require, module) {
            "use strict";

            function Dispatcher(length, parent) {
                this.actors = [], this.currentActor = 0;
                var url, blob, i;
                for (i = 0; length > i; i++) {
                    absolute ? (blob = new Blob(['importScripts("' + workerFile + '");'], {
                        type: "application/javascript"
                    }), url = window.URL.createObjectURL(blob)) : url = workerFile;
                    var worker = new Worker(url),
                        actor = new Actor(worker, parent);
                    actor.name = "Worker " + i, this.actors.push(actor)
                }
            }
            var Actor = require("./actor.js"),
                scripts = document.getElementsByTagName("script"),
                workerFile = scripts[scripts.length - 1].getAttribute("src"),
                absolute = -1 !== workerFile.indexOf("http");
            module.exports = Dispatcher, Dispatcher.prototype.broadcast = function(type, data) {
                for (var i = 0; i < this.actors.length; i++) this.actors[i].send(type, data)
            }, Dispatcher.prototype.send = function(type, data, callback, targetID, buffers) {
                return ("number" != typeof targetID || isNaN(targetID)) && (targetID = this.currentActor = (this.currentActor + 1) % this.actors.length), this.actors[targetID].send(type, data, callback, buffers), targetID
            }
        }, {
            "./actor.js": 58
        }
    ],
    61: [
        function(require, module) {
            "use strict";
            var util = require("./util.js");
            module.exports = {
                on: function(type, fn) {
                    return this._events = this._events || {}, this._events[type] = this._events[type] || [], this._events[type].push(fn), this
                },
                off: function(type, fn) {
                    if (!type) return delete this._events, this;
                    if (!this.listens(type)) return this;
                    if (fn) {
                        var idx = this._events[type].indexOf(fn);
                        idx >= 0 && this._events[type].splice(idx, 1)
                    } else delete this._events[type];
                    return this
                },
                fire: function(type, data) {
                    if (!this.listens(type)) return this;
                    data = util.extend({}, data, {
                        type: type,
                        target: this
                    });
                    for (var listeners = this._events[type].slice(), i = 0; i < listeners.length; i++) listeners[i].call(this, data);
                    return this
                },
                listens: function(type) {
                    return !(!this._events || !this._events[type])
                }
            }
        }, {
            "./util.js": 64
        }
    ],
    62: [
        function(require, module) {
            "use strict";

            function MRUCache(length, onRemove) {
                this.max = length, this.onRemove = onRemove, this.reset()
            }
            module.exports = MRUCache, MRUCache.prototype.reset = function() {
                return this.list = {}, this.order = [], this
            }, MRUCache.prototype.add = function(key, data) {
                if (this.list[key] = data, this.order.push(key), this.order.length > this.max) {
                    var removedData = this.get(this.order[0]);
                    removedData && this.onRemove(removedData)
                }
                return this
            }, MRUCache.prototype.has = function(key) {
                return key in this.list
            }, MRUCache.prototype.keys = function() {
                return this.order
            }, MRUCache.prototype.get = function(key) {
                if (!this.has(key)) return null;
                var data = this.list[key];
                return delete this.list[key], this.order.splice(this.order.indexOf(key), 1), data
            }
        }, {}
    ],
    63: [
        function(require, module) {
            "use strict";

            function resolveTokens(feature, expression) {
                for (var match, value, text = expression; match = text.match(tokenPattern);) value = "undefined" == typeof feature[match[1]] ? "" : feature[match[1]], text = text.replace(match[0], value);
                return text
            }
            module.exports = resolveTokens;
            var tokenPattern = /{{(\w+)}}/
        }, {}
    ],
    64: [
        function(require, module, exports) {
            "use strict";

            function frame(fn) {
                return (window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame)(fn)
            }
            var UnitBezier = require("unitbezier");
            exports.easeCubicInOut = function(t) {
                if (0 >= t) return 0;
                if (t >= 1) return 1;
                var t2 = t * t,
                    t3 = t2 * t;
                return 4 * (.5 > t ? t3 : 3 * (t - t2) + t3 - .75)
            }, exports.bezier = function(p1x, p1y, p2x, p2y) {
                var bezier = new UnitBezier(p1x, p1y, p2x, p2y);
                return function(t) {
                    return bezier.solve(t)
                }
            }, exports.ease = exports.bezier(.25, .1, .25, 1), exports.frame = frame, exports.timed = function(fn, dur, ctx) {
                function tick(now) {
                    abort || (window.performance || (now = Date.now()), now > start + dur ? fn.call(ctx, 1) : (fn.call(ctx, (now - start) / dur), frame(tick)))
                }
                if (!dur) return fn.call(ctx, 1);
                var abort = !1,
                    start = window.performance ? window.performance.now() : Date.now();
                return frame(tick),
                function() {
                    abort = !0
                }
            }, exports.interp = function(a, b, t) {
                return a * (1 - t) + b * t
            }, exports.premultiply = function(c) {
                return c[0] *= c[3], c[1] *= c[3], c[2] *= c[3], c
            }, exports.asyncEach = function(array, fn, callback) {
                function check() {
                    0 === --remaining && callback()
                }
                var remaining = array.length;
                if (0 === remaining) return callback();
                for (var i = 0; i < array.length; i++) fn(array[i], check)
            }, exports.keysDifference = function(obj, other) {
                var difference = [];
                for (var i in obj) i in other || difference.push(i);
                return difference
            }, exports.extend = function(dest, src) {
                for (var i in src) Object.defineProperty(dest, i, Object.getOwnPropertyDescriptor(src, i));
                return dest
            };
            var id = 1;
            exports.uniqueId = function() {
                return id++
            }
        }, {
            unitbezier: 76
        }
    ],
    65: [
        function(require, module) {
            "use strict";

            function loadBuffer(url, callback) {
                var xhr = new XMLHttpRequest;
                return xhr.open("GET", url, !0), xhr.responseType = "arraybuffer", xhr.onload = function() {
                    xhr.status >= 200 && xhr.status < 300 && xhr.response ? callback(null, xhr.response) : callback(xhr.statusText)
                }, xhr.send(), xhr
            }

            function GlyphTile(url, callback) {
                var tile = this;
                this.url = url;
                var id = this.id = -1;
                GlyphTile.loading[id] = loadBuffer(url, function(err, data) {
                    delete GlyphTile.loading[id], err ? callback(err) : (GlyphTile.loaded[id] = tile, tile.data = new Glyphs(new Protobuf(new Uint8Array(data))), tile.parse(tile.data, callback))
                })
            }
            var Protobuf = require("pbf"),
                Glyphs = require("../format/glyphs.js"),
                actor = require("./worker.js");
            module.exports = GlyphTile, GlyphTile.cancel = function(id) {
                GlyphTile.loading[id] && (GlyphTile.loading[id].abort(), delete GlyphTile.loading[id])
            }, GlyphTile.loading = {}, GlyphTile.loaded = {}, GlyphTile.prototype.parse = function(tile, callback) {
                var self = this;
                actor.send("add glyph range", {
                    id: self.id,
                    stacks: tile.stacks
                }, callback)
            }
        }, {
            "../format/glyphs.js": 1,
            "./worker.js": 66,
            pbf: 72
        }
    ],
    66: [
        function(require, module) {
            "use strict";
            var Actor = require("../util/actor.js"),
                bucketFilter = require("../style/bucket-filter.js");
            module.exports = new Actor(self, self);
            var WorkerTile = require("./workertile.js");
            "undefined" == typeof self.alert && (self.alert = function() {
                self.postMessage({
                    type: "alert message",
                    data: [].slice.call(arguments)
                })
            }), self["set buckets"] = function(data) {
                var buckets = WorkerTile.buckets = data;
                for (var id in buckets) buckets[id].fn = bucketFilter(buckets[id], ["source", "layer", "feature_type"])
            }, self["load tile"] = function(params, callback) {
                new WorkerTile(params.url, params.id, params.zoom, params.tileSize, params.template, params.glyphs, callback)
            }, self["abort tile"] = function(id) {
                WorkerTile.cancel(id)
            }, self["remove tile"] = function(id) {
                WorkerTile.loaded[id] && delete WorkerTile.loaded[id]
            }, self["query features"] = function(params, callback) {
                var tile = WorkerTile.loaded[params.id];
                tile ? tile.featureTree.query(params, callback) : callback(null, [])
            }
        }, {
            "../style/bucket-filter.js": 32,
            "../util/actor.js": 58,
            "./workertile.js": 67
        }
    ],
    67: [
        function(require, module) {
            "use strict";

            function loadBuffer(url, callback) {
                var xhr = new XMLHttpRequest;
                return xhr.open("GET", url, !0), xhr.responseType = "arraybuffer", xhr.onload = function() {
                    xhr.status >= 200 && xhr.status < 300 && xhr.response ? callback(null, xhr.response) : callback(xhr.statusText)
                }, xhr.send(), xhr
            }

            function WorkerTile(url, id, zoom, tileSize, template, glyphs, callback) {
                var tile = this;
                this.url = url, this.id = id, this.zoom = zoom, this.tileSize = tileSize, this.template = template, this.glyphs = glyphs, WorkerTile.loading[id] = loadBuffer(url, function(err, data) {
                    delete WorkerTile.loading[id], err ? callback(err) : (WorkerTile.loaded[id] = tile, tile.data = new VectorTile(new Protobuf(new Uint8Array(data))), tile.parse(tile.data, callback))
                })
            }

            function sortFeaturesIntoBuckets(layer, mapping) {
                for (var buckets = {}, i = 0; i < layer.length; i++) {
                    var feature = layer.feature(i);
                    for (var key in mapping)
                        if (!mapping[key].fn || mapping[key].fn(feature)) {
                            var type = VectorTileFeature.mapping[feature._type];
                            (type === mapping[key].filter.feature_type || mapping[key][type]) && (key in buckets || (buckets[key] = []), buckets[key].push(feature))
                        }
                }
                return buckets
            }

            function getGeometry(feature) {
                return feature.loadGeometry()
            }

            function getType(feature) {
                return geometryTypeToName[feature._type]
            }
            var Geometry = require("../geometry/geometry.js"),
                Bucket = require("../geometry/bucket.js"),
                FeatureTree = require("../geometry/featuretree.js"),
                Protobuf = require("pbf"),
                VectorTile = require("../format/vectortile.js"),
                VectorTileFeature = require("../format/vectortilefeature.js"),
                Placement = require("../text/placement.js"),
                Loader = require("../text/loader.js"),
                Shaping = require("../text/shaping.js"),
                queue = require("queue-async"),
                getRanges = require("../text/ranges.js"),
                resolveTokens = require("../util/token.js"),
                actor = require("./worker.js");
            module.exports = WorkerTile, WorkerTile.cancel = function(id) {
                WorkerTile.loading[id] && (WorkerTile.loading[id].abort(), delete WorkerTile.loading[id])
            }, WorkerTile.loading = {}, WorkerTile.loaded = {}, WorkerTile.buckets = {}, WorkerTile.prototype.parseBucket = function(tile, bucket_name, features, info, layer, layerDone, callback) {
                function done(err) {
                    layerDone(err, bucket, callback)
                }
                var geometry = tile.geometry,
                    bucket = new Bucket(info, geometry, tile.placement);
                info.text ? tile.parseTextBucket(tile, bucket_name, features, bucket, info, layer, done) : info.point ? tile.parsePointBucket(tile, bucket_name, features, bucket, info, layer, done) : tile.parseOtherBucket(tile, bucket_name, features, bucket, info, layer, done)
            }, WorkerTile.prototype.parseOtherBucket = function(tile, bucket_name, features, bucket, info, layer, callback) {
                bucket.start();
                for (var i = 0; i < features.length; i++) {
                    var feature = features[i];
                    bucket.addFeature(feature.loadGeometry()), tile.featureTree.insert(feature.bbox(), bucket_name, feature)
                }
                bucket.end(), setTimeout(callback, 0)
            }, WorkerTile.prototype.parsePointBucket = function(tile, bucket_name, features, bucket, info, layer, callback) {
                function addFeatures(err, sprite) {
                    if (err) return callback(err);
                    bucket.start();
                    for (var i = 0; i < features.length; i++) {
                        var feature = features[i],
                            imagePos = !1;
                        info["point-image"] && sprite && (imagePos = sprite[resolveTokens(feature, info["point-image"])], imagePos = imagePos && {
                            tl: [imagePos.x, imagePos.y],
                            br: [imagePos.x + imagePos.width, imagePos.y + imagePos.height]
                        }), bucket.addFeature(feature.loadGeometry(), imagePos), tile.featureTree.insert(feature.bbox(), bucket_name, feature)
                    }
                    bucket.end(), setTimeout(callback, 0)
                }
                info["point-image"] ? actor.send("get sprite json", {}, addFeatures) : addFeatures()
            }, WorkerTile.prototype.parseTextBucket = function(tile, bucket_name, features, bucket, info, layer, callback) {
                var fontstack = info["text-font"],
                    data = getRanges(features, info),
                    ranges = data.ranges,
                    text_features = data.text_features,
                    codepoints = data.codepoints;
                Loader.whenLoaded(tile, fontstack, ranges, function(err) {
                    if (err) return callback(err);
                    var stacks = {};
                    stacks[fontstack] = {}, stacks[fontstack].glyphs = codepoints.reduce(function(obj, codepoint) {
                        return obj[codepoint] = Loader.stacks[fontstack].glyphs[codepoint], obj
                    }, {}), actor.send("add glyphs", {
                        id: tile.id,
                        stacks: stacks
                    }, function(err, rects) {
                        if (err) return callback(err);
                        for (var name in rects) stacks[name] || (stacks[name] = {}), stacks[name].rects = rects[name];
                        var alignment = .5;
                        "right" === bucket.info["text-alignment"] ? alignment = 1 : "left" === bucket.info["text-alignment"] && (alignment = 0);
                        var oneEm = 24,
                            lineHeight = (bucket.info["text-line-height"] || 1.2) * oneEm,
                            maxWidth = (bucket.info["text-max-width"] || 15) * oneEm,
                            spacing = (bucket.info["text-letter-spacing"] || 0) * oneEm;
                        bucket.start();
                        for (var k = 0; k < text_features.length; k++) {
                            var text = text_features[k].text,
                                lines = text_features[k].geometry,
                                shaping = Shaping.shape(text, fontstack, stacks, maxWidth, lineHeight, alignment, spacing);
                            shaping && bucket.addFeature(lines, stacks, shaping)
                        }
                        bucket.end(), callback()
                    })
                })
            };
            var geometryTypeToName = [null, "point", "line", "fill"];
            WorkerTile.prototype.parse = function(tile, callback) {
                function layerDone(key) {
                    return function(err, bucket, callback) {
                        return err ? callback(err) : (layers[key] = bucket, void callback())
                    }
                }
                var self = this,
                    buckets = WorkerTile.buckets,
                    layers = {};
                this.geometry = new Geometry, this.placement = new Placement(this.geometry, this.zoom, this.tileSize), this.featureTree = new FeatureTree(getGeometry, getType);
                var layerName, sourceLayers = {};
                for (var bucket in buckets) layerName = buckets[bucket].filter.layer, sourceLayers[layerName] || (sourceLayers[layerName] = {}), sourceLayers[layerName][bucket] = buckets[bucket];
                var layer, q = queue(1),
                    layerSets = {};
                for (layerName in sourceLayers)
                    if (layer = tile.layers[layerName]) {
                        var featuresets = sortFeaturesIntoBuckets(layer, sourceLayers[layerName]);
                        layerSets[layerName] = featuresets
                    }
                for (var key in buckets) {
                    var info = buckets[key];
                    if (info) {
                        layerName = info.filter.layer;
                        var features = layerSets[layerName] && layerSets[layerName][key];
                        layer = tile.layers[layerName], features && q.defer(self.parseBucket, this, key, features, info, layer, layerDone(key))
                    } else alert("missing bucket information for bucket " + key)
                }
                q.awaitAll(function() {
                    var buffers = self.geometry.bufferList(),
                        bucketJSON = {};
                    for (var b in layers) bucketJSON[b] = layers[b].toJSON();
                    callback(null, {
                        geometry: self.geometry,
                        buckets: bucketJSON
                    }, buffers), self.geometry = null, self.placement = null
                })
            }
        }, {
            "../format/vectortile.js": 2,
            "../format/vectortilefeature.js": 3,
            "../geometry/bucket.js": 6,
            "../geometry/featuretree.js": 8,
            "../geometry/geometry.js": 11,
            "../text/loader.js": 40,
            "../text/placement.js": 41,
            "../text/ranges.js": 42,
            "../text/shaping.js": 44,
            "../util/token.js": 63,
            "./worker.js": 66,
            pbf: 72,
            "queue-async": 74
        }
    ],
    68: [
        function() {}, {}
    ],
    69: [
        function(require, module) {
            function rewind(gj, outer) {
                switch (gj && gj.type || null) {
                    case "FeatureCollection":
                        return gj.features = gj.features.map(curryOuter(rewind, outer)), gj;
                    case "Feature":
                        return gj.geometry = rewind(gj.geometry, outer), gj;
                    case "Polygon":
                    case "MultiPolygon":
                        return correct(gj, outer);
                    default:
                        return gj
                }
            }

            function curryOuter(a, b) {
                return function(_) {
                    return a(_, b)
                }
            }

            function correct(_, outer) {
                return "Polygon" === _.type ? _.coordinates = correctRings(_.coordinates, outer) : "MultiPolygon" === _.type && (_.coordinates = _.coordinates.map(curryOuter(correctRings, outer))), _
            }

            function correctRings(_, outer) {
                outer = !! outer, _[0] = wind(_[0], !outer);
                for (var i = 1; i < _.length; i++) _[i] = wind(_[i], outer);
                return _
            }

            function wind(_, dir) {
                return cw(_) === dir ? _ : _.reverse()
            }

            function cw(_) {
                return geojsonArea.ring(_) >= 0
            }
            var geojsonArea = require("geojson-area");
            module.exports = rewind
        }, {
            "geojson-area": 70
        }
    ],
    70: [
        function(require, module) {
            function geometry(_) {
                if ("Polygon" === _.type) return polygonArea(_.coordinates);
                if ("MultiPolygon" === _.type) {
                    for (var area = 0, i = 0; i < _.coordinates.length; i++) area += polygonArea(_.coordinates[i]);
                    return area
                }
                return null
            }

            function polygonArea(coords) {
                var area = 0;
                if (coords && coords.length > 0) {
                    area += Math.abs(ringArea(coords[0]));
                    for (var i = 1; i < coords.length; i++) area -= Math.abs(ringArea(coords[i]))
                }
                return area
            }

            function ringArea(coords) {
                var area = 0;
                if (coords.length > 2) {
                    for (var p1, p2, i = 0; i < coords.length - 1; i++) p1 = coords[i], p2 = coords[i + 1], area += rad(p2[0] - p1[0]) * (2 + Math.sin(rad(p1[1])) + Math.sin(rad(p2[1])));
                    area = area * wgs84.RADIUS * wgs84.RADIUS / 2
                }
                return area
            }

            function rad(_) {
                return _ * Math.PI / 180
            }
            var wgs84 = require("wgs84");
            module.exports.geometry = geometry, module.exports.ring = ringArea
        }, {
            wgs84: 71
        }
    ],
    71: [
        function(require, module) {
            module.exports.RADIUS = 6378137, module.exports.FLATTENING = 1 / 298.257223563, module.exports.POLAR_RADIUS = 6356752.3142
        }, {}
    ],
    72: [
        function(require, module) {
            "use strict";

            function Protobuf(buf) {
                this.buf = buf, this.length = buf.length, this.pos = 0
            }
            var ieee754 = require("ieee754");
            module.exports = Protobuf, Protobuf.prototype.destroy = function() {
                this.buf = null
            }, Protobuf.prototype.readUInt32 = function() {
                var val = this.readUInt32LE(this.pos);
                return this.pos += 4, val
            }, Protobuf.prototype.readUInt64 = function() {
                var val = this.readUInt64LE(this.pos);
                return this.pos += 8, val
            }, Protobuf.prototype.readDouble = function() {
                var val = ieee754.read(this.buf, this.pos, !1, 52, 8);
                return this.pos += 8, val
            }, Protobuf.prototype.readVarint = function() {
                var pos = this.pos;
                return this.buf[pos] <= 127 ? (this.pos++, this.buf[pos]) : this.buf[pos + 1] <= 127 ? (this.pos += 2, 127 & this.buf[pos] | this.buf[pos + 1] << 7) : this.buf[pos + 2] <= 127 ? (this.pos += 3, 127 & this.buf[pos] | (127 & this.buf[pos + 1]) << 7 | this.buf[pos + 2] << 14) : this.buf[pos + 3] <= 127 ? (this.pos += 4, 127 & this.buf[pos] | (127 & this.buf[pos + 1]) << 7 | (127 & this.buf[pos + 2]) << 14 | this.buf[pos + 3] << 21) : this.buf[pos + 4] <= 127 ? (this.pos += 5, (127 & this.buf[pos] | (127 & this.buf[pos + 1]) << 7 | (127 & this.buf[pos + 2]) << 14 | this.buf[pos + 3] << 21) + 268435456 * this.buf[pos + 4]) : (this.skip(0), 0)
            }, Protobuf.prototype.readSVarint = function() {
                var num = this.readVarint();
                if (num > 2147483647) throw new Error("TODO: Handle numbers >= 2^30");
                return num >> 1 ^ -(1 & num)
            }, Protobuf.prototype.readString = function() {
                for (var bytes = this.readVarint(), chr = String.fromCharCode, b = this.buf, p = this.pos, end = this.pos + bytes, str = ""; end > p;)
                    if (b[p] <= 127) str += chr(b[p++]);
                    else {
                        if (b[p] <= 191) throw new Error("Invalid UTF-8 codepoint: " + b[p]);
                        if (b[p] <= 223) str += chr((31 & b[p++]) << 6 | 63 & b[p++]);
                        else if (b[p] <= 239) str += chr((31 & b[p++]) << 12 | (63 & b[p++]) << 6 | 63 & b[p++]);
                        else if (b[p] <= 247) p += 4;
                        else if (b[p] <= 251) p += 5;
                        else {
                            if (!(b[p] <= 253)) throw new Error("Invalid UTF-8 codepoint: " + b[p]);
                            p += 6
                        }
                    }
                return this.pos += bytes, str
            }, Protobuf.prototype.readBuffer = function() {
                var bytes = this.readVarint(),
                    buffer = this.buf.subarray(this.pos, this.pos + bytes);
                return this.pos += bytes, buffer
            }, Protobuf.prototype.readPacked = function(type) {
                for (var bytes = this.readVarint(), end = this.pos + bytes, array = []; this.pos < end;) array.push(this["read" + type]());
                return array
            }, Protobuf.prototype.skip = function(val) {
                var type = 7 & val;
                switch (type) {
                    case 0:
                        for (; this.buf[this.pos++] > 127;);
                        break;
                    case 1:
                        this.pos += 8;
                        break;
                    case 2:
                        var bytes = this.readVarint();
                        this.pos += bytes;
                        break;
                    case 5:
                        this.pos += 4;
                        break;
                    default:
                        throw new Error("Unimplemented type: " + type)
                }
            }
        }, {
            ieee754: 73
        }
    ],
    73: [
        function(require, module, exports) {
            exports.read = function(buffer, offset, isLE, mLen, nBytes) {
                var e, m, eLen = 8 * nBytes - mLen - 1,
                    eMax = (1 << eLen) - 1,
                    eBias = eMax >> 1,
                    nBits = -7,
                    i = isLE ? nBytes - 1 : 0,
                    d = isLE ? -1 : 1,
                    s = buffer[offset + i];
                for (i += d, e = s & (1 << -nBits) - 1, s >>= -nBits, nBits += eLen; nBits > 0; e = 256 * e + buffer[offset + i], i += d, nBits -= 8);
                for (m = e & (1 << -nBits) - 1, e >>= -nBits, nBits += mLen; nBits > 0; m = 256 * m + buffer[offset + i], i += d, nBits -= 8);
                if (0 === e) e = 1 - eBias;
                else {
                    if (e === eMax) return m ? 0 / 0 : 1 / 0 * (s ? -1 : 1);
                    m += Math.pow(2, mLen), e -= eBias
                }
                return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
            }, exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
                var e, m, c, eLen = 8 * nBytes - mLen - 1,
                    eMax = (1 << eLen) - 1,
                    eBias = eMax >> 1,
                    rt = 23 === mLen ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
                    i = isLE ? 0 : nBytes - 1,
                    d = isLE ? 1 : -1,
                    s = 0 > value || 0 === value && 0 > 1 / value ? 1 : 0;
                for (value = Math.abs(value), isNaN(value) || 1 / 0 === value ? (m = isNaN(value) ? 1 : 0, e = eMax) : (e = Math.floor(Math.log(value) / Math.LN2), value * (c = Math.pow(2, -e)) < 1 && (e--, c *= 2), value += e + eBias >= 1 ? rt / c : rt * Math.pow(2, 1 - eBias), value * c >= 2 && (e++, c /= 2), e + eBias >= eMax ? (m = 0, e = eMax) : e + eBias >= 1 ? (m = (value * c - 1) * Math.pow(2, mLen), e += eBias) : (m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen), e = 0)); mLen >= 8; buffer[offset + i] = 255 & m, i += d, m /= 256, mLen -= 8);
                for (e = e << mLen | m, eLen += mLen; eLen > 0; buffer[offset + i] = 255 & e, i += d, e /= 256, eLen -= 8);
                buffer[offset + i - d] |= 128 * s
            }
        }, {}
    ],
    74: [
        function(require, module) {
            ! function() {
                function queue(parallelism) {
                    function pop() {
                        for (; popping = started < tasks.length && parallelism > active;) {
                            var i = started++,
                                t = tasks[i],
                                a = slice.call(t, 1);
                            a.push(callback(i)), ++active, t[0].apply(null, a)
                        }
                    }

                    function callback(i) {
                        return function(e, r) {
                            --active, null == error && (null != e ? (error = e, started = remaining = 0 / 0, notify()) : (tasks[i] = r, --remaining ? popping || pop() : notify()))
                        }
                    }

                    function notify() {
                        null != error ? await(error) : all ? await(error, tasks) : await.apply(null, [error].concat(tasks))
                    }
                    var q, popping, all, tasks = [],
                        started = 0,
                        active = 0,
                        remaining = 0,
                        error = null,
                        await = noop;
                    return parallelism || (parallelism = 1 / 0), q = {
                        defer: function() {
                            return error || (tasks.push(arguments), ++remaining, pop()), q
                        },
                        await: function(f) {
                            return await = f, all = !1, remaining || notify(), q
                        },
                        awaitAll: function(f) {
                            return await = f, all = !0, remaining || notify(), q
                        }
                    }
                }

                function noop() {}
                var slice = [].slice;
                queue.version = "1.0.7", "function" == typeof define && define.amd ? define(function() {
                    return queue
                }) : "object" == typeof module && module.exports ? module.exports = queue : this.queue = queue
            }()
        }, {}
    ],
    75: [
        function(require, module) {
            ! function() {
                "use strict";

                function rbush(maxEntries, format) {
                    return this instanceof rbush ? (this._maxEntries = Math.max(4, maxEntries || 9), this._minEntries = Math.max(2, Math.ceil(.4 * this._maxEntries)), format && this._initFormat(format), void this.clear()) : new rbush(maxEntries, format)
                }
                rbush.prototype = {
                    all: function() {
                        return this._all(this.data, [])
                    },
                    search: function(bbox) {
                        var node = this.data,
                            result = [];
                        if (!this._intersects(bbox, node.bbox)) return result;
                        for (var i, len, child, childBBox, nodesToSearch = []; node;) {
                            for (i = 0, len = node.children.length; len > i; i++) child = node.children[i], childBBox = node.leaf ? this.toBBox(child) : child.bbox, this._intersects(bbox, childBBox) && (node.leaf ? result.push(child) : this._contains(bbox, childBBox) ? this._all(child, result) : nodesToSearch.push(child));
                            node = nodesToSearch.pop()
                        }
                        return result
                    },
                    load: function(data) {
                        if (!data || !data.length) return this;
                        if (data.length < this._minEntries) {
                            for (var i = 0, len = data.length; len > i; i++) this.insert(data[i]);
                            return this
                        }
                        var node = this._build(data.slice(), 0);
                        if (this.data.children.length)
                            if (this.data.height === node.height) this._splitRoot(this.data, node);
                            else {
                                if (this.data.height < node.height) {
                                    var tmpNode = this.data;
                                    this.data = node, node = tmpNode
                                }
                                this._insert(node, this.data.height - node.height - 1, !0)
                            } else this.data = node;
                        return this
                    },
                    insert: function(item) {
                        return item && this._insert(item, this.data.height - 1), this
                    },
                    clear: function() {
                        return this.data = {
                            children: [],
                            leaf: !0,
                            bbox: this._empty(),
                            height: 1
                        }, this
                    },
                    remove: function(item) {
                        if (!item) return this;
                        for (var i, parent, index, goingUp, node = this.data, bbox = this.toBBox(item), path = [], indexes = []; node || path.length;) {
                            if (node || (node = path.pop(), parent = path[path.length - 1], i = indexes.pop(), goingUp = !0), node.leaf && (index = node.children.indexOf(item), -1 !== index)) return node.children.splice(index, 1), path.push(node), this._condense(path), this;
                            goingUp || node.leaf || !this._contains(node.bbox, bbox) ? parent ? (i++, node = parent.children[i], goingUp = !1) : node = null : (path.push(node), indexes.push(i), i = 0, parent = node, node = node.children[0])
                        }
                        return this
                    },
                    toBBox: function(item) {
                        return item
                    },
                    compareMinX: function(a, b) {
                        return a[0] - b[0]
                    },
                    compareMinY: function(a, b) {
                        return a[1] - b[1]
                    },
                    toJSON: function() {
                        return this.data
                    },
                    fromJSON: function(data) {
                        return this.data = data, this
                    },
                    _all: function(node, result) {
                        for (var nodesToSearch = []; node;) node.leaf ? result.push.apply(result, node.children) : nodesToSearch.push.apply(nodesToSearch, node.children), node = nodesToSearch.pop();
                        return result
                    },
                    _build: function(items, level, height) {
                        var node, N = items.length,
                            M = this._maxEntries;
                        if (M >= N) return node = {
                            children: items,
                            leaf: !0,
                            height: 1
                        }, this._calcBBox(node), node;
                        level || (height = Math.ceil(Math.log(N) / Math.log(M)), M = Math.ceil(N / Math.pow(M, height - 1)), items.sort(this.compareMinX)), node = {
                            children: [],
                            height: height
                        };
                        var i, j, slice, sliceLen, childNode, N1 = Math.ceil(N / M) * Math.ceil(Math.sqrt(M)),
                            N2 = Math.ceil(N / M),
                            compare = level % 2 === 1 ? this.compareMinX : this.compareMinY;
                        for (i = 0; N > i; i += N1)
                            for (slice = items.slice(i, i + N1).sort(compare), j = 0, sliceLen = slice.length; sliceLen > j; j += N2) childNode = this._build(slice.slice(j, j + N2), level + 1, height - 1), node.children.push(childNode);
                        return this._calcBBox(node), node
                    },
                    _chooseSubtree: function(bbox, node, level, path) {
                        for (var i, len, child, targetNode, area, enlargement, minArea, minEnlargement;;) {
                            if (path.push(node), node.leaf || path.length - 1 === level) break;
                            for (minArea = minEnlargement = 1 / 0, i = 0, len = node.children.length; len > i; i++) child = node.children[i], area = this._area(child.bbox), enlargement = this._enlargedArea(bbox, child.bbox) - area, minEnlargement > enlargement ? (minEnlargement = enlargement, minArea = minArea > area ? area : minArea, targetNode = child) : enlargement === minEnlargement && minArea > area && (minArea = area, targetNode = child);
                            node = targetNode
                        }
                        return node
                    },
                    _insert: function(item, level, isNode) {
                        var bbox = isNode ? item.bbox : this.toBBox(item),
                            insertPath = [],
                            node = this._chooseSubtree(bbox, this.data, level, insertPath);
                        for (node.children.push(item), this._extend(node.bbox, bbox); level >= 0 && insertPath[level].children.length > this._maxEntries;) this._split(insertPath, level), level--;
                        this._adjustParentBBoxes(bbox, insertPath, level)
                    },
                    _split: function(insertPath, level) {
                        var node = insertPath[level],
                            M = node.children.length,
                            m = this._minEntries;
                        this._chooseSplitAxis(node, m, M);
                        var newNode = {
                            children: node.children.splice(this._chooseSplitIndex(node, m, M)),
                            height: node.height
                        };
                        node.leaf && (newNode.leaf = !0), this._calcBBox(node), this._calcBBox(newNode), level ? insertPath[level - 1].children.push(newNode) : this._splitRoot(node, newNode)
                    },
                    _splitRoot: function(node, newNode) {
                        this.data = {}, this.data.children = [node, newNode], this.data.height = node.height + 1, this._calcBBox(this.data)
                    },
                    _chooseSplitIndex: function(node, m, M) {
                        var i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;
                        for (minOverlap = minArea = 1 / 0, i = m; M - m >= i; i++) bbox1 = this._distBBox(node, 0, i), bbox2 = this._distBBox(node, i, M), overlap = this._intersectionArea(bbox1, bbox2), area = this._area(bbox1) + this._area(bbox2), minOverlap > overlap ? (minOverlap = overlap, index = i, minArea = minArea > area ? area : minArea) : overlap === minOverlap && minArea > area && (minArea = area, index = i);
                        return index
                    },
                    _chooseSplitAxis: function(node, m, M) {
                        var compareMinX = node.leaf ? this.compareMinX : this._compareNodeMinX,
                            compareMinY = node.leaf ? this.compareMinY : this._compareNodeMinY,
                            xMargin = this._allDistMargin(node, m, M, compareMinX),
                            yMargin = this._allDistMargin(node, m, M, compareMinY);
                        yMargin > xMargin && node.children.sort(compareMinX)
                    },
                    _allDistMargin: function(node, m, M, compare) {
                        node.children.sort(compare);
                        var i, child, leftBBox = this._distBBox(node, 0, m),
                            rightBBox = this._distBBox(node, M - m, M),
                            margin = this._margin(leftBBox) + this._margin(rightBBox);
                        for (i = m; M - m > i; i++) child = node.children[i], this._extend(leftBBox, node.leaf ? this.toBBox(child) : child.bbox), margin += this._margin(leftBBox);
                        for (i = M - m - 1; i >= m; i--) child = node.children[i], this._extend(rightBBox, node.leaf ? this.toBBox(child) : child.bbox), margin += this._margin(rightBBox);
                        return margin
                    },
                    _distBBox: function(node, k, p) {
                        for (var child, bbox = this._empty(), i = k; p > i; i++) child = node.children[i], this._extend(bbox, node.leaf ? this.toBBox(child) : child.bbox);
                        return bbox
                    },
                    _calcBBox: function(node) {
                        node.bbox = this._distBBox(node, 0, node.children.length)
                    },
                    _adjustParentBBoxes: function(bbox, path, level) {
                        for (var i = level; i >= 0; i--) this._extend(path[i].bbox, bbox)
                    },
                    _condense: function(path) {
                        for (var parent, i = path.length - 1; i >= 0; i--) 0 === path[i].children.length ? i > 0 ? (parent = path[i - 1].children, parent.splice(parent.indexOf(path[i]), 1)) : this.clear() : this._calcBBox(path[i])
                    },
                    _contains: function(a, b) {
                        return a[0] <= b[0] && a[1] <= b[1] && b[2] <= a[2] && b[3] <= a[3]
                    },
                    _intersects: function(a, b) {
                        return b[0] <= a[2] && b[1] <= a[3] && b[2] >= a[0] && b[3] >= a[1]
                    },
                    _extend: function(a, b) {
                        return a[0] = Math.min(a[0], b[0]), a[1] = Math.min(a[1], b[1]), a[2] = Math.max(a[2], b[2]), a[3] = Math.max(a[3], b[3]), a
                    },
                    _area: function(a) {
                        return (a[2] - a[0]) * (a[3] - a[1])
                    },
                    _margin: function(a) {
                        return a[2] - a[0] + (a[3] - a[1])
                    },
                    _enlargedArea: function(a, b) {
                        return (Math.max(b[2], a[2]) - Math.min(b[0], a[0])) * (Math.max(b[3], a[3]) - Math.min(b[1], a[1]))
                    },
                    _intersectionArea: function(a, b) {
                        var minX = Math.max(a[0], b[0]),
                            minY = Math.max(a[1], b[1]),
                            maxX = Math.min(a[2], b[2]),
                            maxY = Math.min(a[3], b[3]);
                        return Math.max(0, maxX - minX) * Math.max(0, maxY - minY)
                    },
                    _empty: function() {
                        return [1 / 0, 1 / 0, -1 / 0, -1 / 0]
                    },
                    _compareNodeMinX: function(a, b) {
                        return a.bbox[0] - b.bbox[0]
                    },
                    _compareNodeMinY: function(a, b) {
                        return a.bbox[1] - b.bbox[1]
                    },
                    _initFormat: function(format) {
                        var compareArr = ["return a", " - b", ";"];
                        this.compareMinX = new Function("a", "b", compareArr.join(format[0])), this.compareMinY = new Function("a", "b", compareArr.join(format[1])), this.toBBox = new Function("a", "return [a" + format.join(", a") + "];")
                    }
                }, "function" == typeof define && define.amd ? define(function() {
                    return rbush
                }) : "undefined" != typeof module ? module.exports = rbush : "undefined" != typeof self ? self.rbush = rbush : window.rbush = rbush
            }()
        }, {}
    ],
    76: [
        function(require, module) {
            function UnitBezier(p1x, p1y, p2x, p2y) {
                this.cx = 3 * p1x, this.bx = 3 * (p2x - p1x) - this.cx, this.ax = 1 - this.cx - this.bx, this.cy = 3 * p1y, this.by = 3 * (p2y - p1y) - this.cy, this.ay = 1 - this.cy - this.by, this.p1x = p1x, this.p1y = p2y, this.p2x = p2x, this.p2y = p2y
            }
            module.exports = UnitBezier, UnitBezier.prototype.sampleCurveX = function(t) {
                return ((this.ax * t + this.bx) * t + this.cx) * t
            }, UnitBezier.prototype.sampleCurveY = function(t) {
                return ((this.ay * t + this.by) * t + this.cy) * t
            }, UnitBezier.prototype.sampleCurveDerivativeX = function(t) {
                return (3 * this.ax * t + 2 * this.bx) * t + this.cx
            }, UnitBezier.prototype.solveCurveX = function(x, epsilon) {
                "undefined" == typeof epsilon && (epsilon = 1e-6);
                var t0, t1, t2, x2, i;
                for (t2 = x, i = 0; 8 > i; i++) {
                    if (x2 = this.sampleCurveX(t2) - x, Math.abs(x2) < epsilon) return t2;
                    var d2 = this.sampleCurveDerivativeX(t2);
                    if (Math.abs(d2) < 1e-6) break;
                    t2 -= x2 / d2
                }
                if (t0 = 0, t1 = 1, t2 = x, t0 > t2) return t0;
                if (t2 > t1) return t1;
                for (; t1 > t0;) {
                    if (x2 = this.sampleCurveX(t2), Math.abs(x2 - x) < epsilon) return t2;
                    x > x2 ? t0 = t2 : t1 = t2, t2 = .5 * (t1 - t0) + t0
                }
                return t2
            }, UnitBezier.prototype.solve = function(x, epsilon) {
                return this.sampleCurveY(this.solveCurveX(x, epsilon))
            }
        }, {}
    ]
}, {}, [21]);
