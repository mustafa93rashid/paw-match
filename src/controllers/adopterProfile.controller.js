
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
    "preferredSpecies",
  ];

  const updateData = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid adopter profile fields provided",
    });
  }

  const profile = await AdopterProfile.findOneAndUpdate(
    {
      userId: req.user.id,
    },
    {
      $set: updateData,
      $setOnInsert: {
        userId: req.user.id,
      },
    },
    {
      new: true,
      runValidators: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  ).populate(
    "userId",
    "firstName lastName email phone dateOfBirth gender address role isActive",
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