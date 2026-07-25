const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");

// ==================================================
// Reusable values
// ==================================================

const USER_ROLES = ["superadmin", "shelterEmployee", "vet", "adopter"];

const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "phone",
  "address",
];

const ADMIN_CREATE_USER_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "password",
  "role",
];

const ADOPTER_PROFILE_FIELDS = [
  "homeType",
  "hasKids",
  "hasOtherPets",
  "experienceLevel",
  "dailyActivityLevel",
  "isAllergic",
  "ownerType",
];

const SHELTER_EMPLOYEE_WORK_FIELDS = [
  "position",
  "employeeNumber",
  "hireDate",
];

const VET_PROFILE_FIELDS = [
  "specialization",
  "bio",
  "experienceYears",
  "availableDays",
  "consultationTypes",
];

// ==================================================
// Validate MongoDB ID
// ==================================================

const validateUserId = param("id")
  .trim()
  .notEmpty()
  .withMessage("User ID is required")
  .bail()
  .isMongoId()
  .withMessage("Invalid user ID format");

// ==================================================
// Allow only specific body fields
// ==================================================

const allowOnlyFields = (allowedFields) =>
  body().custom((_, { req }) => {
    const receivedFields = Object.keys(req.body);

    const invalidFields = receivedFields.filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      throw new Error(
        `Invalid fields provided: ${invalidFields.join(", ")}`,
      );
    }

    return true;
  });

// ==================================================
// Require at least one field
// ==================================================

const requireAtLeastOneField = (allowedFields) =>
  body().custom((_, { req }) => {
    const hasValidField = allowedFields.some(
      (field) => req.body[field] !== undefined,
    );

    if (!hasValidField) {
      throw new Error("At least one valid field must be provided");
    }

    return true;
  });

// ==================================================
// Update current user profile validation
// ==================================================

const updateProfileValidation = [
  allowOnlyFields(PROFILE_FIELDS),

  requireAtLeastOneField(PROFILE_FIELDS),

  body("firstName")
    .optional()
    .trim()
    .isString()
    .withMessage("First name must be a string")
    .bail()
    .isLength({ min: 2, max: 30 })
    .withMessage("First name must be between 2 and 30 characters"),

  body("lastName")
    .optional()
    .trim()
    .isString()
    .withMessage("Last name must be a string")
    .bail()
    .isLength({ min: 2, max: 30 })
    .withMessage("Last name must be between 2 and 30 characters"),

  body("dateOfBirth")
    .optional()
    .trim()
    .isISO8601({ strict: true })
    .withMessage("Date of birth must use the YYYY-MM-DD format")
    .bail()
    .custom((value) => {
      const dateOfBirth = new Date(value);
      const currentDate = new Date();

      if (dateOfBirth > currentDate) {
        throw new Error("Date of birth cannot be in the future");
      }

      return true;
    }),

  body("gender")
    .optional()
    .trim()
    .isString()
    .withMessage("Gender must be a string")
    .bail()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be either male, female, or other"),

  body("phone")
    .optional()
    .trim()
    .isString()
    .withMessage("Phone must be a string")
    .bail()
    .isLength({ min: 7, max: 20 })
    .withMessage("Phone must be between 7 and 20 characters"),

  body("address")
    .optional()
    .trim()
    .isString()
    .withMessage("Address must be a string")
    .bail()
    .isLength({ min: 3, max: 300 })
    .withMessage("Address must be between 3 and 300 characters"),

  validate,
];

// ==================================================
// Update user role validation
// ==================================================

const updateUserRoleValidation = [
  validateUserId,

  allowOnlyFields(["role"]),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .bail()
    .isString()
    .withMessage("Role must be a string")
    .bail()
    .isIn(USER_ROLES)
    .withMessage(
      "Role must be either shelterEmployee, vet, or adopter",
    ),

  validate,
];

// ==================================================
// Update user status validation
// ==================================================

const updateStatusValidation = [
  validateUserId,

  allowOnlyFields(["isActive"]),

  body("isActive")
    .exists()
    .withMessage("isActive field is required")
    .bail()
    .isBoolean({ strict: true })
    .withMessage("isActive must be true or false"),

  validate,
];

// ==================================================
// Create user by admin validation
// ==================================================

const createUserByAdminValidation = [
  allowOnlyFields(ADMIN_CREATE_USER_FIELDS),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .bail()
    .isString()
    .withMessage("First name must be a string")
    .bail()
    .isLength({ min: 2, max: 30 })
    .withMessage("First name must be between 2 and 30 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .bail()
    .isString()
    .withMessage("Last name must be a string")
    .bail()
    .isLength({ min: 2, max: 30 })
    .withMessage("Last name must be between 2 and 30 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .customSanitizer((value) => value.toLowerCase()),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Password must be a string")
    .bail()
    .isStrongPassword({
      minLength: 8,
      minNumbers: 1,
      minUppercase: 1,
      minLowercase: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one symbol",
    ),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .bail()
    .isString()
    .withMessage("Role must be a string")
    .bail()
    .isIn(USER_ROLES)
    .withMessage(
      "Invalid role. Allowed roles are: shelterEmployee, vet, adopter",
    ),

  validate,
];

module.exports = {
  updateProfileValidation,
  updateUserRoleValidation,
  updateStatusValidation,
  createUserByAdminValidation,
};