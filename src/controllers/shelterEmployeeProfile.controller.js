const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");

class ShelterEmployeeProfileController {
  // ==================================================
  // Get authenticated shelter employee profile
  // ==================================================
  getMyProfile = async (req, res) => {
    // ==================================================
    // • Retrieves the authenticated shelter employee profile.
    // • Loads the related user personal information.
    // • Loads the shelter assigned to the employee.
    // • Returns 404 if the employee profile does not exist.
    // ==================================================

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

  // ==================================================
  // Update shelter employee work data
  // ==================================================
  updateEmployeeWorkData = async (req, res) => {
    // ==================================================
    // • Allows the Super Admin to update employee work information.
    // • Updates the employee position, number, and hire date.
    // • Searches for the employee profile using the User ID.
    // • Prevents duplicate employee numbers inside the same shelter.
    // • Access is restricted to Super Admin only.
    // ==================================================

    const { userId } = req.params;

    const allowedFields = ["position", "employeeNumber", "hireDate"];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const employeeProfile = await ShelterEmployeeProfile.findOne({
      userId,
    });

    if (!employeeProfile) {
      return res.status(404).json({
        success: false,
        message: "Shelter employee profile not found",
      });
    }

    // Check if the employee number is already used in the same shelter
    if (updateData.employeeNumber) {
      const duplicateEmployeeNumber = await ShelterEmployeeProfile.findOne({
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

    // Apply the provided work information to the employee profile
    Object.assign(employeeProfile, updateData);

    await employeeProfile.save();

    await employeeProfile.populate(
      "userId",
      "firstName lastName email phone dateOfBirth gender address profileImage role isActive",
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

  // ==================================================
  // Get all shelter employee profiles
  // ==================================================
  getAll = async (req, res) => {
    // ==================================================
    // • Retrieves all shelter employee profiles.
    // • Loads the related user information for each employee.
    // • Loads the shelter assigned to each employee.
    // • Access is restricted to Super Admin only.
    // ==================================================

    const profiles = await ShelterEmployeeProfile.find()
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

  // ==================================================
  // Get shelter employee profile by User ID
  // ==================================================
  getOne = async (req, res) => {
    // ==================================================
    // • Retrieves a shelter employee profile using the User ID.
    // • Loads the related user personal information.
    // • Loads the shelter assigned to the employee.
    // • Returns 404 if the employee profile does not exist.
    // • Access is restricted to Super Admin only.
    // ==================================================

    const profile = await ShelterEmployeeProfile.findOne({
      userId: req.params.userId,
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
}

module.exports = new ShelterEmployeeProfileController();
