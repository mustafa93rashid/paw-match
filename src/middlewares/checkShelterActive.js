const Shelter = require("../models/Shelter");

const checkShelterActive = async (req, res, next) => {
  if (req.user.role !== "shelterEmployee") {
    return next();
  }

  const userId = req.user._id || req.user.id;

  const shelter = await Shelter.findOne({
    employees: userId,
  });

  if (!shelter) {
    return res.status(404).json({
      success: false,
      message: "No shelter is associated with this employee",
    });
  }

  if (!shelter.isVerified || shelter.verificationStatus !== "approved") {
    return res.status(403).json({
      success: false,
      message: "Your shelter has not been approved yet",
    });
  }

  if (!shelter.isActive) {
    return res.status(403).json({
      success: false,
      message: "Your shelter has been deactivated",
    });
  }

  req.shelter = shelter;

  next();
};

module.exports = checkShelterActive;