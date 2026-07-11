const cloudinary = require('../config/cloudinary');

// Return normalized file data for one file
const UploadedImage = (file) => {
    if (!file) {
        throw new Error('No file uploaded');
    }

    return {
        url: file.path,
        publicId: file.filename,
        format: file.format,
        bytes: file.bytes,
        originalname: file.originalname,
        mimetype: file.mimetype
    };
};

// Return normalized file data for many files
const UploadedImages = (files) => {
    if (!files || files.length === 0) {
        throw new Error('No files uploaded');
    }

    return files.map((file) => ({
        url: file.path,
        publicId: file.filename,
        format: file.format,
        bytes: file.bytes,
        originalname: file.originalname,
        mimetype: file.mimetype
    }));
};

// Delete file from Cloudinary
const deleteCloudFile = async (publicId) => {

  if (!publicId) {
    throw new Error("public_id is required");
  }

  const result = await cloudinary.uploader.destroy(publicId);

  if (result.result === "not found") {
    throw new Error("Image not found");
  }

  return result;
};

module.exports = {
    UploadedImage,
    UploadedImages,
    deleteCloudFile
};