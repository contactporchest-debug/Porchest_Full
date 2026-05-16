const test = require('node:test');
const assert = require('node:assert/strict');

const CampaignRequest = require('../models/CampaignRequest');
const ClickEvent = require('../models/ClickEvent');
const PurchaseEvent = require('../models/PurchaseEvent');
const InfluencerProfile = require('../models/InfluencerProfile');
const MediaRaw = require('../models/MediaRaw');
const { buildCampaignPerformanceReport } = require('../services/campaignPerformanceService');

const originalCampaignFind = CampaignRequest.find;
const originalClickFind = ClickEvent.find;
const originalPurchaseFind = PurchaseEvent.find;
const originalProfileFind = InfluencerProfile.find;
const originalMediaFind = MediaRaw.find;

function restoreModels() {
    CampaignRequest.find = originalCampaignFind;
    ClickEvent.find = originalClickFind;
    PurchaseEvent.find = originalPurchaseFind;
    InfluencerProfile.find = originalProfileFind;
    MediaRaw.find = originalMediaFind;
}

test('buildCampaignPerformanceReport returns campaign rollups for the selected performance window', async (t) => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000));
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    const campaign = {
        _id: '507f1f77bcf86cd799439011',
        brandId: 'brand-profile-1',
        influencerId: '507f1f77bcf86cd799439012',
        campaignTitle: 'Summer Launch',
        status: 'campaign_active',
        campaignStartAt: fiveDaysAgo.toISOString(),
        brief: {
            trackingLink: 'https://track.porchest.com/c/abc',
            promoCode: 'SUMMER10',
        },
        content: {
            postLink: 'https://instagram.com/p/test-post',
        },
        pricing: {
            agreedFee: 500,
        },
    };

    CampaignRequest.find = () => ({
        sort: () => ({
            lean: async () => [campaign],
        }),
    });

    InfluencerProfile.find = () => ({
        lean: async () => [{
            _id: '507f1f77bcf86cd799439012',
            userId: 'user-123',
            fullName: 'Test Influencer',
            username: 'testinfluencer',
            instagramUsername: 'testinfluencer',
            followersCount: 10000,
            historicalSnapshots: [
                { capturedAt: fiveDaysAgo.toISOString(), followersCount: 9500 },
                { capturedAt: now.toISOString(), followersCount: 10000 },
            ],
        }],
    });

    MediaRaw.find = () => ({
        sort: () => ({
            lean: async () => [{
                _id: 'media-1',
                influencerProfileId: '507f1f77bcf86cd799439012',
                fetchedAt: threeDaysAgo.toISOString(),
                payload: {
                    permalink: 'https://instagram.com/p/test-post',
                    like_count: 420,
                    comments_count: 27,
                    share_count: 9,
                    save_count: 6,
                    view_count: 6100,
                    impression_count: 7200,
                    timestamp: threeDaysAgo.toISOString(),
                },
            }],
        }),
    });

    ClickEvent.find = () => ({
        sort: () => ({
            lean: async () => [
                {
                    collaborationId: campaign._id,
                    timestamp: oneDayAgo.toISOString(),
                    sessionId: 'session-1',
                    isUnique: true,
                },
            ],
        }),
    });

    PurchaseEvent.find = () => ({
        sort: () => ({
            lean: async () => [
                {
                    collaborationId: campaign._id,
                    timestamp: twoDaysAgo.toISOString(),
                    orderValue: 125,
                    orderId: 'ORDER-1',
                },
            ],
        }),
    });

    t.after(restoreModels);

    const report = await buildCampaignPerformanceReport({ brandProfileId: 'brand-profile-1' });

    assert.equal(report.summary.campaignCount, 1);
    assert.equal(report.summary.activeCampaignCount, 1);
    assert.equal(report.campaigns.length, 1);

    const item = report.campaigns[0];
    assert.equal(item.name, 'Summer Launch');
    assert.equal(item.influencer, 'Test Influencer');
    assert.equal(item.daysRan <= 30, true);
    assert.equal(item.timeframes.today.totalClicks, 0);
    assert.equal(item.timeframes['10days'].totalClicks, 1);
    assert.equal(item.timeframes['30days'].conversions, 1);
    assert.equal(item.timeframes['30days'].revenue, 125);
    assert.equal(item.timeframes['30days'].likes, 420);
    assert.equal(item.timeframes['30days'].hasMatchedMedia, true);
});
