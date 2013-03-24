"use strict";

(function (PROTO, undefined) {

I64 = function (msw, lsw, sign) {
    this.msw = msw;
    this.lsw = lsw;
    if (typeof lsw === 'undefined') {
        PROTO.warn("Too few arguments passed to I64 constructor: perhaps you meant PROTO.I64.fromNumber()");
        throw ("Too few arguments passed to I64 constructor: perhaps you meant PROTO.I64.fromNumber()");
    };
    if (sign === true) sign = -1;
    if (!sign) sign = 1;
    this.sign = sign;
};

I64.prototype = {
    toNumber: function() {
        return (this.msw * PROTO.pow32 + this.lsw) * this.sign;
    },

    toString: function() {
        //return this.toNumber();
        function zeros(len){
            var retval = "";
            for (var i = 0; i < len; ++i) {
                retval += "0";
            };
            return retval;
        };
        var firstHalf = this.msw.toString(16);
        var secondHalf = this.lsw.toString(16);
        var sign = (this.sign === -1) ? "-" : "";
        return sign + "0x" + zeros(8 - firstHalf.length) + firstHalf + zeros(8 - secondHalf.length) + secondHalf;
    },

    equals: function(other) {
        return this.sign == other.sign && this.msw == other.msw && this.lsw == other.lsw;
    },

    hash: function() {
        return (this.sign * this.msw) + "_" + this.lsw;
    },

    convertToUnsigned: function() {
        var local_lsw;
        local_lsw = this.lsw;
        var local_msw;
        if (this.sign < 0) {
            local_msw = PROTO.upow32 - this.msw;
            local_msw += PROTO.upow32;
            local_msw += 1;
            local_lsw = PROTO.upow32 - this.lsw;
            local_lsw += PROTO.upow32;
            local_lsw += 2;
            if (local_lsw == PROTO.pow32) {
                local_lsw = 0;
                local_msw += 1;
            };
        } else {
            local_msw = this.msw;
        };
        return new I64(local_msw,local_lsw,1);
    },

    convertFromUnsigned:function() {
        if (this.msw > PROTO.upow32) {
            var local_msw = (PROTO.pow32 - 1) - this.msw;
            var local_lsw = PROTO.pow32 - this.lsw;
            if (local_lsw >= PROTO.pow32) {
                local_lsw -= PROTO.pow32;
                local_msw += 1;
            };
            return new I64(local_msw, local_lsw, -1);
        };
        return new I64(this.msw, this.lsw, this.sign);
    },

	// TODO: refactoring, tests
    convertToZigzag: function() {
        var local_lsw;
        if (this.sign<0) {
            local_lsw=this.lsw*2-1;
        }else {
            local_lsw=this.lsw*2;
        }
        var local_msw=this.msw*2;
        if (local_lsw>4294967295){
            local_msw+=1;
            local_lsw-=4294967296;
        }
        if (local_lsw<0){
            local_msw-=1;
            local_lsw+=4294967296;
        }
        return new PROTO.I64(local_msw,local_lsw,1);
    },

	// TODO: refactoring, tests
    convertFromZigzag:function() {
        var retval;
        if(this.msw&1) {//carry the bit from the most significant to the least by adding 2^31 to lsw
            retval = new PROTO.I64((this.msw>>>1),
                                 2147483648+(this.lsw>>>1),
                                 (this.lsw&1)?-1:1);
        } else {
            retval = new PROTO.I64((this.msw>>>1),
                                   (this.lsw>>>1),
                                   (this.lsw&1)?-1:1);
        }
        if (retval.sign==-1) {
            retval.lsw+=1;
            if (retval.lsw>4294967295) {
                retval.msw+=1;
                retval.lsw-=4294967296;                
            }
        }
        return retval;
    },

	// TODO: refactoring, tests
    serializeToLEBase256: function() {
        var arr = new Array(8);
        var temp=this.lsw;
        for (var i = 0; i < 4; i++) {
            arr[i] = (temp&255);
            temp=(temp>>8);
        }
        temp = this.msw;
        for (var i = 4; i < 8; i++) {
            arr[i] = (temp&255);
            temp=(temp>>8);
        }
        return arr;
    },

	// TODO: refactoring, tests
    serializeToLEVar128: function() {
        var arr = new Array(1);
        var temp=this.lsw;
        for (var i = 0; i < 4; i++) {
            arr[i] = (temp&127);
            temp=(temp>>>7);
            if(temp==0&&this.msw==0) return arr;
            arr[i]+=128;
        }        
        arr[4] = (temp&15) | ((this.msw&7)<<4);
        temp=(this.msw>>>3);
        if (temp==0) return arr;
        arr[4]+=128;
        for (var i = 5; i<10; i++) {
            arr[i] = (temp&127);
            temp=(temp>>>7);
            if(temp==0) return arr;
            
            arr[i]+=128;
        }
        return arr;
    },

	// TODO: refactoring, tests
    unsigned_add:function(other) {
        var temp=this.lsw+other.lsw;
        var local_msw=this.msw+other.msw;
        var local_lsw=temp%4294967296;
        temp-=local_lsw;
        local_msw+=Math.floor(temp/4294967296);
        return new PROTO.I64(local_msw,local_lsw,this.sign);
    },

	// TODO: refactoring, tests
    sub : function(other) {
        if (other.sign!=this.sign) {
            return this.unsigned_add(other);
        }
        if (other.msw>this.msw || (other.msw==this.msw&&other.lsw>this.lsw)) {
            var retval=other.sub(this);
            retval.sign=-this.sign;
            return retval;
        }
        var local_lsw=this.lsw-other.lsw;
        var local_msw=this.msw-other.msw;       
        if (local_lsw<0) {
            local_lsw+=4294967296;
            local_msw-=1;
        }
        return new PROTO.I64(local_msw,local_lsw,this.sign);        
    },

    /**
     * @param {PROTO.I64} other
     */
	// TODO: refactoring, tests
    less:function(other){
        if (other.sign!=this.sign) {
            return this.sign<0;
        }
        /**
         * @type {PROTO.I64}
         */
        var a=this;
        /**
         * @type {PROTO.I64}
         */
        var b=other;
        if (this.sign<0) {
            b=this;a=other;
        }
        if (a.msw==b.msw)
            return a.lsw<b.lsw;
        if (a.msw<b.msw)
            return true;
        return false;
    },

	// TODO: refactoring, tests
    unsigned_less:function(other){
        var a=this,b=other;
        if (a.msw==b.msw)
            return a.lsw<b.lsw;
        if (a.msw<b.msw)
            return true;
        return false;
    },

	// TODO: refactoring, tests
    add : function(other) {
        if (other.sign<0 && this.sign>=0)
            return this.sub(new PROTO.I64(other.msw,other.lsw,-other.sign));
        if (other.sign>=0 && this.sign<0)
            return other.sub(new PROTO.I64(this.msw,this.lsw,-this.sign));
        return this.unsigned_add(other);
    }
};

PROTO.I64.fromNumber = function(mynum) {
    var sign = (mynum < 0) ? -1 : 1;
    mynum *= sign;
    var lsw = (mynum%4294967296);
    var msw = Math.floor((mynum-lsw)/4294967296);
    return new PROTO.I64(msw, lsw, sign);
};

PROTO.I64.from32pair = function(msw, lsw, sign) {
    return new PROTO.I64(msw, lsw, sign);
};
/**
 * @param {PROTO.Stream} stream
 * @param {PROTO.I64=} float64toassignto
 *
 * 64bit = 32bit(msw) + 32bit(lsw)
 */
PROTO.I64.parseLEVar128 = function (stream, float64toassignto) {
    var retval = float64toassignto || new PROTO.I64(0,0,1);
    var n = 0;
    var endloop = false;
    var offset = 1;

    for (var i = 0; !endloop && i < 5; i++) {
        var byt = stream.readByte();
        if (byt >= 128) { // msb == 1
            byt -= 128;
        } else {
            endloop = true;
        };
        n += offset * byt;
        offset *= 128; // 2 ^ 7
    };

    var lsw = n % 4294967296; // 2 ^ 32
    var msw = Math.floor((n - lsw) / 4294967296);

    offset = 8;
    for (var i = 0; !endloop && i < 5; i++) {
        var byt = stream.readByte();
        if (byt >= 128) {
            byt -= 128;
        } else {
            endloop = true;
        };
        msw += offset * byt;
        offset *= 128;
    };

    retval.msw = msw % 4294967296; //??
    retval.lsw = lsw;
    retval.sign = 1;
    return retval;
};
/**
 * @param {PROTO.Stream} stream
 * @param {PROTO.I64=} float64toassignto
 */
PROTO.I64.parseLEBase256 = function (stream, float64toassignto) {
    var retval = float64toassignto||new PROTO.I64(0,0,1);
    var n = 0;
    var endloop = false;
    var offset=1;
    for (var i = 0; i < 4; i++) {
        var byt = stream.readByte();
        n += offset*byt;
        offset *= 256;
    }
    var lsw=n;
    var msw=0;
    offset=1;
    for (var i = 0; i < 4; i++) {
        var byt = stream.readByte();
        msw += offset*byt;
        offset *= 256;
    }
    retval.msw=msw;
    retval.lsw=lsw;
    retval.sign=1;
    return retval;
};

PROTO.I64.ONE = new PROTO.I64.fromNumber(1);
PROTO.I64.ZERO = new PROTO.I64.fromNumber(0);


}) (PROTO);
