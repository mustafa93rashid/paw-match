const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate");

const supportedSpecies = ["dog", "cat", "bird", "rabbit", "fish", "other"];

const availableDays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const consultationTypes = ["vetConsultation", "behaviorTraining"];

const applicationTypes = ["shelterManager", "vet"];

const applicationStatuses = ["pendingVerification", "pending", "approved", "rejected"];

// ==================================================
// Reusable Validation Rules
// ==================================================

// Rejects any top-level body field not in the allow-list (400) — a public
// endpoint must never silently accept (and ignore) fields like `role` or
// `status` that would otherwise look like they were honored.
const allowOnlyFields = (allowedFields) =>
  body().custom((_, { req }) => {
    const invalidFields = Object.keys(req.body).filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      throw new Error(`Invalid fields provided: ${invalidFields.join(", ")}`);
    }

    return true;
  });

// Same idea, scoped to a nested object (shelterData / vetData) — nested
// applicant-controlled data must never be trusted wholesale.
const allowOnlyNestedFields = (parentField, allowedFields) =>
  body(parentField).custom((value) => {
    if (value === undefined) return true;

    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(`${parentField} must be an object`);
    }

    const invalidFields = Object.keys(value).filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      throw new Error(
        `Invalid fields provided in ${parentField}: ${invalidFields.join(", ")}`,
      );
    }

    return true;
  });

const applicationIdValidation = param("id")
  .notEmpty()
  .withMessage("Application ID is required")
  .bail()
  .isMongoId()
  .withMessage("Invalid application ID");

const emailFieldValidation = body("email")
  .trim()
  .notEmpty()
  .withMessage("Email is required")
  .bail()
  .isEmail()
  .withMessage("Please provide a valid email address")
  .bail()
  .normalizeEmail();

const coordinatesPairValidation = body().custom((_, { req }) => {
  const shelterData = req.body.shelterData || {};

  const hasLongitude = shelterData.longitude !== undefined;
  const hasLatitude = shelterData.latitude !== undefined;

  if (hasLongitude !== hasLatitude) {
    throw new Error("shelterData.longitude and shelterData.latitude must be provided together");
  }

  return true;
});

