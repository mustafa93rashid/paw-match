const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    جلب جميع إشعارات المستخدم الحالي (المتبني)
 * @route   GET /api/v1/notifications
 * @access  Private
 */
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ recipientId: req.user._id })
    .populate("senderId", "name avatar") // جلب اسم وصورة الملجأ المرسل
    .populate("referenceId", "name species breed images") // جلب تفاصيل الحيوان المتطابق لفتح صفحته
    .sort({ createdAt: -1 }); // الأحدث أولاً

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

/**
 * @desc    جلب عدد الإشعارات غير المقروءة فقط (لتشغيل عداد الجرس الأحمر 🔔)
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const unreadCount = await Notification.countDocuments({
    recipientId: req.user._id,
    isRead: false
  });

  res.status(200).json({
    success: true,
    unreadCount
  });
});

/**
 * @desc    تحديد إشعار معين كمقروء
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user._id },
    { isRead: true },
    { new: true, runValidators: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "الإشعار غير موجود أو غير مصرح لك بتعديله"
    });
  }

  res.status(200).json({
    success: true,
    message: "تم تحديث حالة الإشعار إلى مقروء",
    data: notification
  });
});

/**
 * @desc    تحديد جميع إشعارات المستخدم كمقروءة دفعة واحدة
 * @route   PUT /api/v1/notifications/mark-all-read
 * @access  Private
 */
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipientId: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: "تم تحديد جميع الإشعارات كمقروءة بنجاح"
  });
});