export type ScoreInput = {
    engagementRate?: number;
    viewRate?: number;
    authenticityScore?: number;
    growthRate?: number;
    costEfficiencyScore?: number;
    consistencyScore?: number;
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));

const safeDivide = (numerator: number, denominator: number, multiplier = 1) => {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
    return (numerator / denominator) * multiplier;
};

const normalizeByStops = (value: number, stops: Array<[number, number]>) => {
    if (!Number.isFinite(value)) return 0;
    if (value <= stops[0][0]) return stops[0][1];

    for (let index = 1; index < stops.length; index += 1) {
        const [currentX, currentY] = stops[index];
        const [previousX, previousY] = stops[index - 1];

        if (value <= currentX) {
            const ratio = (value - previousX) / (currentX - previousX);
            return clamp(previousY + ((currentY - previousY) * ratio));
        }
    }

    return stops[stops.length - 1][1];
};

export { safeDivide };

export const calculateEngagementRate = (likes: number, comments: number, shares: number, followers: number) =>
    safeDivide(likes + comments + shares, followers, 100);

export const calculateAverageViews = (totalViews: number, totalPosts: number) => safeDivide(totalViews, totalPosts);

export const calculateViewRate = (averageViews: number, followers: number) => safeDivide(averageViews, followers, 100);

export const calculateCommentRate = (comments: number, views: number) => safeDivide(comments, views);

export const calculateLikeToViewRate = (likes: number, views: number) => safeDivide(likes, views);

export const calculateGrowthRate = (currentFollowers: number, previousFollowers: number) => {
    if (!Number.isFinite(previousFollowers) || previousFollowers <= 0) return 0;
    return ((currentFollowers - previousFollowers) / previousFollowers) * 100;
};

export const calculateCostPerView = (postRate: number | null | undefined, averageViews: number) => {
    if (!Number.isFinite(postRate as number) || averageViews <= 0) return null;
    return (postRate as number) / averageViews;
};

export const calculateCostPerEngagement = (postRate: number | null | undefined, totalEngagements: number) => {
    if (!Number.isFinite(postRate as number) || totalEngagements <= 0) return null;
    return (postRate as number) / totalEngagements;
};

export const calculateAuthenticityScore = ({
    followers = 0,
    engagementRate = 0,
    viewRate = 0,
    growthRate = 0,
    commentRate = 0,
    engagementGrowthDelta = 100,
    commentQualityScore = null as number | null,
}) => {
    let score = 100;

    if (viewRate < 5 && followers > 100000) score -= 25;
    if (engagementRate < 1) score -= 20;
    if (growthRate > 50 && engagementGrowthDelta < 10) score -= 20;
    if (commentRate > 0 && commentRate < 0.0025) score -= 15;
    if (commentQualityScore != null && commentQualityScore < 40) score -= 10;

    return clamp(score);
};

export const calculateConsistencyScore = (engagementRates: number[]) => {
    const validRates = engagementRates.filter((value) => Number.isFinite(value));
    if (validRates.length < 2) return 60;

    const mean = validRates.reduce((sum, value) => sum + value, 0) / validRates.length;
    if (mean <= 0) return 20;

    const variance = validRates.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / validRates.length;
    const deviation = Math.sqrt(variance);

    return clamp(Math.round(100 - ((deviation / mean) * 85)));
};

export const calculateCostEfficiencyScore = (costPerView: number | null | undefined) => {
    if (costPerView == null || !Number.isFinite(costPerView)) return 60;
    if (costPerView <= 0.002) return 100;
    if (costPerView <= 0.005) return 85;
    if (costPerView <= 0.01) return 70;
    if (costPerView <= 0.03) return 45;
    return 20;
};

export const calculateFinalInfluencerScore = ({
    engagementRate = 0,
    viewRate = 0,
    authenticityScore = 0,
    growthRate = 0,
    costEfficiencyScore = 60,
    consistencyScore = 60,
}: ScoreInput) => {
    const engagementScore = normalizeByStops(engagementRate, [[0, 0], [1, 25], [3, 60], [5, 80], [8, 100]]);
    const viewRateScore = normalizeByStops(viewRate, [[0, 0], [10, 30], [25, 60], [50, 85], [75, 100]]);
    const growthScore = growthRate < 0
        ? normalizeByStops(growthRate, [[-20, 0], [-10, 10], [0, 50]])
        : normalizeByStops(growthRate, [[0, 50], [2, 65], [5, 80], [10, 100]]);

    return clamp(
        (engagementScore * 0.30) +
        (viewRateScore * 0.20) +
        (clamp(authenticityScore) * 0.20) +
        (growthScore * 0.10) +
        (clamp(costEfficiencyScore) * 0.10) +
        (clamp(consistencyScore) * 0.10)
    );
};

export const getInfluencerRatingTier = (score: number) => {
    if (score >= 85) return 'Elite';
    if (score >= 70) return 'Strong';
    if (score >= 50) return 'Average';
    return 'Poor';
};
