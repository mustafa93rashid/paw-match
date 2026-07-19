// this file is just for testing image upload
const router = require("express").Router();
const {
  uploadSingle,
  uploadArray,
} = require("../middlewares/upload.middleware");
const {
  uploadBufferToCloudinary,
  deleteImage,
} = require("../services/cloudinary.service");

router.post("/single", uploadSingle("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image is required" });
    }

    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      folder: "animal",
      originalName: req.file.originalname,
    });

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: { url: uploaded.secure_url, publicId: uploaded.public_id },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/multi", uploadArray("images", 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Images are required" });
    }

    const uploaded = [];
    for (const file of req.files) {
      const result = await uploadBufferToCloudinary({
        buffer: file.buffer,
        folder: "user",
        originalName: file.originalname,
      });
      uploaded.push({ url: result.secure_url, publicId: result.public_id });
    }

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      data: uploaded,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/delete", async (req, res, next) => {
  try {
    const { public_id } = req.query;
    const result = await deleteImage(public_id);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
