const mongoose = require('mongoose');

const campaignRequestSchema = new mongoose.Schema(
    {
        brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        influencerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

        // Core campaign doc
        campaignTitle: { type: String, required: true, trim: true },
        campaignDescription: { type: String, required: true },
        deliverables: { type: String, required: true },
        requiredElements: { type: String, required: true },
        videoLength: { type: String, required: true },
        postingDeadline: { type: Date, required: true },

        // Creative guidelines
        contentGuidelines: { type: String, required: true },
        hashtags: { type: String },
        disclosureRequirements: { type: String, default: '#Ad #Sponsored' },

        // Financial — locked on creation
        agreedPrice: { type: Number, required: true, min: 0 },
        paymentTerms: { type: String, required: true },

        // Lifecycle
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
        respondedAt: { type: Date },        // when influencer responded
        rejectionReason: { type: String },  // optional note on reject
    },
    { timestamps: true }
);

// Indexes for efficient lookups
campaignRequestSchema.index({ brandId: 1, createdAt: -1 });
campaignRequestSchema.index({ influencerId: 1, status: 1 });

module.exports = mongoose.model('CampaignRequest', campaignRequestSchema);
