const { body, param, query } = require("express-validator");

const validate = require("../middlewares/validate");

// ==================================================
// Create animal validation
// ==================================================
// • Validates all required animal information.
// • Validates optional matching requirements.
// • Prevents setting protected fields manually.
// • Shelter ID is optional because Shelter Employees
//   get it automatically from their profile.
// • Super Admin must provide the Shelter ID.
// • Images are added later through the image routes.
// ==================================================
const createAnimalValidation = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("Animal name is required")
    .bail()
    .isString()
    .withMessage("Animal name must be a string")
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Animal name must be between 2 and 50 characters"),

  body("age")
    .exists()
    .withMessage("Animal age is required")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Animal age must be greater than or equal to 0")
    .toFloat(),

  body("ageUnit")
    .exists({ checkFalsy: true })
    .withMessage("Age unit is required")
    .bail()
    .isIn(["months", "years"])
    .withMessage("Age unit must be months or years"),

  body("species")
    .exists({ checkFalsy: true })
    .withMessage("Animal species is required")
    .bail()
    .isIn(["dog", "cat", "bird", "rabbit", "fish", "other"])
    .withMessage("Invalid animal species"),

  body("breed")
    .exists({ checkFalsy: true })
    .withMessage("Animal breed is required")
    .bail()
    .isString()
    .withMessage("Animal breed must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Animal breed must be between 1 and 100 characters"),

  body("gender")
    .exists({ checkFalsy: true })
    .withMessage("Animal gender is required")
    .bail()
    .isIn(["male", "female"])
    .withMessage("Gender must be male or female"),

  body("size")
    .exists({ checkFalsy: true })
    .withMessage("Animal size is required")
    .bail()
    .isIn(["small", "medium", "large"])
    .withMessage("Size must be small, medium, or large"),

  body("color")
    .exists({ checkFalsy: true })
    .withMessage("Animal color is required")
    .bail()
    .isString()
    .withMessage("Animal color must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Animal color must be between 1 and 100 characters"),

  body("healthStatus")
    .exists({ checkFalsy: true })
    .withMessage("Health status is required")
    .bail()
    .isIn(["healthy", "needsCare", "specialNeeds", "underTreatment"])
    .withMessage("Invalid health status"),

  body("vaccinated")
    .optional()
    .isBoolean()
    .withMessage("Vaccinated must be true or false")
    .toBoolean(),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("shelterId")
    .optional()
    .isMongoId()
    .withMessage("Invalid shelter ID"),

  body("requirements")
    .optional()
    .isObject()
    .withMessage("Requirements must be an object"),

  body("requirements.homeType")
    .optional()
    .isIn(["apartment", "house", "farm", "any"])
    .withMessage("Home type must be apartment, house, farm, or any"),

  body("requirements.suitableForKids")
    .optional()
    .isBoolean()
    .withMessage("Suitable for kids must be true or false")
    .toBoolean(),

  body("requirements.goodWithOtherPets")
    .optional()
    .isBoolean()
    .withMessage("Good with other pets must be true or false")
    .toBoolean(),

  body("requirements.experienceLevel")
    .optional()
    .isIn(["beginner", "intermediate", "expert", "any"])
    .withMessage(
      "Experience level must be beginner, intermediate, expert, or any",
    ),

  body("requirements.dailyActivityLevel")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Daily activity level must be low, medium, or high"),

  body("requirements.ownerType")
    .optional()
    .isIn(["single", "family", "any"])
    .withMessage("Owner type must be single, family, or any"),

  body("requirements.hypoallergenic")
    .optional()
    .isBoolean()
    .withMessage("Hypoallergenic must be true or false")
    .toBoolean(),

  body("images")
    .not()
    .exists()
    .withMessage("Images must be added through the animal image endpoint"),

  body("isActive")
    .not()
    .exists()
    .withMessage("isActive cannot be set when creating an animal"),

  body("adoptionStatus")
    .not()
    .exists()
    .withMessage("Adoption status cannot be set when creating an animal"),

  body("addedBy")
    .not()
    .exists()
    .withMessage("Added by cannot be set manually"),

  validate,
];

