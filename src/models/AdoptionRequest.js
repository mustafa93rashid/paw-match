const mongoose = require("mongoose");

const adoptionRequestSchema = new mongoose.Schema(
  {
    adopterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    animalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
      index: true,
    },

    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelter",
      required: true,
      index: true,
    },

    message: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pendingReview",
        "interview",
        "homeCheck",
        "approved",
        "rejected",
        "cancelled",
        "completed",
      ],
      default: "pendingReview",
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Improve queries related to the adopter
adoptionRequestSchema.index({
  adopterId: 1,
  createdAt: -1,
});

// Improve queries related to the shelter
adoptionRequestSchema.index({
  shelterId: 1,
  status: 1,
  createdAt: -1,
});

// Improve queries related to the animal
adoptionRequestSchema.index({
  animalId: 1,
  status: 1,
});

module.exports =
  mongoose.models.AdoptionRequest ||
  mongoose.model(
    "AdoptionRequest",
    adoptionRequestSchema,
  );