export type BrandInfluencerRates = {
    reelPrice?: number | string | null;
    postPrice?: number | string | null;
};

export type BrandInfluencerCard = {
    _id?: string;
    influencerId?: string;
    influencerProfileId?: string;
    userId?: string | { _id?: string };
    fullName?: string;
    username?: string | null;
    followers?: number;
    profilePictureUrl?: string | null;
    niche?: string | null;
    country?: string | null;
    verified?: boolean;
    avgPostPrice?: number | null;
    avgReelPrice?: number | null;
    rates?: BrandInfluencerRates;
    metrics?: {
        finalScore?: number;
        ratingTier?: string;
        engagementRate?: number;
    };
};

export type BrandInfluencerRequestTarget = BrandInfluencerCard & {
    email?: string;
};

export type HistoricalSnapshot = {
    capturedAt?: string;
    followersCount?: number;
    engagementRate?: number;
    accountReach?: number;
    accountImpressions?: number;
    influencerScore?: number;
};

export type MediaItem = {
    mediaId?: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    permalink?: string;
    mediaType?: string;
    caption?: string;
    likeCount?: number;
    commentsCount?: number;
    shareCount?: number;
    saveCount?: number;
    playCount?: number;
    reachCount?: number;
    impressionCount?: number;
    engagementCount?: number;
    viewCount?: number;
    timestamp?: string;
};

export type BrandInfluencerProfile = {
    _id: string;
    userId: string;
    fullName?: string;
    displayName?: string;
    username?: string;
    igUsername?: string;
    bio?: string;
    igBio?: string;
    instagramBiography?: string;
    niche?: string;
    categories?: string[];
    country?: string;
    city?: string;
    languages?: string[];
    age?: number;
    profilePictureUrl?: string;
    instagramDPURL?: string;
    instagramUsername?: string;
    instagramProfileURL?: string;
    platform?: string;
    instagramConnected?: boolean;
    instagramConnectionStatus?: string;
    igFollowersCount?: number;
    followersCount?: number;
    followingCount?: number;
    mediaCount?: number;
    postsCount?: number;
    reelsCount?: number;
    profileViews?: number;
    websiteClicks?: number;
    accountReach?: number;
    accountImpressions?: number;
    onlineFollowers?: Record<string, number> | null;
    engagementRate?: number;
    avgLikes?: number;
    avgComments?: number;
    avgShares?: number;
    avgViews?: number;
    avgReach?: number;
    avgImpressions?: number;
    avgLikesPerPost?: number;
    avgCommentsPerPost?: number;
    avgEngagementPerPost?: number;
    averageEngagement?: number;
    averageReach?: number;
    viewRate?: number;
    likeToCommentRatio?: number;
    postsAnalyzed?: number;
    influencerEfficiencyRate?: number;
    totalReach?: number;
    totalImpressions?: number;
    totalPlays?: number;
    totalShares?: number;
    totalSaved?: number;
    totalEngagements?: number;
    postingFrequency?: number;
    postingFrequency7d?: number;
    postingFrequency30d?: number;
    consistencyRatio?: number;
    consistencyScore?: number;
    costPerView?: number | null;
    costPerEngagement?: number | null;
    authenticityScore?: number;
    engagementQualityScore?: number;
    viralityScore?: number;
    influencerScore?: number;
    topPerformingContentType?: string;
    historicalSnapshots?: HistoricalSnapshot[];
    demographics?: {
        genderDistribution?: Record<string, number>;
        ageDistribution?: Record<string, number>;
        topCountries?: Record<string, number>;
        countries?: Record<string, number>;
        topCities?: Record<string, number>;
        languages?: Record<string, number>;
        audienceType?: string;
        onlineFollowers?: Record<string, number>;
    };
    avgPostPrice?: number;
    avgReelPrice?: number;
    currency?: string;
    profileScore?: number;
    fitScore?: number;
    qualityScore?: number;
    topPostScore?: number;
    topReelScore?: number;
    credibilityScore?: number;
    scoreLabel?: string;
    scoreBreakdown?: Record<string, number>;
    lastSyncAt?: string;
    recentMediaSummary?: MediaItem[];
};

export type BrandInfluencerAnalyticsPost = {
    postId: string;
    timestamp: string;
    type: 'photo' | 'video' | 'reel' | 'story' | string;
    likes: number;
    comments: number;
    shares?: number;
    saves?: number;
    engagement_rate: number;
    reach: number;
    impressions: number;
    permalink?: string | null;
    caption?: string | null;
};

export type BrandInfluencerAnalyticsSummary = {
    average_engagement_rate: number;
    average_likes: number;
    average_comments: number;
    total_posts: number;
    follower_growth_rate: number;
    authenticity_score: number;
    average_views?: number;
    view_rate?: number;
    cost_per_view?: number | null;
    cost_per_engagement?: number | null;
    estimated_cost_per_post?: number | null;
    estimated_cost_per_reel?: number | null;
    estimated_media_value?: number | null;
    predicted_roi?: number | null;
    final_score?: number;
    rating_tier?: string;
    consistency_score?: number;
};

export type BrandInfluencerAnalyticsResponse = {
    influencerId: string;
    period_days: number;
    influencer: {
        id: string;
        userId: string;
        name: string;
        username: string | null;
        profilePictureUrl: string | null;
        followers: number;
        verified: boolean;
        platform: string;
        avgPostPrice?: number | null;
        avgReelPrice?: number | null;
        rates?: BrandInfluencerRates;
    };
    summary: BrandInfluencerAnalyticsSummary;
    trends: {
        engagement_rate_over_time: Array<{ date: string; label: string; engagementRate: number }>;
        follower_count_over_time: Array<{ date: string; label: string; followers: number }>;
        posts_per_week?: Array<{ label: string; postsCount: number }>;
        posting_frequency_over_time?: Array<{ label: string; postsCount: number }>;
    };
    content_distribution: {
        photo_count: number;
        video_count: number;
        reel_count: number;
        story_count: number;
    };
    engagement_breakdown?: Array<{ name: string; value: number }>;
    radar?: Array<{ metric: string; value: number }>;
    roi?: {
        predicted_roi: number | null;
        estimated_media_value: number | null;
        final_score: number;
        rating_tier: string;
    };
    demographics: {
        locations: Array<{ region: string; percent: number }>;
        genders: Array<{ gender: string; percent: number }>;
        ages: Array<{ range: string; percent: number }>;
    };
    posts: BrandInfluencerAnalyticsPost[];
};
