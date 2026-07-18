const express = require("express");
const router = express.Router();
const shelterEmployeeProfileController = require("../../controllers/shelterEmployeeProfile.controller",);
const auth = require("../../middlewares/auth");
const role = require("../../middlewares/role");
const asyncHandler = require("../../utils/asyncHandler");


router.get("/me", [auth], role(["shelterEmployee"]),asyncHandler(shelterEmployeeProfileController.getMyProfile),);

router.put("/me", [auth], role(["shelterEmployee"]),asyncHandler(shelterEmployeeProfileController.updateEmployeeWorkData),);

router.get("/", [auth], role(["superadmin"]),asyncHandler(shelterEmployeeProfileController.getAll),);

router.get("/:id", [auth], role(["superadmin"]),asyncHandler(shelterEmployeeProfileController.getOne),);

module.exports = router;