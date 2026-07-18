const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = require("../controllers/notification.controller");

// استدعاء الميدلوير الخاص بالتحقق من تسجيل الدخول
const auth = require("../middlewares/auth");

// جميع الروابط أدناه محمية وتتطلب تسجيل دخول إلزامي
router.use(auth);

// رابط جلب الإشعارات ورابط تحويل الكل كمقروء
router.get("/", getMyNotifications);
router.put("/mark-all-read", markAllAsRead);

// رابط جلب عداد الجرس الأحمر
router.get("/unread-count", getUnreadCount);

// رابط تحويل إشعار منفرد كمقروء عبر الـ ID
router.put("/:id/read", markAsRead);

module.exports = router;