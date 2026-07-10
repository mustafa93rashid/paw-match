
const AdopterProfile = require("../models/AdopterProfile");

class AdopterProfileController {
  getMyProfile = async (req, res) => {
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

  updateMyProfile = async (req, res) => {
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

  getAllAdopters = async (req, res) => {
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

  getAdopterById = async (req, res) => {
    const profile = await AdopterProfile.findById(req.params.id).populate(
      "userId",
      "firstName lastName email phone address profileImage role isActive",
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