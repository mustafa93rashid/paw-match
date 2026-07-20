const Animal = require("../models/Animal");
const AdopterProfile = require("../models/AdopterProfile");
const Notification = require("../models/Notification");

const { calculateAnimalMatch } = require("./matching.service");

const { getIO } = require("../config/socket");

const MATCH_NOTIFICATION_THRESHOLD = 75;

/*
|--------------------------------------------------------------------------
| Match Notification Service
|--------------------------------------------------------------------------
*/

// ==================================================
// Check Animal Match Notifications
// ==================================================
const checkAnimalMatchNotifications = async (animalId) => {
  // • Retrieves the added or updated animal.
  // • Ensures the animal and shelter are available.
  // • Calculates compatibility with active adopters.
  // • Stores and emits notifications for matches
  //   equal to or greater than 75 percent.
  // ==================================================

  const animal = await Animal.findOne({
    _id: animalId,
    isActive: true,
    adoptionStatus: "available",
  })
    .populate("shelterId", "name isActive isVerified verificationStatus")
    .lean();

  if (!animal || !animal.shelterId) {
    return;
  }

  const shelterIsAvailable =
    animal.shelterId.isActive === true &&
    animal.shelterId.isVerified === true &&
    animal.shelterId.verificationStatus === "approved";

  if (!shelterIsAvailable) {
    return;
  }

  const adopters = await AdopterProfile.find({
    isActive: true,
    homeType: {
      $ne: null,
    },
    hasKids: {
      $ne: null,
    },
    hasOtherPets: {
      $ne: null,
    },
    experienceLevel: {
      $ne: null,
    },
    dailyActivityLevel: {
      $ne: null,
    },
    isAllergic: {
      $ne: null,
    },
    ownerType: {
      $ne: null,
    },
  }).lean();

  for (const adopter of adopters) {
    const matchResult = calculateAnimalMatch(adopter, animal);

    if (matchResult.matchPercentage < MATCH_NOTIFICATION_THRESHOLD) {
      continue;
    }

    // Check whether this animal notification was
    // already sent to the current adopter.
    const existingNotification = await Notification.exists({
      recipientId: adopter.userId,
      type: "animalMatch",
      referenceId: animal._id,
    });

    if (existingNotification) {
      continue;
    }

    try {
      const notification = await Notification.create({
        recipientId: adopter.userId,
        senderId: null,
        type: "animalMatch",
        title: "New matching animal",
        message: `${animal.name} matches your adoption preferences by ${matchResult.matchPercentage}%.`,
        referenceId: animal._id,
        referenceModel: "Animal",
        metadata: {
          matchPercentage: matchResult.matchPercentage,
        },
      });

      // Send the notification immediately to all
      // active devices connected by this adopter.
      getIO().to(`user:${adopter.userId.toString()}`).emit("notification:new", {
        success: true,
        data: notification,
      });
    } catch (error) {
      // A unique database index remains the final
      // protection against concurrent duplicates.
      if (error.code !== 11000) {
        console.error("Failed to create match notification:", error);
      }
    }
  }
};

module.exports = {
  checkAnimalMatchNotifications,
};
