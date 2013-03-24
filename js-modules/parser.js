/**
 * + Jonas Raoni Soares Silva
 * http://jsfromhell.com/classes/binary-parser [rev. #1]
 * @constructor
 */ 
 //TODO: refactoring
"use strict";

(function (PROTO, undefined) {

PROTO.BinaryParser = function(bigEndian, allowExceptions) {
	this.bigEndian = bigEndian;
	this.allowExceptions = allowExceptions;
};

PROTO.BinaryParser.prototype.encodeFloat = function(number, precisionBits, exponentBits){
	var n;
	var bias = Math.pow(2, exponentBits - 1) - 1, minExp = -bias + 1, maxExp = bias, minUnnormExp = minExp - precisionBits,
	status = isNaN(n = parseFloat(number)) || n == -Infinity || n == +Infinity ? n : 0,
	exp = 0, len = 2 * bias + 1 + precisionBits + 3, bin = new Array(len),
	signal = (n = status !== 0 ? 0 : n) < 0;
	n = Math.abs(n);
	var intPart = Math.floor(n), floatPart = n - intPart, i, lastBit, rounded, j, result, r;
	for(i = len; i; bin[--i] = 0){}
	for(i = bias + 2; intPart && i; bin[--i] = intPart % 2, intPart = Math.floor(intPart / 2)){}
	for(i = bias + 1; floatPart > 0 && i; (bin[++i] = ((floatPart *= 2) >= 1) - 0) && --floatPart){}
	for(i = -1; ++i < len && !bin[i];){}
	if(bin[(lastBit = precisionBits - 1 + (i = (exp = bias + 1 - i) >= minExp && exp <= maxExp ? i + 1 : bias + 1 - (exp = minExp - 1))) + 1]){
		if(!(rounded = bin[lastBit]))
			for(j = lastBit + 2; !rounded && j < len; rounded = bin[j++]){}
		for(j = lastBit + 1; rounded && --j >= 0; (bin[j] = !bin[j] - 0) && (rounded = 0)){}
	}
	for(i = i - 2 < 0 ? -1 : i - 3; ++i < len && !bin[i];){}

	(exp = bias + 1 - i) >= minExp && exp <= maxExp ? ++i : exp < minExp &&
		(exp != bias + 1 - len && exp < minUnnormExp && this.warn("encodeFloat::float underflow"), i = bias + 1 - (exp = minExp - 1));
	(intPart || status !== 0) && (this.warn(intPart ? "encodeFloat::float overflow" : "encodeFloat::" + status),
		exp = maxExp + 1, i = bias + 2, status == -Infinity ? signal = 1 : isNaN(status) && (bin[i] = 1));
	for(n = Math.abs(exp + bias), j = exponentBits + 1, result = ""; --j; result = (n % 2) + result, n = n >>= 1){}
	for(n = 0, j = 0, i = (result = (signal ? "1" : "0") + result + bin.slice(i, i + precisionBits).join("")).length, r = [];
		i; n += (1 << j) * result.charAt(--i), j == 7 && (r[r.length] = n, n = 0), j = (j + 1) % 8){}
	
	return (this.bigEndian ? r.reverse() : r);
};
PROTO.BinaryParser.prototype.encodeInt = function(number, bits, signed){
	var max = Math.pow(2, bits), r = [];
	(number >= max || number < -(max >> 1)) && this.warn("encodeInt::overflow") && (number = 0);
	number < 0 && (number += max);
	for(; number; r[r.length] = number % 256, number = Math.floor(number / 256)){}
	for(bits = -(-bits >> 3) - r.length; bits--;){}
	return (this.bigEndian ? r.reverse() : r);
};

(function () {
    var buffer8byte = new ArrayBuffer(8);
    var buffer4byte = new ArrayBuffer(4);
    var f64buffer = new DataView(buffer8byte,0,8);
    var f32buffer = new DataView(buffer4byte,0,4);
    var u8buffer64 = new Uint8Array(buffer8byte);
    var u8buffer32 = new Uint8Array(buffer4byte);
    PROTO.BinaryParser.prototype.encodeFloat32 = function(data) {
        f32buffer.setFloat32(0,data,true);
        return u8buffer32;
    }
    PROTO.BinaryParser.prototype.encodeFloat64 = function(data) {
        f64buffer.setFloat64(0,data,true);
        return u8buffer64;
    }
    PROTO.BinaryParser.prototype.decodeFloat32 = function(data) {
        var len=data.length;
        if (len>4) len=4;
        for (var i=0;i<len;++i) {
            u8buffer32[i]=data[i];
        }
        return f32buffer.getFloat32(0,true);
    }
    PROTO.BinaryParser.prototype.decodeFloat64 = function(data) {
        var len=data.length;
        if (len>8) len=8;
        for (var i=0;i<len;++i) {
            u8buffer64[i]=data[i];
        }
        return f64buffer.getFloat64(0,true);
    }
})();
    PROTO.BinaryParser.prototype.decodeFloat = function(data, precisionBits, exponentBits){
        var b = new this.Buffer(this.bigEndian, data);
        PROTO.BinaryParser.prototype.checkBuffer.call(b, precisionBits + exponentBits + 1);
        var bias = Math.pow(2, exponentBits - 1) - 1, signal = PROTO.BinaryParser.prototype.readBits.call(b,precisionBits + exponentBits, 1);
        var exponent = PROTO.BinaryParser.prototype.readBits.call(b,precisionBits, exponentBits), significand = 0;
        var divisor = 2;
        var curByte = b.buffer.length + (-precisionBits >> 3) - 1;
        var byteValue, startBit, mask;
        do
            for(byteValue = b.buffer[ ++curByte ], startBit = precisionBits % 8 || 8, mask = 1 << startBit;
                mask >>= 1; (byteValue & mask) && (significand += 1 / divisor), divisor *= 2){}
        while((precisionBits -= startBit));
        return exponent == (bias << 1) + 1 ? significand ? NaN : signal ? -Infinity : +Infinity
            : (1 + signal * -2) * (exponent || significand ? !exponent ? Math.pow(2, -bias + 1) * significand
            : Math.pow(2, exponent - bias) * (1 + significand) : 0);
    };
    PROTO.BinaryParser.prototype.decodeInt = function(data, bits, signed){
        var b = new this.Buffer(this.bigEndian, data), x = b.readBits(0, bits), max = Math.pow(2, bits);
        return signed && x >= max / 2 ? x - max : x;
    };
    PROTO.BinaryParser.prototype.Buffer = function(bigEndian, buffer){
        this.bigEndian = bigEndian || 0;
        this.buffer = [];
        PROTO.BinaryParser.prototype.setBuffer.call(this,buffer);
    };

        PROTO.BinaryParser.prototype.readBits = function(start, length){
            //shl fix: Henri Torgemane ~1996 (compressed by Jonas Raoni)
            function shl(a, b){
                for(++b; --b; a = ((a %= 0x7fffffff + 1) & 0x40000000) == 0x40000000 ? a * 2 : (a - 0x40000000) * 2 + 0x7fffffff + 1){}
                return a;
            }
            if(start < 0 || length <= 0)
                return 0;
            PROTO.BinaryParser.prototype.checkBuffer.call(this, start + length);
            for(var offsetLeft, offsetRight = start % 8, curByte = this.buffer.length - (start >> 3) - 1,
                lastByte = this.buffer.length + (-(start + length) >> 3), diff = curByte - lastByte,
                sum = ((this.buffer[ curByte ] >> offsetRight) & ((1 << (diff ? 8 - offsetRight : length)) - 1))
                + (diff && (offsetLeft = (start + length) % 8) ? (this.buffer[ lastByte++ ] & ((1 << offsetLeft) - 1))
                << (diff-- << 3) - offsetRight : 0); diff; sum += shl(this.buffer[ lastByte++ ], (diff-- << 3) - offsetRight)
                ){}
            return sum;
        };
        PROTO.BinaryParser.prototype.setBuffer = function(data){
            if(data){
                for(var l, i = l = data.length, b = this.buffer = new Array(l); i; b[l - i] = data[--i]){}
                this.bigEndian && b.reverse();
            }
        };
        PROTO.BinaryParser.prototype.hasNeededBits = function(neededBits){
            return this.buffer.length >= -(-neededBits >> 3);
        };
        PROTO.BinaryParser.prototype.checkBuffer = function(neededBits){
            if(!PROTO.BinaryParser.prototype.hasNeededBits.call(this,neededBits))
                throw new Error("checkBuffer::missing bytes");
        };
    
    PROTO.BinaryParser.prototype.warn = function(msg){
        if(this.allowExceptions)
            throw new Error(msg);
        return 1;
    };

    PROTO.BinaryParser.prototype.toSmall = function(data){return this.decodeInt(data, 8, true);};
    PROTO.BinaryParser.prototype.fromSmall = function(number){return this.encodeInt(number, 8, true);};
    PROTO.BinaryParser.prototype.toByte = function(data){return this.decodeInt(data, 8, false);};
    PROTO.BinaryParser.prototype.fromByte = function(number){return this.encodeInt(number, 8, false);};
    PROTO.BinaryParser.prototype.toShort = function(data){return this.decodeInt(data, 16, true);};
    PROTO.BinaryParser.prototype.fromShort = function(number){return this.encodeInt(number, 16, true);};
    PROTO.BinaryParser.prototype.toWord = function(data){return this.decodeInt(data, 16, false);};
    PROTO.BinaryParser.prototype.fromWord = function(number){return this.encodeInt(number, 16, false);};
    PROTO.BinaryParser.prototype.toInt = function(data){return this.decodeInt(data, 32, true);};
    PROTO.BinaryParser.prototype.fromInt = function(number){return this.encodeInt(number, 32, true);};
    PROTO.BinaryParser.prototype.toDWord = function(data){return this.decodeInt(data, 32, false);};
    PROTO.BinaryParser.prototype.fromDWord = function(number){return this.encodeInt(number, 32, false);};
    PROTO.BinaryParser.prototype.toFloat = typeof(Float32Array) != "undefined"?PROTO.BinaryParser.prototype.decodeFloat32:function(data){return this.decodeFloat(data, 23, 8);};
    PROTO.BinaryParser.prototype.fromFloat = typeof(Float32Array) != "undefined"?PROTO.BinaryParser.prototype.encodeFloat32:function(number){return this.encodeFloat(number, 23, 8);};
    PROTO.BinaryParser.prototype.toDouble = typeof(Float64Array) != "undefined"?PROTO.BinaryParser.prototype.decodeFloat64:function(data){return this.decodeFloat(data, 52, 11);};
    PROTO.BinaryParser.prototype.fromDouble = typeof(Float64Array) != "undefined"?PROTO.BinaryParser.prototype.encodeFloat64:function(number){return this.encodeFloat(number, 52, 11);};

PROTO.binaryParser = new PROTO.BinaryParser(false, false);

}) (PROTO);
