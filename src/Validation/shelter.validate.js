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

const verificationStatuses = ["pending", "approved", "rejected"];

//============================================================
// Reusable Validation Rules
//============================================================

const shelterIdValidation = param("id")
  .notEmpty()
  .withMessage("Shelter ID is required")
  .bail()
  .isMongoId()
  .withMessage("Invalid shelter ID");

const employeeIdParamValidation = param("employeeId")
  .notEmpty()
  .withMessage("Employee ID is required")
  .bail()
  .isMongoId()
  .withMessage("Invalid employee ID");

const coordinatesPairValidation = body().custom((_, { req }) => {
  const hasLongitude = req.body.longitude !== undefined;
  const hasLatitude = req.body.latitude !== undefined;

  if (hasLongitude !== hasLatitude) {
    throw new Error("Longitude and latitude must be provided together");
  }

  return true;
});

const operatingHoursValidation = [
  body("operatingHours")
    .optional()
    .isObject()
    .withMessage("Operating hours must be an object"),

  body("operatingHours.open")
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Opening time must use HH:mm format"),

  body("operatingHours.close")
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Closing time must use HH:mm format"),
];

const socialLinksValidation = [
  body("socialLinks")
    .optional()
    .isObject()
    .withMessage("Social links must be an object"),

  body("socialLinks.facebook")
    .optional({ nullable: true, checkFalsy: true })
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage("Facebook link must be a valid URL"),

  body("socialLinks.instagram")
    .optional({ nullable: true, checkFalsy: true })
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage("Instagram link must be a valid URL"),

  body("socialLinks.website")
    .optional({ nullable: true, checkFalsy: true })
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage("Website link must be a valid URL"),
];

//============================================================
// Create Shelter Validation
//============================================================
//
// • Validates the required shelter information.
//
// • Verifies email, phone, images, and social links.
//
// • Validates shelter capacity and supported species.
//
// • Restricts geographic coordinates to valid ranges.
//
// • Requires longitude and latitude to be provided together.
//
// • Runs the validation result middleware after all rules.
//
//============================================================

const createShelterValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Shelter name is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shelter name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Shelter email is required")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid shelter email")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Shelter phone is required")
    .bail()
    .isLength({ min: 7, max: 20 })
    .withMessage("Shelter phone must be between 7 and 20 characters")
    .bail()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Shelter phone contains invalid characters"),


  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Shelter address is required")
    .bail()
    .isLength({ min: 3, max: 300 })
    .withMessage("Shelter address must be between 3 and 300 characters"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("Shelter city is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shelter city must be between 2 and 100 characters"),

  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90")
    .toFloat(),

  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180")
    .toFloat(),

  coordinatesPairValidation,

  body("supportedSpecies")
    .optional()
    .isArray()
    .withMessage("Supported species must be an array"),

  body("supportedSpecies.*")
    .optional()
    .isIn(supportedSpecies)
    .withMessage(
      `Supported species must be one of: ${supportedSpecies.join(", ")}`,
    ),

  body("capacity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Capacity must be a non-negative integer")
    .toInt(),

  ...operatingHoursValidation,
  ...socialLinksValidation,

  validate,
];

//============================================================
// Update Shelter Validation
//============================================================
//
// • Validates the shelter ID before updating.
//
// • Allows partial updates to editable shelter information.
//
// • Prevents submitting a request without editable fields.
//
// • Applies the same protections used during creation.
//
// • Requires longitude and latitude to be updated together.
//
// • Runs the validation result middleware after all rules.
//
//============================================================

const updateShelterValidation = [
  shelterIdValidation,

  body().custom((value) => {
    const allowedFields = [
      "name",
      "email",
      "phone",
      // "logo",
      // "images",
      "description",
      "address",
      "city",
      "latitude",
      "longitude",
      "supportedSpecies",
      "capacity",
      "operatingHours",
      "socialLinks",
    ];

    const submittedFields = Object.keys(value);

    const containsEditableField = submittedFields.some((field) =>
      allowedFields.includes(field),
    );

    if (!containsEditableField) {
      throw new Error("At least one editable shelter field is required");
    }

    return true;
  }),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Shelter name cannot be empty")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shelter name must be between 2 and 100 characters"),

  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Shelter email cannot be empty")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid shelter email")
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Shelter phone cannot be empty")
    .bail()
    .isLength({ min: 7, max: 20 })
    .withMessage("Shelter phone must be between 7 and 20 characters")
    .bail()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Shelter phone contains invalid characters"),

  body("logo")
    .optional({ nullable: true, checkFalsy: true })
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage("Logo must be a valid URL"),

  body("images")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Images must be an array containing at most 10 items"),

  body("images.*")
    .optional()
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage("Each shelter image must be a valid URL"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Shelter address cannot be empty")
    .bail()
    .isLength({ min: 3, max: 300 })
    .withMessage("Shelter address must be between 3 and 300 characters"),

  body("city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Shelter city cannot be empty")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shelter city must be between 2 and 100 characters"),

  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90")
    .toFloat(),

  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180")
    .toFloat(),

  coordinatesPairValidation,

  body("supportedSpecies")
    .optional()
    .isArray()
    .withMessage("Supported species must be an array"),

  body("supportedSpecies.*")
    .optional()
    .isIn(supportedSpecies)
    .withMessage(
      `Supported species must be one of: ${supportedSpecies.join(", ")}`,
    ),

  body("capacity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Capacity must be a non-negative integer")
    .toInt(),

  ...operatingHoursValidation,
  ...socialLinksValidation,

  validate,
];

