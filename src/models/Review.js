const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    adopterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "يجب تحديد معرف المتبني صاحب التقييم"]
    },
    targetType: {
      type: String,
      enum: {
        values: ["Shelter", "Vet"],
        message: "الجهة المستهدفة يجب أن تكون إما Shelter أو Vet"
      },
      required: [true, "يجب تحديد نوع الجهة المقيمة"]
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "يجب تحديد معرف الملجأ أو الطبيب البيطري"]
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "يجب إرفاق معرف طلب التبني أو الموعد لإثبات الأهلية"]
    },
    rating: {
      type: Number,
      required: [true, "التقييم الرقمي إلزامي"],
      min: [1, "أقل تقييم هو 1 نجمة"],
      max: [5, "أقصى تقييم هو 5 نجوم"]
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "يجب ألا يتجاوز التعليق 500 حرف"]
    },
    reply: {
      text: { type: String, trim: true },
      createdAt: { type: Date }
    },
    status: {
      type: String,
      enum: ["Published", "Reported", "Hidden"],
      default: "Published"
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// 1. فهرس حماية فريد: يمنع المتبني برمجياً من كتابة أكثر من تقييم لنفس العملية
reviewSchema.index({ adopterId: 1, transactionId: 1 }, { unique: true });

// 2. دالة إحصائية ثابتة لحساب متوسط النجوم وتحديث البروفايل تلقائياً
reviewSchema.statics.calcAverageRating = async function (targetId, targetType) {
  const stats = await this.aggregate([
    {
      $match: { targetId: targetId, status: "Published" }
    },
    {
      $group: {
        _id: "$targetId",
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" }
      }
    }
  ]);

  const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;
  // تقريب المتوسط لأقرب رقم عشري واحد (مثلاً 4.5)
  const averageRating = stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0;

  // تحديث جدول الجهة المستهدفة تلقائياً بناءً على النوع
  if (targetType === "Shelter") {
    await mongoose.model("Shelter").findByIdAndUpdate(targetId, {
      totalReviews,
      averageRating
    });
  } else if (targetType === "Vet") {
    await mongoose.model("VetProfile").findByIdAndUpdate(targetId, {
      totalReviews,
      averageRating
    });
  }
};

// تشغيل حساب المتوسط فوراً بعد حفظ تقييم جديد أو تعديله
reviewSchema.post("save", function () {
  this.constructor.calcAverageRating(this.targetId, this.targetType);
});

// تشغيل حساب المتوسط عند حذف تقييم
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.targetId, doc.targetType);
  }
});

module.exports = mongoose.model("Review", reviewSchema);