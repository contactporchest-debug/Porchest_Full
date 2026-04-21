const CampaignRequest = require('../models/CampaignRequest');
const Notification = require('../models/Notification');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const { generateUniqueCode } = require('../utils/generateCode');
const { isValidObjectId } = require('../utils/validators');

// @desc    Brand creates a campaign request to an influencer
// @route   POST /api/brand/requests
exports.createRequest = async (req, res, next) => {
    try {
        const brandUserId = req.user._id;
        const {
            influencerId, campaignTitle, campaignDescription, campaignType,
            deliverables, requiredElements, videoLength, contentGuidelines,
            hashtags, disclosureRequirements, agreedPrice, budgetRangeMin,
            budgetRangeMax, paymentTerms, postingDeadline, campaignStartDate,
            campaignEndDate, brandMessage,
        } = req.body;

        if (!influencerId || !campaignTitle) {
            return res.status(400).json({ success: false, message: 'Influencer and campaign title are required.' });
        }

        // Resolve profiles
        const [brandProfile, influencerProfile] = await Promise.all([
            BrandProfile.findOne({ userId: brandUserId }).lean(),
            InfluencerProfile.findOne({ userId: influencerId }).lean(),
        ]);

        if (!influencerProfile) {
            return res.status(404).json({ success: false, message: 'Influencer not found.' });
        }

        const requestCode = await generateUniqueCode('REQ', CampaignRequest, 'requestCode');

        const request = await CampaignRequest.create({
            requestCode,
            brandUserId,
            influencerUserId: influencerId,
            brandProfileId: brandProfile?._id,
            influencerProfileId: influencerProfile._id,
            campaignTitle,
            campaignDescription,
            campaignType: campaignType || 'sponsored_post',
            deliverables,
            requiredElements,
            videoLength,
            contentGuidelines,
            hashtags,
            disclosureRequirements,
            agreedPrice: agreedPrice ? Number(agreedPrice) : undefined,
            budgetRangeMin: budgetRangeMin ? Number(budgetRangeMin) : undefined,
            budgetRangeMax: budgetRangeMax ? Number(budgetRangeMax) : undefined,
            paymentTerms,
            postingDeadline: postingDeadline ? new Date(postingDeadline) : undefined,
            campaignStartDate: campaignStartDate ? new Date(campaignStartDate) : undefined,
            campaignEndDate: campaignEndDate ? new Date(campaignEndDate) : undefined,
            brandMessage,
            status: 'sent',
            sentAt: new Date(),
            // Denormalized snapshots
            brandName: brandProfile?.brandName || 'Brand',
            brandLogoUrl: brandProfile?.logoUrl || brandProfile?.instagramDPURL || null,
            brandCategory: brandProfile?.category || null,
            influencerName: influencerProfile.fullName || influencerProfile.displayName || 'Influencer',
            influencerUsername: influencerProfile.instagramUsername || null,
            influencerProfilePic: influencerProfile.profilePictureUrl || influencerProfile.instagramDPURL || null,
            influencerNiche: influencerProfile.niche || null,
        });

        // Create notification for the influencer
        await Notification.create({
            recipientUserId: influencerId,
            type: 'collaboration_request',
            title: 'New Collaboration Request',
            message: `${brandProfile?.brandName || 'A brand'} wants to collaborate on "${campaignTitle}"`,
            campaignRequestId: request._id,
            senderName: brandProfile?.brandName || 'Brand',
            senderAvatar: brandProfile?.logoUrl || brandProfile?.instagramDPURL || null,
            metadata: {
                campaignTitle,
                agreedPrice,
                budgetRangeMin,
                budgetRangeMax,
                deliverables,
                requestCode,
            },
        });

        res.status(201).json({ success: true, request });
    } catch (error) {
        next(error);
    }
};

