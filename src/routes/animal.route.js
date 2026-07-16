const express = require("express");
const router = express.Router();
const animalController = require("../controllers/animal.controller");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const getPaginatedAnimals = require("../utils/pagination");
// Create animal
router.post("/", [auth, role(["shelterEmployee", "superadmin"])], asyncHandler(animalController.createAnimal));

// Get all animals
router.get("/",  [auth, getPaginatedAnimals], asyncHandler(animalController.getAll));

// Get animal by ID
router.get("/:id", [auth], asyncHandler(animalController.getOne));

// Update animal
router.patch("/:id", [auth, role(["shelterEmployee", "superadmin"])], asyncHandler(animalController.updateAnimal));

// Delete animal (soft delete)
router.delete("/:id", [auth, role(["shelterEmployee", "superadmin"])], asyncHandler(animalController.removeAnimal));

// Restore animal
router.patch("/:id/restore", [auth, role(["shelterEmployee", "superadmin"])], asyncHandler(animalController.restoreAnimal));

module.exports = router;