const mongoose = require("mongoose");
const imageSchema = require("../models/image_schema");

const shelterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shelter name is required"],
      trim: true,
      minlength: [2, "Shelter name must be at least 2 characters"],
      maxlength: [100, "Shelter name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Shelter email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Shelter phone is required"],
      trim: true,
    },



    logo: {
      type: imageSchema,
      default: null,
    },

    images: {
      type: [imageSchema],
      default: [],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    address: {
      type: String,
      required: [true, "Shelter address is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "Shelter city is required"],
      trim: true,
    },

    latitude: {
      type: Number,
      min: [-90, "Invalid latitude"],
      max: [90, "Invalid latitude"],
    },

    longitude: {
      type: Number,
      min: [-180, "Invalid longitude"],
      max: [180, "Invalid longitude"],
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: undefined,
        validate: {
          validator(value) {
            if (!value) return true;

            return (
              value.length === 2 &&
              value[0] >= -180 &&
              value[0] <= 180 &&
              value[1] >= -90 &&
              value[1] <= 90
            );
          },
          message:
            "Coordinates must be [longitude, latitude] with valid values",
        },
      },
    },

    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    animalIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Animal",
      },
    ],

    supportedSpecies: [
      {
        type: String,
        enum: ["dog", "cat", "bird", "rabbit", "fish", "other"],
      },
    ],

    capacity: {
      type: Number,
      min: [0, "Capacity cannot be negative"],
      default: 0,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    operatingHours: {
      type: {
        open: {
          type: String,
          default: null,
        },
        close: {
          type: String,
          default: null,
        },
      },
      default: {},
    },

    socialLinks: {
      facebook: {
        type: String,
        default: null,
      },
      instagram: {
        type: String,
        default: null,
      },
      website: {
        type: String,
        default: null,
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

shelterSchema.index({ location: "2dsphere" });
shelterSchema.index({ city: 1 });
shelterSchema.index({ verificationStatus: 1, isActive: 1 });

module.exports = mongoose.model("Shelter", shelterSchema);