const express = require("express");
const router = express.Router();
const adopterProfileController = require("../controllers/adopterProfile.controller");


router.post("/", adopterProfileController.createProfile);
router.get("/:userId", adopterProfileController.getProfileByUserId);
router.put("/:userId", adopterProfileController.updateProfile);

module.exports = router;