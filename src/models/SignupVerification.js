const mongoose = require("mongoose");

const signupVerificationSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
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