// @desc    Brand gets list of all their sent requests
// @route   GET /api/brand/requests
exports.getBrandRequests = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const filter = { brandUserId: req.user._id };
        if (status && status !== 'all') filter.status = status;

        const requests = await CampaignRequest.find(filter)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        const total = await CampaignRequest.countDocuments(filter);

        res.json({
            success: true,
            requests,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Brand gets a single request detail
// @route   GET /api/brand/requests/:id
exports.getBrandRequestDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid request ID' });
        }

        const request = await CampaignRequest.findOne({
            _id: id,
            brandUserId: req.user._id,
        }).lean();

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.json({ success: true, request });
    } catch (error) {
        next(error);
    }
};

// @desc    Influencer gets incoming requests
// @route   GET /api/influencer/requests
exports.getInfluencerRequests = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const filter = { influencerUserId: req.user._id };
        if (status && status !== 'all') filter.status = status;

        const requests = await CampaignRequest.find(filter)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        const total = await CampaignRequest.countDocuments(filter);

        // Mark unviewed requests as "viewed"
        const unviewedIds = requests.filter(r => r.status === 'sent').map(r => r._id);
        if (unviewedIds.length > 0) {
            await CampaignRequest.updateMany(
                { _id: { $in: unviewedIds } },
                { $set: { status: 'viewed', viewedAt: new Date() } }
            );
            // Notify the brand
            for (const req_item of requests.filter(r => r.status === 'sent')) {
                await Notification.create({
                    recipientUserId: req_item.brandUserId,
                    type: 'request_viewed',
                    title: 'Request Viewed',
                    message: `${req_item.influencerName || 'Influencer'} has viewed your request "${req_item.campaignTitle}"`,
                    campaignRequestId: req_item._id,
                    senderName: req_item.influencerName,
                    senderAvatar: req_item.influencerProfilePic,
                });
            }
        }

        res.json({
            success: true,
            requests,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Influencer responds to a request (accept/reject/negotiate)
// @route   PATCH /api/influencer/requests/:id
exports.respondToRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason, counterOfferPrice, counterOfferMessage } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid request ID' });
        }

        const allowedStatuses = ['accepted', 'rejected', 'negotiation', 'deal_closed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const request = await CampaignRequest.findOne({
            _id: id,
            influencerUserId: req.user._id,
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Update status
        request.status = status;
        if (status === 'accepted') request.acceptedAt = new Date();
        if (status === 'rejected') {
            request.rejectedAt = new Date();
            request.rejectionReason = rejectionReason || '';
        }
        if (status === 'negotiation') {
            request.negotiationStartedAt = new Date();
            request.counterOfferPrice = counterOfferPrice;
            request.counterOfferMessage = counterOfferMessage;
        }
        if (status === 'deal_closed') request.dealClosedAt = new Date();

        await request.save();

        // Notify the brand
        const notifTypeMap = {
            accepted: 'request_accepted',
            rejected: 'request_rejected',
            negotiation: 'negotiation',
            deal_closed: 'deal_closed',
        };
        const notifTitleMap = {
            accepted: 'Request Accepted! 🎉',
            rejected: 'Request Declined',
            negotiation: 'Counter Offer Received',
            deal_closed: 'Deal Confirmed! ✅',
        };
        const notifMessageMap = {
            accepted: `${request.influencerName || 'Influencer'} accepted your request "${request.campaignTitle}"`,
            rejected: `${request.influencerName || 'Influencer'} declined your request "${request.campaignTitle}"`,
            negotiation: `${request.influencerName || 'Influencer'} sent a counter offer for "${request.campaignTitle}"`,
            deal_closed: `Deal confirmed for "${request.campaignTitle}" with ${request.influencerName || 'Influencer'}`,
        };

        await Notification.create({
            recipientUserId: request.brandUserId,
            type: notifTypeMap[status],
            title: notifTitleMap[status],
            message: notifMessageMap[status],
            campaignRequestId: request._id,
            senderName: request.influencerName,
            senderAvatar: request.influencerProfilePic,
            metadata: {
                counterOfferPrice,
                counterOfferMessage,
                rejectionReason,
            },
        });

        res.json({ success: true, request });
    } catch (error) {
        next(error);
    }
};
