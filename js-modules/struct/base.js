"use strict";

(function (PROTO, undefined) {

PROTO.Struct = function (properties) {
	this.properties_ = {};
	this.values_ = {};

    for (var key in properties) {
        // HACK: classes are currently included alongside properties.
        if (properties[key].isType) {
            this[key] = properties[key];
        } else {
            this.properties_[key] = properties[key];
        };
    };

	//TODO:
    if (PROTO.DefineProperty !== undefined) {
        for (var prop in this.properties_) {
            (function(prop){
				PROTO.DefineProperty(this, prop,
							   function GetProp() { return this.GetField(prop); },
							   function SetProp(newval) { this.SetField(prop, newval); });
            })(prop);
        };
    };
};

PROTO.Struct.prototype = {
	IsInitialized: function IsInitialized() {
		var checked_any = false;
		for (var key in this.properties_) {
			checked_any = true;
			if (this.values_[key] !== undefined) {
				var descriptor = this.properties_[key];
				if (!descriptor.type()) continue;
				if (descriptor.multiplicity == PROTO.repeated) {
					if (PROTO.array.IsInitialized(this.values_[key])) {
						return true;
					}
				} else {
					if (!descriptor.type().IsInitialized ||
						descriptor.type().IsInitialized(this.values_[key]))
					{
						return true;
					}
				}
			}
		}
		// As a special case, if there weren't any fields, we
		// treat it as initialized. This allows us to send
		// messages that are empty, but whose presence indicates
		// something.
		if (!checked_any) return true;
		// Otherwise, we checked at least one and it failed, so we
		// must be uninitialized.
		return false;
	},

	GetField: function GetField(propname) {
		PROTO.log(propname);
		var ret = this.values_[propname];
		var type = this.properties_[propname].type();
		if (ret && type.FromProto) {
			return type.FromProto(ret);
		}
		return ret;
	},

	SetField: function SetField(propname, value) {
		PROTO.log(propname + "=" + value);
		if (value === undefined || value === null) {
			this.ClearField(propname);
		} else {
			var prop = this.properties_[propname];
			if (prop.multiplicity === PROTO.repeated) {
				this.ClearField(propname);
				for (var i = 0; i < value.length; i++) {
					this.values_[propname].push(
							prop.type().Convert(value[i]));
				}
			} else {
				this.values_[propname] = prop.type().Convert(value);
			}
		};
	},

	computeHasFields: function computeHasFields() {
		var has_fields = {};
		for (var key in this.properties_) {
			if (this.HasField(key)) {
				has_fields[key] = true;
			}
		};
		return has_fields;
	},

	HasField: function HasField(propname) {
		if (this.values_[propname] !== undefined) {
			var descriptor = this.properties_[propname];
			if (!descriptor.type()) {
				return false;
			};

			if (descriptor.multiplicity == PROTO.repeated) {
				return PROTO.array.IsInitialized(this.values_[propname]);
			} else {
				if (!descriptor.type().IsInitialized ||
					descriptor.type().IsInitialized(
						this.values_[propname]))
				{
					return true;
				}
			};
		};
		return false;
	},

	formatValue: function(level, spaces, propname, val) {
		var str = spaces + propname;
		var type = this.properties_[propname].type();

		if (type.composite) {
			str += " " + val.toString(level + 1);
		} else if (typeof val === 'string') {
			var myval = val;
			myval = myval.replace("\"", "\\\"")
						 .replace("\n", "\\n")
						 .replace("\r","\\r");
			str += ": \"" + myval + "\"\n";
		} else {
			if (type.FromProto) {
				val = type.FromProto(val);
			};

			if (type.toString) {
				var myval = type.toString(val);
				str += ": " + myval + "\n";
			} else {
				str += ": " + val + "\n";
			};
		};
		return str;
	},

	toString: function toString(level) {
		var spaces = "";
		var str = "";
		if (level) {
			str = "{\n";
			for (var i = 0 ; i < level*2; i++) {
				spaces += " ";
			}
		} else {
			level = 0;
		};

		for (var propname in this.properties_) {
			if (!this.properties_[propname].type()) {
				continue; // HACK:
			};

			if (!this.HasField(propname)) {
				continue;
			};

			if (this.properties_[propname].multiplicity == PROTO.repeated) {
				var arr = this.values_[propname];
				for (var i = 0; i < arr.length; i++) {
					str += this.formatValue(level, spaces, propname, arr[i]);
				};
			} else {
				str += this.formatValue(level, spaces, propname, this.values_[propname]);
			};
		};

		if (level) {
			str += "}\n";
		};
		return str;
	},

	// TODO:
	// Not implemented:
	// CopyFrom, MergeFrom, SerializePartialToX,
	// RegisterExtension, Extensions, ClearExtension
	ClearField: function ClearField(propname) {
		var descriptor = this.properties_[propname];
		if (descriptor.multiplicity == PROTO.repeated) {
			this.values_[propname] = new PROTO.array(descriptor);
		} else {
			var type = descriptor.type();
			if (type && type.composite) {
				// Don't special case this. Otherwise, we can't actually
				// tell whether a composite child was initialized
				// intentionally or if it just happened here.
				//this.values_[propname] = new type();
				delete this.values_[propname];
			} else {
				delete this.values_[propname];
			}
		}
	},

	ListFields: function ListFields() {
		var ret = [];
		var hasfields = this.computeHasFields();
		for (var f in hasfields) {
			ret.push(f);
		}
		return ret;
	},

	Clear: function Clear() {
		for (var prop in this.properties_) {
			this.ClearField(prop);
		}
	},


	// static?
	MergeFromStream: function Merge(stream) {
		return PROTO.mergeProperties(this.properties_, stream, this.values_);
	},

	MergeFromArray: function (array) {
		return this.MergeFromStream(PROTO.CreateArrayStream(array));
	},

	ParseFromStream: function Parse(stream) {
		this.Clear();
		return this.MergeFromStream(stream);
	},

	ParseFromArray: function (array) {
		this.Clear();
		return this.MergeFromArray(array);
	},

	SerializeToStream: function Serialize(outstream) {
		var hasfields = this.computeHasFields();
		for (var key in hasfields) {
			var val = this.values_[key];
			PROTO.serializeProperty(this.properties_[key], outstream, val);
		}
	},

	SerializeToArray: function (opt_array) {
		var stream = new PROTO.ByteArrayStream(opt_array);
		this.SerializeToStream(stream);
		return stream.getArray();
	}

};

}) (PROTO);
