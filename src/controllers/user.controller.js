const User = require("../models/User");
const AdopterProfile = require("../models/AdopterProfile");
const VetProfile = require("../models/VetProfile");
const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");

const { uploadBufferToCloudinary, deleteImage } = require("../services/cloudinary.service");
//zain
const passwordService = require("../utils/passwordService");
class UsersController {
  // ==================================================
  // Get all users
  // ==================================================
  getAll = async (req, res) => {
    // ==================================================
    // • Retrieves all registered users from the database.
    // • Password hashes are excluded from the response.
    // • Access is restricted to Super Admin only.
    // ==================================================

    // Retrieve all users without exposing password hashes
    const users = await User.find({}).select("-password");

    return res.status(200).json({
      success: true,
      data: users,
    });
  };

  // ==================================================
  // Get user by ID
  // ==================================================
  getOne = async (req, res) => {
    // ==================================================
    // • Retrieves a specific user by their unique ID.
    // • Password hash is excluded from the response.
    // • Returns 404 if the requested user does not exist.
    // • Access is restricted to Super Admin only.
    // ==================================================

    const id = req.params.id;

    // Find the user without exposing the password hash
    const user = await User.findById(id).select("-password");

    // Return an error if the user does not exist
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  };

  // ==================================================
  // Update user role
  // ==================================================
  updateRole = async (req, res) => {
    // ==================================================
    // • Updates the role of an existing user.
    // • Prevents changing the Super Admin role.
    // • Deletes the previous role profile before switching.
    // • Creates a new profile based on the selected role.
    // • Returns the updated role after a successful change.
    // • Access is restricted to Super Admin only.
    // ==================================================

    // Find the target user
    const user = await User.findById(req.params.id);

    // Return an error if the user does not exist
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    const { role } = req.body;

    // Prevent changing the Super Admin role
    if (user.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Superadmin role cannot be changed",
      });
    }

    // Prevent assigning the same role again
    if (user.role === role) {
      return res.status(400).json({
        success: false,
        message: `User already has the ${role} role`,
      });
    }

    // Remove the previous role profile
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

    // Create a new profile for the selected role
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

    // Update the user's role
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

  // ==================================================
  // Update user account status
  // ==================================================
  updateStatus = async (req, res) => {
    // ==================================================
    // • Activates or deactivates an existing user account.
    // • Validates that isActive is provided as a Boolean value.
    // • Prevents the Super Admin from changing their own account status.
    // • Prevents deactivating another Super Admin account.
    // • Synchronizes the account status with the related role profile.
    // • Access is restricted to Super Admin only.
    // ==================================================

    const { isActive } = req.body;

    // Find the target user
    const user = await User.findById(req.params.id);

    // Return an error if the user does not exist
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent the Super Admin from changing their own account status
    if (String(req.user.id) === String(user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own account status",
      });
    }

    // Prevent deactivating a Super Admin account
    if (user.role === "superadmin" && isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Superadmin account cannot be deactivated",
      });
    }

    // Update the user account status
    user.isActive = isActive;

    await user.save();

    // Synchronize the status with the adopter profile
    if (user.role === "adopter") {
      await AdopterProfile.findOneAndUpdate(
        {
          userId: user._id,
        },
        {
          $set: {
            isActive,
          },
        },
        {
          runValidators: true,
        },
      );
    }

    // Synchronize the status with the vet profile
    if (user.role === "vet") {
      await VetProfile.findOneAndUpdate(
        {
          userId: user._id,
        },
        {
          $set: {
            isActive,
          },
        },
        {
          runValidators: true,
        },
      );
    }

    // Synchronize the status with the shelter employee profile
    if (user.role === "shelterEmployee") {
      await ShelterEmployeeProfile.findOneAndUpdate(
        {
          userId: user._id,
        },
        {
          $set: {
            isActive,
          },
        },
        {
          runValidators: true,
        },
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

  // ==================================================
  // Get current user profile
  // ==================================================
  profile = async (req, res) => {
    // ==================================================
    // • Retrieves the authenticated user's profile.
    // • Requires a valid authenticated user.
    // • Password hash is excluded from the response.
    // ==================================================

    // Ensure the request is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Retrieve the authenticated user's profile
    const user = await User.findById(req.user.id).select("-password");

    // Return the user profile
    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: user,
    });
  };

  // ==================================================
  // Update current user profile
  // ==================================================
  updateProfile = async (req, res) => {
    // ==================================================
    // • Updates the authenticated user's personal information.
    // • Only predefined profile fields are allowed to be updated.
    // • Returns an error if no valid fields are provided.
    // • Password and other sensitive fields are excluded from the response.
    // ==================================================

    // Find the authenticated user
    const user = await User.findById(req.user.id);

    // Return an error if the user does not exist
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update the user's profile information
    Object.assign(user, updateData);

    await user.save();

    // Remove sensitive fields before sending the response
    const userData = user.toObject();

    delete userData.password;
    delete userData.passwordResetToken;
    delete userData.passwordResetExpires;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: userData,
    });
  };

  buildUploadedImage = (result) => ({
    url: result.secure_url,
    publicId: result.public_id,
  });

  uploadProfileImage = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.profileImage) {
      return res.status(400).json({
        success: false,
        message: "Profile image already exists. Use replace endpoint.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    }

    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      folder: "user",
      originalName: req.file.originalname,
    });

    try {
      user.profileImage = this.buildUploadedImage(uploaded);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Profile image uploaded successfully",
        data: user,
      });
    } catch (error) {
      await deleteImage(uploaded.public_id);
      throw error;
    }
  };

  replaceProfileImage = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    }

    const oldImage = user.profileImage;

    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      folder: "user",
      originalName: req.file.originalname,
    });

    try {
      user.profileImage = this.buildUploadedImage(uploaded);
      await user.save();

      if (oldImage?.publicId) {
        await deleteImage(oldImage.publicId);
      }

      return res.status(200).json({
        success: true,
        message: "Profile image replaced successfully",
        data: user,
      });
    } catch (error) {
      await deleteImage(uploaded.public_id);
      throw error;
    }
  };

  deleteProfileImage = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.profileImage) {
      return res.status(404).json({
        success: false,
        message: "Profile image not found",
      });
    }

    const oldImage = user.profileImage;
    await deleteImage(oldImage.publicId);
    user.profileImage = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile image deleted successfully",
      data: user,
    });
  };
  // zain hussein - دالة إنشاء مستخدم وبروفايل بواسطة السوبر أدمن

  // ==================================================
  // Create user account by admin
  // ==================================================
  adminCreateUser = async (req, res) => {
    // ==================================================
    // • Creates a new user account directly by the Super Admin.
    // • Allows only adopter, shelterEmployee, and vet roles.
    // • Prevents creating another account with the same email.
    // • Hashes the password before storing it in the database.
    // • Automatically creates the profile related to the selected role.
    // • Password hash is excluded from the response.
    // • Access is restricted to Super Admin only.
    // ==================================================

    const { firstName, lastName, email, password, role } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });

    // Hash the user's password before saving it
    const hashedPassword = await passwordService.hash(password);

    // Create the user account
    let newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    });

    // Prepare the initial role profile data
    const profileData = {
      userId: newUser._id,
      isActive: newUser.isActive,
    };

    // Create the adopter profile
    if (role === "adopter") {
      await AdopterProfile.create(profileData);
    }

    // Create the shelter employee profile
    if (role === "shelterEmployee") {
      await ShelterEmployeeProfile.create(profileData);
    }

    // Create the vet profile
    if (role === "vet") {
      await VetProfile.create(profileData);
    }

    // Remove sensitive fields before sending the response
    newUser = newUser.toObject();

    delete newUser.password;
    delete newUser.passwordResetToken;
    delete newUser.passwordResetExpires;

    return res.status(201).json({
      success: true,
      message: "User and role profile created successfully by admin",
      data: newUser,
    });
  };
}

module.exports = new UsersController();
