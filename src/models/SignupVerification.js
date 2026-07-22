const mongoose = require("mongoose");

const signupVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    purpose: {
      type: String,
      enum: ["signup", "update_email"],
      required: true,
      default: "signup",
    },

    firstName: {
      type: String,
      trim: true,
      required: function () {
        return this.purpose === "signup";
      },
    },

    lastName: {
      type: String,
      trim: true,
      required: function () {
        return this.purpose === "signup";
      },
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function () {
        return this.purpose === "signup";
      },
      select: false,
    },

    role: {
      type: String,
      enum: ["adopter", "shelterEmployee", "vet"],
      required: function () {
        return this.purpose === "signup";
      },
    },

    verificationCode: {
      type: String,
      required: true,
      select: false,
    },

    verificationCodeExpires: {
      type: Date,
      required: true,
      select: false,
    },

    verificationAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: {
        expires: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "SignupVerification",
  signupVerificationSchema,
);