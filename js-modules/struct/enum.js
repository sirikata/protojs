"use strict";

(function (PROTO, undefined) {

//TODO: refactoring
PROTO.Enum = function (name, values) {
    var reverseValues = {};
    var enumobj = {};
    enumobj.isType = true;
    for (var key in values) {
        reverseValues[values[key] ] = key;
        enumobj[key] = values[key];
        enumobj[values[key]] = key;
    }
    enumobj.values = values;
    enumobj.reverseValues = reverseValues;

    enumobj.Convert = function Convert(s) {
        if (typeof s == 'number') {
            // (reverseValues[s] !== undefined)
            return s;
        }
        if (values[s] !== undefined) {
            return values[s]; // Convert string -> int
        }
        throw "Not a valid "+name+" enumeration value: "+s;
    };
    enumobj.toString = function toString(num) {
        if (reverseValues[num]) {
            return reverseValues[num];
        }
        return "" + num;
    };
    enumobj.ParseFromStream = function(a,b) {
        var e = PROTO.int32.ParseFromStream(a,b);
        return e;
    }
    enumobj.SerializeToStream = function(a,b) {
        return PROTO.int32.SerializeToStream(a,b);
    }
    enumobj.wiretype = PROTO.wiretypes.varint;

    return enumobj;
}

}) (PROTO);
