const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const User = require("../models/User");

const signupValidation = [
  body("firstName")
    .trim()
    .notEmpty().withMessage("First name is required").bail()
    .isString().withMessage("First name must be string").bail()
    .isLength({ min: 2, max: 30 })
    .withMessage("First name must be between 2 and 30 characters"),

  body("lastName")
    .trim()
    .notEmpty().withMessage("Last name is required").bail()
    .isString().withMessage("Last name must be string").bail()
    .isLength({ min: 2, max: 30 })
    .withMessage("Last name must be between 2 and 30 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required").bail()
    .isEmail().withMessage("Please provide a valid email address").bail()
    .custom(async (val) => {
      const user = await User.findOne({ email: val });
      if (user) {
        throw new Error("This email already exists");
      }
      return true;
    }),

  body("password")
    .notEmpty().withMessage("Password is required").bail()
    .isString().withMessage("Password must be string").bail()
    .isStrongPassword({
      minLength: 8,
      minNumbers: 1,
      minUppercase: 1,
      minLowercase: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one symbol"
    ),

  validate,
];

const signinValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required").bail()
    .isEmail().withMessage("Invalid email or password"),

  body("password")
    .notEmpty().withMessage("Password is required").bail()
    .isString().withMessage("Invalid email or password"),

  validate,
];

module.exports = {
  signupValidation,
  signinValidation,
};