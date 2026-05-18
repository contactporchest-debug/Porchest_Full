const User = require('../models/User');
const CampaignRequest = require('../models/CampaignRequest');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const SoftwareClientProfile = require('../models/SoftwareClientProfile');
const Notification = require('../models/Notification');
const { sendCampaignEmailNotification } = require('../services/notificationDeliveryService');
const { deleteInstagramRawDataForUser } = require('../services/instagramRetentionService');
const { generateUniqueCode } = require('../utils/generateCode');
const { ADMIN_ROLES, USER_ROLES } = require('../utils/accessRoles');

/* ─── Helpers ─────────────────────────────────────────────── */
const ok  = (res, data = {}) => res.status(200).json({ success: true, ...data });
const err = (res, msg, code = 500) => res.status(code).json({ success: false, message: msg });

function sanitizeAdminUserFields(user) {
    return user;
}

async function removeRoleSpecificProfiles(user) {
    const ops = [];

    if (user.brandProfileId) {
        ops.push(BrandProfile.findByIdAndDelete(user.brandProfileId));
    }

    if (user.influencerProfileId) {
        ops.push(InfluencerProfile.findByIdAndDelete(user.influencerProfileId));
    }

    if (user.softwareClientProfileId) {
        ops.push(SoftwareClientProfile.findByIdAndDelete(user.softwareClientProfileId));
    }

    await Promise.all(ops);
}

async function hardDeleteUserData(user) {
    await deleteInstagramRawDataForUser(user._id);

    const brandProfiles = await BrandProfile.find({
        $or: [
            { userId: user._id },
            ...(user.brandProfileId ? [{ _id: user.brandProfileId }] : []),
        ],
    }).select('_id');

    const influencerProfiles = await InfluencerProfile.find({
        $or: [
            { userId: user._id },
            ...(user.influencerProfileId ? [{ _id: user.influencerProfileId }] : []),
        ],
    }).select('_id');

    const softwareClientProfiles = await SoftwareClientProfile.find({
        $or: [
            { userId: user._id },
            ...(user.softwareClientProfileId ? [{ _id: user.softwareClientProfileId }] : []),
        ],
    }).select('_id');

    const brandProfileIds = brandProfiles.map((profile) => profile._id);
    const influencerProfileIds = influencerProfiles.map((profile) => profile._id);
    const softwareClientProfileIds = softwareClientProfiles.map((profile) => profile._id);

    const campaignRequests = await CampaignRequest.find({
        $or: [
            { brandUserId: user._id },
            { influencerUserId: user._id },
            ...(brandProfileIds.length ? [{ brandProfileId: { $in: brandProfileIds } }] : []),
            ...(influencerProfileIds.length ? [{ influencerProfileId: { $in: influencerProfileIds } }] : []),
        ],
    }).select('_id');

    const campaignRequestIds = campaignRequests.map((request) => request._id);

    await Promise.all([
        brandProfileIds.length
            ? BrandProfile.deleteMany({ _id: { $in: brandProfileIds } })
            : Promise.resolve(),
        influencerProfileIds.length
            ? InfluencerProfile.deleteMany({ _id: { $in: influencerProfileIds } })
            : Promise.resolve(),
        softwareClientProfileIds.length
            ? SoftwareClientProfile.deleteMany({ _id: { $in: softwareClientProfileIds } })
            : Promise.resolve(),
        campaignRequestIds.length
            ? CampaignRequest.deleteMany({ _id: { $in: campaignRequestIds } })
            : Promise.resolve(),
        Notification.deleteMany({
            $or: [
                { recipientUserId: user._id },
                ...(campaignRequestIds.length ? [{ campaignRequestId: { $in: campaignRequestIds } }] : []),
            ],
        }),
        User.deleteOne({ _id: user._id }),
    ]);
}

async function ensureProfileForRole(user, role) {
    if (role === 'brand' && !user.brandProfileId) {
        const brandProfileId = await generateUniqueCode('BRD', BrandProfile, 'brandProfileId');
        const profile = await BrandProfile.create({
            userId: user._id,
            brandProfileId,
            businessName: user.brandName || user.companyName || user.email.split('@')[0] || 'Brand',
            brandName: user.brandName || user.companyName || user.email.split('@')[0] || 'Brand',
        });
        user.brandProfileId = profile._id;
    }

    if (role === 'influencer' && !user.influencerProfileId) {
        const influencerProfileId = await generateUniqueCode('INF', InfluencerProfile, 'influencerProfileId');
        const profile = await InfluencerProfile.create({
            userId: user._id,
            influencerProfileId,
            fullName: user.fullName || user.displayName || user.email.split('@')[0] || 'Influencer',
            displayName: user.displayName || user.fullName || user.email.split('@')[0] || 'Influencer',
        });
        user.influencerProfileId = profile._id;
    }

    if (!['brand', 'influencer', 'software-client'].includes(role)) {
        user.brandProfileId = undefined;
        user.influencerProfileId = undefined;
        user.softwareClientProfileId = undefined;
    }
}