// ==================================================
// Update animal validation
// ==================================================
// • Validates only the fields included in the request.
// • Requires at least one field to be provided.
// • Prevents changing protected fields.
// • Images must be managed through image endpoints.
// • Only Super Admin can change the Shelter ID.
// ==================================================
const updateAnimalValidation = [
  param("id")
    .exists({ checkFalsy: true })
    .withMessage("Animal ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid animal ID"),

  body().custom((value) => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error("At least one field is required for update");
    }

    return true;
  }),

  body("name")
    .optional()
    .isString()
    .withMessage("Animal name must be a string")
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Animal name must be between 2 and 50 characters"),

  body("age")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Animal age must be greater than or equal to 0")
    .toFloat(),

  body("ageUnit")
    .optional()
    .isIn(["months", "years"])
    .withMessage("Age unit must be months or years"),

  body("species")
    .optional()
    .isIn(["dog", "cat", "bird", "rabbit", "fish", "other"])
    .withMessage("Invalid animal species"),

  body("breed")
    .optional()
    .isString()
    .withMessage("Animal breed must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Animal breed cannot be empty")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Animal breed must not exceed 100 characters"),

  body("gender")
    .optional()
    .isIn(["male", "female"])
    .withMessage("Gender must be male or female"),

  body("size")
    .optional()
    .isIn(["small", "medium", "large"])
    .withMessage("Size must be small, medium, or large"),

  body("color")
    .optional()
    .isString()
    .withMessage("Animal color must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Animal color cannot be empty")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Animal color must not exceed 100 characters"),

  body("healthStatus")
    .optional()
    .isIn(["healthy", "needsCare", "specialNeeds", "underTreatment"])
    .withMessage("Invalid health status"),

  body("vaccinated")
    .optional()
    .isBoolean()
    .withMessage("Vaccinated must be true or false")
    .toBoolean(),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("shelterId")
    .optional()
    .isMongoId()
    .withMessage("Invalid shelter ID"),

  body("requirements")
    .optional()
    .isObject()
    .withMessage("Requirements must be an object"),

  body("requirements.homeType")
    .optional()
    .isIn(["apartment", "house", "farm", "any"])
    .withMessage("Home type must be apartment, house, farm, or any"),

  body("requirements.suitableForKids")
    .optional()
    .isBoolean()
    .withMessage("Suitable for kids must be true or false")
    .toBoolean(),

  body("requirements.goodWithOtherPets")
    .optional()
    .isBoolean()
    .withMessage("Good with other pets must be true or false")
    .toBoolean(),

  body("requirements.experienceLevel")
    .optional()
    .isIn(["beginner", "intermediate", "expert", "any"])
    .withMessage(
      "Experience level must be beginner, intermediate, expert, or any",
    ),

  body("requirements.dailyActivityLevel")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Daily activity level must be low, medium, or high"),

  body("requirements.ownerType")
    .optional()
    .isIn(["single", "family", "any"])
    .withMessage("Owner type must be single, family, or any"),

  body("requirements.hypoallergenic")
    .optional()
    .isBoolean()
    .withMessage("Hypoallergenic must be true or false")
    .toBoolean(),

  body("images")
    .not()
    .exists()
    .withMessage("Images must be managed through the animal image endpoints"),

  body("isActive")
    .not()
    .exists()
    .withMessage(
      "Animal active status must be changed through delete or restore endpoints",
    ),

  body("adoptionStatus")
    .not()
    .exists()
    .withMessage(
      "Animal adoption status must be changed through the adoption request process",
    ),

  body("addedBy")
    .not()
    .exists()
    .withMessage("Added by cannot be changed manually"),

  validate,
];

