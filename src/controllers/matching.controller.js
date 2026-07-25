const Animal = require("../models/Animal");
const AdopterProfile = require("../models/AdopterProfile");

const {calculateAnimalMatch,getMatchLevel} = require("../services/matching.service");

/*
|--------------------------------------------------------------------------
| Matching Controller
|--------------------------------------------------------------------------
*/

class MatchingController {
  // ==================================================
  // Get Matched Animals
  // ==================================================
  getMatchedAnimals = async (req, res) => {
    // • Retrieves the current adopter profile.
    // • Ensures all required matching fields are complete.
    // • Retrieves available animals from approved shelters.
    // • Calculates and sorts animals by compatibility.
    // ==================================================

    const adopter = await AdopterProfile.findOne({
      userId: req.user.id,
      isActive: true,
    }).lean();

    if (!adopter) {
      return res.status(404).json({
        success: false,
        message:
          "Adopter profile not found or inactive. Please complete your profile first.",
      });
    }

    // Ensure the profile contains all information
    // required by the matching algorithm.
    const requiredProfileFields = [
      "homeType",
      "hasKids",
      "hasOtherPets",
      "experienceLevel",
      "dailyActivityLevel",
      "isAllergic",
      "ownerType",
    ];

    const missingFields = requiredProfileFields.filter(
      (field) =>
        adopter[field] === undefined ||
        adopter[field] === null ||
        adopter[field] === "",
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please complete the required adopter profile fields before using the matching system.",
        missingFields,
      });
    }

    const animals = await Animal.find({
      adoptionStatus: "available",
      isActive: true,
    })
      .populate(
        "shelterId",
        "name city address logo isActive isVerified verificationStatus",
      )
      .populate("addedBy", "firstName lastName role")
      .lean();

    // Exclude animals belonging to an inactive,
    // unverified, or unapproved shelter.
    const availableAnimals = animals.filter((animal) => {
      if (!animal.shelterId) {
        return false;
      }

      return (
        animal.shelterId.isActive === true &&
        animal.shelterId.isVerified === true &&
        animal.shelterId.verificationStatus === "approved"
      );
    });

    const matchedAnimals = availableAnimals.map((animal) => {
      const matchResult = calculateAnimalMatch(adopter, animal);

      return {
        ...animal,
        matchPercentage: matchResult.matchPercentage,
        matchLevel: getMatchLevel(matchResult.matchPercentage),
        matchedFields: matchResult.matchedFields,
        partialMatchedFields: matchResult.partialMatchedFields,
        unmatchedFields: matchResult.unmatchedFields,
      };
    });

    // Return animals from the highest match
    // percentage to the lowest.
    matchedAnimals.sort(
      (firstAnimal, secondAnimal) =>
        secondAnimal.matchPercentage - firstAnimal.matchPercentage,
    );

    return res.status(200).json({
      success: true,
      message: "Matched animals retrieved successfully",
      count: matchedAnimals.length,
      data: matchedAnimals,
    });
  };
}

module.exports = new MatchingController();
