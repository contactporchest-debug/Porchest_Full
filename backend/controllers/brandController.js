const User = require('../models/User');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const { validateBrandProfile, isValidObjectId } = require('../utils/validators');
const { generateUniqueCode } = require('../utils/generateCode');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Dynamically compute a weighted influence fit score (0–100).
 * Uses a strict multi-signal scoring model so weak profiles are not inflated.
 *
 * SCORING BREAKDOWN (100 pts total):
 *   Engagement Rate     — 40 pts  (main signal of quality)
 *   Follower Tier       — 20 pts  (reach potential)
 *   Data Completeness   — 25 pts  (identity + bio + niche + location + pricing)
 *   Instagram Connected — 10 pts  (verified, live data)
 *   Posting Activity    —  5 pts  (content consistency)
 */
function computeDynamicFitScore(profile) {
    let score = 0;
    const reasons = [];

    // 1. Engagement Rate (max 40 pts)
    const er = profile.engagementRate || 0;
    let erPts = 0;
    if (er >= 6)      { erPts = 40; reasons.push('Exceptional engagement rate'); }
    else if (er >= 4) { erPts = 32; reasons.push('Strong engagement rate'); }
    else if (er >= 2) { erPts = 22; reasons.push('Moderate engagement rate'); }
    else if (er >= 1) { erPts = 12; reasons.push('Below-average engagement rate'); }
    else if (er >  0) { erPts = 5;  reasons.push('Very low engagement rate'); }
    else              { erPts = 0;  reasons.push('No engagement data'); }
    score += erPts;

    // 2. Follower Tier (max 20 pts)
    const followers = profile.followersCount || 0;
    let followerPts = 0;
    if (followers >= 1000000)     { followerPts = 20; }
    else if (followers >= 500000) { followerPts = 18; }
    else if (followers >= 100000) { followerPts = 14; }
    else if (followers >= 50000)  { followerPts = 10; }
    else if (followers >= 10000)  { followerPts =  7; }
    else if (followers >= 1000)   { followerPts =  4; }
    score += followerPts;

    // 3. Data Completeness (max 25 pts — 5 signals × 5 pts each)
    let dataPts = 0;
    if (profile.fullName && profile.fullName.trim())                  dataPts += 5;
    if (profile.bio || profile.instagramBiography)                    dataPts += 5;
    if (profile.niche && profile.niche.trim())                        dataPts += 5;
    if (profile.country && profile.country.trim())                    dataPts += 5;
    if ((profile.avgPostPrice || 0) > 0 || (profile.avgReelPrice || 0) > 0) {
        dataPts += 5; reasons.push('Pricing published');
    } else {
        reasons.push('Pricing not set');
    }
    if (dataPts < 15) reasons.push('Profile data incomplete');
    score += dataPts;

    // 4. Instagram Connected (10 pts)
    const igConnected = profile.instagramConnected || profile.instagramConnectionStatus === 'connected';
    if (igConnected) { score += 10; reasons.push('Instagram verified via OAuth'); }
    else             { reasons.push('Instagram not connected'); }

    // 5. Posting Activity (max 5 pts)
    const freq = profile.postingFrequency7d || profile.postingFrequency || 0;
    if (freq >= 3) score += 5;
    else if (freq >= 1) score += 3;
    else if (freq > 0)  score += 1;

    const finalScore = Math.min(Math.max(Math.round(score), 0), 100);

    // Quality label based on strict thresholds
    let qualityLabel = 'Low Fit';
    if (finalScore >= 80)      qualityLabel = 'Excellent Fit';
    else if (finalScore >= 65) qualityLabel = 'Good Fit';
    else if (finalScore >= 50) qualityLabel = 'Moderate Fit';
    else if (finalScore >= 35) qualityLabel = 'Worth Considering';

    // Stars: strictly tied to score thresholds
    const starRating = finalScore >= 80 ? 5 : finalScore >= 65 ? 4 : finalScore >= 50 ? 3 : finalScore >= 35 ? 2 : 1;

    return { finalScore, qualityLabel, starRating, reasons };
}

