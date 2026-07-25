const mongoose = require("mongoose");

const supportedSpecies = ["dog", "cat", "bird", "rabbit", "fish", "other"];

const availableDays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const consultationTypes = ["vetConsultation", "behaviorTraining"];

/** Mirrors the fields createShelterValidation accepts on POST /shelters (logo/images excluded — managed separately, not applicable at application stage). */
const shelterApplicationDataSchema = new mongoose.Schema(
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
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: [true, "Shelter phone is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: null,
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

    supportedSpecies: {
      type: [String],
      enum: supportedSpecies,
      default: [],
    },

    capacity: {
      type: Number,
      min: [0, "Capacity cannot be negative"],
      default: 0,
    },

    operatingHours: {
      open: { type: String, default: null },
      close: { type: String, default: null },
    },

    socialLinks: {
      facebook: { type: String, default: null },
      instagram: { type: String, default: null },
      website: { type: String, default: null },
    },
  },
  { _id: false },
);

/** Mirrors VetProfile's editable fields (src/models/VetProfile.js). */
const vetApplicationDataSchema = new mongoose.Schema(
  {
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
      enum: availableDays,
      default: [],
    },

    consultationTypes: {
      type: [String],
      enum: consultationTypes,
      default: [],
    },
  },
  { _id: false },
);

const staffApplicationSchema = new mongoose.Schema(
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
      trim: true,
      lowercase: true,
      index: true,
    },

    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    // Optional — not required on the User model either, so an applicant
    // isn't blocked from applying without them.
    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      default: null,
    },

    applicationType: {
      type: String,
      enum: ["shelterManager", "vet"],
      required: [true, "Application type is required"],
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    // Same hashed-code pattern as SignupVerification — never store the
    // plain code, never expose these fields by default.
    verificationCode: {
      type: String,
      select: false,
    },

    verificationCodeExpires: {
      type: Date,
      select: false,
    },

    verificationAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    status: {
      type: String,
      enum: ["pendingVerification", "pending", "approved", "rejected"],
      default: "pendingVerification",
    },

    // Exactly one of these two is populated, based on applicationType.
    shelterData: {
      type: shelterApplicationDataSchema,
      default: null,
    },

    vetData: {
      type: vetApplicationDataSchema,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    // Set once approval successfully creates the User account.
    approvedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Who last edited the application's business fields (see update() in
    // staffApplication.controller.js). updatedAt is already provided by
    // the timestamps option below — no separate field needed for that.
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Non-unique — reapplying after rejection is allowed. Duplicate-pending
// prevention is enforced in the controller (status-scoped query), not here.
staffApplicationSchema.index({ email: 1, status: 1 });
staffApplicationSchema.index({ applicationType: 1, status: 1 });

module.exports = mongoose.model("StaffApplication", staffApplicationSchema);
