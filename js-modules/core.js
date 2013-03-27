/*  ProtoJS - Protocol buffers for Javascript.
 *  protobuf.js
 *
 *  Copyright (c) 2009-2010, Patrick Reiter Horn
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are
 *  met:
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in
 *    the documentation and/or other materials provided with the
 *    distribution.
 *  * Neither the name of ProtoJS nor the names of its contributors may
 *    be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";
(function (GLOBAL, undefined) {

var PROTO = {

	warn: function (s) {
		PROTO.log("!!WARN!! " + s);
	},

	log: function (s) {
		if (typeof self.console !== "undefined" && self.console.log) {
			self.console.log(s); 
		};
	},

	encodeUTF8: function(str) {
		var strlen = str.length;
		var u8 = [];
		var c, nextc;
		var x, y, z;
		for (var i = 0; i < strlen; i++) {
			c = str.charCodeAt(i);
			if ((c & 0xff80) == 0) {
				// ASCII
				u8.push(c);
			} else {
				if ((c & 0xfc00) == 0xD800) {
					nextc = str.charCodeAt(i+1);
					if ((nextc & 0xfc00) == 0xDC00) {
						// UTF-16 Surrogate pair
						c = (((c & 0x03ff)<<10) | (nextc & 0x3ff)) + 0x10000;
						i++;
					} else {
						// error.
						PROTO.warn("Error decoding surrogate pair: "+c+"; "+nextc);
					}
				}
				x = c&0xff;
				y = c&0xff00;
				z = c&0xff0000;
				// Encode UCS code into UTF-8
				if (c <= 0x0007ff) {
					u8.push(0xc0 | (y>>6) | (x>>6));
					u8.push(0x80 | (x&63));
				} else if (c <= 0x00ffff) {
					u8.push(0xe0 | (y>>12));
					u8.push(0x80 | ((y>>6)&63) | (x>>6));
					u8.push(0x80 | (x&63));
				} else if (c <= 0x10ffff) {
					u8.push(0xf0 | (z>>18));
					u8.push(0x80 | ((z>>12)&63) | (y>>12));
					u8.push(0x80 | ((y>>6)&63) | (x>>6));
					u8.push(0x80 | (x&63));
				} else {
					// error.
					PROTO.warn("Error encoding to utf8: "+c+" is greater than U+10ffff");
					u8.push("?".charCodeAt(0));
				}
			}
		}
		return u8;
	},

	decodeUTF8: function(u8) {
		var u8len = u8.length;
		var str = "";
		var c, b2, b3, b4;
		for (var i = 0; i < u8len; i++) {
			c = u8[i];
			if ((c&0x80) == 0x00) {
			} else if ((c&0xf8) == 0xf0) {
				// 4 bytes: U+10000 - U+10FFFF
				b2 = u8[i+1];
				b3 = u8[i+2];
				b4 = u8[i+3];
				if ((b2&0xc0) == 0x80 && (b3&0xc0) == 0x80 && (b4&0xc0) == 0x80) {
					c = (c&7)<<18 | (b2&63)<<12 | (b3&63)<<6 | (b4&63);
					i+=3;
				} else {
					// error.
					PROTO.warn("Error decoding from utf8: "+c+","+b2+","+b3+","+b4);
					continue;
				}
			} else if ((c&0xf0)==0xe0) {
				// 3 bytes: U+0800 - U+FFFF
				b2 = u8[i+1];
				b3 = u8[i+2];
				if ((b2&0xc0) == 0x80 && (b3&0xc0) == 0x80) {
					c = (c&15)<<12 | (b2&63)<<6 | (b3&63);
					i+=2;
				} else {
					// error.
					PROTO.warn("Error decoding from utf8: "+c+","+b2+","+b3);
					continue;
				}
			} else if ((c&0xe0)==0xc0) {
				// 2 bytes: U+0080 - U+07FF
				b2 = u8[i+1];
				if ((b2&0xc0) == 0x80) {
					c = (c&31)<<6 | (b2&63);
					i+=1;
				} else {
					// error.
					PROTO.warn("Error decoding from utf8: "+c+","+b2);
					continue;
				}
			} else {
				// error.
				// 80-BF: Second, third, or fourth byte of a multi-byte sequence
				// F5-FF: Start of 4, 5, or 6 byte sequence
				PROTO.warn("Error decoding from utf8: "+c+" encountered not in multi-byte sequence");
				continue;
			}
			if (c <= 0xffff) {
				str += String.fromCharCode(c);
			} else if (c > 0xffff && c <= 0x10ffff) {
				// Must be encoded into UTF-16 surrogate pair.
				c -= 0x10000;
				str += (String.fromCharCode(0xD800 | (c>>10)) + String.fromCharCode(0xDC00 | (c&1023)));
			} else {
				PROTO.warn("Error encoding surrogate pair: "+c+" is greater than U+10ffff");
			}
		}
		return str;
	},

	CreateArrayStream: function(arr) {
		if (arr instanceof Array) {
			return new PROTO.ByteArrayStream(arr);
		} else {
			return new PROTO.Uint8ArrayStream(arr);
		}
	},

	IsArray: (function() {
	  if (typeof(Uint8Array) != "undefined") {
		return function(arr) {
		  return arr instanceof Array || arr instanceof Uint8Array;
		};
	  } else {
		return function(arr) {
		  return arr instanceof Array;
		};
	  }
	})(),

	DefineProperty: (function () {
		var DefineProperty;
		if (typeof Object.defineProperty !== "undefined") {
			/**
			 * @suppress {missingProperties}
			 */
			DefineProperty = function(prototype, property, getter, setter) {
				Object.defineProperty(prototype, property, {
					'get': getter, 'set': setter,
					'enumerable': true, 'configurable': false});
			};

		} else if (Object.prototype.__defineGetter__ && Object.prototype.__defineSetter__) {
			DefineProperty = function(prototype, property, getter, setter) {
				if (typeof getter !== 'undefined') {
					prototype.__defineGetter__(property, getter);
				}
				if (typeof setter !== 'undefined') {
					prototype.__defineSetter__(property, setter);
				}
			};
		}

		// IE8's Object.defineProperty method might be broken.
		// Make sure DefineProperty works before returning it.
		if (DefineProperty) {
			try {
				/**
				 * @constructor
				 */
				var TestClass = function(){};
				DefineProperty(TestClass.prototype, "x",
							   function(){return this.xval*2;},
							   function(newx){this.xval=newx;});
				var testinst = new TestClass;
				testinst.x = 5;
				if (testinst.x != 10) {
					PROTO.warn("DefineProperty test gave the wrong result "+testinst.x);
					DefineProperty = undefined;
				}
			} catch (e) {
				PROTO.warn("DefineProperty should be supported, but threw "+e);
				DefineProperty = undefined;
			}
		};

		return DefineProperty;
	})(),

	/** Clones a PROTO type object. Does not work on arbitrary javascript objects.
	For example, can be used to copy the "bytes" class and make a custom toString method.
	*/
	cloneType: function(f) {
		var ret = {};
		for (var x in f) {
			ret[x] = f[x];
		}
		return ret;
	},

	mergeProperties: function(properties, stream, values) {
		var fidToProp = {};
		for (var key in properties) {
			fidToProp[properties[key].id] = key;
		}
		var nextfid, nexttype, nextprop, nextproptype, nextval, nextpropname;
		var incompleteTuples = {};
		while (stream.valid()) {
			nextfid = PROTO.int32.ParseFromStream(stream);
			PROTO.log("" + stream.read_pos_ + " ; " + stream.array_.length);
			nexttype = nextfid % 8;
			nextfid >>>= 3;
			nextpropname = fidToProp[nextfid];
			nextprop = nextpropname && properties[nextpropname];
			nextproptype = nextprop && nextprop.type();
			nextval = undefined;
			console.log('mergeProperties', 'nexttype:', nexttype, 'nextfid:', nextfid)

			switch (nexttype) {
			case PROTO.wiretypes.varint:
				PROTO.log("read varint field is " + nextfid);
				if (nextprop && nextproptype.wiretype == PROTO.wiretypes.varint) {
					nextval = nextproptype.ParseFromStream(stream);
				} else {
					PROTO.int64.ParseFromStream(stream);
				}
				break;
			case PROTO.wiretypes.fixed64:
				PROTO.log("read fixed64 field is " + nextfid);
				if (nextprop && nextproptype.wiretype == PROTO.wiretypes.fixed64) {
					nextval = nextproptype.ParseFromStream(stream);
				} else {
					PROTO.fixed64.ParseFromStream(stream);
				}
				break;
			case PROTO.wiretypes.lengthdelim:
				PROTO.log("read lengthdelim field is " + nextfid);
				if (nextprop) {
					if (nextproptype.wiretype != PROTO.wiretypes.lengthdelim)
					{
						var tup;
						if (nextproptype.cardinality > 1) {
							if (incompleteTuples[nextpropname]===undefined) {
								incompleteTuples[nextpropname]=new Array();
							}
							tup = incompleteTuples[nextpropname];
						}
						var bytearr = PROTO.bytes.ParseFromStream(stream);
						var bas = PROTO.CreateArrayStream(bytearr);
						for (var j = 0; j < bytearr.length && bas.valid(); j++) {
							var toappend = nextproptype.ParseFromStream(bas);

							if (nextproptype.cardinality>1) {
								tup.push(toappend);
								if (tup.length==nextproptype.cardinality) {
									if (nextprop.multiplicity == PROTO.repeated) {
										values[nextpropname].push(tup);
									} else {
										values[nextpropname] =
											nextproptype.Convert(tup);
									}
									incompleteTuples[nextpropname]=new Array();
									tup = incompleteTuples[nextpropname];
								}
							}else {
								values[nextpropname].push(toappend);
							}
						}
					} else {
						nextval = nextproptype.ParseFromStream(stream);
						if (nextval == null) {
							return false;
						}
					}
				} else {
					PROTO.bytes.ParseFromStream(stream);
				}
				break;
			case PROTO.wiretypes.startgroup:
				PROTO.log("read group field is " + nextfid);
				if (nextprop && nextproptype.wiretype === PROTO.wiretypes.startgroup) {
					nextval = nextproptype.ParseFromStream(stream);
				} else {
					throw new Error('Couldn\'t parse group'); 
				};
				break;
			case PROTO.wiretypes.endgroup:
				PROTO.log("end group field is " + nextfid);
				break;
			case PROTO.wiretypes.fixed32:
				PROTO.log("read fixed32 field is " + nextfid);
				if (nextprop && nextproptype.wiretype == PROTO.wiretypes.fixed32) {
					nextval = nextproptype.ParseFromStream(stream);
				} else {
					PROTO.fixed32.ParseFromStream(stream);
				}
				break;
			default:
				PROTO.warn("ERROR: Unknown type "+nexttype+" for "+nextfid);
				break;
			};

			if (nextval !== undefined) {
				if (values[nextpropname] === undefined && nextproptype.cardinality>1) {
					values[nextpropname] = {};
				}
				if (nextproptype.cardinality>1) {
					var tup;
					if (incompleteTuples[nextpropname]===undefined) {
						incompleteTuples[nextpropname]=new Array();
						tup = incompleteTuples[nextpropname];
					}
					tup.push(nextval);
					if (tup.length==nextproptype.cardinality) {
						if (nextprop.multiplicity == PROTO.repeated) {
							values[nextpropname].push(tup);
						} else {
							tup = nextproptype.Convert(tup);
							if (!PROTO.DefineProperty && nextproptype.FromProto) {
								tup = nextproptype.FromProto(tup);
							}
							values[nextpropname] = tup;
						}
						incompleteTuples[nextpropname] = undefined;
					}
				} else if (nextprop.multiplicity === PROTO.repeated) {
					values[nextpropname].push(nextval);
				} else {
					nextval = nextproptype.Convert(nextval);
					if (!PROTO.DefineProperty && nextproptype.FromProto) {
						nextval = nextproptype.FromProto(nextval);
					}
					values[nextpropname] = nextval;
				}
			}
		}
		return true;
	},

	serializeProperty: function(property, stream, value) {
		var fid = property.id;
		if (!property.type()) return;
		if (property.type().cardinality > 1) {
			PROTO.serializeTupleProperty(property,stream,value);
			return;
		}
		var wiretype = property.type().wiretype;
		var wireId = fid * 8 + wiretype;

		PROTO.log("Serializing property "+fid+" as "+wiretype+" pos is "+stream.write_pos_);
		if (property.multiplicity == PROTO.repeated) {
			if (wiretype != PROTO.wiretypes.lengthdelim && property.options.packed) {
				var bytearr = new Array();
				// Don't know length beforehand.
				var bas = new PROTO.ByteArrayStream(bytearr);
				for (var i = 0; i < value.length; i++) {
					var val = property.type().Convert(value[i]);
					property.type().SerializeToStream(val, bas);
				}
				wireId = fid * 8 + PROTO.wiretypes.lengthdelim;
				PROTO.int32.SerializeToStream(wireId, stream);
				PROTO.bytes.SerializeToStream(bytearr, stream);
			} else {
				for (var i = 0; i < value.length; i++) {
					PROTO.int32.SerializeToStream(wireId, stream);
					var val = property.type().Convert(value[i]);
					property.type().SerializeToStream(val, stream);
				}
			}
		} else {
			PROTO.int32.SerializeToStream(wireId, stream);
			var val = property.type().Convert(value);
			property.type().SerializeToStream(val, stream);
		}
	},

	serializeTupleProperty: function(property, stream, value) {
		var fid = property.id;
		var wiretype = property.type().wiretype;
		var wireId = fid * 8 + wiretype;

		PROTO.log("Serializing property "+fid+" as "+wiretype+" pos is "+stream.write_pos_);
		if (wiretype != PROTO.wiretypes.lengthdelim && property.options.packed) {
			var bytearr = new Array();
			// Don't know length beforehand.
			var bas = new PROTO.ByteArrayStream(bytearr);
			if (property.multiplicity == PROTO.repeated) {
				for (var i = 0; i < value.length; i++) {
					var val = property.type().Convert(value[i]);
					for (var j=0;j<property.type().cardinality;++j) {
						property.type().SerializeToStream(val[j], bas);
					}
				}
			}else {
				var val = property.type().Convert(value);
				for (var j=0;j<property.type().cardinality;++j) {
					property.type().SerializeToStream(val[j], bas);
				}
			}
			wireId = fid * 8 + PROTO.wiretypes.lengthdelim;
			PROTO.int32.SerializeToStream(wireId, stream);
			PROTO.bytes.SerializeToStream(bytearr, stream);
		} else {
			if (property.multiplicity == PROTO.repeated) {
				for (var i = 0; i < value.length; i++) {
					var val = property.type().Convert(value[i]);
					for (var j=0;j<property.type().cardinality;++j) {
						PROTO.int32.SerializeToStream(wireId, stream);
						property.type().SerializeToStream(val[j], stream);
					}
				}
			}else {
				var val = property.type().Convert(value);
				for (var j=0;j<property.type().cardinality;++j) {
					PROTO.int32.SerializeToStream(wireId, stream);
					property.type().SerializeToStream(val[j], stream);
				}
			}
		}
	}
};

//TODO:
PROTO.Flags = function(bits, name, values) {
    return PROTO.Enum(name, values, bits);
};

PROTO.Extend = function(parent, newproperties) {
    for (var key in newproperties) {
        parent.properties_[key] = newproperties[key];
    }
    return parent;
};

function init() {
	/**
	* !!All modules should be included in this order!!
	* - config.js
	* - parser.js
	* - i64.js
	* -- struct/base.js
	* -- struct/**
	* -- stream/base.js
	* -- stream/**
	**/
	initLogger();
};

function initLogger() { 
	if (typeof self.console === "undefined")
		self.console = {};
	if (typeof self.console.log ==="undefined") {
		self.console.log = function(message) {
			if (document && document.body)
				document.body.appendChild(document.createTextNode(message + "..."));
		};
	};
};

GLOBAL.PROTO = PROTO;
init();

 }) (window);
