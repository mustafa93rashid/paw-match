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

    role: {
      type: String,
      enum: ["superadmin", "shelterEmployee", "vet", "adopter"],
      default: "adopter",
    },

    profileImage: {
      type: imageSchema,
      // default: null,
    },

    address: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // False only for accounts created by staff-application approval, until
    // the applicant sets their own password through the activation link.
    // Every other creation path (self-signup, Super Admin create-user)
    // relies on the default and is unaffected.
    isAccountActivated: {
      type: Boolean,
      default: true,
    },

    // Dedicated activation token — deliberately separate from
    // passwordResetToken/passwordResetExpires. Account Activation and
    // Forgot Password are different business processes; sharing one pair
    // of fields between them made it impossible to tell which flow a given
    // token belonged to. Same hashed-token-with-expiry shape and security
    // properties as the password-reset pair, just not shared with it.
    activationToken: {
      type: String,
      default: null,
      select: false,
    },

    activationTokenExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
