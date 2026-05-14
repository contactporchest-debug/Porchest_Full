const CampaignRequest = require('../models/CampaignRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const { generateUniqueCode } = require('../utils/generateCode');
const { isValidObjectId } = require('../utils/validators');
const { ensureTrackingAssets } = require('../services/trackingService');
const {
    buildEmailHtml,
    sendOptionalEmail,
} = require('../services/notificationDeliveryService');

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
            console.error(`[API Error] Brand ${brandUserId} missing influencerId or campaignTitle`);
            return res.status(400).json({ success: false, message: 'Influencer and campaign title are required.' });
        }

        console.log(`[API Init] Brand ${brandUserId} creating request for Influencer ${influencerId}`);
        console.log(`[API Terms Agreed] Brand ${brandUserId} agreed to T&C and payment terms: ${paymentTerms}`);

        // Resolve profiles
        const [brandProfile, influencerProfile] = await Promise.all([
            BrandProfile.findOne({ userId: brandUserId }).lean(),
            InfluencerProfile.findOne({ userId: influencerId }).lean(),
        ]);

        if (!brandProfile || !influencerProfile) {
            return res.status(404).json({ success: false, message: 'Brand or Influencer profile not found.' });
        }

        if (!brandProfile.profileCompletionStatus || !influencerProfile.profileCompletionStatus) {
            return res.status(400).json({
                success: false,
                message: 'Brand and Influencer profiles must be complete before creating a campaign request.',
            });
        }

        const requestCode = await generateUniqueCode('REQ', CampaignRequest, 'requestCode');
        const agreedFee = agreedPrice ? Number(agreedPrice) : undefined;
        const brandName = brandProfile.businessName || brandProfile.brandName || brandProfile.companyName;
        const influencerName = influencerProfile.fullName || influencerProfile.displayName || influencerProfile.instagramUsername;

        const request = await CampaignRequest.create({
            requestCode,
            brandId: brandProfile._id,
            influencerId: influencerProfile._id,
            assignedEmployeeFK: brandProfile.assignedEmployeeFK || null,
            brandUserId,
            influencerUserId: influencerId,
            brandProfileId: brandProfile._id,
            influencerProfileId: influencerProfile._id,
            brief: {
                brandIntro: brandProfile.bio || brandProfile.description || brandMessage || '',
                campaignObjective: campaignType || 'sponsored_post',
                productDetails: campaignDescription || '',
                targetAudience: JSON.stringify(brandProfile.targetAudience || {}),
                keyMessage: campaignTitle,
                contentTypes: Array.isArray(deliverables) ? deliverables : (deliverables ? String(deliverables).split(',').map((item) => item.trim()).filter(Boolean) : []),
                creativeDirection: brandProfile.tone || 'professional',
                mandatoryTalkingPoints: requiredElements ? [requiredElements] : [],
                dos: [],
                donts: [],
                captionGuidelines: contentGuidelines,
                requiredHashtags: Array.isArray(hashtags) ? hashtags : (hashtags ? String(hashtags).split(',').map((item) => item.trim()).filter(Boolean) : []),
                requiredTags: [],
                callToAction: paymentTerms || '',
                trackingLink: null,
                promoCode: null,
                visualRequirements: contentGuidelines || '',
                postingSchedule: postingDeadline ? new Date(postingDeadline) : undefined,
                revisionRounds: 0,
                deliverables: Array.isArray(deliverables) ? deliverables : (deliverables ? String(deliverables).split(',').map((item) => item.trim()).filter(Boolean) : []),
                usageRights: false,
                disclosureRequired: disclosureRequirements,
                porchestContact: brandProfile.assignedEmployeeFK ? String(brandProfile.assignedEmployeeFK) : null,
            },
            brandOfferedFee: agreedFee,
            agreedFee,
            influencerPayable: agreedFee,
            porchestCommission: 0,
            financials: {
                brandOfferedFee: agreedFee,
                agreedFee,
                influencerPayable: agreedFee,
                porchestCommission: 0,
                currency: 'USD',
            },
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
            metrics: {
                clicks: 0,
                visits: 0,
                conversions: 0,
                revenue: 0,
                reach: 0,
                impressions: 0,
                engagementRate: 0,
                roas: 0,
                cpa: 0,
                lastUpdatedAt: new Date(),
            },
            // Denormalized snapshots
            brandName,
            brandLogoUrl: brandProfile.logo || brandProfile.logoUrl || brandProfile.instagramDPURL,
            brandCategory: brandProfile.industry || brandProfile.category,
            influencerName,
            influencerUsername: influencerProfile.instagramUsername,
            influencerProfilePic: influencerProfile.avatar || influencerProfile.profilePictureUrl || influencerProfile.instagramDPURL,
            influencerNiche: influencerProfile.niche,
        });

        // Create notification for the influencer
        await Notification.create({
            recipientUserId: influencerId,
            type: 'collaboration_request',
            title: 'New Collaboration Request',
            message: `${brandName} wants to collaborate on "${campaignTitle}"`,
            campaignRequestId: request._id,
            senderName: brandName,
            senderAvatar: brandProfile.logo || brandProfile.logoUrl || brandProfile.instagramDPURL,
            metadata: {
                campaignTitle,
                agreedPrice,
                budgetRangeMin,
                budgetRangeMax,
                deliverables,
                requestCode,
            },
        });

        const influencerUser = await User.findById(influencerId).select('email fullName').lean();
        await sendOptionalEmail({
            email: influencerUser?.email,
            subject: `New collaboration request from ${brandName}`,
            message: `${brandName} wants to collaborate on "${campaignTitle}". Open Porchest to review the invitation.`,
            html: buildEmailHtml({
                title: 'New collaboration request',
                message: `${brandName} wants to collaborate on <strong>${campaignTitle}</strong>. Open Porchest to review the invitation.`,
            }),
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

        console.log(`[API Fetch] Brand ${req.user._id} fetched ${requests.length} requests (status: ${status || 'all'})`);

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
        const incomingStatuses = ['sent', 'viewed', 'pending', 'countered', 'negotiation', 'rejected', 'declined', 'deal_closed', 'expired', 'cancelled'];
        if (status && status !== 'all') {
            filter.status = status;
        } else {
            filter.status = { $in: incomingStatuses };
        }

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
        if (status === 'accepted') {
            request.acceptedAt = new Date();
            request.status = 'brand_payment_pending';
            request.brandPaymentStatus = 'pending';
            request.brandPaymentReceivedAt = null;
        }
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

        if (status === 'accepted' || status === 'deal_closed') {
            await ensureTrackingAssets(request._id);
        }

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
            accepted: `${request.influencerName || 'Influencer'} accepted your request "${request.campaignTitle}". Brand payment is now required to start the collaboration.`,
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

        const brandUser = await User.findById(request.brandUserId).select('email fullName').lean();
        await sendOptionalEmail({
            email: brandUser?.email,
            subject: notifTitleMap[status],
            message: notifMessageMap[status],
            html: buildEmailHtml({
                title: notifTitleMap[status],
                message: notifMessageMap[status],
            }),
        });

        // ✅ EMIT REAL-TIME SOCKET.IO EVENTS
        const io = req.app.locals.io;
        if (io) {
            // Notify brand
            io.to(`user-${request.brandUserId}`).emit('collaboration:responded', {
                requestId: request._id,
                status: status,
                campaignTitle: request.campaignTitle,
                influencerName: request.influencerName,
                timestamp: new Date(),
            });

            // Notify influencer's own session
            io.to(`user-${request.influencerUserId}`).emit('collaboration:updated', {
                requestId: request._id,
                status: status,
            });
        }

        console.log(`[API Success] Influencer ${request.influencerUserId} responded ${status} to request ${id}`);
        res.json({ success: true, request });
    } catch (error) {
        console.error(`[API Error] Error responding to request:`, error);
        next(error);
    }
};

