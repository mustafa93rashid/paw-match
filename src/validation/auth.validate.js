const { body, param } = require("express-validator");
const validate = require("../middlewares/validate");
const User = require("../models/User");

const passwordRules = (field, label = "Password") =>
  body(field)
    .notEmpty()
    .withMessage(`${label} is required`)
    .bail()
    .isString()
    .withMessage(`${label} must be string`)
    .bail()
    .isLength({ max: 128 })
    .withMessage(`${label} must not exceed 128 characters`)
    .bail()
    .isStrongPassword({
      minLength: 8,
      minNumbers: 1,
      minUppercase: 1,
      minLowercase: 1,
      minSymbols: 1,
    })
    .withMessage(
      `${label} must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one symbol`,
    );

// ==================================================
// Signup validation
// ==================================================
const signupValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .bail()
    .isString()
    .withMessage("First name must be string")
    .bail()
    .isLength({ min: 2, max: 30 })
    .withMessage("First name must be between 2 and 30 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .bail()
    .isString()
    .withMessage("Last name must be string")
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
    .normalizeEmail()
    .custom(async (value) => {
      const userExists = await User.exists({
        email: value,
      });

      if (userExists) {
        throw new Error("This email already exists");
      }

      return true;
    }),

  passwordRules("password"),

  validate,
];

// ==================================================
// Verify signup validation
// ==================================================
const verifySignupValidation = [
  body("email")
    .exists()
    .withMessage("Email is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .bail()
    .isEmail()
    .withMessage("Invalid email format")
    .bail()
    .normalizeEmail(),

  body("verificationCode")
    .exists()
    .withMessage("Verification code is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Verification code cannot be empty")
    .bail()
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be exactly 6 digits")
    .bail()
    .isNumeric()
    .withMessage("Verification code must contain numbers only"),

  validate,
];

// ==================================================
// Sign in validation
// ==================================================
const signinValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email or password")
    .bail()
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Invalid email or password"),

  validate,
];

// ==================================================
// Change password validation
// ==================================================
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required")
    .bail()
    .isString()
    .withMessage("Current password must be string"),

  passwordRules("newPassword", "New password"),

  body("confirmNewPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match");
      }

      return true;
    }),

  validate,
];

// ==================================================
// Forgot password validation
// ==================================================
const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .normalizeEmail(),

  validate,
];

// ==================================================
// Reset password validation
// ==================================================
const resetPasswordValidation = [
  param("token")
    .trim()
    .notEmpty()
    .withMessage("Reset token is required"),

  passwordRules("newPassword", "New password"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error(
          "Password confirmation does not match the new password",
        );
      }

      return true;
    }),

  validate,
];

// ==================================================
// Request email update validation
// ==================================================
const requestEmailUpdateValidation = [
  body("newEmail")
    .exists()
    .withMessage("New email is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("New email cannot be empty")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const currentUserId = req.user?._id || req.user?.id;

      const emailExists = await User.exists({
        email: value,
        ...(currentUserId && {
          _id: {
            $ne: currentUserId,
          },
        }),
      });

      if (emailExists) {
        throw new Error("This email already exists");
      }

      const currentUser = currentUserId
        ? await User.findById(currentUserId).select("email")
        : null;

      if (currentUser && currentUser.email === value) {
        throw new Error(
          "New email must be different from current email",
        );
      }

      return true;
    }),

  validate,
];

// ==================================================
// Verify email update validation
// ==================================================
const verifyEmailUpdateValidation = [
  body("verificationCode")
    .exists()
    .withMessage("Verification code is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Verification code cannot be empty")
    .bail()
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be exactly 6 digits")
    .bail()
    .isNumeric()
    .withMessage("Verification code must contain numbers only"),

  validate,
];

// ==================================================
// Activate account validation
// ==================================================
const activateAccountValidation = [
  param("token")
    .trim()
    .notEmpty()
    .withMessage("Activation token is required"),

  passwordRules("newPassword", "New password"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error(
          "Password confirmation does not match the new password",
        );
      }

      return true;
    }),

  validate,
];

module.exports = {
  signupValidation,
  verifySignupValidation,
  signinValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  activateAccountValidation,
  requestEmailUpdateValidation,
  verifyEmailUpdateValidation,
};