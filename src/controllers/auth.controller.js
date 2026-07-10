const User = require("../models/User");
const jwtService = require("../utils/jwtService");
const passwordService = require("../utils/passwordService");
const cookiesService = require("../utils/cookiesService");

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
      message: "User registered successfully",
      user,
    });
  };

  signin = async (req, res) => {
    const { email, password } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isVerified = await passwordService.compare(password, user.password);

    if (!isVerified) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwtService.generateAccessToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = jwtService.generateRefreshToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    user = user.toObject();
    delete user.password;

    cookiesService.setAccessToken(res, token);
    cookiesService.setRefreshToken(res, refreshToken);

    res.status(200).json({
      message: "User signed in successfully",
      user,
    });
  };

  logout = async (req, res) => {
    cookiesService.clearTokens(res);
    res.status(200).json({
      message: "User logged out successfully",
    });
  };

  profile = async (req, res) => {
    if (!req.user) {
      return res.status(200).json({ message: "User not found" });
    }

  const user = await User.findById(req.user.id).select("-password");

    res.status(200).json({
      success: true,
      data: user,
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

    const data = {
      _id: decoded._id,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      role: decoded.role,
    };

    const token = jwtService.generateAccessToken(data);
    const refToken = jwtService.generateRefreshToken(data);

    cookiesService.setAccessToken(res, token);
    cookiesService.setRefreshToken(res, refToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
    });
  };
}

module.exports = new AuthController();
