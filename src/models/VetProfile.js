const mongoose = require("mongoose");

const vetProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelter",
      default: null,
      index: true,
    },

    specialization: {
      type: String,
      trim: true,
      default: null,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },

    availableDays: {
      type: [String],
      enum: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
      default: [],
    },

    consultationTypes: {
      type: [String],
      enum: ["vetConsultation", "behaviorTraining"],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("VetProfile", vetProfileSchema);