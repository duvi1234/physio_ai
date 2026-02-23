// src/storage/fileValidator.js

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg"
];

const maxFileSize = 5 * 1024 * 1024; // 5MB

exports.validateFile = (file) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type. Only PDF, JPG, PNG allowed.");
  }

  if (file.size > maxFileSize) {
    throw new Error("File size exceeds 5MB limit.");
  }
};
