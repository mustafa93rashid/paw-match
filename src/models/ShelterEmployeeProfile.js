const mongoose = require("mongoose");

const shelterEmployeeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelter",
      default: null,
    },

    position: {
      type: String,
      enum: ["Manager", "Employee"],
      default: "Employee",
      trim: true,
    },

    employeeNumber: {
      type: String,
      trim: true,
      default: null,
    },

    hireDate: {
      type: Date,
      default: null,
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

module.exports = mongoose.model(
  "ShelterEmployeeProfile",
  shelterEmployeeProfileSchema,
);
