// controllers/vetProfile.controller.js

const VetProfile = require("../models/VetProfile");

class VetProfileController {
  // Get current vet profile
  getMyProfile = async (req, res) => {
    const profile = await VetProfile.findOne({
      userId: req.user.id,
    })
      .populate(
        "userId",
        "firstName lastName email phone dateOfBirth gender address profileImage role isActive",
      )
      .populate("shelterId", "name address city phone email");

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
  updateMyProfile = async (req, res) => {
    const allowedFields = [
      "specialization",
      "bio",
      "experienceYears",
      "availableDays",
      "consultationTypes",
      "shelterId",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const profile = await VetProfile.findOneAndUpdate(
      {
        userId: req.user.id,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate(
        "userId",
        "firstName lastName email phone dateOfBirth gender address profileImage role isActive",
      )
      .populate("shelterId", "name address city phone email");

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

  // Get all vets
  getAll = async (req, res) => {
    const profiles = await VetProfile.find({
      isActive: true,
    })
      .populate(
        "userId",
        "firstName lastName email phone address profileImage role isActive",
      )
      .populate("shelterId", "name address city");

    return res.status(200).json({
      success: true,
      message: "Vets retrieved successfully",
      count: profiles.length,
      data: profiles,
    });
  };

  // Get one vet by profile ID
  getOne = async (req, res) => {
    const profile = await VetProfile.findById(req.params.id)
      .populate(
        "userId",
        "firstName lastName email phone dateOfBirth gender address profileImage role isActive",
      )
      .populate("shelterId", "name address city phone email");

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