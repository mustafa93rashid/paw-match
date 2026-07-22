const express = require("express");

const router = express.Router();

const reviewController = require("../controllers/review.controller");
const reviewValidation = require("../validation/review.validate");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

// Get published reviews for one shelter or veterinarian
router.get("/target/:targetType/:targetId", [reviewValidation.getTargetReviewsValidation], asyncHandler(reviewController.getTargetReviews));

// Get reviews created by the current adopter
router.get("/my", [auth, role(["adopter"]), reviewValidation.getMyReviewsValidation], asyncHandler(reviewController.getMyReviews));

// Create a review after a completed adoption request or vet appointment
router.post("/", [auth, role(["adopter"]), reviewValidation.createReviewValidation], asyncHandler(reviewController.createReview));

// Update the adopter review within 48 hours
router.put("/:id", [auth, role(["adopter"]), reviewValidation.updateReviewValidation], asyncHandler(reviewController.updateReview));

// Add an official reply from the shelter employee or veterinarian
router.put("/:id/reply", [auth, role(["shelterEmployee", "vet"]), reviewValidation.addReplyValidation], asyncHandler(reviewController.addReply));

module.exports = router;