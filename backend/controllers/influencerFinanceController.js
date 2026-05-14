const CampaignRequest = require('../models/CampaignRequest');
const Cashout = require('../models/Cashout');
const InfluencerProfile = require('../models/InfluencerProfile');
const User = require('../models/User');
const { generateUniqueCode } = require('../utils/generateCode');
const { isValidObjectId } = require('../utils/validators');
const {
    deliverAdminsNotification,
    deliverUserNotification,
} = require('../services/notificationDeliveryService');

function extractReleasedAmount(request) {
    const payment = request.payment || {};
    const portion1 = payment.portion1 || payment.tranche1 || {};
    const portion2 = payment.portion2 || payment.tranche2 || {};

    const amount1 = Number(
        request.firstPayoutAmount ??
        portion1.amount ??
        0
    );
    const amount2 = Number(
        request.secondPayoutAmount ??
        portion2.amount ??
        0
    );

    const paid1 = portion1.releasedAt || request.firstPayoutReleasedAt ? amount1 : 0;
    const paid2 = portion2.releasedAt || request.secondPayoutReleasedAt ? amount2 : 0;

    return {
        paid: Number((paid1 + paid2).toFixed(2)),
        contractValue: Number((
            Number(request.influencerNetAmount || 0) ||
            Number(request.agreedFee || request.agreedPrice || 0)
        ).toFixed(2)),
        pending: Number(Math.max(
            0,
            (Number(request.influencerNetAmount || request.agreedFee || request.agreedPrice || 0)) - (paid1 + paid2)
        ).toFixed(2)),
    };
}

async function buildEarningsSummary(userId) {
    const requests = await CampaignRequest.find({
        influencerUserId: userId,
        status: { $in: ['accepted', 'deal_closed', 'brand_payment_pending', 'brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted', 'completed'] },
    })
        .select('_id campaignTitle brandName status agreedFee agreedPrice influencerNetAmount payment firstPayoutAmount secondPayoutAmount firstPayoutReleasedAt secondPayoutReleasedAt createdAt campaignCompletedAt brandVerifiedAt adminVerifiedAt')
        .sort({ createdAt: -1 })
        .lean();

    const cashouts = await Cashout.find({ influencerUserId: userId })
        .select('amount status createdAt transactionId requestedAt reviewedAt processedAt rejectionReason')
        .sort({ createdAt: -1 })
        .lean();

    const payoutHistory = requests.flatMap((request) => {
        const payment = request.payment || {};
        const portion1 = payment.portion1 || payment.tranche1 || {};
        const portion2 = payment.portion2 || payment.tranche2 || {};
        const released = [];

        if (portion1.releasedAt || request.firstPayoutReleasedAt) {
            released.push({
                _id: `${request._id}-p1`,
                type: 'campaign_payout',
                title: `${request.campaignTitle || 'Campaign'} - First payout`,
                amount: Number(request.firstPayoutAmount || portion1.amount || 0),
                status: 'paid',
                createdAt: portion1.releasedAt || request.firstPayoutReleasedAt || request.createdAt,
                campaignRequestId: request._id,
                source: request.brandName || 'Brand',
            });
        }

        if (portion2.releasedAt || request.secondPayoutReleasedAt) {
            released.push({
                _id: `${request._id}-p2`,
                type: 'campaign_payout',
                title: `${request.campaignTitle || 'Campaign'} - Final payout`,
                amount: Number(request.secondPayoutAmount || portion2.amount || 0),
                status: 'paid',
                createdAt: portion2.releasedAt || request.secondPayoutReleasedAt || request.createdAt,
                campaignRequestId: request._id,
                source: request.brandName || 'Brand',
            });
        }

        return released;
    });

    const totalPaid = payoutHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalPendingFromCampaigns = requests.reduce((sum, request) => sum + extractReleasedAmount(request).pending, 0);
    const reservedCashouts = cashouts
        .filter((cashout) => ['pending', 'approved'].includes(cashout.status))
        .reduce((sum, cashout) => sum + Number(cashout.amount || 0), 0);

    const completedCashouts = cashouts.filter((cashout) => cashout.status === 'approved');
    const pendingCashouts = cashouts.filter((cashout) => cashout.status === 'pending');

    return {
        summary: {
            lifetimeTotal: Number((totalPaid + totalPendingFromCampaigns).toFixed(2)),
            totalPaid: Number(totalPaid.toFixed(2)),
            totalPending: Number(totalPendingFromCampaigns.toFixed(2)),
            availableForCashout: Number(Math.max(0, totalPaid - reservedCashouts).toFixed(2)),
            pendingCashoutsTotal: Number(pendingCashouts.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)),
            approvedCashoutsTotal: Number(completedCashouts.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)),
        },
        payoutHistory,
        cashouts,
        recentCollaborations: requests.map((request) => {
            const amounts = extractReleasedAmount(request);
            return {
                _id: request._id,
                campaignTitle: request.campaignTitle,
                brandName: request.brandName,
                status: request.status,
                paidAmount: amounts.paid,
                pendingAmount: amounts.pending,
                contractValue: amounts.contractValue,
                createdAt: request.createdAt,
                firstPayoutReleasedAt: request.firstPayoutReleasedAt || request.payment?.portion1?.releasedAt || null,
                secondPayoutReleasedAt: request.secondPayoutReleasedAt || request.payment?.portion2?.releasedAt || null,
            };
        }),
    };
}