function emitAdminEvent(req, userIds, event, payload) {
    const io = req.app?.locals?.io;
    if (!io) return;
    userIds.filter(Boolean).forEach((userId) => {
        io.to(`user-${userId}`).emit(event, payload);
    });
}

async function getAdminRecipients() {
    return User.find({ role: { $in: ADMIN_ROLES }, status: { $ne: 'suspended' } }).select('_id fullName email').lean();
}

async function enrichPaymentRecord(doc) {
    const [brandProfile, influencerProfile, brandUser, influencerUser] = await Promise.all([
        BrandProfile.findById(doc.brandId || doc.brandProfileId).select('businessName brandName logo website userId').lean(),
        InfluencerProfile.findById(doc.influencerId || doc.influencerProfileId).select('displayName fullName igUsername avatar igProfileUrl userId').lean(),
        User.findById(doc.brandUserId).select('email fullName').lean(),
        User.findById(doc.influencerUserId).select('email fullName').lean(),
    ]);

    return {
        ...doc,
        brandProfile: brandProfile || null,
        influencerProfile: influencerProfile || null,
        brandUser: brandUser || null,
        influencerUser: influencerUser || null,
        brandName: doc.brandName || brandProfile?.businessName || brandProfile?.brandName || '',
        influencerName: doc.influencerName || influencerProfile?.displayName || influencerProfile?.fullName || '',
        influencerUsername: doc.influencerUsername || influencerProfile?.igUsername || '',
        payment_status: doc.payment_status || 'pending',
    };
}

/* ─── GET /api/admin/stats ────────────────────────────────── */
exports.getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalBrands,
            totalInfluencers,
            totalSoftwareClients,
            totalAdmins,
            pendingUsers,
            pendingPayments,
            totalRequests,
            pendingRequests,
            acceptedRequests,
            activeRequests,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'brand' }),
            User.countDocuments({ role: 'influencer' }),
            User.countDocuments({ role: 'software-client' }),
            User.countDocuments({ role: { $in: ADMIN_ROLES } }),
            User.countDocuments({ status: 'pending' }),
            CampaignRequest.countDocuments({ payment_status: { $in: ['pending', 'proof_submitted'] } }),
            CampaignRequest.countDocuments(),
            CampaignRequest.countDocuments({ status: 'sent' }),
            CampaignRequest.countDocuments({ status: 'accepted' }),
            CampaignRequest.countDocuments({ status: { $in: ['accepted', 'deal_closed'] } }),
        ]);

        return ok(res, {
            stats: {
                totalUsers,
                totalBrands,
                totalInfluencers,
                totalSoftwareClients,
                totalAdmins,
                pendingUsers,
                pendingVerifications: pendingUsers, // use pending users as verification proxy
                pendingPayments,
                totalRequests,
                pendingRequests,
                acceptedRequests,
                activeRequests,
            },
        });
    } catch (e) {
        console.error('[Admin] getStats error:', e);
        return err(res, 'Failed to fetch stats');
    }
};

/* ─── GET /api/admin/users ────────────────────────────────── */
exports.getUsers = async (req, res) => {
    try {
        const { role, status, search, page = 1, limit = 50 } = req.query;
        const query = {};
        if (role)   query.role   = role;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password -otp -otpExpires')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            User.countDocuments(query),
        ]);

        return ok(res, {
            users: users.map((user) => sanitizeAdminUserFields(user)),
            total,
            page: Number(page),
            limit: Number(limit),
        });
    } catch (e) {
        console.error('[Admin] getUsers error:', e);
        return err(res, 'Failed to fetch users');
    }
};

/* ─── PATCH /api/admin/users/:id/status ──────────────────── */
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'active', 'suspended'].includes(status))
            return err(res, 'Invalid status', 400);

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, select: '-password -otp -otpExpires' }
        );
        if (!user) return err(res, 'User not found', 404);

        // Notify user via Socket.IO
        const io = req.app.locals.io;
        io.to(`user-${user._id}`).emit('status-update', {
            message: `Your account status has been updated to: ${status}.`,
            status: user.status,
        });

        return ok(res, { user: sanitizeAdminUserFields(user.toObject()) });
    } catch (e) {
        console.error('[Admin] updateUserStatus error:', e);
        return err(res, 'Failed to update status');
    }
};

