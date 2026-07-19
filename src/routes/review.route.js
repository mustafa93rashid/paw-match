const express = require("express");
const router = express.Router();

const {
  createReview,
  updateReview,
  addReply,
  getTargetReviews
} = require("../controllers/review.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

// =========================================================================
// 1. الروابط العامة (Public Routes - لا تتطلب تسجيل دخول)
// =========================================================================

// جلب كل تقييمات ملجأ أو طبيب معين (ليتمكن الزوار من قراءتها)
router.get("/target/:targetId", getTargetReviews);

// =========================================================================
// 2. الروابط المحمية للمتبنين (Adopter Only Routes)
// =========================================================================

// إضافة تقييم جديد (يتطلب تسجيل دخول + صلاحية متبنٍ فقط)
router.post(
  "/",
  auth,
  role("Adopter"),
  createReview
);

// تعديل تقييم قائم خلال 48 ساعة (يتطلب تسجيل دخول + صلاحية متبنٍ فقط)
router.put(
  "/:id",
  auth,
  role("Adopter"),
  updateReview
);

// =========================================================================
// 3. الروابط المحمية للملاجئ والأطباء (Shelter & Vet Only Routes)
// =========================================================================

// إضافة الرد الرسمي الوحيد على التقييم
router.put(
  "/:id/reply",
  auth,
  role("Shelter", "Vet"), // يُسمح للملجأ أو الطبيب فقط بالرد
  addReply
);

module.exports = router;