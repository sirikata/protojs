"use strict";

(function (PROTO, undefined) {

if (typeof ArrayBuffer === "undefined") {
	PROTO.warn("There is no ArrayBuffer implementation");
	return;
};

if (typeof Uint8Array === "undefined") {
	PROTO.warn("There is no Uint8Array implementation");
	return;
};

PROTO.ArrayBufferStream = function(arr, length) {
	this.array_buffer_ = arr || new ArrayBuffer(1024);
	this.length_ = length || 0;
	this.array_ = new Uint8Array(this.array_buffer_);
	this.read_pos = 0;
};

PROTO.ArrayBufferStream.prototype = new PROTO.Stream();

PROTO.ArrayBufferStream.prototype._realloc = function(min_length) {
	var old_array = this.array_;
	var length = this.length_;
	var new_buf_length = old_array.length + min_length;
	this.array_buffer_ = new ArrayBuffer(new_buf_length);
	var new_array = new Uint8Array(this.array_buffer_);
	for (var i = 0; i < length; i++) {
		new_array[i] = old_array[i];
	}
	this.array_ = new_array;
};

PROTO.ArrayBufferStream.prototype.read = function(amt) {
	if (this.read_pos_ + amt > this.length_) {
		// incomplete stream.
		//throw new Error("Read past end of protobuf ArrayBufferStream: "+
		//                this.array_.length+" < "+this.read_pos_+amt);
		return null;
	};
	var ret = this.array_.subarray(this.read_pos_, this.read_pos_+amt);
	this.read_pos_ += amt;
	// FIXME
	var ret_as_array = new Array(amt);
	for (var i = 0; i < amt; i++) {
	    ret_as_array[i] = ret[i];
	}
	return ret_as_array;
};

PROTO.ArrayBufferStream.prototype.write = function(arr) {
	var si = 0;
	var di = this.length_;
	if (this.length_ + arr.length > this.array_.length) {
		this._realloc(this.length_ + arr.length);
	};
	this.length_ += arr.length;
	var dest = this.array_;
	var len = arr.length;
	for (;si < len; si++, di++) {
		dest[di] = arr[si];
	};
};

PROTO.ArrayBufferStream.prototype.readByte = function() {
	return this.array_[this.read_pos_ ++];
};

PROTO.ArrayBufferStream.prototype.writeByte = function(byt) {
	if (this.length_ == this.array_.length) {
		this._realloc(this.length_ + 1);
	}
	this.array_[this.length_ ++] = byt;
};

PROTO.ArrayBufferStream.prototype.valid = function() {
	return this.read_pos_ < this.length_;
};

PROTO.ArrayBufferStream.prototype.getArrayBuffer = function() {
	return this.array_buffer_;
};

PROTO.ArrayBufferStream.prototype.length = function() {
	return this.length_;
};

PROTO.ArrayBufferStream.prototype.getUint8Array = function() {
	return new Uint8Array(this.array_buffer_, 0, this.length_);
};

//TODO: wtf?
	(function() {
		var useBlobCons = false;
		var BlobBuilder = null;
		var slice = "slice";
		var testBlob;
		try {
			testBlob = new self.Blob([new DataView(new ArrayBuffer(1))]);
			useBlobCons = true;
		} catch (e) {
			/**
			 * @suppress {missingProperties} self
			 */
			BlobBuilder = self.BlobBuilder || 
				self["WebKitBlobBuilder"] || self["MozBlobBuilder"] || self["MSBlobBuilder"];
			try {
				testBlob = new BlobBuilder().getBlob();
			}catch (f) {
				//in a worker in FF or blobs not supported
			}
		}
		if (testBlob && (useBlobCons || BlobBuilder)) {
			if (testBlob.webkitSlice && !testBlob.slice) {
				slice = "webkitSlice";
			} else if (testBlob.mozSlice && !testBlob.slice) {
				slice = "mozSlice";
			}
			PROTO.ArrayBufferStream.prototype.getBlob = function() {
			var fullBlob;
			if (useBlobCons) {
				fullBlob = new self.Blob([new DataView(this.array_buffer_)]);
			} else {
				var blobBuilder = new BlobBuilder();
				blobBuilder.append(this.array_buffer_);
				fullBlob = blobBuilder.getBlob();
			}
			return fullBlob[slice](0, this.length_);
			};
		}
	}());

}) (PROTO);
