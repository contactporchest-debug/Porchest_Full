const Notification = require('../models/Notification');
const User = require('../models/User');
const { ADMIN_ROLES } = require('../utils/accessRoles');
const sendEmail = require('../utils/sendEmail');

function hasEmailConfig() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendOptionalEmail({ email, subject, message, html }) {
    if (!email || !hasEmailConfig()) {
        return { sent: false };
    }

    try {
        await sendEmail({
            email,
            subject,
            message,
            html,
        });
        return { sent: true };
    } catch (error) {
        console.error('[EmailDelivery] Failed:', error);
        return { sent: false, error };
    }
}

async function createNotification({
    recipientUserId,
    type,
    title,
    message,
    campaignRequestId = null,
    senderName = null,
    senderAvatar = null,
    metadata = null,
}) {
    return Notification.create({
        recipientUserId,
        type,
        title,
        message,
        campaignRequestId,
        senderName,
        senderAvatar,
        metadata,
    });
}

function buildEmailHtml({ title, message, accent = '#C2340A' }) {
    return `
        <div style="font-family: Arial, sans-serif; color: #1A0A00; background: #FDF6EE; padding: 24px;">
            <div style="max-width: 640px; margin: 0 auto; background: rgba(255,255,255,0.72); border: 1px solid #EDD9BC; border-radius: 18px; padding: 28px; backdrop-filter: blur(12px);">
                <h2 style="margin: 0 0 12px; color: ${accent}; font-size: 26px;">${title}</h2>
                <p style="margin: 0; line-height: 1.7; color: #7A5030; font-size: 15px;">${message}</p>
            </div>
        </div>
    `;
}

async function deliverUserNotification({
    recipientUserId,
    type,
    title,
    message,
    campaignRequestId = null,
    senderName = null,
    senderAvatar = null,
    metadata = null,
    emailSubject,
    emailMessage,
    emailHtml,
}) {
    const notification = await createNotification({
        recipientUserId,
        type,
        title,
        message,
        campaignRequestId,
        senderName,
        senderAvatar,
        metadata,
    });

    const recipient = await User.findById(recipientUserId).select('email fullName').lean();
    await sendOptionalEmail({
        email: recipient?.email,
        subject: emailSubject || title,
        message: emailMessage || message || title,
        html: emailHtml || buildEmailHtml({
            title,
            message: emailMessage || message || title,
        }),
    });

    return notification;
}

async function deliverAdminsNotification({
    type,
    title,
    message,
    metadata = null,
    emailSubject,
    emailMessage,
}) {
    const admins = await User.find({
        role: { $in: ADMIN_ROLES },
        status: { $ne: 'suspended' },
    }).select('email fullName').lean();

    const tasks = admins.map(async (admin) => {
        const notification = await createNotification({
            recipientUserId: admin._id,
            type,
            title,
            message,
            metadata,
        });

        await sendOptionalEmail({
            email: admin.email,
            subject: emailSubject || title,
            message: emailMessage || message || title,
            html: buildEmailHtml({
                title,
                message: emailMessage || message || title,
            }),
        });

        return notification;
    });

    return Promise.all(tasks);
}

module.exports = {
    buildEmailHtml,
    createNotification,
    deliverAdminsNotification,
    deliverUserNotification,
    sendOptionalEmail,
};
