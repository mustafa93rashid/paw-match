const calculateMatchScore = (adopter, animal) => {
  if (!adopter || !animal || !animal.requirements) return 0;

  let totalScore = 0;
  let maxPossibleScore = 100;

  // 1. Home Type Matching (Weight: 20)
  if (animal.requirements.homeType === 'any' || 
      animal.requirements.homeType === adopter.homeType) {
    totalScore += 20;
  }

  // 2. Experience Level Matching (Weight: 20)
  if (animal.requirements.experienceLevel === 'any' || 
      animal.requirements.experienceLevel === adopter.experienceLevel) {
    totalScore += 20;
  }

  // 3. Daily Activity Level (Weight: 20)
  if (animal.requirements.dailyActivityLevel === adopter.dailyActivityLevel) {
    totalScore += 20;
  }

  // 4. Owner Type (Weight: 20)
  if (animal.requirements.ownerType === 'any' || 
      animal.requirements.ownerType === adopter.ownerType) {
    totalScore += 20;
  }

  // 5. Lifestyle Compatibility (Weight: 20)
  let subPoints = 0;
  
  if (adopter.hasKids === true && animal.requirements.suitableForKids === true) {
    subPoints += 7;
  } else if (adopter.hasKids === false) { 
    subPoints += 7; 
  }

  if (adopter.isAllergic === false || animal.requirements.isAllergic === false) {
    subPoints += 7;
  }

  if (adopter.hasOtherPets === true && animal.requirements.goodWithOtherPets === true) {
    subPoints += 6;
  } else if (adopter.hasOtherPets === false) {
    subPoints += 6;
  }

  totalScore += subPoints;

  return Math.min(totalScore, 100);
};

module.exports =  {calculateMatchScore} ;