const SHELTER_DATA_FIELDS = [
  "name",
  "email",
  "phone",
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

const VET_DATA_FIELDS = [
  "specialization",
  "bio",
  "experienceYears",
  "availableDays",
  "consultationTypes",
];

/**
 * Shared by submitApplicationValidation and updateApplicationValidation —
 * `condition` decides when name/email/phone/address/city become required:
 * submit requires them when applicationType is "shelterManager" (present in
 * the same body); update has no applicationType in its body at all (not
 * editable), so it requires them whenever shelterData is provided — the
 * edit form always resends the full object, same full-object convention as
 * every other form in this app (Animal, Shelter, ...).
 */
const buildShelterDataRules = (condition) => [
  body("shelterData.name")
    .if(condition)
    .trim()
    .notEmpty()
    .withMessage("Shelter name is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shelter name must be between 2 and 100 characters"),

  body("shelterData.email")
    .if(condition)
    .trim()
    .notEmpty()
    .withMessage("Shelter email is required")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid shelter email")
    .normalizeEmail(),

  body("shelterData.phone")
    .if(condition)
    .trim()
    .notEmpty()
    .withMessage("Shelter phone is required")
    .bail()
    .isLength({ min: 7, max: 20 })
    .withMessage("Shelter phone must be between 7 and 20 characters")
    .bail()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Shelter phone contains invalid characters"),

  body("shelterData.description")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Shelter description cannot exceed 2000 characters"),

  body("shelterData.address")
    .if(condition)
    .trim()
    .notEmpty()
    .withMessage("Shelter address is required")
    .bail()
    .isLength({ min: 3, max: 300 })
    .withMessage("Shelter address must be between 3 and 300 characters"),

  body("shelterData.city")
    .if(condition)
    .trim()
    .notEmpty()
    .withMessage("Shelter city is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shelter city must be between 2 and 100 characters"),

  body("shelterData.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90")
    .toFloat(),

  body("shelterData.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180")
    .toFloat(),

  body("shelterData.supportedSpecies")
    .optional()
    .isArray()
    .withMessage("Supported species must be an array"),

  body("shelterData.supportedSpecies.*")
    .optional()
    .isIn(supportedSpecies)
    .withMessage(`Supported species must be one of: ${supportedSpecies.join(", ")}`),

  body("shelterData.capacity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Capacity must be a non-negative integer")
    .toInt(),

  body("shelterData.operatingHours")
    .optional()
    .isObject()
    .withMessage("Operating hours must be an object"),

  body("shelterData.operatingHours.open")
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Opening time must use HH:mm format"),

  body("shelterData.operatingHours.close")
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Closing time must use HH:mm format"),

  body("shelterData.socialLinks")
    .optional()
    .isObject()
    .withMessage("Social links must be an object"),

  body("shelterData.socialLinks.facebook")
    .optional({ nullable: true, checkFalsy: true })
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Facebook link must be a valid URL"),

  body("shelterData.socialLinks.instagram")
    .optional({ nullable: true, checkFalsy: true })
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Instagram link must be a valid URL"),

  body("shelterData.socialLinks.website")
    .optional({ nullable: true, checkFalsy: true })
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Website link must be a valid URL"),
];

/** None of VetProfile's fields are hard-required at the application-data level (mirrors VetProfile.js's own schema defaults) — fully shared as-is between submit and update, no condition parameter needed. */
const vetDataRules = [
  body("vetData.specialization")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Specialization cannot exceed 200 characters"),

  body("vetData.bio")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Bio cannot exceed 1000 characters"),

  body("vetData.experienceYears")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Years of experience must be a non-negative integer")
    .toInt(),

  body("vetData.availableDays")
    .optional()
    .isArray()
    .withMessage("Available days must be an array"),

  body("vetData.availableDays.*")
    .optional()
    .isIn(availableDays)
    .withMessage(`Available days must be one of: ${availableDays.join(", ")}`),

  body("vetData.consultationTypes")
    .optional()
    .isArray()
    .withMessage("Consultation types must be an array"),

  body("vetData.consultationTypes.*")
    .optional()
    .isIn(consultationTypes)
    .withMessage(`Consultation types must be one of: ${consultationTypes.join(", ")}`),
];

// ==================================================
// Submit Application Validation
// ==================================================
//
// • Shared applicant fields are always required.
// • applicationType is validated against a strict allow-list — never
//   trusted to imply a User role by itself.
// • shelterData is required (and validated field-by-field) only for
//   applicationType "shelterManager"; vetData only for "vet". Neither
//   nested object is ever trusted without its own explicit rules.
// • The applicant can never submit position, role, status, or any
//   administrative field — allowOnlyFields rejects anything else outright.
//
// ==================================================

const SUBMIT_APPLICATION_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "address",
  "dateOfBirth",
  "gender",
  "applicationType",
  "shelterData",
  "vetData",
];

