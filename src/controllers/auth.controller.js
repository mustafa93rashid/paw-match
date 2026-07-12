const User = require("../models/User");
const jwtService = require("../utils/jwtService");
const passwordService = require("../utils/passwordService");
const cookiesService = require("../utils/cookiesService");
const crypto = require("crypto");
class AuthController {
  signup = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    const hashed = await passwordService.hash(password);

    let user = await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
    });

    user = user.toObject();
    delete user.password;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  };

  signin = async (req, res) => {
    const { email, password } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isVerified = await passwordService.compare(password, user.password);

    if (!isVerified) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

      if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: "Account is inactive",
    });
  }

    const payload = {
      id: user._id,
      role: user.role,
    };

    const token = jwtService.generateAccessToken(payload);

    const refreshToken = jwtService.generateRefreshToken(payload);

    user = user.toObject();
    delete user.password;

    cookiesService.setAccessToken(res, token);
    cookiesService.setRefreshToken(res, refreshToken);

  return res.status(200).json({
    success: true,
    message: "User signed in successfully",
    data: user,
  });
  };

  logout = async (req, res) => {
    cookiesService.clearTokens(res);
    res.status(200).json({
      message: "User logged out successfully",
    });
  };



  changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentPasswordCorrect = await passwordService.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await passwordService.compare(
      newPassword,
      user.password,
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    user.password = await passwordService.hash(newPassword);

    await user.save();

    cookiesService.clearTokens(res);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please sign in again.",
    });
  };

  forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    const responseMessage =
      "If an account exists with this email, a password reset link has been generated";

    if (!user) {
      return res.status(200).json({
        success: true,
        message: responseMessage,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;

    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

    await user.save({
      validateBeforeSave: false,
    });

    const resetUrl =
      `${req.protocol}://${req.get("host")}` +
      `/api/v1/auth/reset-password/${resetToken}`;

    console.log("Password reset URL:", resetUrl);

    return res.status(200).json({
      success: true,
      message: responseMessage,

      // للتجربة فقط، احذفه عند استخدام الإيميل
      resetUrl,
    });
  };

  resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token",
      });
    }

    user.password = await passwordService.hash(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    cookiesService.clearTokens(res);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please sign in again.",
    });
  };

  refreshToken = async (req, res) => {
    const refreshToken = cookiesService.getRefreshToken(req);

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    const decoded = jwtService.verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    const payload = {
      id: user._id,
      role: user.role,
    };

    const newAccessToken = jwtService.generateAccessToken(payload);

    const newRefreshToken = jwtService.generateRefreshToken(payload);

    cookiesService.setAccessToken(res, newAccessToken);

    cookiesService.setRefreshToken(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
    });
  };
}

module.exports = new AuthController();
