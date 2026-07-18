// controllers/vetProfile.controller.js

const mongoose = require("mongoose");
const VetProfile = require("../models/VetProfile");

class VetProfileController {
  // Get current vet profile
  getMyProfile = async (req, res) => {
    const currentUserId = req.user._id 

    const profile = await VetProfile.findOne({
      userId: currentUserId,
    })
      .populate(
        "userId",
        "firstName lastName email phone dateOfBirth gender address profileImage role isActive",
      )
      .populate(
        "shelterId",
        "name email phone address city logo isActive",
      );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Vet profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vet profile retrieved successfully",
      data: profile,
    });
  };

  // Update current vet profile
// Update current vet profile
updateMyProfile = async (req, res) => {
  const currentUserId = req.user.id;

  const allowedFields = [
    "specialization",
    "bio",
    "experienceYears",
    "availableDays",
    "consultationTypes",
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
      message: "No valid vet profile fields provided",
    });
  }

  const profile = await VetProfile.findOneAndUpdate(
    {
      userId: currentUserId,
    },
    {
      $set: updateData,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate(
      "userId",
      "firstName lastName email phone dateOfBirth gender address role isActive",
    )
    .populate(
      "shelterId",
      "name email phone address city logo isActive",
    );

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "Vet profile not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Vet profile updated successfully",
    data: profile,
  });
};

  // Get all active vets
  getAll = async (req, res) => {
    const { shelterId, specialization } = req.query;

    const filter = {
      isActive: true,
    };

    if (shelterId) {
      if (!mongoose.Types.ObjectId.isValid(shelterId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shelter ID",
        });
      }

      filter.shelterId = shelterId;
    }

    if (specialization) {
      filter.specialization = {
        $regex: specialization,
        $options: "i",
      };
    }

    const profiles = await VetProfile.find(filter)
      .populate(
        "userId",
        "firstName lastName email phone address profileImage role isActive",
      )
      .populate(
        "shelterId",
        "name email phone address city logo isActive",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Vets retrieved successfully",
      count: profiles.length,
      data: profiles,
    });
  };

  // Get vet by profile ID
  getOne = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vet profile ID",
      });
    }

    const profile = await VetProfile.findById(id)
      .populate(
        "userId",
        "firstName lastName email phone dateOfBirth gender address profileImage role isActive",
      )
      .populate(
        "shelterId",
        "name email phone address city logo isActive",
      );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Vet profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vet profile retrieved successfully",
      data: profile,
    });
  };
}

module.exports = new VetProfileController();