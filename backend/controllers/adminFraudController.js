const User = require('../models/User');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const SoftwareClientProfile = require('../models/SoftwareClientProfile');
const CampaignRequest = require('../models/CampaignRequest');
const Notification = require('../models/Notification');
const { deliverUserNotification } = require('../services/notificationDeliveryService');
const { deleteInstagramRawDataForUser } = require('../services/instagramRetentionService');
const { mergeFraudRecord, scoreInfluencer } = require('../services/fraudDetectionService');

function ok(res, data = {}) {
    return res.status(200).json({ success: true, ...data });
}

function err(res, msg, code = 500) {
    return res.status(code).json({ success: false, message: msg });
}

function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getRangeFromQuery(query = {}) {
    const registeredFrom = parseDate(query.registeredFrom);
    const registeredTo = parseDate(query.registeredTo);
    return { registeredFrom, registeredTo };
}

function isInRange(dateValue, from, to) {
    const date = dateValue ? new Date(dateValue) : null;
    if (!date || Number.isNaN(date.getTime())) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
}

function normalizeIds(value) {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value.split(',').map((item) => String(item).trim()).filter(Boolean);
    }
    return [];
}

async function hardDeleteFraudUserData(user) {
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
        brandProfileIds.length ? BrandProfile.deleteMany({ _id: { $in: brandProfileIds } }) : Promise.resolve(),
        influencerProfileIds.length ? InfluencerProfile.deleteMany({ _id: { $in: influencerProfileIds } }) : Promise.resolve(),
        softwareClientProfileIds.length ? SoftwareClientProfile.deleteMany({ _id: { $in: softwareClientProfileIds } }) : Promise.resolve(),
        campaignRequestIds.length ? CampaignRequest.deleteMany({ _id: { $in: campaignRequestIds } }) : Promise.resolve(),
        Notification.deleteMany({
            $or: [
                { recipientUserId: user._id },
                ...(campaignRequestIds.length ? [{ campaignRequestId: { $in: campaignRequestIds } }] : []),
            ],
        }),
        User.deleteOne({ _id: user._id }),
    ]);
}

async function loadInfluencerDataset({ search = '', registeredFrom = null, registeredTo = null } = {}) {
    const query = { role: 'influencer' };

    const users = await User.find(query)
        .select('email fullName username status role createdAt status tokenVersion isVerified profileCompletionStatus influencerProfileId')
        .sort({ createdAt: -1 })
        .lean();

    const userIds = users.map((user) => user._id);
    const profiles = await InfluencerProfile.find({ userId: { $in: userIds } })
        .select([
            'userId',
            'fullName',
            'displayName',
            'igUsername',
            'instagramUsername',
            'igProfileUrl',
            'avatar',
            'profilePictureUrl',
            'igFollowersCount',
            'followersCount',
            'igFollowingCount',
            'followingCount',
            'igMediaCount',
            'mediaCount',
            'postsCount',
            'avgEngagementPerPost',
            'averageEngagement',
            'avgLikesPerPost',
            'avgLikes',
            'avgCommentsPerPost',
            'avgComments',
            'avgSharesPerPost',
            'avgShares',
            'recentMediaSummary',
            'profileComplete',
            'profileCompletionStatus',
            'verified',
            'isVerified',
            'fraudDetection',
            'createdAt',
        ].join(' '))
        .lean();

    const profileByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));
    const records = users.map((user) => {
        const profile = profileByUserId.get(String(user._id)) || null;
        const record = mergeFraudRecord(user, profile || {});
        return {
            ...record,
            user,
            profile,
        };
    });

    const newInfluencers = records.filter((record) => isInRange(record.createdAt, registeredFrom, registeredTo));
    const filteredRecords = search
        ? records.filter((record) => {
            const haystack = [
                record.fullName,
                record.username,
                record.email,
                record.fraudDetection.status,
                record.fraudDetection.flags.join(' '),
                record.fraudDetection.details?.username,
            ].join(' ').toLowerCase();
            return haystack.includes(String(search).trim().toLowerCase());
        })
        : records;

    const suspiciousInfluencers = filteredRecords.filter((record) => record.fraudDetection.score >= 50 || record.fraudDetection.status === 'flagged');

    return {
        records: filteredRecords,
        newInfluencers: filteredRecords.filter((record) => isInRange(record.createdAt, registeredFrom, registeredTo)),
        suspiciousInfluencers,
    };
}

function buildSummary(records = [], newInfluencers = [], suspiciousInfluencers = []) {
    const total = records.length;
    const flagged = records.filter((record) => record.fraudDetection.status === 'flagged').length;
    const verificationRequested = records.filter((record) => record.fraudDetection.status === 'verification_requested').length;
    const clean = records.filter((record) => record.fraudDetection.level === 'clean').length;

    return {
        total,
        newRegistrations: newInfluencers.length,
        suspicious: suspiciousInfluencers.length,
        flagged,
        verificationRequested,
        clean,
    };
}

