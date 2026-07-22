const express = require("express");
const router = express.Router();

const { uploadSingle, uploadArray } = require("../middlewares/upload.middleware");

const animalController = require("../controllers/animal.controller");
const animalValidation = require("../Validation/animal.validate");

const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

// Create animal (without images)
router.post("/", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.createAnimalValidation], asyncHandler(animalController.createAnimal));

// Add animal images
router.post("/:id/images", [auth, role(["shelterEmployee", "superadmin"]), uploadArray("images", 8), animalValidation.addAnimalImagesValidation], asyncHandler(animalController.addAnimalImages));

// Replace animal image
router.patch("/:id/images/:imageId", [auth, role(["shelterEmployee", "superadmin"]), uploadSingle("image"), animalValidation.replaceAnimalImageValidation], asyncHandler(animalController.replaceAnimalImage));

// Set primary image
router.patch("/:id/images/:imageId/primary", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.setPrimaryAnimalImageValidation], asyncHandler(animalController.setPrimaryAnimalImage));

// Delete one image
router.delete("/:id/images/:imageId", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.deleteAnimalImageValidation], asyncHandler(animalController.deleteAnimalImage));

// Delete all images
router.delete("/:id/images", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.deleteAllAnimalImagesValidation], asyncHandler(animalController.deleteAllAnimalImages));

// Get all animals
router.get("/", [auth, animalValidation.getAllAnimalsValidation], asyncHandler(animalController.getAll));

// Get animal by ID
router.get("/:id", [auth, animalValidation.getAnimalByIdValidation], asyncHandler(animalController.getOne));

// Update animal
router.patch("/:id", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.updateAnimalValidation], asyncHandler(animalController.updateAnimal));

// Soft delete animal
router.delete("/:id", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.removeAnimalValidation], asyncHandler(animalController.removeAnimal));

// Restore animal
router.patch("/:id/restore", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.restoreAnimalValidation], asyncHandler(animalController.restoreAnimal));

module.exports = router;