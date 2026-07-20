const User = require("../models/User");
const AdopterProfile = require("../models/AdopterProfile");
const VetProfile = require("../models/VetProfile");
const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");

const passwordService = require("../utils/passwordService");

const {uploadBufferToCloudinary,deleteImage} = require("../services/cloudinary.service");

const SignupVerification = require("../models/SignupVerification"); 
const emailService = require("../services/email.service"); 
const verificationCodeService = require("../utils/verificationCodeService"); 
const { getIo, getSocketId } = require("../utils/socket"); 
// ==================================================
// Allowed user roles
// ==================================================
const ALLOWED_USER_ROLES = ["adopter", "shelterEmployee", "vet"];

// ==================================================
// User profile editable fields
// ==================================================
const ALLOWED_PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "phone",
  "address",
];

// ==================================================
// Delete role profile
// ==================================================
const deleteRoleProfile = async (userId, role) => {
  if (role === "adopter") {
    await AdopterProfile.findOneAndDelete({
      userId,
    });

    return;
  }

  if (role === "vet") {
    await VetProfile.findOneAndDelete({
      userId,
    });

    return;
  }

  if (role === "shelterEmployee") {
    await ShelterEmployeeProfile.findOneAndDelete({
      userId,
    });
  }
};

// ==================================================
// Create role profile
// ==================================================
const createRoleProfile = async ({ userId, role, isActive }) => {
  const profileData = {
    userId,
    isActive,
  };

  if (role === "adopter") {
    return AdopterProfile.create(profileData);
  }

  if (role === "vet") {
    return VetProfile.create(profileData);
  }

  if (role === "shelterEmployee") {
    return ShelterEmployeeProfile.create(profileData);
  }

  return null;
};

// ==================================================
// Update role profile status
// ==================================================
const updateRoleProfileStatus = async ({ userId, role, isActive }) => {
  const update = {
    $set: {
      isActive,
    },
  };

  const options = {
    runValidators: true,
  };

  if (role === "adopter") {
    return AdopterProfile.findOneAndUpdate(
      {
        userId,
      },
      update,
      options,
    );
  }

  if (role === "vet") {
    return VetProfile.findOneAndUpdate(
      {
        userId,
      },
      update,
      options,
    );
  }

  if (role === "shelterEmployee") {
    return ShelterEmployeeProfile.findOneAndUpdate(
      {
        userId,
      },
      update,
      options,
    );
  }

  return null;
};

// ==================================================
// Remove sensitive user fields
// ==================================================
const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const userData =
    typeof user.toObject === "function" ? user.toObject() : { ...user };

  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;
  delete userData.emailVerificationCode;
  delete userData.emailVerificationExpires;
  delete userData.refreshToken;

  return userData;
};

class UserController {
  // ==================================================
  // Build uploaded image
  // ==================================================
  buildUploadedImage = (uploadResult) => ({
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  });

  // ==================================================
  // Get current user ID
  // ==================================================
  getCurrentUserId = (req) => {
    return req.user?._id || req.user?.id;
  };

  // ==================================================
  // Get all users
  // ==================================================
  getAll = async (req, res) => {
    // • Retrieves all registered users.
    // • Excludes sensitive user information.
    // • Access should be restricted to Super Admin
    //   through the route middleware.
    // ==================================================

    const users = await User.find({})
      .select(
        [
          "-password",
          "-passwordResetToken",
          "-passwordResetExpires",
          "-emailVerificationCode",
          "-emailVerificationExpires",
          "-refreshToken",
        ].join(" "),
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  };

  // ==================================================
  // Get user by ID
  // ==================================================
  getOne = async (req, res) => {
    // • Retrieves a specific user by ID.
    // • Excludes sensitive information.
    // • Returns 404 when the user does not exist.
    // ==================================================

    const user = await User.findById(req.params.id).select(
      [
        "-password",
        "-passwordResetToken",
        "-passwordResetExpires",
        "-emailVerificationCode",
        "-emailVerificationExpires",
        "-refreshToken",
      ].join(" "),
    );

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
    // • Updates the role of an existing user.
    // • Prevents changing the Super Admin role.
    // • Prevents assigning an unsupported role.
    // • Deletes the old role profile.
    // • Creates the profile related to the new role.
    // • Restores the old profile if creating the
    //   new profile fails.
    // ==================================================

    const { role } = req.body;

    if (!ALLOWED_USER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be adopter, shelterEmployee, or vet",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

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

    const previousRole = user.role;

    await deleteRoleProfile(user._id, previousRole);

    try {
      await createRoleProfile({
        userId: user._id,
        role,
        isActive: user.isActive,
      });

      user.role = role;

      await user.save();
    } catch (error) {
      // Remove the partially created new profile.
      await deleteRoleProfile(user._id, role);

      // Restore the previous role profile.
      try {
        await createRoleProfile({
          userId: user._id,
          role: previousRole,
          isActive: user.isActive,
        });
      } catch (restoreError) {
        console.error(
          "Failed to restore previous role profile:",
          restoreError.message,
        );
      }

      throw error;
    }

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
    // • Activates or deactivates a user account.
    // • Requires isActive to be a Boolean.
    // • Prevents the Super Admin from changing
    //   their own account status.
    // • Prevents deactivating another Super Admin.
    // • Synchronizes the status with the role profile.
    // ==================================================

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a Boolean value",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUserId = this.getCurrentUserId(req);

    if (String(currentUserId) === String(user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own account status",
      });
    }

    if (user.role === "superadmin" && isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Superadmin account cannot be deactivated",
      });
    }

