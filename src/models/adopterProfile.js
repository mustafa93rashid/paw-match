// models/AdopterProfile.js

const mongoose = require("mongoose");

const adopterProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    homeType: {
      type: String,
      enum: ["apartment", "house", "farm"],
      default: null,
    },

    hasKids: {
      type: Boolean,
      default: null,
    },

    hasOtherPets: {
      type: Boolean,
      default: null,
    },

    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "expert"],
      default: null,
    },

    dailyActivityLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: null,
    },

    isAllergic: {
      type: Boolean,
      default: null,
    },

    ownerType: {
      type: String,
      enum: ["single", "family"],
      default: null,
    },

    isActive: {
  type: Boolean,
  default: true,
}
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("AdopterProfile", adopterProfileSchema);