"use strict";

(function (PROTO, undefined) {

var FromB64AlphaMinus43 = [
	62,-1,62,-1,63,52,53,54,55,56,57,58,59,60,61,
	-1,-1,-1,-1,-1,-1,-1,
	0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,
	17,18,19,20,21,22,23,24,25,
	-1,-1,-1,-1,63,-1,
	26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
	41,42,43,44,45,46,47,48,49,50,51];

var ToB64Alpha = [
	'A','B','C','D','E','F','G','H','I','J','K','L','M',
	'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
	'a','b','c','d','e','f','g','h','i','j','k','l','m',
	'n','o','p','q','r','s','t','u','v','w','x','y','z',
	'0','1','2','3','4','5','6','7','8','9','+','/'];

var ToB64Alpha_URLSafe = [
	'A','B','C','D','E','F','G','H','I','J','K','L','M',
	'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
	'a','b','c','d','e','f','g','h','i','j','k','l','m',
	'n','o','p','q','r','s','t','u','v','w','x','y','z',
	'0','1','2','3','4','5','6','7','8','9','-','_'];

PROTO.Base64Stream = function(b64string) {
	this.alphabet = ToB64Alpha;
	this.string_ = b64string || '';
	this.read_pos_ = 0;
	this.read_incomplete_value_ = 0;
	this.read_needed_bits_ = 8;
	this.write_extra_bits_ = 0;
	this.write_incomplete_value_ = 0;
	this.fixString();
};

PROTO.Base64Stream.prototype = new PROTO.Stream();

PROTO.Base64Stream.prototype.setURLSafe = function() {
	this.alphabet = ToB64Alpha_URLSafe;
};

PROTO.Base64Stream.prototype.fixString = function() {
	var len = this.string_.length;
	if (this.string_[len-1]=='=') {
		var n = 4;
		var cutoff = 2;
		if (this.string_[len-cutoff]=='=') {
			n = 2;
			cutoff = 3;
		}
		this.write_extra_bits_ = n;
		this.write_incomplete_value_ = FromB64AlphaMinus43[
			this.string_.charCodeAt(len-cutoff)-43];
		this.write_incomplete_value_ >>= (6-n);
		this.string_ = this.string_.substring(0,len-cutoff);
	}
};

PROTO.Base64Stream.prototype.readByte = function() {
	var next6bits;
	var n = this.read_needed_bits_;
	while (next6bits === undefined || next6bits == -1) {
		if (this.read_pos_ >= this.string_.length) {
			if (this.valid()) {
				next6bits = this.write_incomplete_value_ << (6-n);
				this.read_pos_++;
				break;
			} else {
				return null;
			}
		}
		next6bits = FromB64AlphaMinus43[
			this.string_.charCodeAt(this.read_pos_++)-43];
	}
	if (n == 8) {
		this.read_incomplete_value_ = next6bits;
		this.read_needed_bits_ = 2;
		return this.readByte();
	}
	var ret = this.read_incomplete_value_<<n;
	ret |= next6bits>>(6-n);
	this.read_incomplete_value_ = next6bits&((1<<(6-n))-1);
	this.read_needed_bits_ += 2;
	return ret;
};

PROTO.Base64Stream.prototype.writeByte = function(byt) {
	this.write_extra_bits_ += 2;
	var n = this.write_extra_bits_;
	this.string_ += this.alphabet[
			byt>>n | this.write_incomplete_value_<<(8-n)];
	this.write_incomplete_value_ = (byt&((1<<n)-1));
	if (n == 6) {
		this.string_ += this.alphabet[this.write_incomplete_value_];
		this.write_extra_bits_ = 0;
		this.write_incomplete_value_ = 0;
	}
	if (this.string_.length%77==76) {
		this.string_ += "\n";
	}
};

PROTO.Base64Stream.prototype.getString = function() {
	var len = this.string_.length;
	var retstr = this.string_;
	var n = this.write_extra_bits_;
	if (n > 0) {
		retstr += this.alphabet[this.write_incomplete_value_<<(6-n)];
		if (n==2) {
			retstr += "==";
		} else if (n==4) {
			retstr += "=";
		}
	}
	return retstr;
};

PROTO.Base64Stream.prototype.valid = function() {
	return (this.read_pos_ < this.string_.length) ||
		   (this.read_pos_==this.string_.length && this.write_extra_bits_);
};

}) (PROTO);
