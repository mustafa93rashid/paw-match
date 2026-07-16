const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const User = require("../models/User");

const updateProfileValidation = [
  body("firstName")
    .optional()     // if user doesn't update firstName, it won't throw an error, it's necessary
    .trim()
    .isString().withMessage("First name must be string").bail()
    .isLength({ min: 2, max: 30 }).withMessage("First name must be between 2 and 30 characters"),

  body("lastName")
    .optional()
    .trim()
    .isString().withMessage("Last name must be string").bail()
    .isLength({ min: 2, max: 30 }).withMessage("Last name must be between 2 and 30 characters"),

  body("dateOfBirth")
    .optional()
    .trim()
    .isISO8601().withMessage("Please provide a valid date format (YYYY-MM-DD)"),        // the format of the entered date is YYYY-MM-DD

  body("gender")
    .optional()
    .trim()
    .isString().withMessage("Gender must be string").bail()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be either male, female, or other"),

  body("phone")
    .optional()
    .trim()
    .isString().withMessage("Phone must be string"),        // in the User model phone is a string

  body("address")
    .optional()
    .trim()
    .isString().withMessage("Address must be string"),

  validate,
];

const updateUserRoleValidation = [
  body("role")
    .trim()
    .notEmpty().withMessage("Role is required").bail() 
    .isString().withMessage("Role must be string").bail()
    .isIn(["superadmin", "shelterEmployee", "vet", "adopter"])
    .withMessage("Role must be either superadmin, shelterEmployee, vet or adopter"),

  validate,
];

const updateStatusValidation = [
  body("isActive")
    .exists().withMessage("isActive field is required").bail()      // exists instead of notEmpty() because 'false' is a falsy value and would cause notEmpty to fail.
    .isBoolean().withMessage("isActive must be true or false"),

  validate,
];

const CreateUserByAdminValidation = [
  body("firstName")
    .trim()
    .notEmpty().withMessage("First name is required").bail()
    .isString().withMessage("First name must be string").bail()
    .isLength({ min: 2, max: 30 }).withMessage("First name must be between 2 and 30 characters"),

  body("lastName")
    .trim()
    .notEmpty().withMessage("Last name is required").bail()
    .isString().withMessage("Last name must be string").bail()
    .isLength({ min: 2, max: 30 }).withMessage("Last name must be between 2 and 30 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required").bail()
    .isEmail().withMessage("Please provide a valid email address").bail()
    .custom(async (val) => {        // check if the email already exists in the database
      const user = await User.findOne({ email: val.toLowerCase().trim() });
      if (user) {
        throw new Error("Email already exists");
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
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one symbol"),
    
  body("role")
    .trim()
    .notEmpty().withMessage("Role is required").bail()
    .isString().withMessage("Role must be string").bail()
    .isIn(["shelterEmployee", "vet", "adopter"]) 
    .withMessage("Invalid role. Allowed roles are: shelterEmployee, vet, adopter"),

  validate,
];

const updateAdopterProfileValidation = [
  body("homeType")
    .optional()
    .trim()
    .isString().withMessage("Home type must be string").bail()
    .isIn(["apartment", "house", "farm"]).withMessage("Home type must be either apartment, house, or farm"),

  body("hasKids")
    .optional()
    .isBoolean().withMessage("hasKids must be true or false"),

  body("hasOtherPets")
    .optional()
    .isBoolean().withMessage("hasOtherPets must be true or false"),

  body("experienceLevel")
    .optional()
    .trim()
    .isString().withMessage("Experience level must be string").bail()
    .isIn(["beginner", "intermediate", "expert"]).withMessage("Experience level must be either beginner, intermediate, or expert"),

  body("dailyActivityLevel")
    .optional()
    .trim()
    .isString().withMessage("Daily activity level must be string").bail()
    .isIn(["low", "medium", "high"]).withMessage("Daily activity level must be either low, medium, or high"),

  body("isAllergic")
    .optional()
    .isBoolean().withMessage("isAllergic must be true or false"),

  body("ownerType")
    .optional()
    .trim()
    .isString().withMessage("Owner type must be string").bail()
    .isIn(["single", "family"]).withMessage("Owner type must be either single or family"),

  validate,
];

const updateShelterEmployeeProfileValidation = [
  body("shelterId")
    .optional()     //not required because the shelter employee might stay in the same shelter
    .trim()
    .isMongoId().withMessage("Invalid Shelter ID format"), 

  body("position")
    .optional()
    .trim()
    .isString().withMessage("Position must be string"),

  body("employeeNumber")
    .optional()
    .trim()
    .isString().withMessage("Employee number must be string"),      // it's a string value in the ShelterEmployeeProfile model

//   body("hireDate")       // I'm not sure if hireDate should be updated.
//     .optional()
//     .trim()
//     .isISO8601().withMessage("Please provide a valid date format for hire date (YYYY-MM-DD)"), 

  validate,
];

const updateVetProfileValidation = [
  body("specialization")
    .optional()
    .trim()
    .isString().withMessage("Specialization must be string"),

  body("bio")
    .optional()
    .trim()
    .isString().withMessage("Bio must be string").bail()
    .isLength({ max: 1000 }).withMessage("Bio cannot exceed 1000 characters"),

  body("experienceYears")
    .optional()
    .isInt({ min: 0 }).withMessage("Experience years must be a valid positive number"),

  body("availableDays")
    .optional()
    .isArray().withMessage("Available days must be an array").bail()
    .custom((days) => {
      const validDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const isValid = days.every(day => validDays.includes(day));       // check if days in the array is valid not another words
      if (!isValid) {
        throw new Error("Invalid day input the allowed days are: sunday, monday, tuesday, wednesday, thursday, friday, saturday");
      }
      return true;
    }),

  body("consultationTypes")
    .optional()
    .isArray().withMessage("Consultation types must be an array").bail()
    .custom((types) => {
      const validTypes = ["vetConsultation", "behaviorTraining"];
      const isValid = types.every(type => validTypes.includes(type));
      if (!isValid) {
        throw new Error("Invalid consultation type. Allowed: vetConsultation, behaviorTraining");
      }
      return true;
    }),

  validate,
];





module.exports = {
  updateProfileValidation,
  updateUserRoleValidation,
  updateStatusValidation,
  CreateUserByAdminValidation,
  updateAdopterProfileValidation,
  updateShelterEmployeeProfileValidation,
  updateVetProfileValidation,
};