const cron = require('node-cron');
const CampaignRequest = require('../models/CampaignRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { releaseDueSecondPayouts } = require('./trackingService');
const { buildEmailHtml, sendOptionalEmail } = require('./notificationDeliveryService');

const PENDING_STATUSES = ['sent', 'viewed', 'pending', 'countered', 'negotiation', 'brand_payment_pending'];
const ACTIVE_STATUSES = ['brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted'];
const CLOSABLE_STATUSES = [...ACTIVE_STATUSES];

function toDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function effectiveEndDate(doc) {
    return toDate(doc.campaignEndAt || doc.campaignEndDate || doc.timeline?.campaignEndDate);
}

async function loadUsersByIds(ids) {
    const uniqueIds = [...new Set(ids.filter(Boolean).map(String))];
    if (uniqueIds.length === 0) return new Map();

    const users = await User.find({ _id: { $in: uniqueIds } }).select('_id email fullName').lean();
    return new Map(users.map((user) => [String(user._id), user]));
}

function emitLifecycleEvent(io, userIds, payload) {
    if (!io) return;
    userIds.filter(Boolean).forEach((userId) => {
        io.to(`user-${userId}`).emit('collaboration:updated', payload);
    });
}

async function notifyUsers({ recipients, notification, emailSubject, emailMessage }) {
    if (!recipients.length) return;

    await Notification.insertMany(recipients.map((recipientUserId) => ({
        recipientUserId,
        ...notification,
    }))).catch((error) => {
        console.error('[campaignLifecycleScheduler] Notification insert failed:', error);
    });

    const userMap = await loadUsersByIds(recipients);
    await Promise.all(recipients.map((recipientUserId) => {
        const user = userMap.get(String(recipientUserId));
        return sendOptionalEmail({
            email: user?.email,
            subject: emailSubject,
            message: emailMessage,
            html: buildEmailHtml({
                title: emailSubject,
                message: emailMessage,
            }),
        });
    }));
}

async function expireOverdueRequests(io) {
    const now = new Date();
    const overdue = await CampaignRequest.find({
        status: { $in: PENDING_STATUSES },
        expiredAt: { $exists: false },
        $or: [
            { postingDeadline: { $exists: true, $ne: null, $lte: now } },
            { 'brief.postingSchedule': { $exists: true, $ne: null, $lte: now } },
        ],
    }).select('brandUserId influencerUserId campaignTitle postingDeadline brief status').lean();

    for (const collab of overdue) {
        const expiredAt = new Date();
        await CampaignRequest.findByIdAndUpdate(
            collab._id,
            {
                $set: {
                    status: 'expired',
                    expiredAt,
                },
            },
            { strict: false, new: true }
        );

        const recipients = [collab.brandUserId, collab.influencerUserId];
        const message = `The collaboration "${collab.campaignTitle || 'Campaign'}" expired because its deadline passed.`;
        await notifyUsers({
            recipients,
            notification: {
                type: 'request_expired',
                title: 'Request expired',
                message,
                campaignRequestId: collab._id,
                metadata: { status: 'expired', expiredAt },
            },
            emailSubject: 'Request expired',
            emailMessage: message,
        });

        emitLifecycleEvent(io, recipients, {
            collaborationId: collab._id,
            status: 'expired',
            action: 'expire',
        });
    }

    return overdue.length;
}

async function autoCloseOverdueCampaigns(io) {
    const now = new Date();
    const overdue = await CampaignRequest.find({
        status: { $in: CLOSABLE_STATUSES },
        campaignCompletedAt: { $exists: false },
        $or: [
            { campaignEndAt: { $exists: true, $ne: null, $lte: now } },
            { campaignEndDate: { $exists: true, $ne: null, $lte: now } },
            { 'timeline.campaignEndDate': { $exists: true, $ne: null, $lte: now } },
        ],
    }).select('brandUserId influencerUserId campaignTitle campaignEndAt campaignEndDate timeline secondPayoutAmount payment status').lean();

    for (const collab of overdue) {
        const endDate = effectiveEndDate(collab) || now;
        const secondAmount = Number(
            collab.secondPayoutAmount ||
            collab.payment?.portion2?.amount ||
            collab.payment?.tranche2?.amount ||
            0
        );

        await CampaignRequest.findByIdAndUpdate(
            collab._id,
            {
                $set: {
                    status: 'completed',
                    campaignCompletedAt: now,
                    secondPayoutReleasedAt: now,
                    payment: {
                        ...(collab.payment || {}),
                        status: 'released',
                        portion2: {
                            ...(collab.payment?.portion2 || {}),
                            amount: secondAmount,
                            releasedAt: now,
                            status: 'released',
                        },
                        tranche2: {
                            ...(collab.payment?.tranche2 || collab.payment?.portion2 || {}),
                            amount: secondAmount,
                            releasedAt: now,
                            status: 'released',
                        },
                    },
                },
            },
            { strict: false, new: true }
        );

        const recipients = [collab.brandUserId, collab.influencerUserId];
        const message = `The campaign "${collab.campaignTitle || 'Campaign'}" auto-closed after its end date (${endDate.toLocaleDateString()}).`;
        await notifyUsers({
            recipients,
            notification: {
                type: 'system',
                title: 'Campaign auto-closed',
                message,
                campaignRequestId: collab._id,
                metadata: { status: 'completed', autoClosedAt: now },
            },
            emailSubject: 'Campaign auto-closed',
            emailMessage: message,
        });

        emitLifecycleEvent(io, recipients, {
            collaborationId: collab._id,
            status: 'completed',
            action: 'auto-close',
        });
    }

    return overdue.length;
}

function startCampaignLifecycleScheduler(io) {
    cron.schedule('15 * * * *', async () => {
        console.log('[CampaignLifecycle] Starting campaign lifecycle pass —', new Date().toISOString());
        try {
            const released = await releaseDueSecondPayouts();
            const expired = await expireOverdueRequests(io);
            const closed = await autoCloseOverdueCampaigns(io);

            console.log(`[CampaignLifecycle] Completed lifecycle pass. Released=${released?.released || 0}, Expired=${expired}, Closed=${closed}`);
        } catch (error) {
            console.error('[CampaignLifecycle] Lifecycle job failed:', error);
        }
    }, {
        timezone: 'UTC',
    });
}

module.exports = { startCampaignLifecycleScheduler };
