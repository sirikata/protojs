PROTO.Group = function (name, values) {
    var group = {};

    group.__proto__ = { 
        Convert: function() {
            throw new Error('Not implemented');
        },
        wiretype: PROTO.wiretypes.startgroup,
        SerializeToStream: function(str, stream) {
            var arr = PROTO.encodeUTF8(str);
            return PROTO.bytes.SerializeToStream(arr, stream);
        },
        ParseFromStream: function(stream) {
            var arr = PROTO.bytes.ParseFromStream(stream);
            return PROTO.decodeUTF8(arr);
        },
        toString: function(str) {return str;}
    };

    return group;
};
