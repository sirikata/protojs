"use strict";

(function (PROTO, undefined) {

PROTO.Uint8ArrayStream = function(arr) {
    this.array_ = arr || new Uint8Array(4096);
    this.read_pos_ = 0;
    this.write_pos_ = 0;
};

PROTO.Uint8ArrayStream.prototype._realloc = function(new_size) {
    this.array_ = new Uint8Array(Math.max(new_size, this.array_.length) + this.array_.length);
};

PROTO.Uint8ArrayStream.prototype.read = function(amt) {
    if (this.read_pos_+amt > this.array_.length) {
        return null;
    }
    var ret = this.array_.subarray(this.read_pos_, this.read_pos_+amt);
    this.read_pos_ += amt;
    return ret;
};

PROTO.Uint8ArrayStream.prototype.write = function(arr) {
    if (this.write_pos_ + arr.length > this.array_.length) {
	this._realloc(this.write_pos_ + arr.length);
    }
    this.array_.set(arr, this.write_pos_);
    this.write_pos_ += arr.length;
};

PROTO.Uint8ArrayStream.prototype.readByte = function() {
    return this.array_[this.read_pos_ ++];
};

PROTO.Uint8ArrayStream.prototype.writeByte = function(byt) {
    if (this.write_pos_ >= this.array_.length) {
	this._realloc(this.write_pos_ + 1);
    }
    this.array_[this.write_pos_++] = byt;
};

PROTO.Uint8ArrayStream.prototype.valid = function() {
    return this.read_pos_ < this.array_.length;
};
PROTO.Uint8ArrayStream.prototype.getArray = function() {
    return this.array_.subarray(0, this.write_pos_);
};

}) (PROTO);
