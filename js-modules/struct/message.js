"use strict";

(function (PROTO, undefined) {

PROTO.Message = function(name, properties) {

    /** @constructor */
	function Message () {
        this.Clear();
        this.message_type_ = name;

		// TODO: refactoring:
		this.__defineGetter__("values", function () {
			return this.__proto__.values_;
		});
		return this;
    };

    for (var key in properties) {
        // HACK: classes are currently included alongside properties.
        if (properties[key].isType) {
            Message[key] = properties[key];
			if (!properties[key].isGroup)
				delete properties[key];
        };
    };

	Message.prototype = new PROTO.Struct(properties);

    Message.isType = true;
    Message.composite = true;
    Message.wiretype = PROTO.wiretypes.lengthdelim;

    Message.IsInitialized = function(value) {
        return value && value.IsInitialized();
    };

    Message.Convert = function Convert(val) {
        if (!(val instanceof Message)) {
            
            var errmsg = "Unknown Error: Value not instanceof Message: "+typeof(val)+" : "+val+" instanceof "+(val instanceof Message);
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
        var ret = new Message();
        ret.ParseFromStream(bas);
        return ret;
    };

    return Message;
};

}) (PROTO);
