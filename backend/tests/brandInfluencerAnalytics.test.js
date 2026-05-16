const test = require('node:test');
const assert = require('node:assert/strict');

const InfluencerProfile = require('../models/InfluencerProfile');
const MediaRaw = require('../models/MediaRaw');
const InsightsRaw = require('../models/InsightsRaw');
const { getInfluencer60DayAnalytics } = require('../services/brandInfluencerAnalyticsService');

const originalFindOne = InfluencerProfile.findOne;
const originalMediaFind = MediaRaw.find;
const originalInsightsFind = InsightsRaw.find;

function restoreModels() {
    InfluencerProfile.findOne = originalFindOne;
    MediaRaw.find = originalMediaFind;
    InsightsRaw.find = originalInsightsFind;
}

test('getInfluencer60DayAnalytics enforces the 60 day window', async () => {
    await assert.rejects(
        () => getInfluencer60DayAnalytics({ id: 'abc123', period: 30 }),
        (error) => error.statusCode === 400 && /60 days/i.test(error.message)
    );
});

test('getInfluencer60DayAnalytics returns a 60 day summary from profile data', async (t) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fiftyDaysAgo = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000);

    InfluencerProfile.findOne = () => ({
        lean: async () => ({
            _id: '507f1f77bcf86cd799439011',
            userId: 'brand-test-user',
            fullName: 'Test Creator',
            instagramUsername: 'testcreator',
            verified: true,
            followersCount: 12000,
            engagementRate: 4.6,
            historicalSnapshots: [
                { capturedAt: fiftyDaysAgo.toISOString(), followersCount: 10000, engagementRate: 4.1 },
                { capturedAt: thirtyDaysAgo.toISOString(), followersCount: 12000, engagementRate: 4.8 },
            ],
            demographics: {
                genderDistribution: { Female: 58, Male: 40, Other: 2 },
                ageDistribution: { '18-24': 24, '25-34': 46, '35-44': 20, '45+': 10 },
                topCountries: { US: 42, PK: 18, AE: 10 },
            },
            recentMediaSummary: [
                {
                    mediaId: 'post-1',
                    timestamp: thirtyDaysAgo.toISOString(),
                    mediaType: 'REEL',
                    likeCount: 600,
                    commentsCount: 42,
                    shareCount: 12,
                    saveCount: 8,
                    reachCount: 3500,
                    impressionCount: 5200,
                    permalink: 'https://instagram.com/p/post-1',
                },
            ],
        }),
    });
    MediaRaw.find = () => ({
        sort: () => ({
            lean: async () => [],
        }),
    });
    InsightsRaw.find = () => ({
        sort: () => ({
            lean: async () => [],
        }),
    });

    t.after(restoreModels);

    const result = await getInfluencer60DayAnalytics({ id: 'brand-test-user', period: 60 });

    assert.equal(result.period_days, 60);
    assert.equal(result.influencer.name, 'Test Creator');
    assert.equal(result.summary.total_posts, 1);
    assert.equal(result.summary.average_likes, 600);
    assert.equal(result.summary.average_comments, 42);
    assert.ok(Number.isFinite(result.summary.final_score));
    assert.ok(result.summary.rating_tier);
    assert.ok(Number.isFinite(result.summary.view_rate));
    assert.ok(result.roi);
    assert.equal(result.content_distribution.reel_count, 1);
    assert.equal(result.demographics.locations[0].region, 'US');
    assert.ok(Array.isArray(result.posts));
    assert.equal(result.posts[0].type, 'reel');
});
