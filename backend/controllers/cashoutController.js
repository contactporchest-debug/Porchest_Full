const Cashout = require('../models/Cashout');
const InfluencerProfile = require('../models/InfluencerProfile');
const { isValidObjectId } = require('../utils/validators');
const { deliverUserNotification } = require('../services/notificationDeliveryService');

exports.listCashouts = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (status && status !== 'all') {
            filter.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [cashouts, total] = await Promise.all([
            Cashout.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Cashout.countDocuments(filter),
        ]);

        const influencerIds = [...new Set(cashouts.map((cashout) => String(cashout.influencerUserId)).filter(Boolean))];
        const profiles = await InfluencerProfile.find({ userId: { $in: influencerIds } })
            .select('userId fullName instagramUsername profilePictureUrl')
            .lean();
        const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));

        res.json({
            success: true,
            cashouts: cashouts.map((cashout) => ({
                ...cashout,
                influencer: profileMap.get(String(cashout.influencerUserId)) || null,
            })),
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });
    } catch (error) {
        next(error);
    }
};

exports.reviewCashout = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, transactionId, rejectionReason } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid cashout ID' });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid cashout review status' });
        }

        const cashout = await Cashout.findById(id);
        if (!cashout) {
            return res.status(404).json({ success: false, message: 'Cashout not found' });
        }

        cashout.status = status;
        cashout.reviewedAt = new Date();
        cashout.reviewedByFK = req.user._id;

        if (status === 'approved') {
            cashout.processedAt = new Date();
            cashout.transactionId = transactionId || `TX-${cashout.cashoutCode}-${Date.now()}`;
        } else {
            cashout.rejectionReason = rejectionReason || 'Cashout request was rejected.';
        }

        await cashout.save();

        const influencerProfile = await InfluencerProfile.findOne({ userId: cashout.influencerUserId })
            .select('fullName instagramUsername')
            .lean();

        await deliverUserNotification({
            recipientUserId: cashout.influencerUserId,
            type: status === 'approved' ? 'cashout_approved' : 'cashout_rejected',
            title: status === 'approved' ? 'Cashout approved' : 'Cashout rejected',
            message: status === 'approved'
                ? `Your cashout for $${Number(cashout.amount).toFixed(2)} has been approved.`
                : `Your cashout for $${Number(cashout.amount).toFixed(2)} was rejected.`,
            metadata: {
                cashoutId: cashout._id,
                amount: cashout.amount,
                transactionId: cashout.transactionId,
                rejectionReason: cashout.rejectionReason,
            },
            emailSubject: status === 'approved'
                ? 'Your Porchest cashout has been approved'
                : 'Your Porchest cashout was rejected',
            emailMessage: status === 'approved'
                ? `Your cashout request for $${Number(cashout.amount).toFixed(2)} has been approved. Transaction ID: ${cashout.transactionId}.`
                : `Your cashout request for $${Number(cashout.amount).toFixed(2)} was rejected. ${cashout.rejectionReason || ''}`,
        });

        res.json({
            success: true,
            cashout: {
                ...cashout.toObject(),
                influencer: influencerProfile || null,
            },
        });
    } catch (error) {
        next(error);
    }
};
