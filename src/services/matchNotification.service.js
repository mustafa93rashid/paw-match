const Animal = require("../models/Animal");
const AdopterProfile = require("../models/AdopterProfile");
const Notification = require("../models/Notification");

const { calculateAnimalMatch } = require("./matching.service");

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
      // Real-time push was previously attempted here via
      // config/socket.js's getIO(), but that module's initializeSocket()
      // is never called anywhere in app.js (app.js wires up the unrelated,
      // no-op utils/socket.js instead), so getIO() always threw
      // "Socket.IO has not been initialized" — every call landed in the
      // catch below, silently discarding the error and leaving the
      // Notification document as the only durable record of the match.
      // The frontend (see @paw-match/hooks's notifications.ts) also never
      // connects a socket client at all, by deliberate design: this app's
      // access token is httpOnly-cookie-only and is never exposed to
      // client-side JS, so there's no token available to satisfy
      // config/socket.js's required `socket.handshake.auth.token`. Delivery
      // is therefore API-only — the adopter-facing notification hooks poll
      // GET /notifications/unread-count on an interval and on window focus.
      await Notification.create({
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
