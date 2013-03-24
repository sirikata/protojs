"use strict";

(function (PROTO, undefined) {

/**
 * @constructor
 * @extends {PROTO.Stream}
 * @param {Array=} arr  Existing byte array to read from, or append to.
 */
PROTO.ByteArrayStream = function(arr) {
    this.array_ = arr || new Array();
    this.read_pos_ = 0;
    this.write_pos_ = this.array_.length;
};

PROTO.ByteArrayStream.prototype = new PROTO.Stream();
PROTO.ByteArrayStream.prototype.read = function(amt) {
    if (this.read_pos_+amt > this.array_.length) {
        // incomplete stream.
        //throw new Error("Read past end of protobuf ByteArrayStream: "+
        //                this.array_.length+" < "+this.read_pos_+amt);
        return null;
    }
    var ret = this.array_.slice(this.read_pos_, this.read_pos_+amt);
    this.read_pos_ += amt;
    return ret;
};

PROTO.ByteArrayStream.prototype.write = function(arr) {
    Array.prototype.push.apply(this.array_, arr);
    this.write_pos_ = this.array_.length;
};

PROTO.ByteArrayStream.prototype.readByte = function() {
    return this.array_[this.read_pos_ ++];
};

PROTO.ByteArrayStream.prototype.writeByte = function(byt) {
    this.array_.push(byt);
    this.write_pos_ = this.array_.length;
};

PROTO.ByteArrayStream.prototype.valid = function() {
    return this.read_pos_ < this.array_.length;
};

PROTO.ByteArrayStream.prototype.getArray = function() {
    return this.array_;
};

}) (PROTO);
