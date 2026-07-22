const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    adopterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Adopter ID is required"],
      index: true,
    },

    targetType: {
      type: String,
      enum: {
        values: ["shelter", "vet"],
        message: "Target type must be shelter or vet",
      },
      required: [true, "Target type is required"],
      index: true,
    },

    // Shelter ID when targetType is shelter.
    // Vet User ID when targetType is vet.
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Target ID is required"],
      index: true,
    },

    // AdoptionRequest ID or VetAppointment ID.
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Transaction ID is required"],
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Minimum rating is 1"],
      max: [5, "Maximum rating is 5"],
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
      default: "",
    },

    reply: {
      text: {
        type: String,
        trim: true,
        maxlength: [500, "Reply cannot exceed 500 characters"],
        default: null,
      },
      createdAt: {
        type: Date,
        default: null,
      },
      repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    status: {
      type: String,
      enum: ["published", "reported", "hidden"],
      default: "published",
      index: true,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent creating more than one review for the same completed transaction.
reviewSchema.index(
  {
    adopterId: 1,
    targetType: 1,
    transactionId: 1,
  },
  {
    unique: true,
  },
);

// ==================================================
// Calculate Target Average Rating
// ==================================================
// • Calculates ratings from published reviews only.
// • Separates shelter reviews from veterinarian reviews.
// • Updates the shelter directly using the shelter ID.
// • Updates the veterinarian profile using the veterinarian User ID.
// ==================================================

reviewSchema.statics.calcAverageRating = async function (
  targetId,
  targetType,
) {
  const objectTargetId = new mongoose.Types.ObjectId(
    targetId,
  );

  const stats = await this.aggregate([
    {
      $match: {
        targetId: objectTargetId,
        targetType,
        status: "published",
      },
    },
    {
      $group: {
        _id: null,
        totalReviews: {
          $sum: 1,
        },
        averageRating: {
          $avg: "$rating",
        },
      },
    },
  ]);

  const totalReviews =
    stats.length > 0 ? stats[0].totalReviews : 0;

  const averageRating =
    stats.length > 0
      ? Math.round(stats[0].averageRating * 10) / 10
      : 0;

  if (targetType === "shelter") {
    await mongoose.model("Shelter").findByIdAndUpdate(
      targetId,
      {
        $set: {
          totalReviews,
          averageRating,
        },
      },
    );
  }

  if (targetType === "vet") {
    // targetId is the User ID of the veterinarian.
    await mongoose.model("VetProfile").findOneAndUpdate(
      {
        userId: targetId,
      },
      {
        $set: {
          totalReviews,
          averageRating,
        },
      },
    );
  }
};

// Recalculate the average after creating or updating a review.
reviewSchema.post("save", async function () {
  await this.constructor.calcAverageRating(
    this.targetId,
    this.targetType,
  );
});

// Recalculate the average after deleting a review.
reviewSchema.post(
  "findOneAndDelete",
  async function (deletedReview) {
    if (deletedReview) {
      await deletedReview.constructor.calcAverageRating(
        deletedReview.targetId,
        deletedReview.targetType,
      );
    }
  },
);

module.exports = mongoose.model("Review", reviewSchema);