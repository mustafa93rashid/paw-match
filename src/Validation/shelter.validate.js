const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const Shelter = require("../models/Shelter");

const createShelterValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Shelter name is required")
    .bail()
    .isString()
    .withMessage("Shelter name must be a string")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shelter name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .custom(async (val) => {
      const existingShelter = await Shelter.findOne({
        email: val.toLowerCase().trim(),
      });
      if (existingShelter) {
        throw new Error("Shelter email already exists");
      }
      return true;
    }),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .bail()
    .isMobilePhone("any").withMessage("Please provide a valid mobile phone number"),

  body("logo")
    .optional()
    .trim()
    .isURL()
    .withMessage("Logo must be a valid URL link"),

  body("images").optional().isArray().withMessage("Images must be an array"),

  body("images.*") //check each image in the array
    .optional()
    .trim()
    .isURL()
    .withMessage("Each image must be a valid URL link"), // Check if each image in the array is a valid URL and string

  body("description")
    .optional()
    .trim()
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .bail()
    .isString()
    .withMessage("Address must be a string"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .bail()
    .isString()
    .withMessage("City must be a string"),

  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be a valid number between -90 and 90"),

  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be a valid number between -180 and 180"),

  body("supportedSpecies")
    .optional()
    .isArray().withMessage("Supported species must be an array").bail()
    .custom((species) => {
      const validSpecies = ["dog", "cat", "bird", "rabbit", "fish", "other"];

      const isValid = species.every((item) => validSpecies.includes(item));

      if (!isValid) {
        throw new Error("Invalid species specified. Allowed: dog, cat, bird, rabbit, fish, other");
      }
      return true;
    }),

  body("capacity")
    .optional()
    .isInt({ min: 0 }).withMessage("Capacity cannot be negative"),

  body("operatingHours")
    .optional()
    .isObject().withMessage("Operating hours must be an object").bail(),

  body("operatingHours.open")
    .optional()
    .trim()
    .isString().withMessage("Opening time must be a string"),

  body("operatingHours.close")
    .optional()
    .trim()
    .isString().withMessage("Closing time must be a string"),

  body("socialLinks")
    .optional()
    .isObject().withMessage("Social links must be an object"),

  body("socialLinks.facebook")
    .optional()
    .trim()
    .isURL().withMessage("Facebook link must be a valid URL"),

  body("socialLinks.instagram")
    .optional()
    .trim()
    .isURL().withMessage("Instagram link must be a valid URL"),
    
  body("socialLinks.website")
    .optional()
    .trim()
    .isURL().withMessage("Website link must be a valid URL"),

  validate,
];

const updateShelterValidation = [

  body("name")
    .optional()
    .trim()
    .isString().withMessage("Shelter name must be a string").bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shelter name must be between 2 and 100 characters"),

  body("phone")
    .optional()
    .trim()
    .isMobilePhone("any").withMessage("Please provide a valid mobile phone number"),

  body("logo")
    .optional()
    .trim()
    .isURL().withMessage("Logo must be a valid URL link"),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),

  body("images.*")
    .optional()
    .trim()
    .isURL().withMessage("Each image must be a valid URL link"),

  body("description")
    .optional()
    .trim()
    .isString().withMessage("Description must be a string").bail()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("address")
    .optional()
    .trim()
    .isString().withMessage("Address must be a string"),

  body("city")
    .optional()
    .trim()
    .isString().withMessage("City must be a string"),

  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage("Latitude must be a valid number between -90 and 90"),

  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be a valid number between -180 and 180"),

  body("supportedSpecies")
    .optional()
    .isArray().withMessage("Supported species must be an array").bail()
    .custom((species) => {
      const validSpecies = ["dog", "cat", "bird", "rabbit", "fish", "other"];

      const isValid = species.every((item) => validSpecies.includes(item));

      if (!isValid) {
        throw new Error("Invalid species specified. Allowed: dog, cat, bird, rabbit, fish, other");
      }
      return true;
    }),

  body("capacity")
    .optional()
    .isInt({ min: 0 }).withMessage("Capacity cannot be negative"),

  body("operatingHours")
    .optional()
    .isObject().withMessage("Operating hours must be an object"),

  body("operatingHours.open")
    .optional()
    .trim()
    .isString().withMessage("Opening time must be a string"),

  body("operatingHours.close")
    .optional()
    .trim()
    .isString().withMessage("Closing time must be a string"),

    body("socialLinks")
    .optional()
    .isObject().withMessage("Social links must be an object"),

  body("socialLinks.facebook")
    .optional()
    .trim()
    .isURL().withMessage("Facebook link must be a valid URL"),

  body("socialLinks.instagram")
    .optional()
    .trim()
    .isURL().withMessage("Instagram link must be a valid URL"),

  body("socialLinks.website")
    .optional()
    .trim()
    .isURL().withMessage("Website link must be a valid URL"),

  body("email")
    .optional()
    .trim()
    .isEmail().withMessage("Please provide a valid email address").bail()
    .custom(async (val, { req }) => {
      const existingShelter = await Shelter.findOne({ email: val });
      if (existingShelter && existingShelter._id.toString() !== req.params.id) {
        throw new Error("Shelter email already exists");
      }
      return true;
    }),

  validate,
];

const rejectShelterValidation = [
  body("reason")
    .trim()
    .notEmpty().withMessage("Rejection reason is required").bail()
    .isString().withMessage("Rejection reason must be a string"),

  validate,
];



const addEmployeeValidation = [
  body("employeeId") 
    .trim()
    .notEmpty()
    .withMessage("Employee ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid Employee ID format"), 

  validate,
];

module.exports = {
  createShelterValidation,
  updateShelterValidation,
  rejectShelterValidation,
  addEmployeeValidation,
};
