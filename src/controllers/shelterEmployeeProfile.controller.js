// controllers/shelterEmployeeProfile.controller.js

const ShelterEmployeeProfile = require(
  "../models/ShelterEmployeeProfile",
);

class ShelterEmployeeProfileController {
  // Get the current shelter employee profile
  getMyProfile = async (req, res) => {
    const profile = await ShelterEmployeeProfile.findOne({
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
        message: "Shelter employee profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shelter employee profile retrieved successfully",
      data: profile,
    });
  };

  // Update the current shelter employee profile
  updateMyProfile = async (req, res) => {
    const allowedFields = [
      "shelterId",
      "position",
      "employeeNumber",
      "hireDate",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const profile = await ShelterEmployeeProfile.findOneAndUpdate(
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
        message: "Shelter employee profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shelter employee profile updated successfully",
      data: profile,
    });
  };

  // Get all shelter employee profiles
  getAll = async (req, res) => {
    const profiles = await ShelterEmployeeProfile.find({
      isActive: true,
    })
      .populate(
        "userId",
        "firstName lastName email phone address profileImage role isActive",
      )
      .populate("shelterId", "name address city");

    return res.status(200).json({
      success: true,
      message: "Shelter employees retrieved successfully",
      count: profiles.length,
      data: profiles,
    });
  };

  // Get one shelter employee profile by profile ID
  getOne = async (req, res) => {
    const profile = await ShelterEmployeeProfile.findById(
      req.params.id,
    )
      .populate(
        "userId",
        "firstName lastName email phone dateOfBirth gender address profileImage role isActive",
      )
      .populate("shelterId", "name address city phone email");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Shelter employee profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shelter employee profile retrieved successfully",
      data: profile,
    });
  };
}

module.exports = new ShelterEmployeeProfileController();