    if (user.isActive === isActive) {
      return res.status(400).json({
        success: false,
        message: `User is already ${isActive ? "active" : "inactive"}`,
      });
    }

    const previousStatus = user.isActive;

    user.isActive = isActive;

    await user.save();

    try {
      await updateRoleProfileStatus({
        userId: user._id,
        role: user.role,
        isActive,
      });
    } catch (error) {
      // Restore the user status if profile synchronization fails.
      user.isActive = previousStatus;

      await user.save();

      throw error;
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
    // • Retrieves the authenticated user's account.
    // • Excludes all sensitive information.
    // ==================================================

    const currentUserId = this.getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(currentUserId).select(
      [
        "-password",
        "-passwordResetToken",
        "-passwordResetExpires",
        "-emailVerificationCode",
        "-emailVerificationExpires",
        "-refreshToken",
      ].join(" "),
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: user,
    });
  };
// ==================================================
  // Request Email Update (Enhanced & Secure)
  // ==================================================
  requestEmailUpdate = async (req, res) => {
    const { newEmail } = req.body;
    const currentUserId = this.getCurrentUserId(req);

    // 1. التحقق من أن الإيميل الجديد غير مستخدم من قبل أي مستخدم آخر في النظام
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "هذا البريد الإلكتروني مستخدم بالفعل لحساب آخر",
      });
    }

    // 2. حذف أي أكواد تحقق قديمة معلقة لهذا المستخدم لنفس الغرض
    await SignupVerification.deleteMany({
      userId: currentUserId,
      purpose: "update_email",
    });

    // 3. توليد كود تحقق جديد
    const code = await verificationCodeService.generateCode();

    // 4. حفظ الكود في قاعدة البيانات مع انتهاء صلاحية (10 دقائق)
    const verificationRecord = await SignupVerification.create({
      email: newEmail,
      code: code,
      purpose: "update_email",
      userId: currentUserId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // 5. محاولة إرسال الإيميل (مع التراجع وحذف الكود في حال فشل الإرسال)
    try {
      await emailService.sendVerificationCode(newEmail, code);
    } catch (error) {
      await SignupVerification.findByIdAndDelete(verificationRecord._id);
      console.error("Failed to send verification email:", error.message);
      return res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء إرسال البريد الإلكتروني. الرجاء المحاولة لاحقاً.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم إرسال كود التحقق بنجاح إلى بريدك الإلكتروني الجديد",
    });
  };

  // ==================================================
  // Verify Email Update (Enhanced & Secure)
  // ==================================================
  verifyEmailUpdate = async (req, res) => {
    const { newEmail, code } = req.body;
    const currentUserId = this.getCurrentUserId(req);

    // 1. البحث عن كود التحقق ومطابقته
    const verification = await SignupVerification.findOne({
      email: newEmail,
      code: code,
      purpose: "update_email",
      userId: currentUserId,
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "كود التحقق غير صحيح أو منتهي الصلاحية",
      });
    }

    // 2. تحديث الإيميل في حساب المستخدم
    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    }

    user.email = newEmail;
    await user.save();

    // 3. تنظيف وحذف كود التحقق من قاعدة البيانات بعد نجاح العملية
    await SignupVerification.deleteOne({ _id: verification._id });

    // 4. إرسال الإشعار اللحظي عبر Socket.io (إن وجد اتصال نشط)
    try {
      const targetSocketId = getSocketId(currentUserId.toString());
      if (targetSocketId) {
        getIo().to(targetSocketId).emit("notification", {
          message: "تم تغيير البريد الإلكتروني الخاص بك بنجاح",
          type: "success",
        });
      }
    } catch (socketError) {
      // لا نجعل فشل الإشعار اللحظي يوقف نجاح العملية الرئيسية
      console.error("Socket emission failed:", socketError.message);
    }

    return res.status(200).json({
      success: true,
      message: "تم تحديث البريد الإلكتروني بنجاح",
      data: sanitizeUser(user),
    });
  };

  // ==================================================
  // Update current user profile
  // ==================================================
  updateProfile = async (req, res) => {
    // • Updates the authenticated user's personal data.
    // • Accepts predefined editable fields only.
    // • Prevents changing email, role, password,
    //   status, and profile image through this endpoint.
    // • Profile image must be managed through
    //   dedicated image endpoints.
    // ==================================================

    const currentUserId = this.getCurrentUserId(req);

    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const protectedFields = [
      "email",
      "password",
      "role",
      "isActive",
      "isEmailVerified",
      "profileImage",
      "passwordResetToken",
      "passwordResetExpires",
      "emailVerificationCode",
      "emailVerificationExpires",
    ];

    const hasProtectedField = protectedFields.some(
      (field) => req.body[field] !== undefined,
    );

    if (hasProtectedField) {
      return res.status(400).json({
        success: false,
        message:
          "Protected user fields cannot be updated through this endpoint",
      });
    }

    const updateData = {};

    ALLOWED_PROFILE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields were provided",
      });
    }

    Object.assign(user, updateData);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: sanitizeUser(user),
    });
  };

  // ==================================================
  // Upload profile image
  // ==================================================
  uploadProfileImage = async (req, res) => {
    // • Uploads the user's first profile image.
    // • Prevents uploading another image when one
    //   already exists.
    // • Uploads the image to Cloudinary.
    // • Removes the uploaded Cloudinary image if
    //   saving MongoDB fails.
    // ==================================================

    const currentUserId = this.getCurrentUserId(req);

    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.profileImage) {
      return res.status(400).json({
        success: false,
        message: "Profile image already exists. Use the replace endpoint",
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
    } catch (error) {
      try {
        await deleteImage(uploaded.public_id);
      } catch (cleanupError) {
        console.error(
          "Failed to clean newly uploaded profile image:",
          cleanupError.message,
        );
      }

      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      data: sanitizeUser(user),
    });
  };

  // ==================================================
  // Replace profile image
  // ==================================================
  replaceProfileImage = async (req, res) => {
    // • Uploads and saves the new image first.
    // • Deletes the previous Cloudinary image only
    //   after MongoDB saves successfully.
    // • Does not fail the completed update when
    //   deleting the old Cloudinary image fails.
    // ==================================================

    const currentUserId = this.getCurrentUserId(req);

    const user = await User.findById(currentUserId);

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
    } catch (error) {
      try {
        await deleteImage(uploaded.public_id);
      } catch (cleanupError) {
        console.error(
          "Failed to clean newly uploaded profile image:",
          cleanupError.message,
        );
      }

      throw error;
    }

    // Delete the previous image only after
    // the new image is saved successfully.
    if (oldImage?.publicId) {
      try {
        await deleteImage(oldImage.publicId);
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete old profile image:",
          cloudinaryError.message,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: oldImage
        ? "Profile image replaced successfully"
        : "Profile image uploaded successfully",
      data: sanitizeUser(user),
    });
  };

  // ==================================================
  // Delete profile image
  // ==================================================
  deleteProfileImage = async (req, res) => {
    // • Removes the profile image reference from
    //   MongoDB first.
    // • Attempts to delete the Cloudinary image after
    //   MongoDB saves successfully.
    // • Cloudinary deletion failure does not restore
    //   the removed MongoDB reference.
    // ==================================================

    const currentUserId = this.getCurrentUserId(req);

    const user = await User.findById(currentUserId);

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

    const imageToDelete = user.profileImage;

    // Remove the MongoDB reference first.
    user.profileImage = null;

    await user.save();

    // Delete the Cloudinary file after MongoDB succeeds.
    if (imageToDelete.publicId) {
      try {
        await deleteImage(imageToDelete.publicId);
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete profile image from Cloudinary:",
          cloudinaryError.message,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile image deleted successfully",
      data: sanitizeUser(user),
    });
  };

  // ==================================================
  // Create user account by Super Admin
  // ==================================================
  adminCreateUser = async (req, res) => {
    // • Creates a user account directly by Super Admin.
    // • Allows adopter, Shelter Employee, and Vet only.
    // • Prevents duplicate emails.
    // • Hashes the password.
    // • Creates the profile related to the selected role.
    // • Deletes the created user if profile creation fails.
    // ==================================================

    const { firstName, lastName, email, password, role } = req.body;

    if (!ALLOWED_USER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be adopter, shelterEmployee, or vet",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await passwordService.hash(password);

    let newUser;

    try {
      newUser = await User.create({
        firstName,
        lastName,
        email: normalizedEmail,
        password: hashedPassword,
        role,
      });

      await createRoleProfile({
        userId: newUser._id,
        role,
        isActive: newUser.isActive,
      });
    } catch (error) {
      // Prevent leaving a user account without its role profile.
      if (newUser?._id) {
        await User.findByIdAndDelete(newUser._id);
      }

      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "User and role profile created successfully by admin",
      data: sanitizeUser(newUser),
    });
  };
}

module.exports = new UserController();