exports.getEarnings = async (req, res, next) => {
    try {
        const data = await buildEarningsSummary(req.user._id);
        res.json({ success: true, ...data });
    } catch (error) {
        next(error);
    }
};

exports.getCashouts = async (req, res, next) => {
    try {
        const cashouts = await Cashout.find({ influencerUserId: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, cashouts });
    } catch (error) {
        next(error);
    }
};

exports.requestCashout = async (req, res, next) => {
    try {
        const amount = Number(req.body.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Please enter a valid cashout amount.' });
        }

        const profile = await InfluencerProfile.findOne({ userId: req.user._id }).select('_id influencerProfileId fullName instagramUsername').lean();
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Influencer profile not found.' });
        }

        const earnings = await buildEarningsSummary(req.user._id);
        if (amount > earnings.summary.availableForCashout) {
            return res.status(400).json({
                success: false,
                message: `Amount exceeds your available balance of $${earnings.summary.availableForCashout.toFixed(2)}.`,
            });
        }

        const cashoutCode = await generateUniqueCode('CSH', Cashout, 'cashoutCode');
        const cashout = await Cashout.create({
            cashoutCode,
            influencerUserId: req.user._id,
            influencerProfileId: profile._id,
            amount,
            status: 'pending',
            requestedAt: new Date(),
            balanceSnapshot: {
                totalPaid: earnings.summary.totalPaid,
                availableBalance: earnings.summary.availableForCashout,
            },
        });

        await deliverUserNotification({
            recipientUserId: req.user._id,
            type: 'cashout_requested',
            title: 'Cashout request received',
            message: `We received your cashout request for $${amount.toFixed(2)}.`,
            metadata: { cashoutId: cashout._id, amount, cashoutCode },
            emailSubject: 'Your Porchest cashout request is pending',
            emailMessage: `Your cashout request for $${amount.toFixed(2)} has been submitted and is now pending review.`,
        });

        await deliverAdminsNotification({
            type: 'cashout_requested',
            title: 'New cashout request',
            message: `${profile.fullName || profile.instagramUsername || 'An influencer'} requested a cashout of $${amount.toFixed(2)}.`,
            metadata: {
                cashoutId: cashout._id,
                amount,
                influencerUserId: req.user._id,
                cashoutCode,
            },
            emailSubject: `New Porchest cashout request: $${amount.toFixed(2)}`,
            emailMessage: `An influencer requested a cashout of $${amount.toFixed(2)}. Review it in the admin dashboard.`,
        });

        res.status(201).json({ success: true, cashout });
    } catch (error) {
        next(error);
    }
};

exports.buildEarningsSummary = buildEarningsSummary;
