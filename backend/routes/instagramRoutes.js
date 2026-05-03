const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const CampaignRequest = require('../models/CampaignRequest');
const { syncInfluencer, syncBrand, syncCollaborationMetrics } = require('../services/syncService');
const { computeAudienceBrandFitScore } = require('../services/metricsService');
const { isAdminRole } = require('../utils/accessRoles');

const ONE_HOUR_MS = 60 * 60 * 1000;

function normalizeMetricsForResponse(profile) {
    return {
        igUsername: profile.igUsername || profile.instagramUsername || null,
        igProfileUrl: profile.igProfileUrl || profile.profilePictureUrl || null,
        igFollowersCount: profile.igFollowersCount ?? profile.igFollowers ?? profile.followersCount ?? 0,
        igFollowingCount: profile.igFollowingCount ?? profile.followingCount ?? profile.followsCount ?? 0,
        igMediaCount: profile.igMediaCount ?? profile.mediaCount ?? 0,
        followerTier: profile.followerTier || null,
        avgEngagementRate: profile.avgEngagementRate ?? profile.engagementRate ?? 0,
        porchestScore: profile.porchestScore ?? profile.influencerScore ?? null,
        authenticityScore: profile.authenticityScore ?? null,
        avgReachPerPost: profile.avgReachPerPost ?? profile.avgReach ?? profile.averageReach ?? 0,
        avgSavesPerPost: profile.avgSavesPerPost ?? profile.totalSaved ?? 0,
        totalReach90d: profile.totalReach90d ?? profile.totalReach ?? 0,
        totalImpressions90d: profile.totalImpressions90d ?? profile.totalImpressions ?? 0,
        followerGrowth90d: profile.followerGrowth90d ?? 0,
        audienceDemographics: profile.audience || profile.demographics || profile.targetAudienceDemographics || {},
        igLastSyncedAt: profile.igLastSyncedAt || profile.lastSyncAt || profile.lastSyncedAt || null,
        postingFrequency: profile.postingFrequency ?? 0,
        profilePictureUrl: profile.profilePictureUrl || null,
        followersCount: profile.followersCount ?? profile.igFollowersCount ?? 0,
        followingCount: profile.followingCount ?? profile.igFollowingCount ?? 0,
        mediaCount: profile.mediaCount ?? profile.igMediaCount ?? 0,
        followers: profile.followers ?? profile.followersCount ?? profile.igFollowersCount ?? 0,
        following: profile.following ?? profile.followingCount ?? profile.igFollowingCount ?? 0,
        postsCount: profile.postsCount ?? profile.igMediaCount ?? profile.mediaCount ?? 0,
    };
}

router.post('/sync', authMiddleware, async (req, res) => {
    try {
        const role = req.user?.role;
        if (!['influencer', 'brand'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Sync is only available for influencer and brand accounts.' });
        }

        if (role === 'influencer') {
            const profile = await InfluencerProfile.findOne({ userId: req.user._id }).lean();
            if (profile?.igLastSyncedAt && (Date.now() - new Date(profile.igLastSyncedAt).getTime()) < ONE_HOUR_MS) {
                return res.status(429).json({
                    success: false,
                    error: 'Sync too recent',
                    nextSyncAt: new Date(new Date(profile.igLastSyncedAt).getTime() + ONE_HOUR_MS),
                });
            }

            const result = await syncInfluencer(req.user._id);
            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error });
            }
            return res.json({ success: true, syncedAt: result.syncedAt, message: 'Influencer sync completed.' });
        }

        const profile = await BrandProfile.findOne({ userId: req.user._id }).lean();
        if (profile?.igLastSyncedAt && (Date.now() - new Date(profile.igLastSyncedAt).getTime()) < ONE_HOUR_MS) {
            return res.status(429).json({
                success: false,
                error: 'Sync too recent',
                nextSyncAt: new Date(new Date(profile.igLastSyncedAt).getTime() + ONE_HOUR_MS),
            });
        }

        const result = await syncBrand(req.user._id);
        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        return res.json({ success: true, syncedAt: result.syncedAt, message: 'Brand sync completed.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Sync failed' });
    }
});

