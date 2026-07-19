const { body, param, query } = require("express-validator");

const validate = require("../middlewares/validate");

// ==================================================
// Update authenticated vet profile validation
// ==================================================
const updateMyProfileValidation = [
  // Prevent updating fields that are not allowed
  body().custom((value, { req }) => {
    const allowedFields = [
      "specialization",
      "bio",
      "experienceYears",
      "availableDays",
      "consultationTypes",
    ];

    const receivedFields = Object.keys(req.body);

    if (receivedFields.length === 0) {
      throw new Error("At least one field must be provided");
    }

    const invalidFields = receivedFields.filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      throw new Error(
        `These fields are not allowed: ${invalidFields.join(", ")}`,
      );
    }

    return true;
  }),

  // Validate specialization
  body("specialization")
    .optional()
    .isString()
    .withMessage("Specialization must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Specialization cannot be empty")
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Specialization must be between 2 and 100 characters",
    ),

  // Validate bio
  body("bio")
    .optional()
    .isString()
    .withMessage("Bio must be a string")
    .bail()
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage("Bio cannot exceed 1000 characters"),

  // Validate experience years
  body("experienceYears")
    .optional()
    .isInt({
      min: 0,
      max: 80,
    })
    .withMessage(
      "Experience years must be an integer between 0 and 80",
    )
    .toInt(),

  // Validate available days array
  body("availableDays")
    .optional()
    .isArray()
    .withMessage("Available days must be an array")
    .bail()
    .custom((availableDays) => {
      const uniqueDays = new Set(availableDays);

      if (uniqueDays.size !== availableDays.length) {
        throw new Error("Available days cannot contain duplicates");
      }

      return true;
    }),

  // Validate every available day
  body("availableDays.*")
    .optional()
    .isString()
    .withMessage("Each available day must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Available day cannot be empty")
    .bail()
    .isIn([
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ])
    .withMessage(
      "Available day must be sunday, monday, tuesday, wednesday, thursday, friday, or saturday",
    ),

  // Validate consultation types array
  body("consultationTypes")
  .optional()
  .isArray()
  .withMessage("Consultation types must be an array")
  .bail()
  .custom((consultationTypes) => {
    const uniqueTypes = new Set(consultationTypes);

    if (uniqueTypes.size !== consultationTypes.length) {
      throw new Error("Consultation types cannot contain duplicates");
    }

    return true;
  }),

body("consultationTypes.*")
  .optional()
  .isString()
  .withMessage("Each consultation type must be a string")
  .bail()
  .isIn(["vetConsultation", "behaviorTraining"])
  .withMessage(
    "Consultation type must be vetConsultation or behaviorTraining",
  ),

  validate,
];

// ==================================================
// Get all active vet profiles validation
// ==================================================
const getAllValidation = [
  // Validate shelter ID query parameter
  query("shelterId")
    .optional()
    .isMongoId()
    .withMessage("Invalid shelter ID"),

  // Validate specialization query parameter
  query("specialization")
    .optional()
    .isString()
    .withMessage("Specialization must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Specialization cannot be empty")
    .bail()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Specialization cannot exceed 100 characters",
    ),

  validate,
];

// ==================================================
// Get vet profile by User ID validation
// ==================================================
const getOneValidation = [
  // Validate user ID route parameter
  param("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid user ID"),

  validate,
];

module.exports = {
  updateMyProfileValidation,
  getAllValidation,
  getOneValidation,
};