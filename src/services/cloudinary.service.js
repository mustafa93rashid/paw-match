const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

const allowedFolders = ['user', 'animal', 'shelter'];
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const sanitizeBaseName = (value) =>
  String(value || 'image')
    .trim()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'image';

const buildPublicId = (folder, originalName) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${sanitizeBaseName(folder)}_${sanitizeBaseName(originalName)}_${uniqueSuffix}`;
};

const uploadBufferToCloudinary = ({
  buffer,
  folder,
  originalName,
  publicId,
}) => {
  if (!buffer) {
    throw new Error('File buffer is required');
  }

  if (!allowedFolders.includes(folder)) {
    throw new Error('Invalid upload folder');
  }

  const finalPublicId = publicId || buildPublicId(folder, originalName);
// upload_stream() doesn't upload the image by itself.
//  It simply creates a writable stream (an upload channel) and opens a connection to Cloudinary,
//  waiting for data to be sent.
//  The actual image upload starts only when the image buffer is piped into that stream using
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `paw-match/${folder}`,
        public_id: finalPublicId,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      },
    );
//  The actual image upload starts only when the image buffer is piped into that stream using

    Readable.from(buffer).on('error', reject).pipe(uploadStream);
  });
};

const deleteImage = async (publicId) => {
  if (!publicId) {
    throw new Error('publicId is required');
  }

  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

const deleteImages = async (publicIds = []) => {
  const ids = publicIds.filter(Boolean);
  if (ids.length === 0) {
    return [];
  }

  return Promise.all(ids.map((publicId) => deleteImage(publicId)));
};

module.exports = {
  allowedFolders,
  allowedMimeTypes,
  uploadBufferToCloudinary,
  deleteImage,
  deleteImages,
};