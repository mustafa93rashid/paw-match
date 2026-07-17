const multer = require('multer');

const errorHandler = (err, req, res, next) => {

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    let message = 'Upload error';

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size must not exceed 5MB';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }

    return res.status(400).json({
      success: false,
      message,
      error: err.code,
    });
  }

  if (err?.message && /Only JPEG, PNG, GIF, and WebP images are allowed/i.test(err.message)) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate key error',
    });
  }

  
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    })
  });
};

module.exports = errorHandler;