// models/Animal.js

const mongoose = require("mongoose");
const imageSchema = require("../models/image_schema");
const animalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Animal name is required"],
      trim: true,
      minlength: [2, "Animal name must be at least 2 characters"],
      maxlength: [50, "Animal name must not exceed 50 characters"],
    },

    age: {
      type: Number,
      required: [true, "Animal age is required"],
      min: [0, "Animal age cannot be negative"],
    },

    ageUnit: {
      type: String,
      enum: {
        values: ["months", "years"],
        message: "Age unit must be months or years",
      },
      required: [true, "Age unit is required"],
    },

    species: {
      type: String,
      enum: {
        values: ["dog", "cat", "bird", "rabbit", "fish", "other"],
        message: "Invalid animal species",
      },
      required: [true, "Animal species is required"],
    },

    breed: {
      type: String,
      required: [true, "Animal breed is required"],
      trim: true,
      maxlength: [100, "Breed must not exceed 100 characters"],
    },

    gender: {
      type: String,
      enum: {
        values: ["male", "female"],
        message: "Gender must be male or female",
      },
      required: [true, "Animal gender is required"],
    },

    size: {
      type: String,
      enum: {
        values: ["small", "medium", "large"],
        message: "Size must be small, medium, or large",
      },
      required: [true, "Animal size is required"],
    },

    color: {
      type: String,
      required: [true, "Animal color is required"],
      trim: true,
      maxlength: [100, "Color must not exceed 100 characters"],
    },

    healthStatus: {
      type: String,
      enum: {
        values: ["healthy", "needsCare", "specialNeeds", "underTreatment"],
        message: "Invalid health status",
      },
      required: [true, "Health status is required"],
    },

    vaccinated: {
      type: Boolean,
      default: false,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description must not exceed 1000 characters"],
      default: null,
    },
  
  images: {
    type: [imageSchema],
    default: [],
    // validate: {
    //     validator(images) {
    //         return Array.isArray(images) && images.length > 0;
    //       },
    //       message: "At least one animal image is required",
    // },
  },
    adoptionStatus: {
      type: String,
      enum: {
        values: ["available", "pending", "adopted", "unavailable"],
        message: "Invalid adoption status",
      },
      default: "available",
    },

    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelter",
      required: [true, "Shelter ID is required"],
      index: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User who added the animal is required"],
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
        default: "medium",
      },

      ownerType: {
        type: String,
        enum: ["single", "family", "any"],
        default: "any",
      },

      isAllergic: {
        type: Boolean,
        default: false,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Animal", animalSchema);
