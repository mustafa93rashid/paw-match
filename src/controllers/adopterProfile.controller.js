const AdopterProfile = require("../models/AdopterProfile");
class AdopterProfileController {
  // ==================================================
  // Get authenticated adopter profile
  // ==================================================
  getMyProfile = async (req, res) => {
    // ==================================================
    // • Retrieves the authenticated adopter profile.
    // • Loads the related user information.
    // • Returns 404 if the profile does not exist.
    // ==================================================

    const profile = await AdopterProfile.findOne({
      userId: req.user.id,
    }).populate(
      "userId",
      "firstName lastName email phone dateOfBirth gender address profileImage role",
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Adopter profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Adopter profile retrieved successfully",
      data: profile,
    });
  };

  // ==================================================
  // Create or update authenticated adopter profile
  // ==================================================
  updateMyProfile = async (req, res) => {
    // ==================================================
    // • Allows updating only approved profile fields.
    // • Ignores any fields outside the whitelist.
    // • Creates the profile automatically if it does not exist.
    // • Runs Mongoose validation before saving.
    // • Returns the updated profile with user information.
    // ==================================================

    const allowedFields = [
      "homeType",
      "hasKids",
      "hasOtherPets",
      "experienceLevel",
      "dailyActivityLevel",
      "isAllergic",
      "ownerType",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const profile = await AdopterProfile.findOneAndUpdate(
      {
        userId: req.user.id,
      },
      updateData,
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).populate(
      "userId",
      "firstName lastName email phone dateOfBirth gender address profileImage role",
    );

    return res.status(200).json({
      success: true,
      message: "Adopter profile updated successfully",
      data: profile,
    });
  };

  // ==================================================
  // Get all adopter profiles
  // ==================================================
  getAllAdopters = async (req, res) => {
    // ==================================================
    // • Retrieves all adopter profiles.
    // • Loads related user information for each profile.
    // • Returns the total number of profiles.
    // • Accessible by Super Admin only.
    // ==================================================

    const profiles = await AdopterProfile.find().populate(
      "userId",
      "firstName lastName email phone address profileImage role isActive",
    );

    return res.status(200).json({
      success: true,
      message: "Adopters retrieved successfully",
      count: profiles.length,
      data: profiles,
    });
  };

  // ==================================================
  // Get adopter profile by user ID
  // ==================================================
  getAdopterByUserId = async (req, res) => {
    // ==================================================
    // • Retrieves an adopter profile using the user's ID.
    // • Loads the related user information.
    // • Returns 404 if the profile does not exist.
    // • Accessible by Super Admin and Shelter Employee.
    // ==================================================

    const profile = await AdopterProfile.findOne({
      userId: req.params.userId,
    }).populate(
      "userId",
      "firstName lastName email phone dateOfBirth gender address profileImage role isActive",
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Adopter profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Adopter profile retrieved successfully",
      data: profile,
    });
  };
}

module.exports = new AdopterProfileController();