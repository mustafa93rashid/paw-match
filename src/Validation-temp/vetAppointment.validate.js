const { body, param } = require("express-validator");
const mongoose = require("mongoose");
const validate = require("../middlewares/validate");

const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID");
  }

  return true;
};

// Validate creating a new appointment request
const requestAppointmentValidation = [
  body("vetId")
    .notEmpty()
    .withMessage("Vet ID is required")
    .bail()
    .custom(isValidObjectId),

  body("requestMessage")
    .optional()
    .isString()
    .withMessage("Request message must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Request message cannot exceed 1000 characters"),

  validate,
];

// Validate scheduling an appointment
const scheduleAppointmentValidation = [
  param("id").custom(isValidObjectId),

  body("appointmentDate")
    .notEmpty()
    .withMessage("Appointment date is required")
    .isISO8601()
    .withMessage("Appointment date must be a valid ISO date"),

  body("duration")
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage("Duration must be between 15 and 180 minutes"),

  body("vetNotes")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Vet notes cannot exceed 1000 characters"),

  validate,
];

// Validate updating appointment status
const updateAppointmentStatusValidation = [
  param("id").custom(isValidObjectId),

  body("status")
    .isIn(["completed", "rejected"])
    .withMessage("Status must be completed or rejected"),

  body("rejectionReason").optional().isString(),

  body("rejectionReason").custom((value, { req }) => {
    if (req.body.status === "rejected" && !value) {
      throw new Error(
        "Rejection reason is required when rejecting an appointment",
      );
    }

    return true;
  }),

  validate,
];

// Validate appointment id
const appointmentIdValidation = [param("id").custom(isValidObjectId), validate];

module.exports = {
  requestAppointmentValidation,
  scheduleAppointmentValidation,
  updateAppointmentStatusValidation,
  appointmentIdValidation,
};
