const User = require('../models/User');
const CampaignRequest = require('../models/CampaignRequest');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const { generateUniqueCode } = require('../utils/generateCode');

/* ─── Helpers ─────────────────────────────────────────────── */
const ok  = (res, data = {}) => res.status(200).json({ success: true, ...data });
const err = (res, msg, code = 500) => res.status(code).json({ success: false, message: msg });

async function removeRoleSpecificProfiles(user) {
    const ops = [];

    if (user.brandProfileId) {
        ops.push(BrandProfile.findByIdAndDelete(user.brandProfileId));
    }

    if (user.influencerProfileId) {
        ops.push(InfluencerProfile.findByIdAndDelete(user.influencerProfileId));
    }

    await Promise.all(ops);
}

async function ensureProfileForRole(user, role) {
    if (role === 'brand' && !user.brandProfileId) {
        const brandProfileId = await generateUniqueCode('BRD', BrandProfile, 'brandProfileId');
        const profile = await BrandProfile.create({
            userId: user._id,
            brandProfileId,
        });
        user.brandProfileId = profile._id;
    }

    if (role === 'influencer' && !user.influencerProfileId) {
        const influencerProfileId = await generateUniqueCode('INF', InfluencerProfile, 'influencerProfileId');
        const profile = await InfluencerProfile.create({
            userId: user._id,
            influencerProfileId,
        });
        user.influencerProfileId = profile._id;
    }
}

/* ─── GET /api/admin/stats ────────────────────────────────── */
exports.getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalBrands,
            totalInfluencers,
            totalAdmins,
            pendingUsers,
            totalRequests,
            pendingRequests,
            acceptedRequests,
            activeRequests,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'brand' }),
            User.countDocuments({ role: 'influencer' }),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ status: 'pending' }),
            CampaignRequest.countDocuments(),
            CampaignRequest.countDocuments({ status: 'sent' }),
            CampaignRequest.countDocuments({ status: 'accepted' }),
            CampaignRequest.countDocuments({ status: { $in: ['accepted', 'negotiation', 'deal_closed'] } }),
        ]);

        return ok(res, {
            stats: {
                totalUsers,
                totalBrands,
                totalInfluencers,
                totalAdmins,
                pendingUsers,
                pendingVerifications: pendingUsers, // use pending users as verification proxy
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

        return ok(res, { users, total, page: Number(page), limit: Number(limit) });
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

        return ok(res, { user });
    } catch (e) {
        console.error('[Admin] updateUserStatus error:', e);
        return err(res, 'Failed to update status');
    }
};

/* ─── PATCH /api/admin/users/:id/role ────────────────────── */
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['brand', 'influencer', 'admin'].includes(role))
            return err(res, 'Invalid role', 400);

        // Prevent demoting the only admin
        if (role !== 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            const target = await User.findById(req.params.id).select('role');
            if (target?.role === 'admin' && adminCount <= 1)
                return err(res, 'Cannot demote the last admin', 400);
        }

        const user = await User.findById(req.params.id).select('-password -otp -otpExpires');
        if (!user) return err(res, 'User not found', 404);

        if (role === 'admin') {
            await removeRoleSpecificProfiles(user);
            user.brandProfileId = undefined;
            user.influencerProfileId = undefined;
            user.profileCompletionStatus = false;
            user.instagramConnected = false;
        } else {
            if (user.role === 'admin') {
                user.profileCompletionStatus = false;
                user.instagramConnected = false;
            }

            user.brandProfileId = role === 'brand' ? user.brandProfileId : undefined;
            user.influencerProfileId = role === 'influencer' ? user.influencerProfileId : undefined;
            await ensureProfileForRole(user, role);
        }

        user.role = role;
        await user.save();

        // Notify user via Socket.IO
        const io = req.app.locals.io;
        io.to(`user-${user._id}`).emit('role-update', {
            message: `Your account role has been updated to: ${role}.`,
            role: user.role,
        });

        return ok(res, { user });
    } catch (e) {
        console.error('[Admin] updateUserRole error:', e);
        return err(res, 'Failed to update role');
    }
};

/* ─── DELETE /api/admin/users/:id ────────────────────────── */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return err(res, 'User not found', 404);
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

/* ─── GET /api/admin/verifications ───────────────────────── */
// Treat "pending" users as pending verifications for now
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
        return ok(res, { user, adminNote });
    } catch (e) {
        console.error('[Admin] reviewVerification error:', e);
        return err(res, 'Failed to review verification');
    }
};
