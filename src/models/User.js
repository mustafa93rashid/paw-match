const mongoose = require("mongoose");
const imageSchema= require("../models/image_schema");
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
    },

    phone: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: imageSchema,
      // default: null,
    },
    role: {
      type: String,
      enum: ["superadmin", "shelterEmployee", "vet", "adopter"],
      default: "adopter",
    },

    address: {
      type: String,
      trim: true,
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

module.exports = mongoose.model("User", userSchema);