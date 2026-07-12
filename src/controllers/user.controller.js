const User = require("../models/User");
//const { stripPassword } = require("../utils/userHelpers");
const AdopterProfile = require("../models/AdopterProfile");
const VetProfile = require("../models/VetProfile");
const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");
class UsersController {
  getAll = async (req, res) => {
    const users = await User.find({}).select("-password");
    res.status(200).json({
      success: true,
      data: users,
    });
  };

  getOne = async (req, res) => {
    const id = req.params.id;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  };

  updateRole = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    const { role } = req.body;

    const allowedRoles = ["shelterEmployee", "vet", "adopter"];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Prevent changing the superadmin role
    if (user.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Superadmin role cannot be changed",
      });
    }

    if (user.role === role) {
      return res.status(400).json({
        success: false,
        message: `User already has the ${role} role`,
      });
    }

    // Delete the previous role profile
    if (user.role === "adopter") {
      await AdopterProfile.findOneAndDelete({
        userId: user._id,
      });
    }

    if (user.role === "vet") {
      await VetProfile.findOneAndDelete({
        userId: user._id,
      });
    }

    if (user.role === "shelterEmployee") {
      await ShelterEmployeeProfile.findOneAndDelete({
        userId: user._id,
      });
    }

    // Create the new role profile
    if (role === "adopter") {
      await AdopterProfile.create({
        userId: user._id,
        isActive: user.isActive,
      });
    }

    if (role === "vet") {
      await VetProfile.create({
        userId: user._id,
        isActive: user.isActive,
      });
    }

    if (role === "shelterEmployee") {
      await ShelterEmployeeProfile.create({
        userId: user._id,
        isActive: user.isActive,
      });
    }

    user.role = role;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: {
        _id: user._id,
        role: user.role,
      },
    });
  };

updateStatus = async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isActive must be true or false",
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // منع السوبر أدمن من تغيير حالة حسابه بنفسه
  if (req.user._id.toString() === user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: "You cannot change your own account status",
    });
  }

  // منع تعطيل حساب سوبر أدمن
  if (user.role === "superadmin" && isActive === false) {
    return res.status(403).json({
      success: false,
      message: "Superadmin account cannot be deactivated",
    });
  }

  user.isActive = isActive;

  await user.save();

  if (user.role === "adopter") {
    await AdopterProfile.findOneAndUpdate(
      { userId: user._id },
      { isActive },
    );
  }

  if (user.role === "vet") {
    await VetProfile.findOneAndUpdate(
      { userId: user._id },
      { isActive },
    );
  }

  if (user.role === "shelterEmployee") {
    await ShelterEmployeeProfile.findOneAndUpdate(
      { userId: user._id },
      { isActive },
    );
  }

  return res.status(200).json({
    success: true,
    message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    data: {
      _id: user._id,
      role: user.role,
      isActive: user.isActive,
    },
  });
};

  profile = async (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
const user = await User.findById(req.user._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: user,
    });
  };

  updateProfile = async (req, res) => {
    const allowedFields = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "gender",
      "phone",
      "address",
    ];

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });



    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: userData,
    });
  };
}

module.exports = new UsersController();
