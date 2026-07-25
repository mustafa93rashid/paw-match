const { Readable } = require("stream");
const crypto = require("crypto");

const cloudinary = require("../config/cloudinary");

const allowedFolders = ["user", "animal", "shelter"];

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// ==================================================
// Sanitize Base Name
// ==================================================
const sanitizeBaseName = (value) =>
  String(value || "image")
    .trim()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "image";

// ==================================================
// Build Short Unique Public ID
// ==================================================
const buildPublicId = (folder) => {
  const timestamp = Date.now();

  const randomId = crypto.randomBytes(6).toString("hex");

  return `${sanitizeBaseName(folder)}_${timestamp}_${randomId}`;
};

// ==================================================
// Upload Buffer to Cloudinary
// ==================================================
const uploadBufferToCloudinary = ({
  buffer,
  folder,
  originalName,
  publicId,
}) => {
  if (!buffer) {
    throw new Error("File buffer is required");
  }

  if (!allowedFolders.includes(folder)) {
    throw new Error("Invalid upload folder");
  }

  const finalPublicId = publicId
    ? sanitizeBaseName(publicId)
    : buildPublicId(folder);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `paw-match/${folder}`,
        public_id: finalPublicId,
        resource_type: "image",

        // Keep the original filename only as metadata.
        context: {
          originalName: String(originalName || "image").slice(0, 200),
        },

        transformation: [
          {
            width: 800,
            height: 800,
            crop: "limit",
          },
          {
            quality: "auto",
          },
          {
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new Error("Cloudinary upload failed"));
        }

        return resolve(result);
      },
    );

    uploadStream.on("error", reject);

    Readable.from(buffer)
      .on("error", reject)
      .pipe(uploadStream);
  });
};

// ==================================================
// Delete One Image
// ==================================================
const deleteImage = async (publicId) => {
  if (!publicId || typeof publicId !== "string") {
    throw new Error("publicId is required");
  }

  return cloudinary.uploader.destroy(publicId.trim(), {
    resource_type: "image",
  });
};

// ==================================================
// Delete Multiple Images
// ==================================================
const deleteImages = async (publicIds = []) => {
  if (!Array.isArray(publicIds)) {
    throw new Error("publicIds must be an array");
  }

  const ids = [
    ...new Set(
      publicIds
        .filter(
          (publicId) =>
            typeof publicId === "string" && publicId.trim().length > 0,
        )
        .map((publicId) => publicId.trim()),
    ),
  ];

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