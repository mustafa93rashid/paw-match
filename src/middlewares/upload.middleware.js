const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Allowed folders only
const allowedFolders = ['user', 'animal', 'shelter'];

// File filter for security
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
    }
};
const createCloudUpload = (folder) => {
    if (!allowedFolders.includes(folder)) {
        throw new Error('Invalid folder. Use user, animal, or shelter');
    }

    const cloudStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder:`paw-match/${folder}`,
            resource_type: 'image',
            format:"webp",
            public_id: (req, file) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileExtension = path.extname(file.originalname);
                const baseName = path.basename(file.originalname, fileExtension);
                const safeFileName = baseName.replace(/[^a-zA-Z0-9]/g, '_');

                // optional custom name from req.body.fileName
                if (req.body && req.body.fileName) {
                    return req.body.fileName.replace(/[^a-zA-Z0-9]/g, '_') + '-' + uniqueSuffix;
                }

                return safeFileName + '-' + uniqueSuffix;
            },
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        }
    });

    return multer({
        storage: cloudStorage,
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024,
        }
    });
};

module.exports = {
    createCloudUpload
};