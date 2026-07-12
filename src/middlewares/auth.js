const User = require("../models/User");
const jwtService = require("../utils/jwtService");
const cookiesService = require("../utils/cookiesService");

const auth = async (req, res, next) => {
  try {
    let token = cookiesService.getAccessToken(req);

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    const decoded = jwtService.verifyAccessToken(token);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token payload",
      });
    }

    const user = await User.findById(decoded.id).select(
      "_id firstName lastName email role isActive",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};

module.exports = auth;