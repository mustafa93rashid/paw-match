const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    adoptionRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdoptionRequest",
      required: true,
    },
    adopterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    animalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
    },
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelter",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // المدة بالدقائق
      required: true,
      default: 30,
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "rescheduled",
        "completed",
        "cancelled",
        "noShow",
      ],
      default: "scheduled",
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
    previousAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// إضافة Index لسرعة البحث ومنع تعارض المواعيد لاحقاً في الـ Query
appointmentSchema.index({ shelterId: 1, startTime: 1 });

module.exports =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);