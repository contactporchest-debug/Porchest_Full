const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: {
            type: String,
            enum: [
                'collaboration_request',
                'request_viewed',
                'request_accepted',
                'request_rejected',
                'negotiation',
                'counter_offer',
                'deal_closed',
                'request_expired',
                'request_cancelled',
                'system'
            ],
            required: true
        },
        title: { type: String, required: true },
        message: { type: String },
        
        // Link to related entities
        campaignRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignRequest' },
        
        // Sender info (denormalized)
        senderName: { type: String },
        senderAvatar: { type: String },
        
        // Status
        isRead: { type: Boolean, default: false },
        readAt: { type: Date },
        
        // Extra data for rendering
        metadata: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

notificationSchema.index({ recipientUserId: 1, isRead: 1 });
notificationSchema.index({ recipientUserId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