/**
 * Build a presentation-ready influencer card object from a flat InfluencerProfile doc.
 * All values come from InfluencerProfile — the single source of truth after write-through sync.
 */
function buildInfluencerCard(profile) {
    const { finalScore, qualityLabel, starRating, reasons } = computeDynamicFitScore(profile);

    return {
        _id:                   profile._id,
        influencerProfileId:   profile.influencerProfileId,
        userId:                profile.userId,
        fullName:              profile.fullName  || null,
        username:              profile.instagramUsername || null,
        instagramProfileURL:   profile.instagramProfileURL || null,
        profileImageURL:       profile.instagramDPURL || profile.profilePictureUrl || null,
        bio:                   profile.instagramBiography || profile.bio || null,
        niche:                 profile.niche || null,
        country:               profile.country || null,
        city:                  profile.city || null,

        followersCount:        profile.followersCount || 0,
        followsCount:          profile.followingCount || 0,
        mediaCount:            profile.mediaCount     || 0,

        engagementRate:        profile.engagementRate || 0,
        avgLikes:              profile.avgLikes       || 0,
        avgComments:           profile.avgComments    || 0,

        // Canonical field names for frontend consumption
        avgPostCostUSD:        profile.avgPostPrice   || 0,
        avgReelCostUSD:        profile.avgReelPrice   || 0,

        audienceDemographics:  profile.demographics   || null,

        // Dynamic score — not the stale stored fitScore
        fitScore:              finalScore,
        starRating,
        qualityLabel,
        scoringReasons:        reasons,

        instagramConnected:    profile.instagramConnected || profile.instagramConnectionStatus === 'connected',
        profileCompletionStatus: profile.profileCompletionStatus,
        lastSyncedAt:          profile.lastSyncAt || null,
    };
}