async function persistFraudAnalysis(record, analyzedById = null) {
    if (!record?.profile?._id) {
        return record;
    }
    const now = new Date();
    const analysis = scoreInfluencer(record.profile || {}, record.user || {});
    const fraudDetection = {
        ...(record.profile?.fraudDetection || {}),
        score: analysis.score,
        level: analysis.level,
        status: record.profile?.fraudDetection?.status === 'flagged'
            ? 'flagged'
            : record.profile?.fraudDetection?.status === 'verification_requested'
                ? 'verification_requested'
                : analysis.level === 'high_risk'
                    ? 'suspicious'
                    : analysis.level === 'suspicious'
                        ? 'review'
                        : 'clean',
        flags: analysis.flags,
        details: analysis.details,
        analyzedAt: now,
        analyzedByFK: analyzedById || undefined,
    };

    await InfluencerProfile.findByIdAndUpdate(record.profile._id, {
        $set: {
            fraudDetection,
            authenticityScore: Math.max(0, 100 - analysis.score),
            verified: record.profile.verified,
            isVerified: record.profile.isVerified,
        },
    }, { new: false, strict: false });

    return {
        ...record,
        fraudDetection,
        analysis,
        authenticityScore: Math.max(0, 100 - analysis.score),
    };
}

exports.getFraudDetection = async (req, res) => {
    try {
        const { search } = req.query;
        const { registeredFrom, registeredTo } = getRangeFromQuery(req.query);
        const { records, newInfluencers, suspiciousInfluencers } = await loadInfluencerDataset({
            search: String(search || '').trim(),
            registeredFrom,
            registeredTo,
        });

        return ok(res, {
            influencers: records,
            newInfluencers,
            suspiciousInfluencers,
            summary: buildSummary(records, newInfluencers, suspiciousInfluencers),
            range: {
                registeredFrom: registeredFrom ? registeredFrom.toISOString() : null,
                registeredTo: registeredTo ? registeredTo.toISOString() : null,
            },
        });
    } catch (error) {
        console.error('[AdminFraud] getFraudDetection error:', error);
        return err(res, 'Failed to load fraud detection data');
    }
};

exports.analyzeFraud = async (req, res) => {
    try {
        const search = String(req.body?.search || '').trim();
        const { registeredFrom, registeredTo } = getRangeFromQuery(req.body || {});
        const { records, newInfluencers, suspiciousInfluencers } = await loadInfluencerDataset({
            search,
            registeredFrom,
            registeredTo,
        });

        const analyzedById = req.user?._id || null;
        const analyzed = [];
        for (const record of records) {
            analyzed.push(await persistFraudAnalysis(record, analyzedById));
        }

        const refreshed = await loadInfluencerDataset({
            search,
            registeredFrom,
            registeredTo,
        });

        return ok(res, {
            analyzedCount: analyzed.length,
            influencers: refreshed.records,
            newInfluencers: refreshed.newInfluencers,
            suspiciousInfluencers: refreshed.suspiciousInfluencers,
            summary: buildSummary(refreshed.records, refreshed.newInfluencers, refreshed.suspiciousInfluencers),
        });
    } catch (error) {
        console.error('[AdminFraud] analyzeFraud error:', error);
        return err(res, 'Failed to analyze fraud');
    }
};

exports.requestFraudVerification = async (req, res) => {
    try {
        const ids = normalizeIds(req.body?.influencerIds || req.body?.influencerId);
        if (!ids.length) {
            return err(res, 'No influencers selected', 400);
        }

        const message = String(req.body?.message || 'Please submit proof of originality and recent content sources for your Instagram account.').trim();
        const users = await User.find({ _id: { $in: ids }, role: 'influencer' }).select('_id email fullName status').lean();
        const profiles = await InfluencerProfile.find({ userId: { $in: users.map((user) => user._id) } }).select('_id userId fraudDetection').lean();
        const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));

        const now = new Date();
        const tasks = users.map(async (user) => {
            const profile = profileMap.get(String(user._id));
            if (profile?._id) {
                await InfluencerProfile.findByIdAndUpdate(profile._id, {
                    $set: {
                        fraudDetection: {
                            ...(profile.fraudDetection || {}),
                            status: 'verification_requested',
                            verificationRequestedAt: now,
                            verificationRequestedByFK: req.user._id,
                            analyzedAt: profile.fraudDetection?.analyzedAt || now,
                            analyzedByFK: profile.fraudDetection?.analyzedByFK || req.user._id,
                        },
                    },
                }, { strict: false });
            }

            await deliverUserNotification({
                recipientUserId: user._id,
                type: 'system',
                title: 'Verification requested',
                message,
                emailSubject: 'Porchest verification request',
                emailMessage: message,
                metadata: {
                    action: 'fraud-verification-requested',
                    requestedBy: req.user._id,
                },
            }).catch((notificationError) => {
                console.error('[AdminFraud] verification notification failed:', notificationError);
            });

            return user._id;
        });

        const results = await Promise.all(tasks);
        return ok(res, { message: 'Verification requests sent', updatedCount: results.filter(Boolean).length });
    } catch (error) {
        console.error('[AdminFraud] requestFraudVerification error:', error);
        return err(res, 'Failed to request verification');
    }
};

