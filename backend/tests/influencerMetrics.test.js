const test = require('node:test');
const assert = require('node:assert/strict');
const {
    calculateAverageViews,
    calculateAuthenticityScore,
    calculateCommentRate,
    calculateConsistencyScore,
    calculateCostEfficiencyScore,
    calculateCostPerEngagement,
    calculateCostPerView,
    calculateEngagementRate,
    calculateFinalInfluencerScore,
    calculateGrowthRate,
    calculateLikeToViewRate,
    calculateViewRate,
    getInfluencerRatingTier,
    safeDivide,
} = require('../utils/influencerMetrics');

test('safeDivide handles normal and zero division cases', () => {
    assert.equal(safeDivide(10, 2), 5);
    assert.equal(safeDivide(10, 0), 0);
});

test('core metric calculations return expected values for normal cases', () => {
    assert.equal(calculateEngagementRate({ likes: 300, comments: 100, shares: 100, followers: 10000 }), 5);
    assert.equal(calculateAverageViews({ totalViews: 12000, totalPosts: 4 }), 3000);
    assert.equal(calculateViewRate({ averageViews: 3000, followers: 10000 }), 30);
    assert.equal(calculateCommentRate({ comments: 200, views: 10000 }), 0.02);
    assert.equal(calculateLikeToViewRate({ likes: 1200, views: 10000 }), 0.12);
    assert.equal(calculateGrowthRate({ currentFollowers: 12000, previousFollowers: 10000 }), 20);
});

test('metric calculations use defensive defaults for zero followers and zero views', () => {
    assert.equal(calculateEngagementRate({ likes: 300, comments: 100, shares: 100, followers: 0 }), 0);
    assert.equal(calculateViewRate({ averageViews: 3000, followers: 0 }), 0);
    assert.equal(calculateCommentRate({ comments: 20, views: 0 }), 0);
    assert.equal(calculateLikeToViewRate({ likes: 100, views: 0 }), 0);
});

test('cost metrics return null when post rate is missing or views are zero', () => {
    assert.equal(calculateCostPerView({ postRate: 120, averageViews: 10000 }), 0.012);
    assert.equal(calculateCostPerEngagement({ postRate: 120, totalEngagements: 4000 }), 0.03);
    assert.equal(calculateCostPerView({ postRate: null, averageViews: 10000 }), null);
    assert.equal(calculateCostPerView({ postRate: 100, averageViews: 0 }), null);
    assert.equal(calculateCostPerEngagement({ postRate: null, totalEngagements: 1000 }), null);
    assert.equal(calculateCostPerEngagement({ postRate: 100, totalEngagements: 0 }), null);
});

test('consistency and cost efficiency scoring use safe defaults when data is sparse', () => {
    assert.equal(calculateConsistencyScore({ engagementRates: [] }), 60);
    assert.equal(calculateCostEfficiencyScore({ costPerView: null }), 60);
});

test('high performer scores strongly across the model', () => {
    const authenticityScore = calculateAuthenticityScore({
        followers: 50000,
        engagementRate: 6.2,
        viewRate: 58,
        growthRate: 8,
        commentRate: 0.015,
        engagementGrowthDelta: 20,
    });
    const consistencyScore = calculateConsistencyScore({ engagementRates: [5.8, 6.1, 6.0, 6.3] });
    const costEfficiencyScore = calculateCostEfficiencyScore({ costPerView: 0.0015 });
    const score = calculateFinalInfluencerScore({
        engagementRate: 6.2,
        viewRate: 58,
        authenticityScore,
        growthRate: 8,
        costEfficiencyScore,
        consistencyScore,
    });

    assert.ok(authenticityScore >= 95);
    assert.ok(consistencyScore >= 90);
    assert.ok(score.finalScore >= 85);
    assert.equal(getInfluencerRatingTier(score.finalScore), 'Elite');
});

test('fake follower suspect gets penalized by authenticity scoring', () => {
    const authenticityScore = calculateAuthenticityScore({
        followers: 180000,
        engagementRate: 0.6,
        viewRate: 2.5,
        growthRate: 75,
        commentRate: 0.001,
        engagementGrowthDelta: 3,
    });

    assert.ok(authenticityScore <= 20);
});

test('negative growth maps to lower growth score and average tier when mixed with mid metrics', () => {
    const score = calculateFinalInfluencerScore({
        engagementRate: 2.4,
        viewRate: 18,
        authenticityScore: 72,
        growthRate: -12,
        costEfficiencyScore: 60,
        consistencyScore: 62,
    });

    assert.ok(score.growthScore <= 10);
    assert.equal(getInfluencerRatingTier(score.finalScore), 'Average');
});

test('tier assignment follows the requested thresholds', () => {
    assert.equal(getInfluencerRatingTier(90), 'Elite');
    assert.equal(getInfluencerRatingTier(72), 'Strong');
    assert.equal(getInfluencerRatingTier(55), 'Average');
    assert.equal(getInfluencerRatingTier(40), 'Poor');
});
