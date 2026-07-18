const { body, param } = require("express-validator");
const validate = require("../middlewares/validate");

// ==================================================
// Update shelter employee work data validation
// ==================================================
const updateEmployeeWorkDataValidation = [
  // Validate the User ID
  param("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID"),

  // Validate the employee position
  body("position")
    .optional()
    .isIn(["Manager", "Employee"])
    .withMessage("Position must be either Manager or Employee"),

  // Validate the employee number
  body("employeeNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Employee number cannot be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("Employee number must be between 2 and 50 characters"),

  // Validate the employee hire date
  body("hireDate")
    .optional()
    .isISO8601()
    .withMessage("Hire date must be a valid date"),

  // Ensure at least one employment field is provided
  body().custom((value) => {
    const allowedFields = ["position", "employeeNumber", "hireDate"];

    const hasValidField = allowedFields.some(
      (field) => value[field] !== undefined,
    );

    if (!hasValidField) {
      throw new Error("At least one employment field must be provided");
    }

    return true;
  }),

  validate,
];

// ==================================================
// Get shelter employee profile by User ID validation
// ==================================================
const getShelterEmployeeByUserIdValidation = [
  param("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID"),

  validate,
];

module.exports = {
  updateEmployeeWorkDataValidation,
  getShelterEmployeeByUserIdValidation,
};