// @desc    Brand responds to a request (e.g. accept counter offer, counter again, or reject)
// @route   PATCH /api/brand/requests/:id
exports.brandRespondToRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, agreedPrice, brandMessage, rejectionReason, counterOfferPrice, counterOfferMessage } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid request ID' });
        }

        const allowedStatuses = ['accepted', 'rejected', 'negotiation', 'deal_closed', 'cancelled'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const request = await CampaignRequest.findOne({
            _id: id,
            brandUserId: req.user._id,
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        request.status = status;
        if (status === 'deal_closed' || status === 'accepted') {
            request.status = 'deal_closed';
            request.dealClosedAt = new Date();
            if (agreedPrice != null) request.agreedPrice = Number(agreedPrice);
            if (counterOfferPrice != null) request.agreedPrice = Number(counterOfferPrice);
            request.counterOfferPrice = undefined;
            request.counterOfferMessage = undefined;
        } else if (status === 'rejected' || status === 'cancelled') {
            request.status = 'cancelled';
            request.cancelledAt = new Date();
            request.rejectionReason = rejectionReason || '';
        } else if (status === 'negotiation') {
            request.negotiationStartedAt = new Date();
            if (counterOfferPrice == null || Number.isNaN(Number(counterOfferPrice))) {
                return res.status(400).json({ success: false, message: 'Counter offer price is required' });
            }
            request.counterOfferPrice = Number(counterOfferPrice);
            request.counterOfferMessage = counterOfferMessage || brandMessage || '';
        }

        await request.save();

        if (request.status === 'accepted' || request.status === 'deal_closed') {
            await ensureTrackingAssets(request._id);
        }

        const notifTypeMap = {
            deal_closed: 'deal_closed',
            cancelled: 'request_rejected',
            negotiation: 'negotiation',
        };
        const notifTitleMap = {
            deal_closed: 'Deal Confirmed! 🎉',
            cancelled: 'Request Cancelled',
            negotiation: 'New Counter Offer from Brand',
        };
        const notifMessageMap = {
            deal_closed: `${request.brandName || 'The brand'} accepted the terms and confirmed the deal for "${request.campaignTitle}".`,
            cancelled: `${request.brandName || 'The brand'} cancelled the request for "${request.campaignTitle}".`,
            negotiation: `${request.brandName || 'The brand'} sent a new counter offer for "${request.campaignTitle}".`,
        };

        const targetStatus = (status === 'deal_closed' || status === 'accepted') ? 'deal_closed' : (status === 'rejected' || status === 'cancelled') ? 'cancelled' : 'negotiation';

        await Notification.create({
            recipientUserId: request.influencerUserId,
            type: notifTypeMap[targetStatus],
            title: notifTitleMap[targetStatus],
            message: notifMessageMap[targetStatus],
            campaignRequestId: request._id,
            senderName: request.brandName,
            senderAvatar: request.brandLogoUrl,
            metadata: {
                agreedPrice,
                counterOfferPrice,
                counterOfferMessage,
                brandMessage,
                rejectionReason,
            },
        });

        const influencerUser = await User.findById(request.influencerUserId).select('email fullName').lean();
        await sendOptionalEmail({
            email: influencerUser?.email,
            subject: notifTitleMap[targetStatus],
            message: notifMessageMap[targetStatus],
            html: buildEmailHtml({
                title: notifTitleMap[targetStatus],
                message: notifMessageMap[targetStatus],
            }),
        });

        // ✅ EMIT REAL-TIME SOCKET.IO EVENTS
        const io = req.app.locals.io;
        if (io) {
            // Notify influencer
            io.to(`user-${request.influencerUserId}`).emit('collaboration:responded', {
                requestId: request._id,
                status: request.status,
                campaignTitle: request.campaignTitle,
                brandName: request.brandName,
                timestamp: new Date(),
            });

            // Notify brand's own session
            io.to(`user-${request.brandUserId}`).emit('collaboration:updated', {
                requestId: request._id,
                status: request.status,
            });
        }

        console.log(`[API Success] Brand ${request.brandUserId} responded ${status} to counter offer on request ${id}`);
        res.json({ success: true, request });
    } catch (error) {
        console.error(`[API Error] Brand responding to counter offer:`, error);
        next(error);
    }
};

// @desc    Brand gets completed/verified collaborations
// @route   GET /api/brand/verifications
exports.getBrandVerifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const filter = { 
            brandUserId: req.user._id,
            $or: [
                { status: 'deal_closed' },
                { status: 'accepted' }
            ]
        };

        const verifications = await CampaignRequest.find(filter)
            .sort({ dealClosedAt: -1, acceptedAt: -1, createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        const total = await CampaignRequest.countDocuments(filter);

        // Transform to verification format (with status field for UI)
        const formatted = verifications.map(v => ({
            ...v,
            _id: v._id,
            campaignRequestId: v._id,
            status: v.status === 'deal_closed' ? 'verified' : 'verified'
        }));

        console.log(`[API Fetch] Brand ${req.user._id} fetched ${formatted.length} verifications`);

        res.json({
            success: true,
            verifications: formatted,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });
    } catch (error) {
        console.error(`[API Error] Fetching brand verifications:`, error);
        next(error);
    }
};

// @desc    Influencer gets completed/verified collaborations
// @route   GET /api/influencer/verifications
exports.getInfluencerVerifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const filter = { 
            influencerUserId: req.user._id,
            $or: [
                { status: 'deal_closed' },
                { status: 'accepted' }
            ]
        };

        const verifications = await CampaignRequest.find(filter)
            .sort({ dealClosedAt: -1, acceptedAt: -1, createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        const total = await CampaignRequest.countDocuments(filter);

        // Transform to verification format (with status field for UI)
        const formatted = verifications.map(v => ({
            ...v,
            _id: v._id,
            campaignRequestId: v._id,
            status: v.status === 'deal_closed' ? 'verified' : 'verified'
        }));

        console.log(`[API Fetch] Influencer ${req.user._id} fetched ${formatted.length} verifications`);

        res.json({
            success: true,
            verifications: formatted,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });
    } catch (error) {
        console.error(`[API Error] Fetching influencer verifications:`, error);
        next(error);
    }
};
