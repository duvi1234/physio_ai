// src/storage/fileValidator.js

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp"
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

exports.validateFile = (file) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type. Only PDF, JPG, PNG, WEBP allowed.");
  }

  if (file.size > maxFileSize) {
    throw new Error("File size exceeds 10MB limit.");
  }
};
