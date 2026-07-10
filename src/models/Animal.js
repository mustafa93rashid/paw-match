const mongoose = require("mongoose");

const AnimalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    ageUnit: {
      type: String,
      enum: ["months", "years"],
      required: true,
    },
    species: {
      type: String,
      enum: ["dog", "cat", "bird", "rabbit", "fish", "other"],
      required: true,
    },
    breed: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    size: {
      type: String,
      enum: ["small", "medium", "large"],
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    healthStatus: {
      type: String,
      enum: ["healthy", "needsCare", "specialNeeds", "underTreatment"],
      required: true,
    },
    vaccinated: {
      type: Boolean,
    },
    description: {
      type: String,
    },
    images: {
      type: [String],
      required: true,
    },
    adoptionStatus: {
      type: String,
      enum: ["available", "pending", "adopted", "unavailable"],
      default: "available",
    },
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelter",
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requirements: {
      homeType: {
        type: String,
        enum: ["apartment", "house", "farm", "any"],
        default: "any",
      },
      suitableForKids: {
        type: Boolean,
        default: false,
      },
      goodWithOtherPets: {
        type: Boolean,
        default: false,
      },
      experienceLevel: {
        type: String,
        enum: ["beginner", "intermediate", "expert", "any"],
        default: "any",
      },
      dailyActivityLevel: {
        type: String,
        enum: ["low", "medium", "high"],
      },
      ownerType: {
        type: String,
        enum: ["single", "family", "any"],
        default: "any",
      },
      isAllergic: Boolean,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Animal", AnimalSchema);
