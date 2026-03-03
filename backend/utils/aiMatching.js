/**
 * Porchest AI Matching Engine (Mock Module)
 *
 * Scores influencers based on:
 * - Engagement Rate: 40%
 * - Niche Match: 40%
 * - Follower Count (normalized): 20%
 *
 * Ready for replacement with real ML model in production.
 */

const matchInfluencers = (influencers, campaign = {}) => {
    const { niche = '' } = campaign;

    const scored = influencers.map((inf) => {
        // Engagement score (0-100), cap at 10% engagement rate = 100
        const engagementScore = Math.min((inf.engagementRate || 0) * 10, 100);

        // Niche match score (0-100)
        let nicheScore = 0;
        if (niche && inf.niche) {
            const campaignWords = niche.toLowerCase().split(/\s+/);
            const influencerWords = inf.niche.toLowerCase().split(/\s+/);
            const intersection = campaignWords.filter((w) => influencerWords.includes(w));
            nicheScore = (intersection.length / Math.max(campaignWords.length, 1)) * 100;
            // Partial substring match bonus
            if (inf.niche.toLowerCase().includes(niche.toLowerCase())) nicheScore = 100;
        } else {
            nicheScore = 50; // neutral if no niche specified
        }

        // Follower score (logarithmic, 0-100): 1M followers = 100
        const followerScore = Math.min((Math.log10(Math.max(inf.followers || 1, 1)) / 6) * 100, 100);

        // Weighted total
        const totalScore =
            engagementScore * 0.4 + nicheScore * 0.4 + followerScore * 0.2;

        return {
            ...inf.toJSON ? inf.toJSON() : inf,
            aiScore: Math.round(totalScore),
            scoreBreakdown: {
                engagementScore: Math.round(engagementScore),
                nicheScore: Math.round(nicheScore),
                followerScore: Math.round(followerScore),
            },
        };
    });

    // Sort by AI score descending
    return scored.sort((a, b) => b.aiScore - a.aiScore);
};

const calculateEngagementScore = (engagementRate, followers) => {
    // Adjust for follower count (mega influencers often have lower engagement)
    const baseScore = Math.min(engagementRate * 10, 100);
    const followerPenalty = followers > 1000000 ? 10 : followers > 500000 ? 5 : 0;
    return Math.max(baseScore - followerPenalty, 0);
};

module.exports = { matchInfluencers, calculateEngagementScore };