// ==================================================
// Get all animals validation
// ==================================================
// • Validates animal filtering query parameters.
// • Accepts only valid Boolean string values.
// • Validates filter values and Shelter ID.
// • The controller determines whether isActive
//   can be used based on the current user role.
// ==================================================
const getAllAnimalsValidation = [
  query("species")
    .optional()
    .isIn(["dog", "cat", "bird", "rabbit", "fish", "other"])
    .withMessage("Invalid animal species"),

  query("breed")
    .optional()
    .isString()
    .withMessage("Breed must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Breed cannot be empty")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Breed must not exceed 100 characters"),

  query("gender")
    .optional()
    .isIn(["male", "female"])
    .withMessage("Gender must be male or female"),

  query("size")
    .optional()
    .isIn(["small", "medium", "large"])
    .withMessage("Size must be small, medium, or large"),

  query("healthStatus")
    .optional()
    .isIn(["healthy", "needsCare", "specialNeeds", "underTreatment"])
    .withMessage("Invalid health status"),

  query("adoptionStatus")
    .optional()
    .isIn(["available", "pending", "adopted", "unavailable"])
    .withMessage("Invalid adoption status"),

  query("shelterId")
    .optional()
    .isMongoId()
    .withMessage("Invalid shelter ID"),

  query("vaccinated")
    .optional()
    .isIn(["true", "false"])
    .withMessage("Vaccinated must be true or false"),

  query("isActive")
    .optional()
    .isIn(["true", "false"])
    .withMessage("isActive must be true or false"),

  query("search")
    .optional()
    .isString()
    .withMessage("Search must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Search cannot be empty")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Search must not exceed 100 characters"),

  validate,
];

// ==================================================
// Get animal by ID validation
// ==================================================
// • Validates the Animal ID route parameter.
// ==================================================
const getAnimalByIdValidation = [
  param("id")
    .exists({ checkFalsy: true })
    .withMessage("Animal ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid animal ID"),

  validate,
];

// ==================================================
// Delete animal validation
// ==================================================
// • Validates the Animal ID before soft deletion.
// ==================================================
const removeAnimalValidation = [
  param("id")
    .exists({ checkFalsy: true })
    .withMessage("Animal ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid animal ID"),

  validate,
];

// ==================================================
// Restore animal validation
// ==================================================
// • Validates the Animal ID before restoration.
// ==================================================
const restoreAnimalValidation = [
  param("id")
    .exists({ checkFalsy: true })
    .withMessage("Animal ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid animal ID"),

  validate,
];

// ==================================================
// Add animal images validation
// ==================================================
// • Validates the Animal ID.
// • Uploaded files are validated by Multer
//   and the upload middleware.
// ==================================================
const addAnimalImagesValidation = [
  param("id")
    .exists({ checkFalsy: true })
    .withMessage("Animal ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid animal ID"),

  validate,
];

// ==================================================
// Replace animal image validation
// ==================================================
// • Validates the Animal ID.
// • Validates the embedded image ID.
// • The replacement image is validated by Multer.
// ==================================================
const replaceAnimalImageValidation = [
  param("id")
    .exists({ checkFalsy: true })
    .withMessage("Animal ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid animal ID"),

  param("imageId")
    .exists({ checkFalsy: true })
    .withMessage("Image ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid image ID"),

  validate,
];

// ==================================================
// Set primary animal image validation
// ==================================================
// • Validates the Animal ID.
// • Validates the image ID that becomes primary.
// ==================================================
const setPrimaryAnimalImageValidation = [
  param("id")
    .exists({ checkFalsy: true })
    .withMessage("Animal ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid animal ID"),

  param("imageId")
    .exists({ checkFalsy: true })
    .withMessage("Image ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid image ID"),

  validate,
];

// ==================================================
// Delete animal image validation
// ==================================================
// • Validates the Animal ID.
// • Validates the image ID before deletion.
// ==================================================
const deleteAnimalImageValidation = [
  param("id")
    .exists({ checkFalsy: true })
    .withMessage("Animal ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid animal ID"),

  param("imageId")
    .exists({ checkFalsy: true })
    .withMessage("Image ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid image ID"),

  validate,
];

// ==================================================
// Delete all animal images validation
// ==================================================
// • Validates the Animal ID before deleting
//   all images belonging to the animal.
// ==================================================
const deleteAllAnimalImagesValidation = [
  param("id")
    .exists({ checkFalsy: true })
    .withMessage("Animal ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid animal ID"),

  validate,
];

module.exports = {
  createAnimalValidation,
  updateAnimalValidation,
  getAllAnimalsValidation,
  getAnimalByIdValidation,
  removeAnimalValidation,
  restoreAnimalValidation,
  addAnimalImagesValidation,
  replaceAnimalImageValidation,
  setPrimaryAnimalImageValidation,
  deleteAnimalImageValidation,
  deleteAllAnimalImagesValidation,
};