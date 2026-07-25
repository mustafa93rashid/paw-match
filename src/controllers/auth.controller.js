const User = require("../models/User");
const jwtService = require("../utils/jwtService");
const passwordService = require("../utils/passwordService");
const cookiesService = require("../utils/cookiesService");
const emailService = require("../services/email.service");
const SignupVerification = require("../models/SignupVerification");
const {generateVerificationCode,hashVerificationCode,verifyVerificationCode} = require("../utils/verificationCodeService");
const crypto = require("crypto");
const MAX_VERIFICATION_ATTEMPTS = 5;

class AuthController {
// ==================== Register New User ====================
  signup = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Hash sensitive data
    const hashedPassword = await passwordService.hash(password);
    const hashedVerificationCode = hashVerificationCode(verificationCode);

    // Expiration dates
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save or update the temporary signup request
    await SignupVerification.findOneAndUpdate(
      { email },
      {
        $set: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          verificationCode: hashedVerificationCode,
          verificationCodeExpires,
          verificationAttempts: 0,
          expiresAt,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
      },
    );

    // Send verification code
    await emailService.sendSignupVerificationEmail({
      to: email,
      firstName,
      verificationCode,
    });

    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
      data: {
        email,
        expiresInMinutes: 10,
      },
    });
  };

// ==================== Verify Signup ====================
  verifySignup = async (req, res) => {
    const { email, verificationCode } = req.body;

    const signupRequest = await SignupVerification.findOne({
      email,
    }).select(
      "+password +verificationCode +verificationCodeExpires +verificationAttempts",
    );

    // Check if the temporary signup request exists
    if (!signupRequest) {
      return res.status(404).json({
        success: false,
        message: "Signup verification request not found or expired",
      });
    }

    // Check code expiration
    if (
      !signupRequest.verificationCodeExpires ||
      signupRequest.verificationCodeExpires.getTime() < Date.now()
    ) {
      await SignupVerification.findByIdAndDelete(signupRequest._id);

      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please signup again",
      });
    }

    // Limit failed attempts for this signup request
    if (signupRequest.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      await SignupVerification.findByIdAndDelete(signupRequest._id);

      return res.status(429).json({
        success: false,
        message: "Too many invalid attempts. Please signup again",
      });
    }

    const isValidCode = verifyVerificationCode(
      verificationCode,
      signupRequest.verificationCode,
    );

    if (!isValidCode) {
      signupRequest.verificationAttempts += 1;

      await signupRequest.save({
        validateBeforeSave: false,
      });

      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
        remainingAttempts:
          MAX_VERIFICATION_ATTEMPTS - signupRequest.verificationAttempts,
      });
    }

    // Ensure the email is still available
    const userExists = await User.exists({ email });

    if (userExists) {
      await SignupVerification.findByIdAndDelete(signupRequest._id);

      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    let user;

    try {
      // Create the account after successful verification
      user = await User.create({
        firstName: signupRequest.firstName,
        lastName: signupRequest.lastName,
        email: signupRequest.email,
        password: signupRequest.password,
        role: "adopter",
        isActive: true,
      });
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }

      await SignupVerification.findByIdAndDelete(signupRequest._id);

      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Remove the temporary request after account creation
    await SignupVerification.findByIdAndDelete(signupRequest._id);

    const userResponse = user.toObject();

    delete userResponse.password;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;

    return res.status(201).json({
      success: true,
      message: "Email verified and account registered successfully",
      data: userResponse,
    });
  };

// ==================== Sign In ====================
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

    if (!user.isAccountActivated) {
      return res.status(403).json({
        success: false,
        message: "Please activate your account. Check your email for the activation link.",
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

// ==================== Logout User ====================
  logout = async (req, res) => {
    cookiesService.clearTokens(res);
    res.status(200).json({
      message: "User logged out successfully",
    });
  };

// ==================== Change Password for Authenticated User ====================
  changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const userId = req.user?._id;

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

// ==================== Forgot Password ====================
  forgotPassword = async (req, res) => {
    const { email } = req.body;

    const responseMessage =
      "If an account exists for this email address, you will receive password reset instructions shortly.";

    const user = await User.findOne({ email });

    // Return the same response to avoid exposing registered emails
    if (!user) {
      return res.status(200).json({
        success: true,
        message: responseMessage,
      });
    }

    // Generate and hash the reset token
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

    // Create the frontend reset URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      // Send the password reset email
      await emailService.sendPasswordResetEmail({
        to: user.email,
        firstName: user.firstName,
        resetUrl,
      });
    } catch (error) {
      // Remove the token if email delivery fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save({
        validateBeforeSave: false,
      });

      throw error;
    }

    return res.status(200).json({
      success: true,
      message: responseMessage,
    });
  };

// ==================== Reset Password ====================
  resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Hash the received token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the user with a valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        $gt: Date.now(),
      },
      isActive: true,
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token",
      });
    }

    // Prevent using the current password again
    const isSamePassword = await passwordService.compare(
      newPassword,
      user.password,
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password",
      });
    }

    // Update password
    user.password = await passwordService.hash(newPassword);

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Forgot Password is a completely independent process from Account
    // Activation — this endpoint assumes the account is already activated
    // and never touches isAccountActivated or activationToken/
    // activationTokenExpires. An unactivated account must use the
    // dedicated /auth/activate-account/:token flow instead.
    await user.save();

    // Clear authentication cookies
    cookiesService.clearTokens(res);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please sign in again.",
    });
  };

// ==================== Activate Account (Staff-Application-Approved Users) ====================
  activateAccount = async (req, res) => {
    // Deliberately independent of resetPassword: separate token fields
    // (activationToken/activationTokenExpires, never passwordResetToken/
    // passwordResetExpires), separate endpoint, separate semantics. A
    // password-reset token can never activate an account, and an
    // activation token can never be used to reset an already-active
    // account's password.
    const { token } = req.params;
    const { newPassword } = req.body;

    // Hash the received token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the user with a valid activation token. Deliberately no isActive
    // filter here (unlike resetPassword) — isActive and isAccountActivated
    // are separate axes, and this endpoint's whole purpose is to flip the
    // latter for the first time.
    const user = await User.findOne({
      activationToken: hashedToken,
      activationTokenExpires: {
        $gt: Date.now(),
      },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired activation link",
      });
    }

    if (user.isAccountActivated) {
      return res.status(400).json({
        success: false,
        message: "This account has already been activated. Please sign in.",
      });
    }

    // Set the applicant's own password and activate the account
    user.password = await passwordService.hash(newPassword);

    user.isAccountActivated = true;

    user.activationToken = undefined;
    user.activationTokenExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account activated successfully. Please sign in.",
    });
  };

// ==================== Refresh Access Token Using Refresh Token ====================
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

    if (!user.isAccountActivated) {
      return res.status(403).json({
        success: false,
        message: "Please activate your account. Check your email for the activation link.",
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
