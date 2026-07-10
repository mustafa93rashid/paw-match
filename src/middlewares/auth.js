const jwtService = require("../utils/jwtService");
const cookiesService = require("../utils/cookiesService");

const auth = (req, res, next) => {
  try {
    const token = cookiesService.getAccessToken(req, "accessToken");

    if (!token) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const decoded = jwtService.verifyAccessToken(token);
    req.user = { ...decoded };

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Not authorized",
      error: error.message,
    });
  }
};

module.exports = auth;
