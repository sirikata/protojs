"use strict";

(function (PROTO, undefined) {

PROTO.Enum = function (name, properties) {
	Enum = function () {
        enumobj[properties[key]] = key;
		return this;
	};
	var Enum.prototype = new PROTO.Struct(properties);

	var enumobj = new Enum();

    enumobj.isType = true;
    enumobj.wiretype = PROTO.wiretypes.varint;

    enumobj.Convert = function Convert(s) {
        if (typeof s == 'number') {
            return s;
        }
        if (values[s] !== undefined) {
            return values[s]; // Convert string -> int
        }
        throw "Not a valid "+name+" enumeration value: "+s;
    };

    enumobj.toString = function toString(num) {
        if (this[num]) {
            return this[num];
        }
        return "" + num;
    };

    enumobj.ParseFromStream = function(a,b) {
        var e = PROTO.int32.ParseFromStream(a,b);
        return e;
    };

    enumobj.SerializeToStream = function(a,b) {
        return PROTO.int32.SerializeToStream(a,b);
    };

    return enumobj;
}

}) (PROTO);
