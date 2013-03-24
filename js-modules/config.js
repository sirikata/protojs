"use strict";

(function (PROTO, undefined) {

PROTO.wiretypes = {
    varint: 0,
    fixed64: 1,
    lengthdelim: 2,
    startgroup: 3,
    endgroup: 4,
    fixed32: 5
};

PROTO.optional = 'optional';
PROTO.repeated = 'repeated';
PROTO.required = 'required';

PROTO.pow32 = Math.pow(2, 32); 
PROTO.upow32 = (Math.pow(2, 32) / 2) - 1;

}) (PROTO)
