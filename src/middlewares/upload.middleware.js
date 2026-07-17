const multer = require('multer');
const { allowedMimeTypes } = require('../services/cloudinary.service');

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadArray = (fieldName, maxCount = 10) => upload.array(fieldName, maxCount);
// Middleware for handling multiple file fields with different names.
// Example: shelter logo (single image) and gallery images (multiple images)
// Each field has its own name and maximum number of allowed files.
const uploadFields = (fields) => upload.fields(fields);


module.exports = {
  uploadSingle,
  uploadArray,
  uploadFields,
  fileFilter,
};