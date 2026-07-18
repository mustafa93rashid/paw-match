const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate");

const supportedSpecies = [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "fish",
  "other",
];

const animalStatuses = ["available", "pending", "adopted"];
const genders = ["male", "female", "unknown"];
const sizes = ["small", "medium", "large", "extra-large"];

//============================================================
// Reusable Validation Rules
//============================================================

const animalIdValidation = param("id")
  .notEmpty()
  .withMessage("Animal ID is required")
  .bail()
  .isMongoId()
  .withMessage("Invalid animal ID");

const shelterIdBodyValidation = body("shelterId")
  .notEmpty()
  .withMessage("Shelter ID is required")
  .bail()
  .isMongoId()
  .withMessage("Invalid shelter ID");

//============================================================
// Create Animal Validation
//============================================================

const createAnimalValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Animal name is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Animal name must be between 2 and 50 characters"),

  body("species")
    .trim()
    .notEmpty()
    .withMessage("Species is required")
    .bail()
    .isIn(supportedSpecies)
    .withMessage(`Species must be one of: ${supportedSpecies.join(", ")}`),

  body("breed")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Breed cannot exceed 100 characters"),

  body("age")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Age must be a positive number")
    .toFloat(),

  body("gender")
    .trim()
    .notEmpty()
    .withMessage("Gender is required")
    .bail()
    .isIn(genders)
    .withMessage(`Gender must be one of: ${genders.join(", ")}`),

  body("size")
    .optional()
    .isIn(sizes)
    .withMessage(`Size must be one of: ${sizes.join(", ")}`),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1500 })
    .withMessage("Description cannot exceed 1500 characters"),

  body("images")
    .optional()
    .isArray({ max: 5 })
    .withMessage("Images must be an array containing at most 5 items"),

  body("images.*")
    .optional()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Each animal image must be a valid URL"),

  shelterIdBodyValidation,

  validate,
];

//============================================================
// Update Animal Validation
//============================================================

const updateAnimalValidation = [
  animalIdValidation,

  body().custom((value) => {
    const allowedFields = [
      "name",
      "species",
      "breed",
      "age",
      "gender",
      "size",
      "description",
      "images",
      "status",
    ];

    const submittedFields = Object.keys(value);
    const containsEditableField = submittedFields.some((field) =>
      allowedFields.includes(field)
    );

    if (!containsEditableField) {
      throw new Error("At least one editable animal field is required");
    }
    return true;
  }),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Animal name cannot be empty")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Animal name must be between 2 and 50 characters"),

  body("species")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Species cannot be empty")
    .bail()
    .isIn(supportedSpecies)
    .withMessage(`Species must be one of: ${supportedSpecies.join(", ")}`),

  body("gender")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Gender cannot be empty")
    .bail()
    .isIn(genders)
    .withMessage(`Gender must be one of: ${genders.join(", ")}`),

  body("status")
    .optional()
    .isIn(animalStatuses)
    .withMessage(`Status must be one of: ${animalStatuses.join(", ")}`),

  validate,
];

//============================================================
// Get Animal by ID Validation
//============================================================

const getAnimalByIdValidation = [
  animalIdValidation,
  validate,
];

//============================================================
// Delete Animal Validation
//============================================================

const deleteAnimalValidation = [
  animalIdValidation,
  validate,
];

module.exports = {
  createAnimalValidation,
  updateAnimalValidation,
  getAnimalByIdValidation,
  deleteAnimalValidation,
};