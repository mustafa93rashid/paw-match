const mongoose = require("mongoose");

const adopterProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: [true, "User ID is required"],
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    experienceWithPets: {
      type: String,
      enum: ["None", "Beginner", "Experienced"],
      default: "None",
    },
    hasOtherPets: {
      type: Boolean,
      default: false,
    },
    householdType: {
      type: String,
      enum: ["Apartment", "House", "Villa"],
      required: [true, "Household type is required"],
    },
  },
  {
    timestamps: true, 
  }
);

const AdopterProfile = mongoose.model("AdopterProfile", adopterProfileSchema);

module.exports = AdopterProfile;