const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate");

// ==================================================
// Create Review Validation
// ==================================================
const createReviewValidation = [
    body("targetType")
        .exists()
        .withMessage("Target type is required")
        .bail()
        .isIn(["shelter", "vet"])
        .withMessage("Target type must be shelter or vet"),

    body("transactionId")
        .exists()
        .withMessage("Transaction ID is required")
        .bail()
        .isMongoId()
        .withMessage("Invalid transaction ID"),

    body("rating")
        .exists()
        .withMessage("Rating is required")
        .bail()
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be between 1 and 5"),

    body("comment")
        .optional()
        .isString()
        .withMessage("Comment must be a string")
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Comment cannot exceed 1000 characters"),

    validate,
];

// ==================================================
// Update Review Validation
// ==================================================
const updateReviewValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid review ID"),

    body("rating")
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be between 1 and 5"),

    body("comment")
        .optional()
        .isString()
        .withMessage("Comment must be a string")
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Comment cannot exceed 1000 characters"),

    validate,
];

// ==================================================
// Add Reply Validation
// ==================================================
const addReplyValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid review ID"),

    body("text")
        .exists()
        .withMessage("Reply text is required")
        .bail()
        .isString()
        .withMessage("Reply text must be a string")
        .trim()
        .notEmpty()
        .withMessage("Reply text cannot be empty")
        .isLength({ max: 1000 })
        .withMessage("Reply text cannot exceed 1000 characters"),

    validate,
];

// ==================================================
// Get Target Reviews Validation
// ==================================================
const getTargetReviewsValidation = [
    param("targetType")
        .isIn(["shelter", "vet"])
        .withMessage("Target type must be shelter or vet"),

    param("targetId")
        .isMongoId()
        .withMessage("Invalid target ID"),

    validate,
];

// ==================================================
// Get My Reviews Validation
// ==================================================
const getMyReviewsValidation = [
    query("targetType")
        .optional()
        .isIn(["shelter", "vet"])
        .withMessage("Target type must be shelter or vet"),

    validate,
];

module.exports = {
    createReviewValidation,
    updateReviewValidation,
    addReplyValidation,
    getTargetReviewsValidation,
    getMyReviewsValidation,
};