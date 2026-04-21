const mongoose = require('mongoose');

const campaignRequestSchema = new mongoose.Schema(
    {
        requestCode: { type: String, unique: true, required: true }, // REQ-xxx

        // ── Participants ─────────────────────────────────────────
        brandUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        influencerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        brandProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandProfile' },
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile' },

        // ── Campaign Details ─────────────────────────────────────
        campaignTitle: { type: String, required: true },
        campaignDescription: { type: String },
        campaignType: { type: String, default: 'sponsored_post' }, // sponsored_post, ugc, affiliate, review, story, reel
        deliverables: { type: String },
        requiredElements: { type: String },
        videoLength: { type: String },
        contentGuidelines: { type: String },
        hashtags: { type: String },
        disclosureRequirements: { type: String, default: '#Ad #Sponsored' },

        // ── Budget & Pricing ─────────────────────────────────────
        agreedPrice: { type: Number },
        budgetRangeMin: { type: Number },
        budgetRangeMax: { type: Number },
        paymentTerms: { type: String },
        currency: { type: String, default: 'USD' },

        // ── Timeline ─────────────────────────────────────────────
        postingDeadline: { type: Date },
        campaignStartDate: { type: Date },
        campaignEndDate: { type: Date },

        // ── Message ──────────────────────────────────────────────
        brandMessage: { type: String },

        // ── Status & Lifecycle ───────────────────────────────────
        status: {
            type: String,
            enum: ['sent', 'viewed', 'accepted', 'rejected', 'negotiation', 'deal_closed', 'expired', 'cancelled'],
            default: 'sent'
        },

        // ── Negotiation ──────────────────────────────────────────
        counterOfferPrice: { type: Number },
        counterOfferMessage: { type: String },
        rejectionReason: { type: String },

        // ── Timestamps for lifecycle tracking ────────────────────
        sentAt: { type: Date, default: Date.now },
        viewedAt: { type: Date },
        acceptedAt: { type: Date },
        rejectedAt: { type: Date },
        negotiationStartedAt: { type: Date },
        dealClosedAt: { type: Date },
        expiredAt: { type: Date },
        cancelledAt: { type: Date },

        // ── Brand snapshot (denormalized for quick display) ──────
        brandName: { type: String },
        brandLogoUrl: { type: String },
        brandCategory: { type: String },

        // ── Influencer snapshot ──────────────────────────────────
        influencerName: { type: String },
        influencerUsername: { type: String },
        influencerProfilePic: { type: String },
        influencerNiche: { type: String },
    },
    { timestamps: true }
);

campaignRequestSchema.index({ brandUserId: 1, status: 1 });
campaignRequestSchema.index({ influencerUserId: 1, status: 1 });
campaignRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('CampaignRequest', campaignRequestSchema);
