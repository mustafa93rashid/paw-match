const AdopterProfile = require("../models/AdopterProfile");
const Notification = require("../models/Notification");
const Shelter = require("../models/Shelter");

//zain-edit
const calculateMatchScore = (adopter, animal, shelter) => {
  if (!adopter || !animal || !animal.requirements || !shelter) return 0;

  // 🛑 الفلترة الإلزامية المزدوجة: إذا لم يتطابق الفصيل أو المدينة، النسبة صفر فوراً دون حساب باقي النقاط
  const adopterSpecies = adopter.preferences?.species || adopter.species; 
  if (animal.species !== adopterSpecies || shelter.city !== adopter.city) {
    return 0;
  }

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

//zain
/**
 * 2. الدالة الجديدة المسؤولة عن تشغيل المحرك وجلب المتبنين وإرسال الإشعارات جماعياً
 */
const runSmartMatchEngine = async (animal) => {
  try {
    // جلب بيانات الملجأ لمعرفة موقع الحيوان الحالي
    const shelter = await Shelter.findById(animal.shelterId);
    if (!shelter) return;

    // جلب كل بروفايلات المتبنين من قاعدة البيانات مع بيانات حساباتهم
    const adopters = await AdopterProfile.find().populate("userId");
    const notificationsToInsert = [];

    // الدوران على المتبنين لحساب النسبة لكل شخص بناءً على كودك الحالي
    for (const adopter of adopters) {
      if (!adopter.userId) continue; // تخطي الحساب إذا كان المستخدم محذوفاً

      // استدعاء دالة الحساب المحدثة
      const score = calculateMatchScore(adopter, animal, shelter);

      // شرط اتخاذ القرار: إذا حقق المتبني 80% أو أكثر، نجهز له مستند الإشعار
      if (score >= 80) {
        notificationsToInsert.push({
          recipientId: adopter.userId._id,
          senderId: animal.shelterId,
          type: "SMART_MATCH",
          title: `🐾 تطابق ذكي بنسبة ${score}%!`,
          message: `خبر رائع! أضاف ملجأ "${shelter.name}" الحيوان "${animal.name}" الذي يطابق تفضيلاتك بنسبة عالية جداً. اضغط لمشاهدته.`,
          referenceId: animal._id,
          matchScore: score
        });
      }
    }

    // الإدخال الجماعي السريع والمحمي في قاعدة البيانات (Bulk Insert)
    if (notificationsToInsert.length > 0) {
      await Notification.insertMany(notificationsToInsert, { ordered: false });
    }

  } catch (error) {
    console.error("خطأ أثناء تشغيل محرك الإشعارات الذكي:", error.message);
  }
};
module.exports =  {calculateMatchScore, runSmartMatchEngine} ;