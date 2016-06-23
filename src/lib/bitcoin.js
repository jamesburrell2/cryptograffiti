/**
 * @preserve Bitcoin lib v1.1
 * (c) 2014 by Icedude. All rights reserved.
 * dependant on sha256.js
 *
 * USE:
 * Bitcoin.testAddress(base58BitcoinAddressString) returns 1 or 0
 * Bitcoin.getAddressPayload(base58BitcoinAddressString) returns upto 20char Latin1 encoded string
 * Bitcoin.createAddressFromText(20charString) returns bitcoin address from 20 char long string
 * Bitcoin.genAddressesFromText(string,true or false newline at end) returns array with address strings
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD.
    define([], factory);
  } else {
    // Browser globals.
    root.Bitcoin = factory();
  }
}(this, function () {
  
  
  var o = {};
  var asc256 = []; //ascii char value is converted to 58base value
  var alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  for (var i = 0, len = 256; i < len; i++) {
    var alphaIndex = alphabet.indexOf(String.fromCharCode(i));
    asc256.push(alphaIndex > -1 ? alphaIndex : -1);
  }

  var checksum = 0;
  var wordarray = CryptoJS.lib.WordArray.create(new Array(7), 21); //holds 21 bytes of the addresses 25total bytes. so need 28byte array

  o.testAddress = function (address) {
    if (!unbase58(address)) return 0;
    var hashWordArray = CryptoJS.SHA256(CryptoJS.SHA256(wordarray));
    if (hashWordArray['words'][0] === checksum) return 1;
    return 0;
  };

  o.getAddressPayload = function (address) {
    if (!unbase58(address)) return null;
    var string = CryptoJS.enc.Latin1.stringify(wordarray);
    //        var string = CryptoJS.enc.Utf16.stringify(wordarray);
    return string.substr(1);
  };

  o.createAddressFromText = function (payload) {
    return base58(payload);
  };

  o.genAddressesFromText = function (text_in, endWithNewline) {
    var text = text_in;
    if (endWithNewline === undefined) endWithNewline = true;
    if (endWithNewline && text.length > 20 && text.search("\n") === -1) text += "\n";
    var nrOfAddressesNeeded = (((text.length - 1) / 20) + 1) >>> 0;
    var addressesAsTextInArray = [];
    for (var i = 0, len = nrOfAddressesNeeded; i < len; i++) {
      addressesAsTextInArray.push(o.createAddressFromText(text.substr(i * 20, 20)));
    }
    return addressesAsTextInArray;
  };

  function unbase58(base58str) {
    var intAr = wordarray['words'],
      base = 58,
      c;

    resetArrayTo(intAr, 0);

    for (i = 0, len = base58str.length; i < len; i++) {
      if ((c = asc256[base58str.charCodeAt(i)]) < 0) return 0; //bad char
      for (var j = intAr.length; j--;) {
        c += base * intAr[j];
        intAr[j] = c % 0x100000000; //c mod #FFFFFFFF
        c = c / 0x100000000 >>> 0; //c div #FFFFFFFF
      }
      if (c) return 0; //"address too long";
    }
    checksum = intAr[intAr.length - 1] >> 0; //make checksum to integer
    intAr[intAr.length - 1] = 0;
    c = 0;
    var flow = 0;
    for (i = intAr.length; i--;) { //shift all integers left for wordarray
      c = intAr[i];
      intAr[i] = (c << 24) + flow;
      flow = c >>> 8;
    }
    return 1;
  }

  function base58(text) {
      var intAr = wordarray['words'],
        base = 58,
        i;
      resetArrayTo(intAr, 0);

      var padding = 0;
      var count_zeroes = true;
      text = String.fromCharCode(0) + text; //add 00 before message
      for (i = 0, len = Math.min(text.length, 21); i < len; i++) { //put ascii chars to int array
        var chr = text.charCodeAt(i);
        if (i > 0) {
            if (chr === 0 && count_zeroes) padding++;
            if (chr !== 0) count_zeroes = false;
        }
        intAr[i / 4 >> 0] |= chr << 24 - i % 4 * 8;
      }
      var hashWordArray = CryptoJS.SHA256(CryptoJS.SHA256(wordarray));
      var checksum = hashWordArray['words'][0];
      //shift all integers right for wordarray
      var c = 0;
      var flow = 0;
      for (i = 0, len = intAr.length; i < len; i++) {
        c = intAr[i];
        intAr[i] = (c >>> 24) + flow;
        flow = c << 8;
      }

      //place checksum
      intAr[intAr.length - 1] = checksum;

      var base58encoded = "";
      var reminder, valueExists;
      while (true) {
        valueExists = 0;
        reminder = 0;
        for (i = 0, len = intAr.length; i < len; i++) {
          reminder = 0x100000000 * reminder + (intAr[i] >>> 0);
          if (intAr[i] !== 0) valueExists = 1;
          intAr[i] = reminder / base >>> 0;
          reminder = reminder % base;
        }
        base58encoded = alphabet[reminder] + base58encoded;
        if (!valueExists) break;
      }

      base58encoded = "1".repeat(padding)+base58encoded;
      // Bitcoin address cannot be shorter than 27 characters.
      padding = Math.max( 27-base58encoded.length, 0 );
      return "1".repeat(padding)+base58encoded;
  }

  //Testinnn
  function resetArrayTo(array, val) {
    var i = array.length;
    while (i--) array[i] = val;
  }

  //    o.intArrayToHex = function (ar) {
  //        var sss = "";
  //        for (var i = 0, lenn = ar.length; i < lenn; i++) sss += intToHex(ar[i]);
  //        console.log(sss);
  //    };
  //
  //    o.intArrayToHex2 = function (ar) {
  //        var sss = "";
  //        for (var i = 0, lenn = ar.length; i < lenn; i++) sss += intToHex(ar[i]);
  //        return sss;
  //    };
  //
  //    function intToHex(val) {
  //        var hex = (val >>> 0).toString(16);
  //        while (hex.length < 8) hex = "0" + hex;
  //        return hex;
  //    }
  //    o.toString = function (num, len, radix) {
  //        var s = (num >>> 0).toString(radix);
  //        while (s.length < len) s = "0" + s;
  //        console.log(s);
  //    };
  return o;
}));
