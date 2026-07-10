const router = require("express").Router();

const adopterProfileController = require("../../controllers/adopterProfile.controller");
const auth = require("../../middlewares/auth");
const role = require("../../middlewares/role");
const asyncHandler = require("../../utils/asyncHandler");

router.get("/me",[auth], role(["adopter"]),asyncHandler(adopterProfileController.getMyProfile));

router.put("/me",[auth], role(["adopter"]),asyncHandler(adopterProfileController.updateMyProfile));

router.get("/", [auth], role(["superadmin"]),asyncHandler(adopterProfileController.getAllAdopters));

router.get("/:id", [auth], role(["superadmin", "shelterEmployee"]),asyncHandler(adopterProfileController.getAdopterById));

module.exports = router;