router.get('/metrics', authMiddleware, async (req, res) => {
    try {
        const role = req.user?.role;
        if (role === 'influencer') {
            const profile = await InfluencerProfile.findOne({ userId: req.user._id }).lean();
            if (!profile || !profile.igUserId) {
                return res.status(404).json({ success: false, error: 'Instagram account not connected' });
            }
            return res.json({ success: true, metrics: normalizeMetricsForResponse(profile) });
        }

        if (role === 'brand') {
            const profile = await BrandProfile.findOne({ userId: req.user._id }).lean();
            if (!profile || !profile.igUserId) {
                return res.status(404).json({ success: false, error: 'Instagram account not connected' });
            }
            return res.json({ success: true, metrics: normalizeMetricsForResponse(profile) });
        }

        return res.status(403).json({ success: false, error: 'Access denied' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Failed to fetch metrics' });
    }
});

router.get('/influencer/:influencerId/metrics', authMiddleware, roleMiddleware('brand', 'admin'), async (req, res) => {
    try {
        const influencerProfile = await InfluencerProfile.findOne({ _id: req.params.influencerId }).lean();
        if (!influencerProfile || !influencerProfile.igUserId) {
            return res.status(404).json({ success: false, error: 'Influencer profile not found' });
        }

        const brandProfile = await BrandProfile.findOne({ userId: req.user._id }).lean();
        const audienceBrandFitScore = brandProfile
            ? computeAudienceBrandFitScore(influencerProfile.audience || influencerProfile.demographics || {}, brandProfile.targetAudience || {})
            : 0;

        return res.json({
            success: true,
            metrics: {
                ...normalizeMetricsForResponse(influencerProfile),
                audienceBrandFitScore,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Failed to fetch influencer metrics' });
    }
});

router.post('/collaboration/:collaborationId/sync-post', authMiddleware, roleMiddleware('influencer', 'brand', 'admin'), async (req, res) => {
    try {
        const result = await syncCollaborationMetrics(req.params.collaborationId);
        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        return res.json({ success: true, metrics: result.metrics });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Failed to sync collaboration post' });
    }
});

router.get('/collaboration/:collaborationId/metrics', authMiddleware, async (req, res) => {
    try {
        const collaboration = await CampaignRequest.findById(req.params.collaborationId).lean();
        if (!collaboration) {
            return res.status(404).json({ success: false, error: 'Collaboration not found' });
        }

        const brandProfile = collaboration.brandId ? await BrandProfile.findById(collaboration.brandId).lean() : null;
        const influencerProfile = collaboration.influencerId ? await InfluencerProfile.findById(collaboration.influencerId).lean() : null;
        const isAdmin = isAdminRole(req.user?.role);
        const isBrandOwner = brandProfile && String(brandProfile.userId) === String(req.user._id);
        const isInfluencerOwner = influencerProfile && String(influencerProfile.userId) === String(req.user._id);

        if (!isAdmin && !isBrandOwner && !isInfluencerOwner) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const campaignStartDate = collaboration.campaignStartDate || null;
        const campaignEndDate = collaboration.campaignEndDate || null;
        const now = Date.now();
        const endTime = campaignEndDate ? new Date(campaignEndDate).getTime() : now;
        const startTime = campaignStartDate ? new Date(campaignStartDate).getTime() : now;
        const gracePeriodDays = collaboration.gracePeriodDays || 3;
        const graceEndTime = endTime + (gracePeriodDays * 24 * 60 * 60 * 1000);

        let windowStatus = 'completed';
        if (now < startTime) windowStatus = 'pending';
        else if (now <= endTime) windowStatus = 'active';
        else if (now <= graceEndTime) windowStatus = 'grace_period';

        const metrics = collaboration.metrics || {};
        return res.json({
            success: true,
            metrics: {
                ...metrics,
                roas: metrics.roas ?? (collaboration.agreedFee ? Number(((metrics.revenue || 0) / collaboration.agreedFee).toFixed(2)) : 0),
                cpa: metrics.cpa ?? ((metrics.conversions || 0) > 0 ? Number((collaboration.agreedFee / metrics.conversions).toFixed(2)) : 0),
            },
            campaignStartDate,
            campaignEndDate,
            daysRemaining: Math.max(0, Math.ceil((endTime - now) / 86400000)),
            windowStatus,
            dataLabel: windowStatus === 'completed'
                ? 'Final campaign report'
                : 'Campaign in progress — data still being collected',
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Failed to fetch collaboration metrics' });
    }
});

router.get('/collaboration/:collaborationId/followers', authMiddleware, async (req, res) => {
    try {
        const { collaborationId } = req.params;
        const collab = await CampaignRequest.findById(collaborationId)
            .select('brandId influencerId followerSnapshot campaignStartDate campaignEndDate status')
            .lean();

        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });

        const [brandProfile, influencerProfile] = await Promise.all([
            BrandProfile.findById(collab.brandId).select('userId').lean(),
            InfluencerProfile.findById(collab.influencerId).select('userId').lean(),
        ]);

        const userId = req.user._id.toString();
        const isAuthorized =
            isAdminRole(req.user.role) ||
            String(brandProfile?.userId || '') === userId ||
            String(influencerProfile?.userId || '') === userId;

        if (!isAuthorized) return res.status(403).json({ success: false, error: 'Access denied' });

        const snap = collab.followerSnapshot || {};
        const readings = Array.isArray(snap.dailyReadings) ? snap.dailyReadings : [];

        return res.json({
            success: true,
            baseline: snap.baseline?.count || 0,
            baselineDate: snap.baseline?.timestamp || null,
            currentCount: snap.currentCount || snap.baseline?.count || 0,
            netNewFollowers: snap.netNewFollowers || 0,
            growthRate: snap.growthRate || 0,
            lastPolledAt: snap.lastPolledAt || null,
            dailyReadings: readings.map((reading) => ({
                count: reading.count,
                date: reading.timestamp,
            })),
            campaignStartDate: collab.campaignStartDate || null,
            campaignEndDate: collab.campaignEndDate || null,
            status: collab.status,
        });
    } catch (error) {
        console.error('[FollowerGrowth] Error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
