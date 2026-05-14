const express = require('express');
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const ClickEvent = require('../models/ClickEvent');
const CampaignRequest = require('../models/CampaignRequest');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const { isAdminRole } = require('../utils/accessRoles');
const { signAttributionToken } = require('../services/attributionTokenService');

const router = express.Router();

router.get('/r', async (req, res) => {
    const { cid, iid, dest } = req.query;
    const decodedDestination = dest ? decodeURIComponent(dest) : 'https://porchest.com';

    res.cookie('porchest_attribution', encodeURIComponent(JSON.stringify({
        cid,
        iid,
        timestamp: Date.now(),
    })), {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    try {
        let collab = null;
        if (cid) {
            collab = await CampaignRequest.findById(cid).select('brandId influencerId campaignStartDate campaignEndDate status gracePeriodDays').lean();
        }

        const now = new Date();
        const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
        const userAgent = req.headers['user-agent'] || '';
        const sessionId = crypto.randomBytes(4).toString('hex');
        let clickDoc = null;

        if (collab && cid && iid) {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            const recentClick = await ClickEvent.findOne({
                collaborationId: cid,
                ip,
                userAgent,
                timestamp: { $gte: thirtyMinutesAgo },
            }).lean();

            const isUnique = !recentClick;

            clickDoc = await ClickEvent.create({
                collaborationId: cid,
                influencerId: iid,
                brandId: collab.brandId,
                ip,
                userAgent,
                referrer: req.headers.referer || req.headers.referrer || '',
                sessionId,
                isUnique,
                timestamp: now,
            });

            const metricsUpdate = {
                $inc: { 'metrics.clicks': 1 },
                $set: { 'metrics.lastUpdatedAt': now },
            };
            if (isUnique) metricsUpdate.$inc['metrics.visits'] = 1;

            await CampaignRequest.findByIdAndUpdate(cid, metricsUpdate, { strict: false, new: true });
        }

        try {
            const destinationUrl = new URL(decodedDestination);
            if (!['http:', 'https:'].includes(destinationUrl.protocol)) {
                throw new Error('Unsupported destination protocol');
            }
            if (cid) destinationUrl.searchParams.set('pcid', cid);
            if (iid) destinationUrl.searchParams.set('piid', iid);

            if (collab && cid && iid) {
                const token = signAttributionToken({
                    brandId: collab.brandId,
                    collaborationId: cid,
                    influencerId: iid,
                    clickId: clickDoc?._id || null,
                    issuedAt: now,
                });
                destinationUrl.searchParams.set('pc_attrib', token);
            }

            return res.redirect(302, destinationUrl.toString());
        } catch (error) {
            console.warn('[TrackingRedirect] Invalid destination URL, falling back to safe redirect:', error.message);
            return res.redirect(302, 'https://porchest.com');
        }
    } catch (error) {
        console.error('[TrackingRedirect] Error logging click:', error.message);
        return res.redirect(302, 'https://porchest.com');
    }
});

router.get('/api/tracking/collaboration/:collaborationId/clicks', authMiddleware, async (req, res) => {
    try {
        const { collaborationId } = req.params;

        const [collab, clicks] = await Promise.all([
            CampaignRequest.findById(collaborationId).select('brandId influencerId').lean(),
            ClickEvent.find({ collaborationId }).sort({ timestamp: 1 }).lean(),
        ]);

        if (!collab) return res.status(404).json({ success: false, error: 'Not found' });

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

        const totalClicks = clicks.length;
        const uniqueVisitors = clicks.filter((c) => c.isUnique).length;
        const byDate = {};

        clicks.forEach((c) => {
            const date = new Date(c.timestamp).toISOString().split('T')[0];
            if (!byDate[date]) byDate[date] = { clicks: 0, unique: 0 };
            byDate[date].clicks += 1;
            if (c.isUnique) byDate[date].unique += 1;
        });

        return res.json({
            success: true,
            totalClicks,
            uniqueVisitors,
            ctr: totalClicks > 0 ? Number(((uniqueVisitors / totalClicks) * 100).toFixed(1)) : 0,
            dailyChart: Object.entries(byDate).map(([date, data]) => ({ date, ...data })),
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
});

router.get('/api/tracking/docs', (req, res) => {
    res.json({
        success: true,
        docs: {
            redirect: '/r?cid=...&iid=...&dest=...',
            clickAnalytics: '/api/tracking/collaboration/:collaborationId/clicks',
        },
    });
});

module.exports = router;
