const mongoose = require('mongoose');

const brandTrackingConnectionSchema = new mongoose.Schema(
    {
        brandId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        platform: {
            type: String,
            enum: ['custom', 'shopify', 'woocommerce', 'gtm', 'manual'],
            default: 'custom',
        },
        status: {
            type: String,
            enum: ['not_started', 'connected', 'waiting_for_test', 'active', 'issue_detected', 'disconnected'],
            default: 'not_started',
        },
        linksStatus: {
            type: String,
            enum: ['not_ready', 'active'],
            default: 'not_ready',
        },
        salesStatus: {
            type: String,
            enum: ['not_started', 'waiting_for_test', 'active', 'issue_detected'],
            default: 'not_started',
        },
        pixelStatus: {
            type: String,
            enum: ['not_installed', 'installed', 'active', 'issue_detected'],
            default: 'not_installed',
        },
        webhookStatus: {
            type: String,
            enum: ['not_configured', 'configured', 'active', 'issue_detected'],
            default: 'not_configured',
        },
        trackingKey: { type: String, index: true },
        webhookSecret: { type: String },
        storeUrl: { type: String },
        lastEventReceivedAt: Date,
        lastVerifiedAt: Date,
        lastError: String,
        metadata: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

brandTrackingConnectionSchema.index({ brandId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('BrandTrackingConnection', brandTrackingConnectionSchema);
