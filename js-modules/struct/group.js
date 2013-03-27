PROTO.Group = function (name, properties, fields) {
	function Group () {
		return this;
		this.group_type_ = name;
	};

	var key;
	for (key in properties) {
		Group[key] = properties[key];	
	};

    for (key in fields) {
        // HACK: classes are currently included alongside properties.
        if (fields[key].isType) {
            Group[key] = fields[key];
			delete fields[key];
        };
    };

	Group.prototype = new PROTO.Struct(fields);
	Group.wiretype = PROTO.wiretypes.startgroup;
	Group.isType = true;
	Group.isGroup = true;

	Group.SerializeToStream = function(str, stream) {
		var arr = PROTO.encodeUTF8(str);
		return PROTO.bytes.SerializeToStream(arr, stream);
	};

	Group.ParseFromStream = function(stream) {
        var bytearr = PROTO.bytes.ParseFromStream(stream);
        var bas = PROTO.CreateArrayStream(bytearr);
        var ret = new Group;
        ret.ParseFromStream(bas);
        return ret;
	};
	Group.Convert = function Convert(val) {
		return val;
	};

	Group.toString = function(str) {return str;}

    return Group;
};
