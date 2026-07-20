/*
|--------------------------------------------------------------------------
| Matching Configuration
|--------------------------------------------------------------------------
*/

const experienceLevels = {
  beginner: 1,
  intermediate: 2,
  expert: 3,
};

const activityLevels = {
  low: 1,
  medium: 2,
  high: 3,
};

const matchingWeights = {
  species: 20,
  homeType: 15,
  kids: 15,
  otherPets: 15,
  experienceLevel: 10,
  activityLevel: 15,
  ownerType: 5,
  allergy: 5,
};

/*
|--------------------------------------------------------------------------
| Matching Service
|--------------------------------------------------------------------------
*/

// ==================================================
// Calculate Animal Match
// ==================================================
const calculateAnimalMatch = (adopter, animal) => {
  // • Calculates the compatibility score between
  //   an adopter profile and an animal.
  // • Classifies fields as matched, partially matched,
  //   or unmatched.
  // • Limits the final score between 0 and 100.
  // ==================================================

  let earnedScore = 0;

  const matchedFields = [];
  const partialMatchedFields = [];
  const unmatchedFields = [];

  const requirements = animal.requirements || {};

  // Check the preferred animal species.
  if (
    !adopter.preferredSpecies?.length ||
    adopter.preferredSpecies.includes(animal.species)
  ) {
    earnedScore += matchingWeights.species;
    matchedFields.push("species");
  } else {
    unmatchedFields.push("species");
  }

  // Check the adopter home against
  // the animal home requirement.
  if (
    requirements.homeType === "any" ||
    requirements.homeType === adopter.homeType
  ) {
    earnedScore += matchingWeights.homeType;
    matchedFields.push("homeType");
  } else {
    unmatchedFields.push("homeType");
  }

  // The kids requirement only affects adopters
  // who currently have children.
  if (
    adopter.hasKids === false ||
    requirements.suitableForKids === true
  ) {
    earnedScore += matchingWeights.kids;
    matchedFields.push("kids");
  } else {
    unmatchedFields.push("kids");
  }

  // The other pets requirement only affects adopters
  // who currently own other animals.
  if (
    adopter.hasOtherPets === false ||
    requirements.goodWithOtherPets === true
  ) {
    earnedScore += matchingWeights.otherPets;
    matchedFields.push("otherPets");
  } else {
    unmatchedFields.push("otherPets");
  }

  // Compare the adopter experience level with
  // the animal required experience level.
  if (requirements.experienceLevel === "any") {
    earnedScore += matchingWeights.experienceLevel;
    matchedFields.push("experienceLevel");
  } else {
    const adopterExperience =
      experienceLevels[adopter.experienceLevel] || 0;

    const requiredExperience =
      experienceLevels[requirements.experienceLevel] || 0;

    if (adopterExperience >= requiredExperience) {
      earnedScore += matchingWeights.experienceLevel;
      matchedFields.push("experienceLevel");
    } else if (
      adopterExperience + 1 === requiredExperience
    ) {
      earnedScore +=
        matchingWeights.experienceLevel / 2;

      partialMatchedFields.push(
        "experienceLevel",
      );
    } else {
      unmatchedFields.push("experienceLevel");
    }
  }

  const adopterActivity =
    activityLevels[adopter.dailyActivityLevel] || 0;

  const animalActivity =
    activityLevels[
      requirements.dailyActivityLevel
    ] || 0;

  const activityDifference = Math.abs(
    adopterActivity - animalActivity,
  );

  // Give partial points when the activity levels
  // differ by one level only.
  if (activityDifference === 0) {
    earnedScore += matchingWeights.activityLevel;
    matchedFields.push("activityLevel");
  } else if (activityDifference === 1) {
    earnedScore +=
      matchingWeights.activityLevel / 2;

    partialMatchedFields.push("activityLevel");
  } else {
    unmatchedFields.push("activityLevel");
  }

  // Check the adopter type against
  // the animal owner type requirement.
  if (
    requirements.ownerType === "any" ||
    requirements.ownerType === adopter.ownerType
  ) {
    earnedScore += matchingWeights.ownerType;
    matchedFields.push("ownerType");
  } else {
    unmatchedFields.push("ownerType");
  }

  // Allergy compatibility only affects adopters
  // who have allergies.
  if (
    adopter.isAllergic === false ||
    requirements.hypoallergenic === true
  ) {
    earnedScore += matchingWeights.allergy;
    matchedFields.push("allergy");
  } else {
    unmatchedFields.push("allergy");
  }

  const matchPercentage = Math.round(earnedScore);

  return {
    matchPercentage: Math.min(
      Math.max(matchPercentage, 0),
      100,
    ),
    matchedFields,
    partialMatchedFields,
    unmatchedFields,
  };
};

// ==================================================
// Get Match Level
// ==================================================
const getMatchLevel = (matchPercentage) => {
  // • Converts the match percentage into
  //   a readable compatibility level.
  // ==================================================

  if (matchPercentage >= 80) {
    return "excellent";
  }

  if (matchPercentage >= 60) {
    return "good";
  }

  if (matchPercentage >= 40) {
    return "medium";
  }

  return "low";
};

module.exports = {
  calculateAnimalMatch,
  getMatchLevel,
};