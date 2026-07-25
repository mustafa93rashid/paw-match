const { param } = require("express-validator");

const validate = require("../middlewares/validate");

const markNotificationAsReadValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid notification ID"),

  validate,
];

module.exports = {
  markNotificationAsReadValidation,
};