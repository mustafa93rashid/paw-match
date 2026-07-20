const Notification = require("../models/Notification");

/*
|--------------------------------------------------------------------------
| Notification Controller
|--------------------------------------------------------------------------
*/

class NotificationController {
  // ==================================================
  // Get My Notifications
  // ==================================================
  getMyNotifications = async (req, res) => {
    // • Retrieves all notifications belonging to
    //   the current authenticated user.
    // • Returns the newest notifications first.
    // ==================================================

    const notifications = await Notification.find({
      recipientId: req.user.id,
    })
      .populate(
        "senderId",
        "firstName lastName profileImage",
      )
      .populate(
        "referenceId",
        "name species breed images adoptionStatus",
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  };

  // ==================================================
  // Get Unread Count
  // ==================================================
  getUnreadCount = async (req, res) => {
    // • Counts unread notifications for the current user.
    // • Used to display the notification bell badge.
    // ==================================================

    const count = await Notification.countDocuments({
      recipientId: req.user.id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      count,
    });
  };

  // ==================================================
  // Mark Notification as Read
  // ==================================================
  markAsRead = async (req, res) => {
    // • Marks one notification as read.
    // • Ensures the notification belongs to
    //   the current authenticated user.
    // ==================================================

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          recipientId: req.user.id,
        },
        {
          isRead: true,
          readAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        },
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  };

  // ==================================================
  // Mark All Notifications as Read
  // ==================================================
  markAllAsRead = async (req, res) => {
    // • Marks all unread notifications belonging
    //   to the current user as read.
    // ==================================================

    const result = await Notification.updateMany(
      {
        recipientId: req.user.id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  };
}

module.exports = new NotificationController();