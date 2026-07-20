const mongoose = require("mongoose");

const vetAppointmentSchema = new mongoose.Schema(
  {
    adopterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Adopter ID is required"],
      index: true,
    },

    vetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vet ID is required"],
    },

    appointmentDate: {
      type: Date,
      default: null,
    },

    duration: {
      type: Number,
      min: [15, "Duration must be at least 15 minutes"],
      max: [180, "Duration cannot exceed 180 minutes"],
      default: 30,
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "scheduled", "completed", "rejected", "cancelled"],
        message: "{VALUE} is not a valid appointment status",
      },
      default: "pending",
      index: true,
    },

    requestMessage: {
      type: String,
      trim: true,
      maxlength: [1000, "Request message cannot exceed 1000 characters"],
      default: "",
    },

    vetNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Vet notes cannot exceed 1000 characters"],
      default: "",
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

vetAppointmentSchema.index({
  vetId: 1,
  status: 1,
  appointmentDate: 1,
});

vetAppointmentSchema.index({
  adopterId: 1,
  createdAt: -1,
});

module.exports =
  mongoose.models.VetAppointment ||
  mongoose.model(
    "VetAppointment",
    vetAppointmentSchema,
  );