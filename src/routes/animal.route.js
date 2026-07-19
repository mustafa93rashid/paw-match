const express = require("express");
const router = express.Router();
const { uploadArray } = require("../middlewares/upload.middleware");

const animalController = require("../controllers/animal.controller");
const animalValidation = require("../Validation/animal.validate");

const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const { uploadArray } = require("../middlewares/upload.middleware");
const pagination = require("../middlewares/pagination");

// Create animal
router.post(
  "/",
  [
    auth,
    role(["shelterEmployee", "superadmin"]),
    uploadArray("images", 8),
    animalValidation.createAnimalValidation,
  ],
  asyncHandler(animalController.createAnimal)
);

router.post(
  "/:id/images",
  [auth, role(["shelterEmployee", "superadmin"]), uploadArray("images", 8)],
  asyncHandler(animalController.addAnimalImages),
);

router.delete(
  "/:id/images/:imageId",
  [auth, role(["shelterEmployee", "superadmin"])],
  asyncHandler(animalController.deleteAnimalImage),
);

// Delete all images
router.delete(
  "/:id/images",
  [auth, role(["shelterEmployee", "superadmin"])],
  asyncHandler(animalController.deleteAllAnimalImages),
);

// Set primary image
router.patch(
  "/:id/images/:imageId/primary",
  [auth, role(["shelterEmployee", "superadmin"])],
  asyncHandler(animalController.setPrimaryAnimalImage),
);

// Get all animals
router.get(
  "/",
  [auth, pagination, animalValidation.getAllAnimalsValidation],
  asyncHandler(animalController.getAll)
);
// Get animal by ID
router.get("/:id", [auth, animalValidation.getAnimalByIdValidation], asyncHandler(animalController.getOne));

// Update animal
router.patch("/:id", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.updateAnimalValidation], asyncHandler(animalController.updateAnimal));

// Delete animal
router.delete("/:id", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.removeAnimalValidation], asyncHandler(animalController.removeAnimal));

// Restore animal
router.patch("/:id/restore", [auth, role(["shelterEmployee", "superadmin"]), animalValidation.restoreAnimalValidation], asyncHandler(animalController.restoreAnimal));

// Add and remove animal images
router.post("/:id/images",[auth, role(["shelterEmployee", "superadmin"]), uploadArray("images", 10)],asyncHandler(animalController.addAnimalImages));

// Delete animal image by publicId
router.delete("/:id/images/:publicId",[auth, role(["shelterEmployee", "superadmin"])],asyncHandler(animalController.deleteAnimalImage));

module.exports = router;