//============================================================
// Public Shelter Filters Validation
//============================================================

const getPublicSheltersValidation = [
  query("city")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("City cannot exceed 100 characters"),

  query("species")
    .optional()
    .isIn(supportedSpecies)
    .withMessage(`Species must be one of: ${supportedSpecies.join(", ")}`),

  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search text cannot exceed 100 characters"),

  validate,
];

//============================================================
// Admin Shelter Filters Validation
//============================================================

const getAllSheltersValidation = [
  query("verificationStatus")
    .optional()
    .isIn(verificationStatuses)
    .withMessage(
      `Verification status must be one of: ${verificationStatuses.join(", ")}`,
    ),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false")
    .toBoolean(),

  query("city")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("City cannot exceed 100 characters"),

  validate,
];

//============================================================
// Get Shelter by ID Validation
//============================================================

const getShelterByIdValidation = [
  shelterIdValidation,
  validate,
];

//============================================================
// Approve Shelter Validation
//============================================================

const approveShelterValidation = [
  shelterIdValidation,
  validate,
];

//============================================================
// Reject Shelter Validation
//============================================================

const rejectShelterValidation = [
  shelterIdValidation,

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Rejection reason is required")
    .bail()
    .isLength({ min: 3, max: 1000 })
    .withMessage("Rejection reason must be between 3 and 1000 characters"),

  validate,
];

//============================================================
// Toggle Shelter Status Validation
//============================================================

const toggleShelterStatusValidation = [
  shelterIdValidation,
  validate,
];

//============================================================
// Permanently Delete Shelter Validation
//============================================================

const permanentlyDeleteShelterValidation = [
  shelterIdValidation,
  validate,
];

//============================================================
// Add Employee Validation
//============================================================

const addEmployeeValidation = [
  shelterIdValidation,

  body("employeeId")
    .notEmpty()
    .withMessage("Employee ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid employee ID"),

  validate,
];

//============================================================
// Remove Employee Validation
//============================================================

const removeEmployeeValidation = [
  shelterIdValidation,
  employeeIdParamValidation,

  param("employeeId").custom((employeeId, { req }) => {
    if (
      req.user?.role === "shelterEmployee" &&
      String(req.user._id || req.user.id) === String(employeeId)
    ) {
      throw new Error("You cannot remove yourself from the shelter");
    }

    return true;
  }),

  validate,
];

//============================================================
// Nearest Shelters Validation
//============================================================
//
// • Requires longitude, latitude, and search distance.
//
// • Ensures all values contain valid numbers.
//
// • Restricts coordinates to valid geographic ranges.
//
// • Requires the distance to be greater than zero.
//
// • Converts the accepted values to numbers.
//
// • Runs the validation result middleware after all rules.
//
//============================================================

const getNearestSheltersValidation = [
  query("lng")
    .notEmpty()
    .withMessage("Longitude is required")
    .bail()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180")
    .toFloat(),

  query("lat")
    .notEmpty()
    .withMessage("Latitude is required")
    .bail()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90")
    .toFloat(),

  query("distance")
    .notEmpty()
    .withMessage("Distance is required")
    .bail()
    .isFloat({ gt: 0 })
    .withMessage("Distance must be greater than zero")
    .toFloat(),

  validate,
];

module.exports = {
  createShelterValidation,
  updateShelterValidation,
  getPublicSheltersValidation,
  getAllSheltersValidation,
  getShelterByIdValidation,
  approveShelterValidation,
  rejectShelterValidation,
  toggleShelterStatusValidation,
  permanentlyDeleteShelterValidation,
  addEmployeeValidation,
  removeEmployeeValidation,
  getNearestSheltersValidation,
};