// controllers/shelterEmployeeProfile.controller.js

const ShelterEmployeeProfile = require(
  "../models/ShelterEmployeeProfile",
);

class ShelterEmployeeProfileController {
  // Get the current shelter employee profile
  getMyProfile = async (req, res) => {
    const profile = await ShelterEmployeeProfile.findOne({
      userId: req.user._id,
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
updateEmployeeWorkData = async (req, res) => {
  const { employeeId } = req.params;

  const allowedFields = [
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

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid employment fields provided",
    });
  }

  const employeeProfile = await ShelterEmployeeProfile.findOne({
    userId: employeeId,
  });

  if (!employeeProfile) {
    return res.status(404).json({
      success: false,
      message: "Shelter employee profile not found",
    });
  }

  // السوبر أدمن يستطيع تعديل بيانات أي موظف
  if (req.user.role !== "superadmin") {
    const managerProfile = await ShelterEmployeeProfile.findOne({
      userId: req.user.id,
      position: "Manager",
      isActive: true,
    });

    if (!managerProfile) {
      return res.status(403).json({
        success: false,
        message:
          "Only shelter managers can update employment information",
      });
    }

    if (!managerProfile.shelterId) {
      return res.status(403).json({
        success: false,
        message: "Manager is not assigned to a shelter",
      });
    }

    if (!employeeProfile.shelterId) {
      return res.status(403).json({
        success: false,
        message: "Employee is not assigned to a shelter",
      });
    }

    const belongsToSameShelter =
      String(managerProfile.shelterId) ===
      String(employeeProfile.shelterId);

    if (!belongsToSameShelter) {
      return res.status(403).json({
        success: false,
        message: "You can only update employees in your shelter",
      });
    }

    const isUpdatingSelf =
      String(employeeProfile.userId) === String(req.user.id);

    if (isUpdatingSelf && updateData.position !== undefined) {
      return res.status(403).json({
        success: false,
        message: "Managers cannot change their own position",
      });
    }
  }

  if (updateData.employeeNumber) {
    const duplicateEmployeeNumber =
      await ShelterEmployeeProfile.findOne({
        shelterId: employeeProfile.shelterId,
        employeeNumber: updateData.employeeNumber,
        _id: {
          $ne: employeeProfile._id,
        },
      });

    if (duplicateEmployeeNumber) {
      return res.status(409).json({
        success: false,
        message: "Employee number is already used in this shelter",
      });
    }
  }

  Object.assign(employeeProfile, updateData);

  await employeeProfile.save();

  await employeeProfile.populate(
    "userId",
    "firstName lastName email phone dateOfBirth gender address role isActive",
  );

  await employeeProfile.populate(
    "shelterId",
    "name address city phone email",
  );

  return res.status(200).json({
    success: true,
    message: "Employee work information updated successfully",
    data: employeeProfile,
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
      req.params._id,
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