//this file is just for testin image upload
const router = require("express").Router();
const cloudinary = require("../config/cloudinary");

const { createCloudUpload } = require("../middlewares/upload.middleware");
const { UploadedImage,UploadedImages,deleteCloudFile } = require("../services/upload.service");


router.post(
  "/single",
  createCloudUpload('animal').single("image"),

  async (req, res) => {
    try {
  console.log("BEFORE MULTER");
      const image = UploadedImage(req.file);
      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: image
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message: error.message
      });

    }
  }
);

router.post(
  "/multi",
  createCloudUpload('user').array("images"),

  async (req, res) => {
    try {
      const image = UploadedImages(req.files);
      res.status(200).json({
        success: true,
        message: "Images uploaded successfully",
        data: image
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message: error.message
      });

    }
  }
);
router.delete(
  "/delete",

  async (req, res) => {
    try {

      const { public_id } = req.query;

      const result = await deleteCloudFile(public_id);


      res.status(200).json({
        success: true,
        message: "Image deleted successfully",
        result
      });


    } catch (error) {

      console.log("DELETE ERROR:", error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });

    }
  }
);
module.exports = router;