exports.flagFraudInfluencers = async (req, res) => {
    try {
        const ids = normalizeIds(req.body?.influencerIds || req.body?.influencerId);
        if (!ids.length) {
            return err(res, 'No influencers selected', 400);
        }

        const reason = String(req.body?.reason || 'Flagged after fraud review').trim();
        const users = await User.find({ _id: { $in: ids }, role: 'influencer' }).select('_id email fullName status tokenVersion').lean();
        const profiles = await InfluencerProfile.find({ userId: { $in: users.map((user) => user._id) } }).select('_id userId fraudDetection').lean();
        const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
        const now = new Date();

        const tasks = users.map(async (user) => {
            const profile = profileMap.get(String(user._id));

            await Promise.all([
                User.findByIdAndUpdate(user._id, {
                    $set: {
                        status: 'suspended',
                        tokenVersion: Number(user.tokenVersion || 0) + 1,
                    },
                }, { strict: false }),
                profile?._id ? InfluencerProfile.findByIdAndUpdate(profile._id, {
                    $set: {
                        suspended: true,
                        isSearchable: false,
                        verified: false,
                        isVerified: false,
                        fraudDetection: {
                            ...(profile.fraudDetection || {}),
                            status: 'flagged',
                            flaggedAt: now,
                            flaggedByFK: req.user._id,
                            flagReason: reason,
                            analyzedAt: profile.fraudDetection?.analyzedAt || now,
                            analyzedByFK: profile.fraudDetection?.analyzedByFK || req.user._id,
                        },
                    },
                }, { strict: false }) : Promise.resolve(),
            ]);

            await deliverUserNotification({
                recipientUserId: user._id,
                type: 'system',
                title: 'Account flagged',
                message: reason,
                emailSubject: 'Porchest account flagged',
                emailMessage: reason,
                metadata: {
                    action: 'fraud-flag',
                    reason,
                    flaggedBy: req.user._id,
                },
            }).catch((notificationError) => {
                console.error('[AdminFraud] flag notification failed:', notificationError);
            });

            return user._id;
        });

        const results = await Promise.all(tasks);
        return ok(res, { message: 'Influencers flagged', updatedCount: results.filter(Boolean).length });
    } catch (error) {
        console.error('[AdminFraud] flagFraudInfluencers error:', error);
        return err(res, 'Failed to flag influencers');
    }
};

exports.hardDeleteFraudInfluencers = async (req, res) => {
    try {
        const ids = normalizeIds(req.body?.influencerIds || req.body?.influencerId);
        if (!ids.length) {
            return err(res, 'No influencers selected', 400);
        }

        const users = await User.find({ _id: { $in: ids }, role: 'influencer', status: 'suspended' }).select('_id email fullName status tokenVersion').lean();
        if (!users.length) {
            return err(res, 'Only flagged and suspended influencers can be permanently deleted', 400);
        }
        if (users.length !== ids.length) {
            return err(res, 'All selected influencers must be flagged and suspended', 400);
        }

        const profiles = await InfluencerProfile.find({ userId: { $in: users.map((user) => user._id) } }).select('_id userId fraudDetection').lean();
        const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
        const eligibleUsers = [];

        for (const user of users) {
            const profile = profileMap.get(String(user._id));
            if (profile?.fraudDetection?.status !== 'flagged') {
                return err(res, 'All selected influencers must be flagged and suspended', 400);
            }
            eligibleUsers.push({ user, profile });
        }

        for (const { user, profile } of eligibleUsers) {
            await hardDeleteFraudUserData(user);

            await deliverUserNotification({
                recipientUserId: user._id,
                type: 'system',
                title: 'Account removed',
                message: 'Your account has been permanently removed after fraud review.',
                emailSubject: 'Porchest account removed',
                emailMessage: 'Your account has been permanently removed after fraud review.',
                metadata: {
                    action: 'fraud-hard-delete',
                    deletedBy: req.user._id,
                    profileId: profile?._id || null,
                },
            }).catch((notificationError) => {
                console.error('[AdminFraud] hard delete notification failed:', notificationError);
            });
        }

        return ok(res, { message: 'Influencers permanently deleted', deletedCount: eligibleUsers.length });
    } catch (error) {
        console.error('[AdminFraud] hardDeleteFraudInfluencers error:', error);
        return err(res, 'Failed to permanently delete influencers');
    }
};
