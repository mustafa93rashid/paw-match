const AdopterProfile = require("../models/AdopterProfile");
const Notification = require("../models/Notification");
const Shelter = require("../models/Shelter");
const { getIo, getSocketId } = require("../utils/socket"); // استيراد الـ WebSocket


const calculateMatchScore = (adopter, animal, shelter) => {
  if (!adopter || !animal || !animal.requirements || !shelter) return 0;

  // 🛑 الفلترة الإلزامية المزدوجة
  const adopterSpecies = adopter.preferences?.species || adopter.species; 
  if (animal.species !== adopterSpecies || shelter.city !== adopter.city) {
    return 0;
  }

  let totalScore = 0;

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

const runSmartMatchEngine = async (animal) => {
  try {
    const shelter = await Shelter.findById(animal.shelterId);
    if (!shelter) return;

    const adopters = await AdopterProfile.find().populate("userId");
    const notificationsToInsert = [];

    for (const adopter of adopters) {
      if (!adopter.userId) continue;

      const score = calculateMatchScore(adopter, animal, shelter);

      if (score >= 80) {
        notificationsToInsert.push({
          recipientId: adopter.userId._id,
          senderId: animal.shelterId,
          type: "SMART_MATCH",
          title: `🐾 تطابق ذكي بنسبة ${score}%!`,
          message: `خبر رائع! أضاف ملجأ "${shelter.name}" الحيوان "${animal.name}" الذي يطابق تفضيلاتك بنسبة ${score}%.`,
          referenceId: animal._id,
          matchScore: score
        });
      }
    }

    if (notificationsToInsert.length > 0) {
      const savedNotifications = await Notification.insertMany(notificationsToInsert, { ordered: false });
      
      // إرسال الإشعارات عبر الـ WebSocket
      const io = getIo();
      savedNotifications.forEach(notif => {
        const socketId = getSocketId(notif.recipientId.toString());
        if (socketId) {
          io.to(socketId).emit("newNotification", notif);
        }
      });
    }
  } catch (error) {
    console.error("خطأ في محرك التطابق:", error.message);
  }
};

module.exports = { calculateMatchScore, runSmartMatchEngine };