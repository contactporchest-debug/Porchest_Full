const asyncHandler = require('express-async-handler');
const Campaign = require('../models/CampaignRequest');

// @desc    Get all campaigns for admin
// @route   GET /api/admin/campaigns
// @access  Private/Admin
const getCampaigns = asyncHandler(async (req, res) => {
    const { status, search } = req.query;

    const query = {};
    if (status && status !== 'all') {
        query.status = status;
    }

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const campaigns = await Campaign.find(query)
        .populate('brand', 'companyName')
        .populate('influencers.influencer', 'fullName');

    res.json({ campaigns });
});

// @desc    Update campaign status
// @route   PATCH /api/admin/campaigns/:id/status
// @access  Private/Admin
const updateCampaignStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!['running', 'paused', 'completed'].includes(status)) {
        res.status(400);
        throw new Error('Invalid campaign status.');
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
        res.status(404);
        throw new Error('Campaign not found.');
    }

    campaign.status = status;
    await campaign.save();

    const io = req.app.locals.io;
    io.to(`user-${campaign.brand}`).emit('campaign-status-update', {
        campaignId: campaign._id,
        status,
        message: `Your campaign "${campaign.name}" has been ${status}.`,
    });

    campaign.influencers.forEach((inf) => {
        io.to(`user-${inf.influencer}`).emit('campaign-status-update', {
            campaignId: campaign._id,
            status,
            message: `The campaign "${campaign.name}" you are part of has been ${status}.`,
        });
    });

    res.json({ message: `Campaign status updated to ${status}` });
});

// @desc    Get a single campaign by ID
// @route   GET /api/admin/campaigns/:id
// @access  Private/Admin
const getCampaignById = asyncHandler(async (req, res) => {
    const campaign = await Campaign.findById(req.params.id)
        .populate('brand', 'companyName email')
        .populate({
            path: 'influencers.influencer',
            select: 'fullName email',
            model: 'User',
            populate: {
                path: 'influencerProfile',
                model: 'InfluencerProfile',
                select: 'instagramHandle',
            },
        });

    if (campaign) {
        res.json(campaign);
    } else {
        res.status(404);
        throw new Error('Campaign not found');
    }
});

module.exports = {
    getCampaigns,
    updateCampaignStatus,
    getCampaignById,
};