const submitApplicationValidation = [
  allowOnlyFields(SUBMIT_APPLICATION_FIELDS),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .bail()
    .isLength({ min: 2, max: 30 })
    .withMessage("First name must be between 2 and 30 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .bail()
    .isLength({ min: 2, max: 30 })
    .withMessage("Last name must be between 2 and 30 characters"),

  emailFieldValidation,

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone is required")
    .bail()
    .isLength({ min: 7, max: 20 })
    .withMessage("Phone must be between 7 and 20 characters")
    .bail()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Phone contains invalid characters"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .bail()
    .isLength({ min: 3, max: 300 })
    .withMessage("Address must be between 3 and 300 characters"),

  body("dateOfBirth")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Date of birth must be a valid date")
    .toDate(),

  body("gender")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(["male", "female"])
    .withMessage("Gender must be male or female"),

  body("applicationType")
    .trim()
    .notEmpty()
    .withMessage("Application type is required")
    .bail()
    .isIn(applicationTypes)
    .withMessage(`Application type must be one of: ${applicationTypes.join(", ")}`),

  // ---- shelterData (applicationType === "shelterManager") ----
  allowOnlyNestedFields("shelterData", SHELTER_DATA_FIELDS),

  body("shelterData")
    .custom((value, { req }) => {
      if (req.body.applicationType === "shelterManager" && (!value || typeof value !== "object")) {
        throw new Error("shelterData is required for a shelter manager application");
      }

      if (req.body.applicationType !== "shelterManager" && value !== undefined) {
        throw new Error("shelterData is only accepted for a shelter manager application");
      }

      return true;
    }),

  ...buildShelterDataRules(body("applicationType").equals("shelterManager")),
  coordinatesPairValidation,

  // ---- vetData (applicationType === "vet") ----
  allowOnlyNestedFields("vetData", VET_DATA_FIELDS),

  body("vetData")
    .custom((value, { req }) => {
      if (req.body.applicationType === "vet" && (!value || typeof value !== "object")) {
        throw new Error("vetData is required for a veterinarian application");
      }

      if (req.body.applicationType !== "vet" && value !== undefined) {
        throw new Error("vetData is only accepted for a veterinarian application");
      }

      return true;
    }),

  ...vetDataRules,

  validate,
];

// ==================================================
// Verify Application Validation
// ==================================================
const verifyApplicationValidation = [
  emailFieldValidation,

  body("verificationCode")
    .exists()
    .withMessage("Verification code is required")
    .bail()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be exactly 6 digits")
    .bail()
    .isNumeric()
    .withMessage("Verification code must contain numbers only"),

  validate,
];

// ==================================================
// Resend Verification Code Validation
// ==================================================
const resendVerificationValidation = [emailFieldValidation, validate];

// ==================================================
// Resend Activation Email Validation
// ==================================================
const resendActivationValidation = [emailFieldValidation, validate];

// ==================================================
// List Applications Validation (Super Admin)
// ==================================================
const listApplicationsValidation = [
  query("applicationType")
    .optional()
    .isIn(applicationTypes)
    .withMessage(`Application type must be one of: ${applicationTypes.join(", ")}`),

  query("status")
    .optional()
    .isIn(applicationStatuses)
    .withMessage(`Status must be one of: ${applicationStatuses.join(", ")}`),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Search term cannot exceed 200 characters"),

  validate,
];

// ==================================================
// Get / Approve Application Validation
// ==================================================
const getApplicationValidation = [applicationIdValidation, validate];

const approveApplicationValidation = [applicationIdValidation, validate];

// ==================================================
// Reject Application Validation
// ==================================================
const rejectApplicationValidation = [
  applicationIdValidation,

  allowOnlyFields(["reason"]),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Rejection reason is required")
    .bail()
    .isLength({ max: 1000 })
    .withMessage("Rejection reason cannot exceed 1000 characters"),

  validate,
];

// ==================================================
// Update Application Validation (Super Admin, status "pending" only)
// ==================================================
//
// • Only business fields are editable: phone/address (shared), plus
//   shelterData or vetData — never email, applicationType, status, or any
//   verification/approval field (those simply aren't in the allow-list).
// • Neither applicationType nor the application's current type is known to
//   this validator (it isn't sent in the body — see buildShelterDataRules'
//   doc comment) — the cross-check that shelterData/vetData actually
//   matches the target application's real applicationType happens in the
//   controller, which has the existing document to compare against.
// • Every field is validated with the exact same rules as submission.
//
// ==================================================

const UPDATE_APPLICATION_FIELDS = ["phone", "address", "shelterData", "vetData"];

const updateApplicationValidation = [
  applicationIdValidation,

  allowOnlyFields(UPDATE_APPLICATION_FIELDS),

  body().custom((_, { req }) => {
    if (req.body.shelterData !== undefined && req.body.vetData !== undefined) {
      throw new Error("An application can only have shelterData or vetData, not both");
    }

    return true;
  }),

  body("phone")
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage("Phone must be between 7 and 20 characters")
    .bail()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Phone contains invalid characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ min: 3, max: 300 })
    .withMessage("Address must be between 3 and 300 characters"),

  allowOnlyNestedFields("shelterData", SHELTER_DATA_FIELDS),
  ...buildShelterDataRules(body("shelterData").exists()),
  coordinatesPairValidation,

  allowOnlyNestedFields("vetData", VET_DATA_FIELDS),
  ...vetDataRules,

  validate,
];

module.exports = {
  submitApplicationValidation,
  verifyApplicationValidation,
  resendVerificationValidation,
  resendActivationValidation,
  listApplicationsValidation,
  getApplicationValidation,
  approveApplicationValidation,
  rejectApplicationValidation,
  updateApplicationValidation,
};
