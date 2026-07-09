const AdopterProfile = require("../models/adopterProfile.model");

class AdopterProfileController {

  async createProfile(req, res) {
    try {
     
      const { userId, fullName, phoneNumber, address, experienceWithPets, hasOtherPets, householdType } = req.body;

      const existingProfile = await AdopterProfile.findOne({ userId });
      if (existingProfile) {
        return res.status(400).json({ message: "Profile already exists for this user." });
      }

      const newProfile = await AdopterProfile.create({
        userId,
        fullName,
        phoneNumber,
        address,
        experienceWithPets,
        hasOtherPets,
        householdType,
      });

      return res.status(201).json({
        message: "Adopter profile created successfully.",
        data: newProfile,
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }


  async getProfileByUserId(req, res) {
    try {
      const { userId } = req.params;
      const profile = await AdopterProfile.findOne({ userId }).populate("userId", "name email"); // جلب بيانات اليوزر مع البروفايل

      if (!profile) {
        return res.status(404).json({ message: "Adopter profile not found." });
      }

      return res.status(200).json({
        message: "Profile fetched successfully.",
        data: profile,
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  
  async updateProfile(req, res) {
    try {
      const { userId } = req.params;
      const updatedProfile = await AdopterProfile.findOneAndUpdate(
        { userId },
        req.body,
        { new: true, runValidators: true } 
      );

      if (!updatedProfile) {
        return res.status(404).json({ message: "Adopter profile not found." });
      }

      return res.status(200).json({
        message: "Profile updated successfully.",
        data: updatedProfile,
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }
}

module.exports = new AdopterProfileController();