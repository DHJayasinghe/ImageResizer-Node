const express = require("express");
var multer = require("multer");
const sharp = require("sharp");
const path = require("path");

var app = express();

const supportedImageType = (imageExt) => {
  if (!imageExt) return null;
  const convertType = imageExt.toString().split(".")[0].toLowerCase();
  return ["jpeg", "png", "webp", "avif", "tiff", "gif", "svg"].find(
    (type) => type === convertType
  );
};
const changeFileExtension = (filename, ext) => {
  let pos = filename.lastIndexOf(".");
  return filename.substr(0, pos < 0 ? filename.length : pos) + `.${ext}`;
};

app.post("/api/image/converter", multer().single("image"), function (req, res) {
  if (!req.body.convertType) {
    res.status(400);
    res.end("Convert type is not provided");
    return;
  }
  if (!req.file) {
    res.status(400);
    res.end("Image content is not provided");
    return;
  }

  const targetFormat = supportedImageType(req.body.convertType);
  if (!targetFormat) {
    res.status(400);
    res.end(`Target image type is not supported: ${req.body.convertType}`);
    return;
  }

  const sharpStream = sharp(req.file.buffer);
  sharpStream.metadata().then((metadata) => {
    const originalFormat = supportedImageType(metadata.format);
    if (!originalFormat) {
      res.status(400);
      res.end(`Source image type is not supported: ${metadata.format}`);
    }

    sharpStream
      .toFormat(targetFormat, { quality: 100 })
      .toBuffer()
      .then((buffer) => {
        const newFileName = changeFileExtension(
          req.file.originalname,
          targetFormat
        );
        res.status(200);
        res.append("Content-Type", `image/${targetFormat}`);
        res.set({
          "Content-Type": `image/${targetFormat}`,
          "Content-Length": buffer.length,
          "Content-Disposition": `attachment; filename=${newFileName}`,
        });
        res.send(buffer);
      })
      .catch((err) => {
        console.log(err);
        res.status(500);
        res.end("Unable to convert the image");
      });
  });
});

const port = process.env.PORT || 80;
var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Image converter listening at http://%s:%s", host, port);
});

// const image = sharp("40334_X.png");
// image
//   .metadata()
//   .then(function (metadata) {
//     console.log(metadata);
//   })
//   .then(function (data) {
//     // data contains a WebP image half the width and height of the original JPEG
//   });
