/*  ProtoJS - Protocol buffers for Javascript - Tests
 *  test.js
 *
 *  Copyright (c) 2009-2010, Patrick Reiter Horn
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are
 *  met:
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in
 *    the documentation and/or other materials provided with the
 *    distribution.
 *  * Neither the name of ProtoJS nor the names of its contributors may
 *    be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";

function blobToString(blob, func) {
    var reader = new FileReader();
    reader.onloadend = function() {
	func(reader.result);
    };
    reader.readAsText(blob);
};

window.onload = function() {

  var bigPositive = new PROTO.I64(4294967295,4294967295,1);

  var my64 = new PROTO.I64(2147483647,4294967295,-1);
  var my64min = new PROTO.I64(2147483648,0,-1);
  var negOne = new PROTO.I64(0,1,-1);
  var oneHundred = new PROTO.I64(1,100,1);//4294967396
  var twoTen = new PROTO.I64(2,10,1);//8589934602
  var NoneHundred = new PROTO.I64(1,100,-1);//4294967396
  var NtwoTen = new PROTO.I64(2,10,-1);//8589934602
  var unsigned64 = my64.convertToUnsigned();
  var unsigned64min = my64min.convertToUnsigned();
  var unsignednegOne = negOne.convertToUnsigned();
  var zigzag64 = my64.convertToZigzag();
  var zigzagmy64min = my64min.convertToZigzag();
  var zigzagnegOne = negOne.convertToZigzag();
  var output = document.getElementById('output');
  output.value += "" + my64.msw+","+my64.lsw+"\n";
  output.value += "Parts " + my64.msw+","+my64.lsw+"\n";
  output.value += "UParts " + unsigned64.msw+","+unsigned64.lsw+"\n";
  output.value += "UMinimumParts " + unsigned64min.msw+","+unsigned64min.lsw+"\n";
  output.value += "UNegOne " + unsignednegOne.msw+","+unsignednegOne.lsw+"\n";
  output.value += "ZZParts " + zigzag64.msw+","+zigzag64.lsw+"\n";
  output.value += "ZZMinimumParts " + zigzagmy64min.msw+","+zigzagmy64min.lsw+"\n";
  output.value += "ZZNegOne " + zigzagnegOne.msw+","+zigzagnegOne.lsw+"\n";
  output.value += "Unsigned Num: "+unsigned64.toNumber()+"\n";
  output.value += "Unsigned Zigzag Num: "+zigzag64.toNumber()+"\n";
  output.value += "Num: "+my64.toNumber()+"\n";
  output.value += "Unsigned 256: "+unsigned64.serializeToLEBase256().toString()+"\n";
  output.value += "Unsigned 128: "+unsigned64.serializeToLEVar128().toString()+"\n";
  output.value += "Zig 256: "+my64.convertToZigzag().serializeToLEBase256().toString()+"\n";
  output.value += "Zig 128: "+my64.convertToZigzag().serializeToLEVar128().toString()+"\n";
  output.value += "4294967396+8589934602 = "+twoTen.add(oneHundred).toNumber()+"\n";
  output.value += "8589934602-4294967396 = "+twoTen.sub(oneHundred).toNumber()+"\n";
  output.value += "4294967396-8589934602 = "+oneHundred.sub(twoTen).toNumber()+"\n";
  output.value += "-4294967396+-8589934602 = "+NtwoTen.add(NoneHundred).toNumber()+"\n";
  output.value += "-8589934602--4294967396 = "+NtwoTen.sub(NoneHundred).toNumber()+"\n";
  output.value += "-4294967396--8589934602 = "+NoneHundred.sub(NtwoTen).toNumber()+"\n";
  output.value += "-8589934602+4294967396 = "+NtwoTen.add(oneHundred).toNumber()+"\n";
  output.value += "-4294967396+8589934602 = "+NoneHundred.add(twoTen).toNumber()+"\n";
  output.value += "-8589934602-4294967396 = "+NtwoTen.sub(oneHundred).toNumber()+"\n";
  output.value += "-4294967396-8589934602 = "+NoneHundred.sub(twoTen).toNumber()+"\n";
  var flt=2350.2352355552;
  output.value += flt + ": "+PROTO.binaryParser.fromDouble(flt)+" back "+PROTO.binaryParser.toDouble(PROTO.binaryParser.fromDouble(flt))+"\n";
  var arr = [];
  var stream = new PROTO.ByteArrayStream(arr);
  var b64stream = new PROTO.Base64Stream();
  var extmsg = new ProtoJSTest.PB.ExternalMessage();
  extmsg.is_true = true;
  output.value += extmsg.toString();
  extmsg.SerializeToStream(stream);
  output.value += "ExternalMessage.is_true: Serializes to ["+arr.toString()+"]\n";
  extmsg = new ProtoJSTest.PB.TestMessage;
  var arr2 = new Array;
  stream = new PROTO.ByteArrayStream(arr2);
  extmsg.xxu32=4294967295;
  extmsg.xxi32=-1;
  extmsg.xxsi32=-11;

    extmsg.xxu64=negOne;//bigPositive;
    extmsg.xxi64=negOne;//bigPositive;
    extmsg.xxsi64=negOne;//bigPositive;

    extmsg.nnu64=my64min;//bigPositive;
    extmsg.nni64=my64min;//bigPositive;
    extmsg.nnsi64=my64min;//bigPositive;

  extmsg.v2f = [1.25, 2.5];
  extmsg.xxd = 3.14159265358979323846264;
  extmsg.xxf = .12345678;
  extmsg.xxbb = [extmsg, // serializes extmsg into bytes.
      [1,2,3,4,5,6,7,8,255,254,253,252,251,250,249,248]]; // test list assign.
  extmsg.xxff.push(1); // test push
  extmsg.xxff.push(123456789123456789);
  extmsg.xxff.push(-1.345e-30);
  extmsg.xxfr = .1;
  extmsg.xxs = ("\u59cb");
  extmsg.xxss = ["Hello world! \u3053\u3093\u306b\u3061\u306f, \u4e16\u754c\u3002\u300e\ud840\ude0c\ud840\udda4\ud840\udda9\ud840\uddab\u300f",
      "Brought to you by \u30b7\u30ea\u30ab\u30bf"];
  extmsg.xxb = new Array([1,2,3,4]);
  extmsg.f32 = ProtoJSTest.PB.TestMessage.Flagsf32.WE | ProtoJSTest.PB.TestMessage.Flagsf32.IMAGE;
  extmsg.e32 = ProtoJSTest.PB.TestMessage.Enum32.WEB1;
  extmsg.submes = new ProtoJSTest.PB.TestMessage.SubMessage;
try {
  extmsg.submes.subduration = 0;
} catch (e) {
  output.value += "Testing if we get an error for invalid I64: "+e+"\n";
}
  extmsg.submes.subduration = PROTO.I64.fromNumber(1234567);
  extmsg.submessers.push().subduration = PROTO.I64.fromNumber(1);
  extmsg.submessers.push().subduration = PROTO.I64.fromNumber(2);
  extmsg.submessers.push().subduration = PROTO.I64.fromNumber(-18234563242342346752);
  extmsg.extmesser = new ProtoJSTest.PB.ExternalMessage();
  extmsg.extmesser.is_true = 5;
  output.value += extmsg;
  extmsg.SerializeToStream(b64stream);
  extmsg.SerializeToStream(stream);

  if (PROTO.ArrayBufferStream) {
    var buf = new ArrayBuffer(32);
    var bufstream = new PROTO.ArrayBufferStream(buf);
    extmsg.SerializeToStream(bufstream);
    var serializedbuf = bufstream.getArrayBuffer();
    var len = bufstream.length();
    var serializedbufstream = new PROTO.ArrayBufferStream(serializedbuf, len);
    var decodedbufmsg = new ProtoJSTest.PB.TestMessage;
    decodedbufmsg.ParseFromStream(bufstream);
    if (bufstream.getBlob) {
	try {
	    blobToString(bufstream.getBlob(), function(data) {
		    output.value += "\n TestMessage encoded with ArrayBuffer is: \n" +
			data + "\n";
		});
	} catch (e) {
	    output.value += "Aww. FileReader is not supported. Sorry!" + e;
	}
    } else {
	output.value += "Aww. Blob.slice is not supported. Sorry!";
    }
    output.value += "\n TestMessage decoded with ArrayBuffer is: \n" +
	decodedbufmsg + "\n";
  } else {
    output.value += "*** Not testing ArrayBufferStream: not supported in this browser\n";
  }

  output.value += "\n TestMessage encoded is:\n["+arr2+"]\n";
  output.value += "\n TestMessage base64'ed is:\n"+b64stream.getString()+"\n";
  var decodedmsg = new ProtoJSTest.PB.TestMessage;
  decodedmsg.ParseFromStream(new PROTO.ByteArrayStream(arr2));
  output.value += "\n DECODED: \n"+decodedmsg;
  var decoded64msg = new ProtoJSTest.PB.TestMessage;
  decoded64msg.ParseFromStream(new PROTO.Base64Stream(b64stream.getString()));
  output.value += "\n DECODED64: \n"+decoded64msg;
  
};
