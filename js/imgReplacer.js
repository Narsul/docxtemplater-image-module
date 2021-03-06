var DocUtils, DocxQrCode, ImgReplacer, JSZip, PNG,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

DocUtils = require('./docUtils');

DocxQrCode = require('./docxQrCode');

PNG = require('png-js');

JSZip = require('jszip');

module.exports = ImgReplacer = (function() {
  function ImgReplacer(xmlTemplater, imgManager) {
    this.xmlTemplater = xmlTemplater;
    this.imgManager = imgManager;
    this.imageSetter = __bind(this.imageSetter, this);
    this.imgMatches = [];
    this.xmlTemplater.numQrCode = 0;
    this;
  }

  ImgReplacer.prototype.findImages = function() {
    this.imgMatches = DocUtils.pregMatchAll(/<w:drawing[^>]*>.*?<a:blip.r:embed.*?<\/w:drawing>/g, this.xmlTemplater.content);
    return this;
  };

  ImgReplacer.prototype.replaceImages = function() {
    var match, u, _i, _len, _ref;
    this.qr = [];
    this.xmlTemplater.numQrCode += this.imgMatches.length;
    _ref = this.imgMatches;
    for (u = _i = 0, _len = _ref.length; _i < _len; u = ++_i) {
      match = _ref[u];
      this.replaceImage(match, u);
    }
    return this;
  };

  ImgReplacer.prototype.imageSetter = function(docxqrCode) {
    if (docxqrCode.callbacked === true) {
      return;
    }
    docxqrCode.callbacked = true;
    docxqrCode.xmlTemplater.numQrCode--;
    this.imgManager.setImage("word/media/" + docxqrCode.imgName, docxqrCode.data, {
      binary: true
    });
    return this.popQrQueue(this.imgManager.fileName + '-' + docxqrCode.num, false);
  };

  ImgReplacer.prototype.replaceImage = function(match, u) {
    var e, imageTag, imgName, mockedQrCode, newId, num, oldFile, rId, replacement, tag, tagrId, xmlImg;
    num = parseInt(Math.random() * 10000);
    try {
      xmlImg = DocUtils.Str2xml('<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">' + match[0] + '</w:document>', function(_i, type) {
        if (_i === 'fatalError') {
          throw "fatalError";
        }
      });
    } catch (_error) {
      e = _error;
      return;
    }
    tagrId = xmlImg.getElementsByTagName("a:blip")[0];
    if (tagrId === void 0) {
      throw new Error('tagRiD undefined !');
    }
    rId = tagrId.getAttribute('r:embed');
    oldFile = this.imgManager.getImageByRid(rId);
    tag = xmlImg.getElementsByTagName("wp:docPr")[0];
    if (tag === void 0) {
      throw new Error('tag undefined');
    }
    if (tag.getAttribute("name").substr(0, 6) === "Copie_") {
      return;
    }
    imgName = this.imgManager.getImageName();
    this.pushQrQueue(this.imgManager.fileName + '-' + num, true);
    newId = this.imgManager.addImageRels(imgName, "");
    this.xmlTemplater.imageId++;
    this.imgManager.setImage(this.imgManager.getFullPath(imgName), oldFile.data, {
      binary: true
    });
    tag.setAttribute('name', "" + imgName);
    tagrId.setAttribute('r:embed', "rId" + newId);
    imageTag = xmlImg.getElementsByTagName('w:drawing')[0];
    if (imageTag === void 0) {
      throw new Error('imageTag undefined');
    }
    replacement = DocUtils.xml2Str(imageTag);
    this.xmlTemplater.content = this.xmlTemplater.content.replace(match[0], replacement);
    mockedQrCode = {
      xmlTemplater: this.xmlTemplater,
      imgName: imgName,
      data: oldFile.asBinary(),
      num: num
    };
    if (/\.png$/.test(oldFile.name)) {
      return (function(_this) {
        return function(imgName) {
          var base64, binaryData, dat, finished, png;
          base64 = JSZip.base64.encode(oldFile.asBinary());
          binaryData = new Buffer(base64, 'base64');
          png = new PNG(binaryData);
          finished = function(a) {
            png.decoded = a;
            try {
              _this.qr[u] = new DocxQrCode(png, _this.xmlTemplater, imgName, num, _this.getDataFromString);
              return _this.qr[u].decode(_this.imageSetter);
            } catch (_error) {
              e = _error;
              return _this.imageSetter(mockedQrCode);
            }
          };
          return dat = png.decode(finished);
        };
      })(this)(imgName);
    } else {
      return this.imageSetter(mockedQrCode);
    }
  };

  return ImgReplacer;

})();
