"use strict";

(function (PROTO, undefined) {

PROTO.Message = function(name, properties) {

    /** @constructor */
	function Message () {
        if (!PROTO.DefineProperty) {
            this.values_ = this;
        } else {
            this.values_ = {};
        }
        this.Clear();
        this.message_type_ = name;

		return this;
    };

	Message.prototype = new PROTO.Struct(properties);

    Message.isType = true;
    Message.composite = true;
    Message.wiretype = PROTO.wiretypes.lengthdelim;

    Message.IsInitialized = function(value) {
        return value && value.IsInitialized();
    };

    Message.Convert = function Convert(val) {
        if (!(val instanceof Composite)) {
            
            var errmsg = "Unknown Error: Value not instanceof Composite: "+typeof(val)+" : "+val+" instanceof "+(val instanceof Composite);
            PROTO.warn(errmsg);//this should not happen, but occasionally it does
        }
        return val;
    };

    Message.SerializeToStream = function(value, stream) {
        var bytearr = new Array();
        var bas = new PROTO.ByteArrayStream(bytearr);
        value.SerializeToStream(bas);
        return PROTO.bytes.SerializeToStream(bytearr, stream);
    };

    Message.ParseFromStream = function(stream) {
        var bytearr = PROTO.bytes.ParseFromStream(stream);
        var bas = PROTO.CreateArrayStream(bytearr);
        var ret = new Composite;
        ret.ParseFromStream(bas);
        return ret;
    };

    return Message;
};

}) (PROTO);
