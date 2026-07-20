const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification recipient is required"],
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: {
        values: ["animalMatch", "adoptionRequest", "appointment", "system"],
        message: "Invalid notification type",
      },
      required: [true, "Notification type is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [150, "Notification title must not exceed 150 characters"],
    },

    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [500, "Notification message must not exceed 500 characters"],
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel",
      default: null,
    },

    referenceModel: {
      type: String,
      enum: ["Animal", "AdoptionRequest", "VetAppointment"],
      default: null,
    },

    metadata: {
      matchPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent sending the same animal match notification
// more than once to the same adopter.
notificationSchema.index(
  {
    recipientId: 1,
    type: 1,
    referenceId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      type: "animalMatch",
      referenceId: {
        $type: "objectId",
      },
    },
  },
);

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