/* ─── PATCH /api/admin/users/:id/role ────────────────────── */
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!USER_ROLES.includes(role))
            return err(res, 'Invalid role', 400);

        const user = await User.findById(req.params.id).select('-password -otp -otpExpires');
        if (!user) return err(res, 'User not found', 404);

        if (role !== 'brand') user.set('brandProfileId', undefined);
        if (role !== 'influencer') user.set('influencerProfileId', undefined);
        if (role !== 'software-client') user.set('softwareClientProfileId', undefined);
        await ensureProfileForRole(user, role);

        user.role = role;
        await user.save();

        // Notify user via Socket.IO
        const io = req.app.locals.io;
        io.to(`user-${user._id}`).emit('role-update', {
            message: `Your account role has been updated to: ${role}.`,
            role: user.role,
        });

        return ok(res, { user: sanitizeAdminUserFields(user.toObject()) });
    } catch (e) {
        console.error('[Admin] updateUserRole error:', e);
        return err(res, 'Failed to update role');
    }
};

/* ─── DELETE /api/admin/users/:id ────────────────────────── */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -otp -otpExpires');
        if (!user) return err(res, 'User not found', 404);

        await hardDeleteUserData(user);
        return ok(res, { message: 'User deleted' });
    } catch (e) {
        console.error('[Admin] deleteUser error:', e);
        return err(res, 'Failed to delete user');
    }
};

