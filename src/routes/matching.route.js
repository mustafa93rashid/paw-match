const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const matchingController = require("../controllers/matching.controller",);

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const router = express.Router();

router.get("/", auth, role(["adopter"]), asyncHandler(matchingController.getMatchedAnimals));

module.exports = router;