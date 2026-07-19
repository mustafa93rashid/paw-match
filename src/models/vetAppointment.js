const mongoose = require("mongoose");

const vetAppointmentSchema = new mongoose.Schema(
  {
    adopterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Adopter ID is required"],
      index: true // لسرعة البحث عن مواعيد المتبني
    },
    vetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vet ID is required"],
      index: true // لسرعة البحث عن مواعيد الطبيب
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"]
    },
    status: {
      type: String,
      enum: {
        values: ["scheduled", "completed", "rejected"],
        message: "{VALUE} is not a valid status"
      },
      default: "scheduled"
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// إضافة Compound Index للبحث السريع عن مواعيد طبيب معين في تاريخ معين
vetAppointmentSchema.index({ vetId: 1, appointmentDate: 1 });

module.exports = mongoose.model("VetAppointment", vetAppointmentSchema);