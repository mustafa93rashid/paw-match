const express = require("express");
const router = express.Router();

const animalController = require("../controllers/animal.controller");
const animalValidation = require("../validation/animal.validate");

const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const getPaginatedAnimals = require("../utils/pagination");

// Create animal
router.post("/", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.createAnimalValidation], asyncHandler(animalController.createAnimal));

// Get all animals
router.get("/", [auth, getPaginatedAnimals, animalValidation.getAllAnimalsValidation], asyncHandler(animalController.getAll));

// Get animal by ID
router.get("/:id", [auth, animalValidation.getAnimalByIdValidation], asyncHandler(animalController.getOne));

// Update animal
router.patch("/:id", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.updateAnimalValidation], asyncHandler(animalController.updateAnimal));

// Delete animal
router.delete("/:id", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.removeAnimalValidation], asyncHandler(animalController.removeAnimal));

// Restore animal
router.patch("/:id/restore", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.restoreAnimalValidation], asyncHandler(animalController.restoreAnimal));

module.exports = router;