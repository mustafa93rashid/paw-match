// routes/vetProfile.routes.js

const express = require("express");

const router = express.Router();

const vetProfileController = require("../../controllers/vetProfile.controller");

const auth = require("../../middlewares/auth");
const role = require("../../middlewares/role");
const asyncHandler = require("../../utils/asyncHandler");

// All routes require authentication
router.use(auth);

router.get("/me",role(["vet"]),asyncHandler(vetProfileController.getMyProfile),);

router.put("/me",role(["vet"]),asyncHandler(vetProfileController.updateMyProfile),);

router.get("/",role(["superadmin", "shelterEmployee", "adopter"]),asyncHandler(vetProfileController.getAll),);

router.get("/:id",role(["superadmin", "shelterEmployee", "adopter"]),asyncHandler(vetProfileController.getOne),);

module.exports = router;
