// src/storage/multer.config.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { validateFile } = require("./fileValidator");

const uploadPath = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    try {
      validateFile({ mimetype: file.mimetype, size: 0 });
      cb(null, true);
    } catch (err) {
      cb(err);
    }
  }
});

module.exports = upload;
