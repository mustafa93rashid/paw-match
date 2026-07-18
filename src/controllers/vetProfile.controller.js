const VetProfile = require("../models/VetProfile");

class VetProfileController {
  // ==================================================
  // Get authenticated vet profile
  // ==================================================
  getMyProfile = async (req, res) => {
    // ==================================================
    // • Retrieves the authenticated vet profile.
    // • Loads the related user personal information.
    // • Loads the shelter assigned to the vet.
    // • Returns 404 if the vet profile does not exist.
    // • Access is restricted to authenticated vets only.
    // ==================================================

    const currentUserId = req.user._id;

    const profile = await VetProfile.findOne({
      userId: currentUserId,
    })
      .populate(
        "userId",
        "firstName lastName email phone dateOfBirth gender address profileImage role isActive",
      )
      .populate(
        "shelterId",
        "name email phone address city logo isActive",
      );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Vet profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vet profile retrieved successfully",
      data: profile,
    });
  };

  // ==================================================
  // Update authenticated vet profile
  // ==================================================
  updateMyProfile = async (req, res) => {
    // ==================================================
    // • Allows the authenticated vet to update professional data.
    // • Updates specialization, bio, experience, availability,
    //   and consultation types.
    // • Prevents updating protected profile fields.
    // • Returns 404 if the vet profile does not exist.
    // • Access is restricted to authenticated vets only.
    // ==================================================

    const currentUserId = req.user._id;

    const allowedFields = [
      "specialization",
      "bio",
      "experienceYears",
      "availableDays",
      "consultationTypes",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const profile = await VetProfile.findOneAndUpdate(
      {
        userId: currentUserId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate(
        "userId",
        "firstName lastName email phone dateOfBirth gender address profileImage role isActive",
      )
      .populate(
        "shelterId",
        "name email phone address city logo isActive",
      );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Vet profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vet profile updated successfully",
      data: profile,
    });
  };

  // ==================================================
  // Get all active vet profiles
  // ==================================================
  getAll = async (req, res) => {
    // ==================================================
    // • Retrieves all active vet profiles.
    // • Supports filtering by shelter and specialization.
    // • Loads the related user and shelter information.
    // • Sorts the results from newest to oldest.
    // • Access requires authentication.
    // ==================================================

    const { shelterId, specialization } = req.query;

    const filter = {
      isActive: true,
    };

    if (shelterId) {
      filter.shelterId = shelterId;
    }

    if (specialization) {
      filter.specialization = {
        $regex: specialization,
        $options: "i",
      };
    }

    const profiles = await VetProfile.find(filter)
      .populate(
        "userId",
        "firstName lastName email phone address profileImage role isActive",
      )
      .populate(
        "shelterId",
        "name email phone address city logo isActive",
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message: "Vets retrieved successfully",
      count: profiles.length,
      data: profiles,
    });
  };

  // ==================================================
  // Get vet profile by User ID
  // ==================================================
  getOne = async (req, res) => {
    // ==================================================
    // • Retrieves a vet profile using the User ID.
    // • Loads the related user personal information.
    // • Loads the shelter assigned to the vet.
    // • Returns 404 if the vet profile does not exist.
    // • Access requires authentication.
    // ==================================================

    const { userId } = req.params;

    const profile = await VetProfile.findOne({
      userId,
    })
      .populate(
        "userId",
        "firstName lastName email phone dateOfBirth gender address profileImage role isActive",
      )
      .populate(
        "shelterId",
        "name email phone address city logo isActive",
      );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Vet profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vet profile retrieved successfully",
      data: profile,
    });
  };
}

module.exports = new VetProfileController();