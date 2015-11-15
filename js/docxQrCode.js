var DocXTemplater, DocxQrCode, JSZip, QrCode, vm;

DocXTemplater = require('docxtemplater');

vm = require('vm');

JSZip = require('jszip');

QrCode = require('qrcode-reader');

module.exports = DocxQrCode = (function() {
  function DocxQrCode(imageData, xmlTemplater, imgName, num, getDataFromString) {
    this.xmlTemplater = xmlTemplater;
    this.imgName = imgName != null ? imgName : "";
    this.num = num;
    this.getDataFromString = getDataFromString;
    this.callbacked = false;
    this.data = imageData;
    if (this.data === void 0) {
      throw new Error("data of qrcode can't be undefined");
    }
    this.ready = false;
    this.result = null;
  }

  DocxQrCode.prototype.decode = function(callback) {
    var _this;
    this.callback = callback;
    _this = this;
    this.qr = new QrCode();
    this.qr.callback = function() {
      var testdoc;
      _this.ready = true;
      _this.result = this.result;
      testdoc = new _this.xmlTemplater.currentClass(this.result, {
        tags: _this.xmlTemplater.tags,
        Tags: _this.xmlTemplater.Tags,
        parser: _this.xmlTemplater.parser
      });
      testdoc.render();
      _this.result = testdoc.content;
      return _this.searchImage();
    };
    return this.qr.decode({
      width: this.data.width,
      height: this.data.height
    }, this.data.decoded);
  };

  DocxQrCode.prototype.searchImage = function() {
    var cb;
    cb = (function(_this) {
      return function(err, data) {
        _this.data = data != null ? data : _this.data.data;
        if (err) {
          console.error(err);
        }
        return _this.callback(_this, _this.imgName, _this.num);
      };
    })(this);
    if (this.result == null) {
      return cb();
    }
    return this.getDataFromString(this.result, cb);
  };

  return DocxQrCode;

})();
