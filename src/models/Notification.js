const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "يجب تحديد المستخدم المستلم للإشعار"]
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelter",
      default: null
    },
    type: {
      type: String,
      enum: ["SMART_MATCH", "ADOPTION_UPDATE", "SYSTEM"],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal", // يربط الإشعار بمعرف الحيوان لفتح صفحته مباشرة
      required: true
    },
    matchScore: {
      type: Number,
      default: 0
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// فهرس مركب فريد: يمنع تكرار إرسال إشعار تطابق لنفس المستخدم وعن نفس الحيوان تماماً
notificationSchema.index({ recipientId: 1, referenceId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Notification", notificationSchema);