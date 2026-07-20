const router = require("express").Router();

const notificationController = require("../controllers/notification.controller");
const notificationValidation = require("../validation/notification.validate");

const auth = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");

// Get current user notifications
router.get("/", [auth], asyncHandler(notificationController.getMyNotifications));

// Get unread notifications count
router.get("/unread-count", [auth], asyncHandler(notificationController.getUnreadCount));

// Mark all notifications as read
router.patch("/read-all", [auth], asyncHandler(notificationController.markAllAsRead));

// Mark one notification as read
router.patch("/:id/read", [auth, notificationValidation.markNotificationAsReadValidation], asyncHandler(notificationController.markAsRead));

module.exports = router;