/* ─── GET /api/admin/requests ────────────────────────────── */
exports.getRequests = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 30 } = req.query;
        const query = {};
        if (status && status !== 'all') query.status = status;
        if (search) {
            query.$or = [
                { campaignTitle: { $regex: search, $options: 'i' } },
                { brandName: { $regex: search, $options: 'i' } },
                { influencerName: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [requests, total] = await Promise.all([
            CampaignRequest.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            CampaignRequest.countDocuments(query),
        ]);

        return ok(res, { requests, total });
    } catch (e) {
        console.error('[Admin] getRequests error:', e);
        return err(res, 'Failed to fetch requests');
    }
};

/* ─── GET /api/admin/payments ────────────────────────────── */
exports.getPayments = async (req, res) => {
    try {
        const { status = 'pending,proof_submitted', search, page = 1, limit = 50 } = req.query;
        const statuses = String(status)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        const query = {
            payment_status: statuses.length ? { $in: statuses } : { $in: ['pending', 'proof_submitted'] },
        };

        if (search) {
            query.$or = [
                { campaignTitle: { $regex: search, $options: 'i' } },
                { brandName: { $regex: search, $options: 'i' } },
                { influencerName: { $regex: search, $options: 'i' } },
                { influencerUsername: { $regex: search, $options: 'i' } },
                { payment_method: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [payments, total] = await Promise.all([
            CampaignRequest.find(query)
                .sort({ payment_timestamp: -1, updatedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            CampaignRequest.countDocuments(query),
        ]);

        const enriched = await Promise.all(payments.map((item) => enrichPaymentRecord(item)));
        return ok(res, {
            payments: enriched,
            total,
            page: Number(page),
            limit: Number(limit),
        });
    } catch (e) {
        console.error('[Admin] getPayments error:', e);
        return err(res, 'Failed to fetch payments');
    }
};

/* ─── PATCH /api/admin/payments/:id/verify ──────────────── */
exports.verifyPayment = async (req, res) => {
    try {
        const campaign = await CampaignRequest.findById(req.params.id).lean();
        if (!campaign) return err(res, 'Campaign not found', 404);
        if (!['proof_submitted', 'pending'].includes(String(campaign.payment_status || 'pending'))) {
            return err(res, 'Payment is not ready for verification', 400);
        }

        const now = new Date();
        const updated = await CampaignRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    payment_status: 'verified',
                    brandPaymentStatus: 'paid',
                    brandPaymentReceivedAt: now,
                    status: 'brand_paid_work_can_start',
                    campaignActiveAt: null,
                },
            },
            { new: true, strict: false }
        ).lean();

        const [brandUser, influencerUser] = await Promise.all([
            User.findById(campaign.brandUserId).select('email fullName').lean(),
            User.findById(campaign.influencerUserId).select('email fullName').lean(),
        ]);

        const title = 'Payment verified';
        const message = `Payment for "${campaign.campaignTitle || 'your collaboration'}" has been verified. The campaign can now move into production.`;
        await Promise.all([
            sendCampaignEmailNotification({
                email: brandUser?.email,
                subject: title,
                title,
                message,
                actionText: 'View collaboration',
                actionHref: `/dashboard/brand/collaborations?request=${campaign._id}`,
            }),
            sendCampaignEmailNotification({
                email: influencerUser?.email,
                subject: title,
                title,
                message: `Payment for "${campaign.campaignTitle || 'your collaboration'}" has been verified. You can now start production.`,
                actionText: 'View collaboration',
                actionHref: `/dashboard/influencer/collaborations?request=${campaign._id}`,
            }),
        ]);

        await Notification.insertMany([
            {
                recipientUserId: campaign.brandUserId,
                type: 'system',
                title,
                message,
                campaignRequestId: campaign._id,
                metadata: { action: 'verify-payment', payment_status: 'verified' },
            },
            {
                recipientUserId: campaign.influencerUserId,
                type: 'system',
                title,
                message: `Payment for "${campaign.campaignTitle || 'your collaboration'}" has been verified. You can now start production.`,
                campaignRequestId: campaign._id,
                metadata: { action: 'verify-payment', payment_status: 'verified' },
            },
        ]).catch((error) => {
            console.error('[Admin] verifyPayment notification error:', error);
        });

        emitAdminEvent(req, [campaign.brandUserId, campaign.influencerUserId], 'collaboration:updated', {
            collaborationId: campaign._id,
            status: 'brand_paid_work_can_start',
            payment_status: 'verified',
            action: 'verify-payment',
        });

        return ok(res, { payment: await enrichPaymentRecord(updated) });
    } catch (e) {
        console.error('[Admin] verifyPayment error:', e);
        return err(res, 'Failed to verify payment');
    }
};

/* ─── PATCH /api/admin/payments/:id/reject ───────────────── */
exports.rejectPayment = async (req, res) => {
    try {
        const campaign = await CampaignRequest.findById(req.params.id).lean();
        if (!campaign) return err(res, 'Campaign not found', 404);

        const message = String(req.body?.message || req.body?.reason || 'Payment proof rejected').trim();
        const updated = await CampaignRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    payment_status: 'rejected',
                    brandPaymentStatus: 'failed',
                    rejectionReason: message,
                },
            },
            { new: true, strict: false }
        ).lean();

        const brandUser = await User.findById(campaign.brandUserId).select('email fullName').lean();
        await sendCampaignEmailNotification({
            email: brandUser?.email,
            subject: 'Payment rejected',
            title: 'Payment rejected',
            message,
            actionText: 'View collaboration',
            actionHref: `/dashboard/brand/collaborations?request=${campaign._id}`,
        });

        await Notification.create({
            recipientUserId: campaign.brandUserId,
            type: 'system',
            title: 'Payment rejected',
            message,
            campaignRequestId: campaign._id,
            metadata: { action: 'reject-payment', payment_status: 'rejected' },
        }).catch((error) => {
            console.error('[Admin] rejectPayment notification error:', error);
        });

        emitAdminEvent(req, [campaign.brandUserId], 'collaboration:updated', {
            collaborationId: campaign._id,
            status: campaign.status,
            payment_status: 'rejected',
            action: 'reject-payment',
        });

        return ok(res, { payment: await enrichPaymentRecord(updated) });
    } catch (e) {
        console.error('[Admin] rejectPayment error:', e);
        return err(res, 'Failed to reject payment');
    }
};

/* ─── GET /api/admin/verifications ───────────────────────── */
exports.getVerificationQueue = async (req, res) => {
    try {
        const { status = 'pending' } = req.query;
        const users = await User.find({ status })
            .select('-password -otp -otpExpires')
            .sort({ createdAt: -1 })
            .lean();
        return ok(res, { verifications: users, total: users.length });
    } catch (e) {
        console.error('[Admin] getVerificationQueue error:', e);
        return err(res, 'Failed to fetch verification queue');
    }
};

/* ─── PATCH /api/admin/verifications/:id ─────────────────── */
exports.reviewVerification = async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        const newStatus = status === 'verified' ? 'active' : 'suspended';
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status: newStatus },
            { new: true, select: '-password -otp -otpExpires' }
        );
        if (!user) return err(res, 'User not found', 404);
        return ok(res, { user: sanitizeAdminUserFields(user.toObject()), adminNote });
    } catch (e) {
        console.error('[Admin] reviewVerification error:', e);
        return err(res, 'Failed to review verification');
    }
};
