const Animal = require("../models/Animal");
const AdopterProfile = require("../models/adopterProfile");

/*
|--------------------------------------------------------------------------
| Matching Helper Functions
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

/**
 * حساب نسبة التوافق بين بروفايل المتبني والحيوان.
 *
 * النتيجة النهائية تكون من 0 إلى 100.
 */
const calculateMatchScore = (adopter, animal) => {
  let earnedScore = 0;
  let totalScore = 0;

  /*
  |--------------------------------------------------------------------------
  | 1. نوع الحيوان المفضل - 20 نقطة
  |--------------------------------------------------------------------------
  */

  totalScore += 20;

  if (
    !adopter.preferredSpecies?.length ||
    adopter.preferredSpecies.includes(animal.species)
  ) {
    earnedScore += 20;
  }

  /*
  |--------------------------------------------------------------------------
  | 2. نوع السكن - 20 نقطة
  |--------------------------------------------------------------------------
  */

  totalScore += 20;

  if (
    animal.suitableHomeTypes?.length &&
    animal.suitableHomeTypes.includes(adopter.homeType)
  ) {
    earnedScore += 20;
  } else if (!animal.suitableHomeTypes?.length) {
    // في حال لم يتم تحديد أنواع السكن المناسبة للحيوان،
    // لا يتم معاقبة المستخدم بالكامل.
    earnedScore += 10;
  }

  /*
  |--------------------------------------------------------------------------
  | 3. وجود أطفال - 15 نقطة
  |--------------------------------------------------------------------------
  */

  totalScore += 15;

  if (!adopter.hasKids) {
    earnedScore += 15;
  } else if (animal.goodWithKids === true) {
    earnedScore += 15;
  }

  /*
  |--------------------------------------------------------------------------
  | 4. وجود حيوانات أخرى - 15 نقطة
  |--------------------------------------------------------------------------
  */

  totalScore += 15;

  if (!adopter.hasOtherPets) {
    earnedScore += 15;
  } else if (animal.goodWithOtherPets === true) {
    earnedScore += 15;
  }

  /*
  |--------------------------------------------------------------------------
  | 5. مستوى خبرة المتبني - 10 نقاط
  |--------------------------------------------------------------------------
  */

  totalScore += 10;

  const adopterExperience =
    experienceLevels[adopter.experienceLevel] || 0;

  const requiredExperience =
    experienceLevels[animal.requiredExperienceLevel] || 1;

  if (adopterExperience >= requiredExperience) {
    earnedScore += 10;
  } else if (adopterExperience + 1 === requiredExperience) {
    // توافق جزئي إذا كان الفرق مستوى واحد فقط.
    earnedScore += 5;
  }

  /*
  |--------------------------------------------------------------------------
  | 6. مستوى النشاط - 15 نقطة
  |--------------------------------------------------------------------------
  */

  totalScore += 15;

  const adopterActivity =
    activityLevels[adopter.dailyActivityLevel] || 0;

  const animalActivity =
    activityLevels[animal.activityLevel] || 0;

  const activityDifference = Math.abs(
    adopterActivity - animalActivity,
  );

  if (activityDifference === 0) {
    earnedScore += 15;
  } else if (activityDifference === 1) {
    earnedScore += 8;
  }

  /*
  |--------------------------------------------------------------------------
  | 7. الحساسية - 5 نقاط
  |--------------------------------------------------------------------------
  */

  totalScore += 5;

  if (!adopter.isAllergic) {
    earnedScore += 5;
  } else if (animal.hypoallergenic === true) {
    earnedScore += 5;
  }

  const percentage = Math.round(
    (earnedScore / totalScore) * 100,
  );

  return Math.min(Math.max(percentage, 0), 100);
};

/**
 * تحديد مستوى التوافق اعتماداً على النسبة.
 */
const getMatchLevel = (percentage) => {
  if (percentage >= 80) {
    return "excellent";
  }

  if (percentage >= 60) {
    return "good";
  }

  if (percentage >= 40) {
    return "medium";
  }

  return "low";
};

/**
 * إرجاع أسباب التوافق وعدم التوافق.
 */
