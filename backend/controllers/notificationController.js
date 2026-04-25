const Notification = require('../models/Notification');
const { isValidObjectId } = require('../utils/validators');

// @desc    Get all notifications for logged-in user
// @route   GET /api/influencer/notifications  OR  /api/brand/notifications
exports.getNotifications = async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 30));
        const filter = { recipientUserId: req.user._id };

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select('_id type title message isRead createdAt senderName senderAvatar campaignRequestId')
                .lean(),
            Notification.countDocuments(filter),
            Notification.countDocuments({ ...filter, isRead: false }),
        ]);

        res.json({
            success: true,
            notifications,
            total,
            unreadCount,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get unread notification count
// @route   GET /api/influencer/notifications/count  OR  /api/brand/notifications/count
exports.getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({
            recipientUserId: req.user._id,
            isRead: false,
        });
        res.json({ success: true, count });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark a notification as read
// @route   PATCH /api/influencer/notifications/:id/read  OR  /api/brand/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid notification ID' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipientUserId: req.user._id },
            { $set: { isRead: true, readAt: new Date() } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, notification });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/influencer/notifications/read-all  OR  /api/brand/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipientUserId: req.user._id, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};
