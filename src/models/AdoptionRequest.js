const mongoose = require("mongoose");

const adoptionRequestSchema = new mongoose.Schema(
  {
    adopterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    animalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
    },

    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelter",
      required: true,
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

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = 
 mongoose.models.AdoptionRequest ||
 mongoose.model(
  "AdoptionRequest",
  adoptionRequestSchema,
);