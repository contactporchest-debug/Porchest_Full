const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));

const lerp = (x, x0, x1, y0, y1) => {
    if (x1 === x0) return y1;
    const ratio = (x - x0) / (x1 - x0);
    return y0 + ratio * (y1 - y0);
};

const normalizeByStops = (value, stops) => {
    if (!Number.isFinite(value)) return 0;
    if (value <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i += 1) {
        const [currentX, currentY] = stops[i];
        const [prevX, prevY] = stops[i - 1];
        if (value <= currentX) return clamp(lerp(value, prevX, currentX, prevY, currentY));
    }
    return stops[stops.length - 1][1];
};

function safeDivide(numerator, denominator, multiplier = 1) {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
    return (numerator / denominator) * multiplier;
}

function calculateEngagementRate({ likes = 0, comments = 0, shares = 0, followers = 0 }) {
    return safeDivide(likes + comments + shares, followers, 100);
}

function calculateAverageViews({ totalViews = 0, totalPosts = 0 }) {
    return safeDivide(totalViews, totalPosts);
}

function calculateViewRate({ averageViews = 0, followers = 0 }) {
    return safeDivide(averageViews, followers, 100);
}

function calculateCommentRate({ comments = 0, views = 0 }) {
    return safeDivide(comments, views);
}

function calculateLikeToViewRate({ likes = 0, views = 0 }) {
    return safeDivide(likes, views);
}

function calculateGrowthRate({ currentFollowers = 0, previousFollowers = 0 }) {
    if (!Number.isFinite(previousFollowers) || previousFollowers <= 0) return 0;
    return ((currentFollowers - previousFollowers) / previousFollowers) * 100;
}

function calculateCostPerView({ postRate = null, averageViews = 0 }) {
    if (!Number.isFinite(postRate)) return null;
    if (!Number.isFinite(averageViews) || averageViews <= 0) return null;
    return postRate / averageViews;
}

function calculateCostPerEngagement({ postRate = null, totalEngagements = 0 }) {
    if (!Number.isFinite(postRate)) return null;
    if (!Number.isFinite(totalEngagements) || totalEngagements <= 0) return null;
    return postRate / totalEngagements;
}

function calculateAuthenticityScore({
    followers = 0,
    engagementRate = 0,
    viewRate = 0,
    growthRate = 0,
    commentRate = 0,
    engagementGrowthDelta = 100,
    commentQualityScore = null,
}) {
    let score = 100;

    if (viewRate < 5 && followers > 100000) score -= 25;
    if (engagementRate < 1) score -= 20;
    if (growthRate > 50 && engagementGrowthDelta < 10) score -= 20;
    if (commentRate > 0 && commentRate < 0.0025) score -= 15;
    if (Number.isFinite(commentQualityScore) && commentQualityScore < 40) score -= 10;

    return clamp(score);
}

function calculateConsistencyScore({ engagementRates = [] }) {
    const numericRates = engagementRates.filter((value) => Number.isFinite(value));
    if (numericRates.length < 2) return 60;

    const mean = numericRates.reduce((sum, value) => sum + value, 0) / numericRates.length;
    if (mean <= 0) return 20;

    const variance = numericRates.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / numericRates.length;
    const stdDeviation = Math.sqrt(variance);
    const coefficientOfVariation = stdDeviation / mean;

    return clamp(Math.round(100 - (coefficientOfVariation * 85)));
}

function calculateCostEfficiencyScore({ costPerView = null }) {
    if (costPerView == null || !Number.isFinite(costPerView)) return 60;
    if (costPerView <= 0.002) return 100;
    if (costPerView <= 0.005) return 85;
    if (costPerView <= 0.01) return 70;
    if (costPerView <= 0.03) return 45;
    return 20;
}

function calculateEngagementScore({ engagementRate = 0 }) {
    return normalizeByStops(engagementRate, [
        [0, 0],
        [1, 25],
        [3, 60],
        [5, 80],
        [8, 100],
    ]);
}

function calculateViewRateScore({ viewRate = 0 }) {
    return normalizeByStops(viewRate, [
        [0, 0],
        [10, 30],
        [25, 60],
        [50, 85],
        [75, 100],
    ]);
}

function calculateGrowthScore({ growthRate = 0 }) {
    if (growthRate < -20) return 0;
    if (growthRate < -10) return 10;
    if (growthRate < 0) return normalizeByStops(growthRate, [[-10, 10], [0, 50]]);
    return normalizeByStops(growthRate, [
        [0, 50],
        [2, 65],
        [5, 80],
        [10, 100],
    ]);
}

function calculateFinalInfluencerScore({
    engagementRate = 0,
    viewRate = 0,
    authenticityScore = 0,
    growthRate = 0,
    costEfficiencyScore = 60,
    consistencyScore = 60,
}) {
    const engagementScore = calculateEngagementScore({ engagementRate });
    const viewRateScore = calculateViewRateScore({ viewRate });
    const growthScore = calculateGrowthScore({ growthRate });

    const finalScore =
        (engagementScore * 0.30) +
        (viewRateScore * 0.20) +
        (clamp(authenticityScore) * 0.20) +
        (growthScore * 0.10) +
        (clamp(costEfficiencyScore) * 0.10) +
        (clamp(consistencyScore) * 0.10);

    return {
        engagementScore: Math.round(engagementScore),
        viewRateScore: Math.round(viewRateScore),
        growthScore: Math.round(growthScore),
        finalScore: Math.round(clamp(finalScore)),
    };
}

function getInfluencerRatingTier(score = 0) {
    if (score >= 85) return 'Elite';
    if (score >= 70) return 'Strong';
    if (score >= 50) return 'Average';
    return 'Poor';
}

module.exports = {
    clamp,
    safeDivide,
    calculateEngagementRate,
    calculateAverageViews,
    calculateViewRate,
    calculateCommentRate,
    calculateLikeToViewRate,
    calculateGrowthRate,
    calculateCostPerView,
    calculateCostPerEngagement,
    calculateAuthenticityScore,
    calculateConsistencyScore,
    calculateCostEfficiencyScore,
    calculateEngagementScore,
    calculateViewRateScore,
    calculateGrowthScore,
    calculateFinalInfluencerScore,
    getInfluencerRatingTier,
};
