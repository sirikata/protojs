"use strict";

(function (PROTO, undefined) {

PROTO.Stream = function () {
	this.write_pos_ = 0;
	this.read_pos_ = 0;
};

PROTO.Stream.prototype = {
    read: function(amt) {
        var result = [];
        for (var i = 0; i < amt; ++i) {
            var byt = this.readByte();
            if (byt === null) {
                break;
            }
            result.push(byt);
        }
        return result;
    },

    write: function(array) {
        for (var i = 0; i < array.length; i++) {
            this.writeByte(array[i]);
        }
    },

    readByte: function() {
        return null;
    },

    writeByte: function(byt) {
        this.write_pos_ += 1;
    },

    readPosition: function() {
        return this.read_pos_;
    },

    setReadPosition: function(pos) {
        this.read_pos_=pos;
    },

    writePosition: function() {
        return this.write_pos_;
    },

    valid: function() {
        return false;
    }
};

}) (PROTO);