// @desc    Brand dashboard overview
exports.getDashboard = async (req, res, next) => {
    try {
        const brandId = req.user._id;
        const brandProfile = await BrandProfile.findOne({ userId: brandId }).lean();

        const profileComplete = !!(
            brandProfile?.brandName && brandProfile?.contactDetails?.officialEmail &&
            brandProfile?.contactDetails?.contactPersonName && brandProfile?.country
        );

        let formattedBrandProfile = brandProfile;
        if (formattedBrandProfile) {
            formattedBrandProfile = {
                ...formattedBrandProfile,
                companyCountry: formattedBrandProfile.country,
                companyWebsite: formattedBrandProfile.website,
                brandNiche: formattedBrandProfile.category,
                brandGoal: formattedBrandProfile.description,
                contactPersonName: formattedBrandProfile.contactDetails?.contactPersonName,
                officialEmail: formattedBrandProfile.contactDetails?.officialEmail,
            };
        }

        res.json({
            success: true,
            dashboard: {
                profile: req.user,
                brandProfile: formattedBrandProfile || null,
                instagramConnection: {
                    isConnected: brandProfile?.instagramConnected || brandProfile?.instagramConnectionStatus === 'connected',
                    lastSyncedAt: brandProfile?.lastSyncedAt || null,
                    username: brandProfile?.instagramUsername,
                    profilePictureURL: brandProfile?.instagramDPURL,
                    followersCount: brandProfile?.followersCount,
                    followsCount: brandProfile?.followsCount,
                    mediaCount: brandProfile?.mediaCount,
                    accountType: brandProfile?.instagramAccountType
                },
                profileComplete,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get brand profile
exports.getBrandProfile = async (req, res, next) => {
    try {
        const [user, brandProfile] = await Promise.all([
            User.findById(req.user._id).select('-password'),
            BrandProfile.findOne({ userId: req.user._id }).lean(),
        ]);
        
        let formattedBrandProfile = brandProfile;
        if (formattedBrandProfile) {
            formattedBrandProfile = {
                ...formattedBrandProfile,
                companyCountry: formattedBrandProfile.country,
                companyWebsite: formattedBrandProfile.website,
                brandNiche: formattedBrandProfile.category,
                brandGoal: formattedBrandProfile.description,
                contactPersonName: formattedBrandProfile.contactDetails?.contactPersonName,
                officialEmail: formattedBrandProfile.contactDetails?.officialEmail,
            };
        }

        res.json({ 
            success: true, 
            user, 
            brandProfile: formattedBrandProfile,
            instagramConnection: brandProfile ? {
                isConnected: brandProfile.instagramConnected || brandProfile.instagramConnectionStatus === 'connected',
                lastSyncedAt: brandProfile.lastSyncedAt || null,
                username: brandProfile.instagramUsername,
                profilePictureURL: brandProfile.instagramDPURL,
                followersCount: brandProfile.followersCount,
                followsCount: brandProfile.followsCount,
                mediaCount: brandProfile.mediaCount,
                accountType: brandProfile.instagramAccountType
            } : null
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update brand profile
exports.updateProfile = async (req, res, next) => {
    try {
        // Just extract basic fields since validator isn't perfectly mapped in reality
        const updates = req.body;
        const mappedUpdates = {
            brandName: updates.brandName,
            category: updates.brandNiche || updates.category,
            country: updates.companyCountry || updates.country,
            website: updates.companyWebsite || updates.website,
            description: updates.brandGoal || updates.description,
            approxBudgetUSD: updates.approxBudgetUSD,
            contactDetails: {
                officialEmail: updates.officialEmail,
                contactPersonName: updates.contactPersonName
            }
        };

        const existing = await BrandProfile.findOne({ userId: req.user._id });
        let brandProfile = existing;

        if (!brandProfile) {
            const brandProfileId = await generateUniqueCode('BRD', BrandProfile, 'brandProfileId');
            brandProfile = await BrandProfile.create({
                userId: req.user._id,
                brandProfileId,
                ...mappedUpdates
            });
        } else {
            Object.assign(brandProfile, mappedUpdates);
            await brandProfile.save();
        }

        const profileCompletionStatus = !!(brandProfile.brandName && brandProfile.contactDetails?.officialEmail && brandProfile.contactDetails?.contactPersonName && brandProfile.country && brandProfile.description && brandProfile.category);
        brandProfile.profileCompletionStatus = profileCompletionStatus;
        
        if (profileCompletionStatus && brandProfile.verificationStatus !== 'verified') {
            brandProfile.verificationStatus = 'verified';
            brandProfile.isVerified = true;
        }
        await brandProfile.save();

        await User.findByIdAndUpdate(req.user._id, { 
            profileCompletionStatus,
            ...(profileCompletionStatus && { isVerified: true })
        });

        const user = await User.findById(req.user._id).select('-password');
        console.log(`[API Success] Brand ${req.user._id} updated profile successfully`);
        
        const bpObj = brandProfile.toObject();
        bpObj.companyCountry = bpObj.country;
        bpObj.companyWebsite = bpObj.website;
        bpObj.brandNiche = bpObj.category;
        bpObj.brandGoal = bpObj.description;
        bpObj.contactPersonName = bpObj.contactDetails?.contactPersonName;
        bpObj.officialEmail = bpObj.contactDetails?.officialEmail;

        res.json({ success: true, user, brandProfile: bpObj });
    } catch (error) {
        console.error(`[API Error] Failed to update profile persistence for Brand ${req.user._id}:`, error);
        next(error);
    }
};

// @desc    AI Influencer Discovery — brand-facing search
// STRICT: Only returns influencers with fully completed profiles
exports.getMatchedInfluencers = async (req, res, next) => {
    try {
        const { niche, country, minFollowers, maxFollowers, minEngagement, maxPostCost } = req.query;

        // Base filter: must have connected Instagram AND completed profile
        const filter = { 
            profileCompletionStatus: true,
            $or: [
                { instagramConnectionStatus: 'connected' },
                { instagramConnected: true }
            ],
            // ── Profile Completion Gate ──
            followersCount: { $gt: 0 },
            engagementRate: { $gt: 0 },
        };

        // Apply user filters on top
        if (niche && niche !== 'All') filter.niche = niche;
        if (country && country !== 'Any') filter.country = country;
        if (minFollowers || maxFollowers) {
            filter.followersCount = { $gt: 0 };
            if (minFollowers) filter.followersCount.$gte = Number(minFollowers);
            if (maxFollowers) filter.followersCount.$lte = Number(maxFollowers);
        }
        if (minEngagement) filter.engagementRate = { $gte: Number(minEngagement) };
        if (maxPostCost) filter.avgPostPrice = { $lte: Number(maxPostCost), $gt: 0 };

        const influencerProfiles = await InfluencerProfile.find(filter)
            .sort({ fitScore: -1, followersCount: -1 })
            .limit(100)
            .lean();

        // Second-pass filter: ensure critical display fields exist
        const eligible = influencerProfiles.filter(p => {
            const hasIdentity = !!(p.fullName || p.displayName) && !!(p.instagramUsername);
            const hasBio = !!(p.bio || p.instagramBiography);
            const hasNiche = !!p.niche;
            const hasLocation = !!p.country;
            const hasFollowers = (p.followersCount || 0) > 0;
            const hasEngagement = (p.engagementRate || 0) > 0;
            const hasPricing = (p.avgPostPrice || 0) > 0 || (p.avgReelPrice || 0) > 0;
            const hasInstagram = p.instagramConnected || p.instagramConnectionStatus === 'connected';
            return hasIdentity && hasBio && hasNiche && hasLocation && hasFollowers && hasEngagement && hasPricing && hasInstagram;
        });

        const result = eligible.map(buildInfluencerCard);
        res.json({ success: true, influencers: result });
    } catch (error) {
        next(error);
    }
};

// @desc    Get full influencer details
exports.getInfluencerDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid influencer ID' });
        }

        const profile = await InfluencerProfile.findOne({ userId: id }).lean();
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Influencer not found' });
        }

        const card = buildInfluencerCard(profile);

        res.json({
            success: true,
            // Full native A-Z document returned 
            profile,
            // Keeping these legacy objects mapped for frontend compatibility immediately
            instagram: {
                isConnected: profile.instagramConnected || profile.instagramConnectionStatus === 'connected',
                username: profile.instagramUsername
            },
            analytics: {
                engagementRate:       profile.engagementRate,
                avgLikesPerPost:      profile.avgLikes,
                avgCommentsPerPost:   profile.avgComments,
                postingFrequency7d:   profile.postingFrequency,
                audienceDemographics: profile.demographics
            },
            recentPosts: profile.recentMediaSummary || [],
            ...{ fitScore: card.fitScore, starRating: card.starRating, qualityLabel: card.qualityLabel },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    AI Matching for brand to discover influencers
exports.aiMatching = async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured in the backend.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        const prompt = `You are an AI assistant for an influencer discovery platform. A brand user is chatting with you to find influencers.
The user message is: "${message}"

Your task is to:
1. Understand the user's intent. If they are just greeting you, reply politely and ask about their influencer search requirements (e.g., niche, location, follower count, or budget).
2. If their message lacks any valid context or is completely off-topic, politely steer the conversation back to influencer discovery.
3. If they describe specifics for an influencer search, extract the appropriate search filters.
4. Output a JSON object and NOTHING else.

Output JSON MUST match this exact structure:
{
    "filters": {
        "niche": "string or null (e.g. 'Tech', 'Fashion', 'Food')",
        "country": "string or null",
        "minFollowers": "number or null",
        "maxFollowers": "number or null",
        "minEngagement": "number or null (e.g., if > 5%, 5)",
        "maxPostCost": "number or null",
        "keywords": ["array of at most 3 context keywords or empty array if none"]
    },
    "reply": "Conversational, natural language reply. If they greeted, greet back and ask how you can help find influencers. If they lacked context, remind them what you can do. If they searched, affirm the criteria you are querying."
}
Only output the raw JSON format, no markdown tags. Avoid markdown blocks (\`\`\`json).`;

        const response = await model.generateContent(prompt);
        let textResult = response.response.text().trim();
        if (textResult.startsWith('\`\`\`json')) {
            textResult = textResult.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        } else if (textResult.startsWith('\`\`\`')) {
            textResult = textResult.replace(/\`\`\`/g, '').trim();
        }

        const aiData = JSON.parse(textResult);

        // Check if AI generated any actual filters
        const f = aiData.filters || {};
        const hasFilters = f.niche || f.country || f.minFollowers || f.maxFollowers || f.minEngagement || f.maxPostCost || (f.keywords && f.keywords.length > 0);

        if (!hasFilters) {
            // No specifics identified (e.g. general greeting or off-topic)
            return res.json({
                success: true,
                aiReply: aiData.reply,
                filters: {},
                influencers: []
            });
        }

        // Build database query
        const filter = {
            profileCompletionStatus: true,
            $or: [
                { instagramConnectionStatus: 'connected' },
                { instagramConnected: true }
            ],
            followersCount: { $gt: 0 },
            engagementRate: { $gt: 0 }
        };

        if (f.niche) {
            filter.niche = { $regex: new RegExp(f.niche, 'i') };
        }
        if (f.country) {
            filter.country = { $regex: new RegExp(f.country, 'i') };
        }
        if (f.minFollowers || f.maxFollowers) {
            filter.followersCount = { $gt: 0 };
            if (f.minFollowers) filter.followersCount.$gte = f.minFollowers;
            if (f.maxFollowers) filter.followersCount.$lte = f.maxFollowers;
        }
        if (f.minEngagement) {
            filter.engagementRate = { $gte: f.minEngagement };
        }
        if (f.maxPostCost) {
            filter.avgPostPrice = { $lte: f.maxPostCost, $gt: 0 };
        }

        if (f.keywords && Array.isArray(f.keywords) && f.keywords.length > 0) {
           const keywordRegex = f.keywords.join('|');
           // the $or has to be careful since we already have an $or.
           filter.$and = [
               {
                   $or: [
                       { bio: { $regex: new RegExp(keywordRegex, 'i') } },
                       { fullName: { $regex: new RegExp(keywordRegex, 'i') } },
                       { categories: { $regex: new RegExp(keywordRegex, 'i') } }
                   ]
               }
           ];
        }

        const influencerProfiles = await InfluencerProfile.find(filter)
            .sort({ fitScore: -1, followersCount: -1 })
            .limit(20)
            .lean();

        // Pass through existing card builder to maintain consistency with Discover UI
        const eligible = influencerProfiles.filter(p => {
            const hasIdentity = !!(p.fullName || p.displayName) && !!(p.instagramUsername);
            const hasBio = !!(p.bio || p.instagramBiography);
            return hasIdentity && hasBio;
        });

        const result = eligible.map(buildInfluencerCard);

        res.json({
            success: true,
            aiReply: aiData.reply,
            filters: aiData.filters,
            influencers: result
        });

    } catch (error) {
        console.error('[AI Matching Error]', error);
        
        // Handle Gemini AI capacity issues specifically due to free-tier constraints
        if (error?.status === 503) {
            return res.status(503).json({ 
                success: false, 
                message: 'Our AI model is currently experiencing high demand. Spikes are temporary, so please try asking again in a few moments!' 
            });
        }
        
        res.status(500).json({ success: false, message: 'AI Matching failed. Please try reformatting your request.' });
    }
};
