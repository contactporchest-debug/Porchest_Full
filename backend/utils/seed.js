require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const Analytics = require('../models/Analytics');

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding...');
};

const seed = async () => {
    await connectDB();

    // Clear existing data
    await Promise.all([
        User.deleteMany({}),
        Campaign.deleteMany({}),
        Application.deleteMany({}),
        Payment.deleteMany({}),
        Analytics.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Admin
    const admin = await User.create({
        role: 'admin',
        email: 'admin@porchest.com',
        password: 'Admin123!',
        fullName: 'Porchest Admin',
        status: 'active',
    });

    // Create Brand
    const brand = await User.create({
        role: 'brand',
        email: 'brand@demo.com',
        password: 'Brand123!',
        companyName: 'NovaTech Solutions',
        industry: 'Technology',
        website: 'https://novatech.com',
        budgetRange: '$5,000 - $20,000',
        status: 'active',
    });

    // Create Influencer
    const influencer = await User.create({
        role: 'influencer',
        email: 'influencer@demo.com',
        password: 'Influencer123!',
        fullName: 'Alex Rivera',
        niche: 'Technology & Lifestyle',
        followers: 125000,
        engagementRate: 4.7,
        socialLinks: {
            instagram: 'https://instagram.com/alexrivera',
            youtube: 'https://youtube.com/alexrivera',
        },
        bio: 'Tech enthusiast, lifestyle creator, and digital innovator.',
        status: 'active',
    });

    // Create extra influencers
    const influencer2 = await User.create({
        role: 'influencer',
        email: 'sarah@demo.com',
        password: 'Influencer123!',
        fullName: 'Sarah Chen',
        niche: 'Fashion & Beauty',
        followers: 280000,
        engagementRate: 6.2,
        socialLinks: {
            instagram: 'https://instagram.com/sarahchen',
            tiktok: 'https://tiktok.com/@sarahchen',
        },
        bio: 'Fashion-forward creator with a passion for sustainable beauty.',
        status: 'active',
    });

    const influencer3 = await User.create({
        role: 'influencer',
        email: 'marcus@demo.com',
        password: 'Influencer123!',
        fullName: 'Marcus Johnson',
        niche: 'Fitness & Health',
        followers: 520000,
        engagementRate: 5.1,
        socialLinks: {
            instagram: 'https://instagram.com/marcusfitness',
            youtube: 'https://youtube.com/marcusfitness',
        },
        bio: 'Certified fitness coach and wellness advocate reaching millions.',
        status: 'active',
    });

    // Create Campaigns
    const campaign1 = await Campaign.create({
        brandId: brand._id,
        title: 'Product Launch Campaign',
        description: 'Promote our new AI-powered productivity app across social platforms.',
        budget: 12000,
        timeline: {
            startDate: new Date('2026-03-01'),
            endDate: new Date('2026-03-31'),
        },
        targetNiche: 'Technology',
        status: 'active',
        requirements: 'Minimum 100k followers, tech niche audience',
        deliverables: ['3 Instagram posts', '2 YouTube shorts', '1 dedicated video review'],
        applicantsCount: 3,
    });

    const campaign2 = await Campaign.create({
        brandId: brand._id,
        title: 'Brand Awareness Drive',
        description: 'Increase brand visibility through authentic lifestyle content.',
        budget: 8000,
        timeline: {
            startDate: new Date('2026-03-15'),
            endDate: new Date('2026-04-15'),
        },
        targetNiche: 'Lifestyle',
        status: 'active',
        requirements: 'Engagement rate > 4%, authentic storytelling style',
        deliverables: ['5 Instagram stories', '2 feed posts'],
        applicantsCount: 1,
    });

    // Create Application
    const application = await Application.create({
        campaignId: campaign1._id,
        influencerId: influencer._id,
        brandId: brand._id,
        message: "I would love to promote your product! I've reviewed the requirements and I match perfectly.",
        status: 'accepted',
        proposedRate: 3500,
    });

    // Create Payment
    await Payment.create({
        influencerId: influencer._id,
        brandId: brand._id,
        campaignId: campaign1._id,
        amount: 3500,
        status: 'completed',
        description: 'Payment for Product Launch Campaign collaboration',
        transactionId: 'TXN-2026-0001',
    });

    // Create Analytics
    await Analytics.create({
        campaignId: campaign1._id,
        brandId: brand._id,
        impressions: 85400,
        clicks: 3200,
        engagement: 4.2,
        conversions: 180,
        roi: 240,
        reach: 72000,
    });

    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Demo Accounts:');
    console.log('  👑 Admin:      admin@porchest.com    / Admin123!');
    console.log('  🏢 Brand:      brand@demo.com        / Brand123!');
    console.log('  ⭐ Influencer: influencer@demo.com   / Influencer123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