const getMatchDetails = (adopter, animal) => {
  const matchedFields = [];
  const unmatchedFields = [];

  /*
  |--------------------------------------------------------------------------
  | نوع الحيوان
  |--------------------------------------------------------------------------
  */

  if (
    !adopter.preferredSpecies?.length ||
    adopter.preferredSpecies.includes(animal.species)
  ) {
    matchedFields.push("species");
  } else {
    unmatchedFields.push("species");
  }

  /*
  |--------------------------------------------------------------------------
  | نوع السكن
  |--------------------------------------------------------------------------
  */

  if (
    animal.suitableHomeTypes?.includes(adopter.homeType)
  ) {
    matchedFields.push("homeType");
  } else {
    unmatchedFields.push("homeType");
  }

  /*
  |--------------------------------------------------------------------------
  | الأطفال
  |--------------------------------------------------------------------------
  */

  if (!adopter.hasKids || animal.goodWithKids === true) {
    matchedFields.push("kids");
  } else {
    unmatchedFields.push("kids");
  }

  /*
  |--------------------------------------------------------------------------
  | الحيوانات الأخرى
  |--------------------------------------------------------------------------
  */

  if (
    !adopter.hasOtherPets ||
    animal.goodWithOtherPets === true
  ) {
    matchedFields.push("otherPets");
  } else {
    unmatchedFields.push("otherPets");
  }

  /*
  |--------------------------------------------------------------------------
  | الخبرة
  |--------------------------------------------------------------------------
  */

  const adopterExperience =
    experienceLevels[adopter.experienceLevel] || 0;

  const requiredExperience =
    experienceLevels[animal.requiredExperienceLevel] || 1;

  if (adopterExperience >= requiredExperience) {
    matchedFields.push("experienceLevel");
  } else {
    unmatchedFields.push("experienceLevel");
  }

  /*
  |--------------------------------------------------------------------------
  | مستوى النشاط
  |--------------------------------------------------------------------------
  */

  const adopterActivity =
    activityLevels[adopter.dailyActivityLevel] || 0;

  const animalActivity =
    activityLevels[animal.activityLevel] || 0;

  if (
    Math.abs(adopterActivity - animalActivity) <= 1
  ) {
    matchedFields.push("activityLevel");
  } else {
    unmatchedFields.push("activityLevel");
  }

  /*
  |--------------------------------------------------------------------------
  | الحساسية
  |--------------------------------------------------------------------------
  */

  if (
    !adopter.isAllergic ||
    animal.hypoallergenic === true
  ) {
    matchedFields.push("allergy");
  } else {
    unmatchedFields.push("allergy");
  }

  return {
    matchedFields,
    unmatchedFields,
  };
};

/*
|--------------------------------------------------------------------------
| Matching Controller
|--------------------------------------------------------------------------
*/

class MatchingController {
  getMatchedAnimals = async (req, res) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | 1. جلب بروفايل المتبني
      |--------------------------------------------------------------------------
      */

      const adopter = await AdopterProfile.findOne({
        userId: req.user._id,
        isActive: true,
      }).lean();

      if (!adopter) {
        return res.status(404).json({
          success: false,
          message:
            "Adopter profile not found. Please complete your profile first.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | 2. التحقق من اكتمال البيانات الأساسية
      |--------------------------------------------------------------------------
      */

      const requiredProfileFields = [
        "homeType",
        "experienceLevel",
        "dailyActivityLevel",
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

      /*
      |--------------------------------------------------------------------------
      | 3. جلب الحيوانات المتاحة والفعالة
      |--------------------------------------------------------------------------
      */

      const animals = await Animal.find({
        adoptionStatus: "available",
        isActive: true,
      })
        .populate(
          "shelterId",
          "name city address logo isActive verificationStatus",
        )
        .populate(
          "addedBy",
          "firstName lastName role",
        )
        .lean();

      /*
      |--------------------------------------------------------------------------
      | 4. استبعاد الحيوانات التابعة لملجأ غير فعال أو غير معتمد
      |--------------------------------------------------------------------------
      */

      const availableAnimals = animals.filter((animal) => {
        if (!animal.shelterId) {
          return false;
        }

        const shelterIsActive =
          animal.shelterId.isActive !== false;

        const shelterIsApproved =
          !animal.shelterId.verificationStatus ||
          animal.shelterId.verificationStatus ===
            "approved";

        return shelterIsActive && shelterIsApproved;
      });

      /*
      |--------------------------------------------------------------------------
      | 5. حساب نسبة التوافق لكل حيوان
      |--------------------------------------------------------------------------
      */

      const matchedAnimals = availableAnimals.map(
        (animal) => {
          const matchPercentage =
            calculateMatchScore(adopter, animal);

          const matchDetails = getMatchDetails(
            adopter,
            animal,
          );

          return {
            ...animal,

            matchPercentage,

            matchLevel:
              getMatchLevel(matchPercentage),

            matchedFields:
              matchDetails.matchedFields,

            unmatchedFields:
              matchDetails.unmatchedFields,
          };
        },
      );

      /*
      |--------------------------------------------------------------------------
      | 6. ترتيب الحيوانات من أعلى نسبة توافق إلى الأقل
      |--------------------------------------------------------------------------
      */

      matchedAnimals.sort(
        (firstAnimal, secondAnimal) =>
          secondAnimal.matchPercentage -
          firstAnimal.matchPercentage,
      );

      /*
      |--------------------------------------------------------------------------
      | 7. إرجاع النتيجة
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,
        message:
          "Matched animals retrieved successfully",
        count: matchedAnimals.length,
        data: matchedAnimals,
      });
    } catch (error) {
      console.error(
        "Get matched animals error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Server Error: Failed to calculate animal matches",
      });
    }
  };
}

module.exports = new MatchingController();