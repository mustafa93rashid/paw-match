const Review = require("../models/Review");
const AdoptionRequest = require("../models/AdoptionRequest");
const VetAppointment = require("../models/vetAppointment");
const Shelter = require("../models/Shelter");
const User = require("../models/User");
const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");

class ReviewController {
  // ==================================================
  // Create Review
  // ==================================================
  // • Allows only the adopter to create a review.
  // • Allows shelter reviews only after the adoption
  //   request becomes completed.
  // • Allows veterinarian reviews only after the vet
  //   appointment becomes completed.
  // • Confirms that the completed transaction belongs
  //   to the current adopter.
  // • Gets the target ID from the transaction instead
  //   of trusting the target ID sent by the client.
  // • Prevents duplicate reviews for the same transaction.
  // ==================================================
  createReview = async (req, res) => {
    const adopterId = req.user._id || req.user.id;

    const {
      targetType,
      transactionId,
      rating,
      comment,
    } = req.body;

    let targetId;

    if (targetType === "shelter") {
      const adoptionRequest =
        await AdoptionRequest.findOne({
          _id: transactionId,
          adopterId,
          status: "completed",
        });

      if (!adoptionRequest) {
        return res.status(403).json({
          success: false,
          message:
            "You can review a shelter only after your adoption request is completed",
        });
      }

      const shelter = await Shelter.findById(
        adoptionRequest.shelterId,
      );

      if (!shelter) {
        return res.status(404).json({
          success: false,
          message: "Shelter not found",
        });
      }

      targetId = adoptionRequest.shelterId;
    }

    if (targetType === "vet") {
      const appointment =
        await VetAppointment.findOne({
          _id: transactionId,
          adopterId,
          status: "completed",
        });

      if (!appointment) {
        return res.status(403).json({
          success: false,
          message:
            "You can review a veterinarian only after your appointment is completed",
        });
      }

      const vet = await User.findOne({
        _id: appointment.vetId,
        role: "vet",
      });

      if (!vet) {
        return res.status(404).json({
          success: false,
          message: "Veterinarian not found",
        });
      }

      targetId = appointment.vetId;
    }

    try {
      const review = await Review.create({
        adopterId,
        targetType,
        targetId,
        transactionId,
        rating,
        comment: comment?.trim() || "",
      });

      const populatedReview = await Review.findById(
        review._id,
      )
        .populate(
          "adopterId",
          "firstName lastName profileImage",
        )
        .populate(
          "reply.repliedBy",
          "firstName lastName role",
        );

      return res.status(201).json({
        success: true,
        message: "Review created successfully",
        data: populatedReview,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "You have already reviewed this transaction",
        });
      }

      throw error;
    }
  };

  // ==================================================
  // Update Review
  // ==================================================
  // • Allows the adopter to update only their own review.
  // • Allows updating the rating and comment only.
  // • Allows updating the review within 48 hours.
  // • Marks the review as edited.
  // • Recalculates the target average after saving.
  // ==================================================
  updateReview = async (req, res) => {
    const adopterId = req.user._id || req.user.id;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (
      review.adopterId.toString() !==
      adopterId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to update this review",
      });
    }

    const editDeadline =
      review.createdAt.getTime() +
      48 * 60 * 60 * 1000;

    if (Date.now() > editDeadline) {
      return res.status(400).json({
        success: false,
        message:
          "The 48-hour review editing period has expired",
      });
    }

    const { rating, comment } = req.body;

    if (rating !== undefined) {
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment.trim();
    }

    review.isEdited = true;

    await review.save();

    const populatedReview = await Review.findById(
      review._id,
    )
      .populate(
        "adopterId",
        "firstName lastName profileImage",
      )
      .populate(
        "reply.repliedBy",
        "firstName lastName role",
      );

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: populatedReview,
    });
  };

  // ==================================================
  // Add Official Reply
  // ==================================================
  // • Allows one official reply for each review.
  // • Allows the veterinarian to reply only to reviews
  //   written about their own account.
  // • Allows shelter employees to reply only to reviews
  //   written about their assigned shelter.
  // • Requires the shelter employee profile to be active.
  // ==================================================
  addReply = async (req, res) => {
    const userId = req.user._id || req.user.id;
    const { text } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.reply?.text) {
      return res.status(409).json({
        success: false,
        message:
          "An official reply has already been added",
      });
    }

    if (req.user.role === "vet") {
      if (
        review.targetType !== "vet" ||
        review.targetId.toString() !==
        userId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to reply to this review",
        });
      }
    }

    if (req.user.role === "shelterEmployee") {
      if (review.targetType !== "shelter") {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to reply to this review",
        });
      }

      const employeeProfile =
        await ShelterEmployeeProfile.findOne({
          userId,
          shelterId: review.targetId,
          isActive: true,
        });

      if (!employeeProfile) {
        return res.status(403).json({
          success: false,
          message:
            "You are not assigned to this shelter",
        });
      }
    }

    review.reply = {
      text: text.trim(),
      createdAt: new Date(),
      repliedBy: userId,
    };

    await review.save();

    const populatedReview = await Review.findById(
      review._id,
    )
      .populate(
        "adopterId",
        "firstName lastName profileImage",
      )
      .populate(
        "reply.repliedBy",
        "firstName lastName role",
      );

    return res.status(200).json({
      success: true,
      message: "Official reply added successfully",
      data: populatedReview,
    });
  };

  // ==================================================
  // Get Target Reviews
  // ==================================================
  // • Retrieves published reviews for one shelter
  //   or veterinarian.
  // • Separates reviews using both target type and ID.
  // • Returns the newest reviews first.
  // • Includes limited adopter and reply information.
  // ==================================================
  getTargetReviews = async (req, res) => {
    const { targetType, targetId } = req.params;

    const reviews = await Review.find({
      targetType,
      targetId,
      status: "published",
    })
      .populate(
        "adopterId",
        "firstName lastName profileImage",
      )
      .populate(
        "reply.repliedBy",
        "firstName lastName role",
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  };

  // ==================================================
  // Get Current Adopter Reviews
  // ==================================================
  // • Retrieves all reviews created by the current adopter.
  // • Supports optional filtering by target type.
  // • Returns the newest reviews first.
  // ==================================================
  getMyReviews = async (req, res) => {
    const adopterId = req.user._id || req.user.id;
    const { targetType } = req.query;

    const filter = {
      adopterId,
    };

    if (targetType) {
      filter.targetType = targetType;
    }

    const reviews = await Review.find(filter)
      .populate(
        "reply.repliedBy",
        "firstName lastName role",
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  };
}

module.exports = new ReviewController();