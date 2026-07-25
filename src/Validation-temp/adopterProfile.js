const { body, param } = require("express-validator");
const mongoose = require("mongoose");

const validate = require("../middlewares/validate");

// ==================================================
// Update adopter profile validation
// ==================================================
const updateAdopterProfileValidation = [
  body("homeType")
    .optional()
    .isIn(["apartment", "house", "farm"])
    .withMessage("Home type must be apartment, house, or farm"),

  body("hasKids")
    .optional()
    .isBoolean()
    .withMessage("Has kids must be a boolean value"),

  body("hasOtherPets")
    .optional()
    .isBoolean()
    .withMessage("Has other pets must be a boolean value"),

  body("experienceLevel")
    .optional()
    .isIn(["beginner", "intermediate", "expert"])
    .withMessage(
      "Experience level must be beginner, intermediate, or expert",
    ),

  body("dailyActivityLevel")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Daily activity level must be low, medium, or high"),

  body("isAllergic")
    .optional()
    .isBoolean()
    .withMessage("Is allergic must be a boolean value"),

  body("ownerType")
    .optional()
    .isIn(["single", "family"])
    .withMessage("Owner type must be single or family"),

  body("preferredSpecies")
    .optional()
    .isArray()
    .withMessage("Preferred species must be an array"),

  body("preferredSpecies.*")
    .optional()
    .isIn(["dog", "cat", "bird", "rabbit", "fish", "other"])
    .withMessage(
      "Preferred species must contain only dog, cat, bird, rabbit, fish, or other",
    ),

  body().custom((value) => {
    const allowedFields = [
      "homeType",
      "hasKids",
      "hasOtherPets",
      "experienceLevel",
      "dailyActivityLevel",
      "isAllergic",
      "ownerType",
      "preferredSpecies",
    ];

    const receivedFields = Object.keys(value);

    const invalidFields = receivedFields.filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      throw new Error(
        `Invalid fields: ${invalidFields.join(", ")}`,
      );
    }

    if (receivedFields.length === 0) {
      throw new Error("At least one profile field is required");
    }

    return true;
  }),

  validate,
];

// ==================================================
// Get adopter profile by user ID validation
// ==================================================
const getAdopterByUserIdValidation = [
  param("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid user ID"),

  validate,
];

module.exports = {
  updateAdopterProfileValidation,
  getAdopterByUserIdValidation,
};