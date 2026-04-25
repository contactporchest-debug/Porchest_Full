const User = require('../models/User');
const SoftwareClientProfile = require('../models/SoftwareClientProfile');
const { generateUniqueCode } = require('./generateCode');

const DEMO_SOFTWARE_CLIENT_EMAIL = 'soft1@porchest.com';
const DEMO_SOFTWARE_CLIENT_PASSWORD = 'demo_porchest';

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

const SOFTWARE_CLIENT_PROFILE = {
    fullName: 'Saad Rahman',
    companyName: 'Northstar Digital Ventures',
    roleTitle: 'Product Owner',
    email: DEMO_SOFTWARE_CLIENT_EMAIL,
    phone: '+971 50 778 2144',
    country: 'United Arab Emirates',
    city: 'Dubai',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    clientSince: daysAgo(142),
    preferredContact: 'Weekly product review call + WhatsApp for urgent updates',
    workingHours: 'Mon-Fri, 11:00 AM to 7:00 PM GST',
    companyWebsite: 'https://northstardigital.co',
    companyStage: 'Growth-stage digital product business',
    industry: 'Marketing Technology',
    teamSize: '18 internal stakeholders',
    overview: {
        projectName: 'Porchest Influencer Collaboration Platform',
        currentStatus: 'In active development',
        simpleDescription: 'A multi-portal web platform for brands, influencers, admins, and software clients to manage influencer discovery, campaign workflows, analytics, and delivery visibility.',
        deadline: daysFromNow(21),
        nextProjectProposal: 'Phase 2 mobile companion app for campaign approvals, notifications, and executive reporting.',
        currentPhase: 'QA, demo preparation, and final product polish',
        completionPercent: 86,
    },
    currentRequirements: [
        'Role-based login and dedicated dashboards for all user types',
        'Brand-side influencer discovery, profile review, and collaboration request flow',
        'Influencer-side analytics, profile setup, and request management',
        'Admin monitoring for users, requests, and campaign visibility',
        'Presentation-ready seeded demo data with meaningful charts and collaboration records',
        'A software client portal showing project status, requirements, and delivery visibility',
    ],
    productGoals: [
        'Make campaign coordination easier for non-technical users',
        'Reduce back-and-forth between brands and influencers',
        'Give stakeholders a clean, trustworthy progress view during demos and delivery',
        'Present realistic analytics and workflow states for decision-making',
    ],
    technologyScope: [
        'Next.js frontend with protected role-based dashboard routing',
        'Node.js and Express backend with MongoDB persistence',
        'Reusable seeded demo data for influencer, brand, and software client accounts',
        'Charts and KPI visualizations for profiles and analytics',
    ],
    deliverablesSummary: [
        'Full multi-portal web application',
        'Seeded presentation accounts for each role',
        'Realistic collaboration and analytics demo data',
        'Client-facing project visibility portal',
    ],
    activeProject: {
        name: 'Porchest Platform Final Delivery',
        status: 'On track',
        phase: 'Final QA and presentation readiness',
        description: 'The main delivery stream focused on interface polish, seeded data realism, analytics validation, and stakeholder-facing demo readiness.',
        startDate: daysAgo(96),
        deadline: daysFromNow(21),
        progress: 86,
        budgetUsd: 14800,
        requirements: [
            'Stable authentication and role-based access',
            'Complete seeded flows for presentation accounts',
            'Meaningful visualizations and KPI summaries',
            'Consistent branding and polished UI across portals',
            'Client visibility into delivery phase, milestones, and pending requirements',
        ],
        deliverables: [
            'Working admin, brand, influencer, and software client portals',
            'Overview, profile, analytics, collaborations, and project-tracking experiences',
            'Presentation-ready seeded accounts and realistic activity records',
        ],
        notes: 'Current focus is final usability polish, client-facing visibility, and ensuring all demo flows open with meaningful data.',
        milestones: [
            { title: 'Core multi-role auth and dashboards', status: 'completed', dueDate: daysAgo(62), summary: 'Base routing, login, and protected dashboard structure completed.' },
            { title: 'Brand and influencer collaboration workflows', status: 'completed', dueDate: daysAgo(34), summary: 'Discovery, request handling, and collaboration lifecycle flows completed.' },
            { title: 'Analytics and full-profile presentation layer', status: 'completed', dueDate: daysAgo(14), summary: 'Charts, KPI blocks, and full influencer profile views completed.' },
            { title: 'Presentation data polishing and client portal', status: 'in_progress', dueDate: daysFromNow(7), summary: 'Refining seeded datasets and adding stakeholder-facing delivery visibility.' },
            { title: 'Final demo rehearsal and handoff pack', status: 'up_next', dueDate: daysFromNow(18), summary: 'Final walkthrough, delivery notes, and stakeholder demo package.' },
        ],
    },
    projects: [
        {
            name: 'Porchest Platform Final Delivery',
            status: 'On track',
            phase: 'Final QA and presentation readiness',
            description: 'Primary product stream covering the live web platform and seeded stakeholder demo experience.',
            startDate: daysAgo(96),
            deadline: daysFromNow(21),
            progress: 86,
            budgetUsd: 14800,
            requirements: [
                'Final bug fixes',
                'Cross-role demo data validation',
                'Client visibility and delivery updates',
            ],
            deliverables: [
                'Web platform delivery',
                'Presentation-ready accounts',
                'Stakeholder overview portal',
            ],
            notes: 'Healthy progress with the highest remaining priority on presentation confidence and clean stakeholder review.',
            milestones: [
                { title: 'Architecture and dashboard base', status: 'completed', dueDate: daysAgo(70), summary: 'Established role-based frontend and backend foundations.' },
                { title: 'Feature-complete collaboration flows', status: 'completed', dueDate: daysAgo(28), summary: 'Core product flow signed off for brand and influencer journeys.' },
                { title: 'Final presentation and handoff readiness', status: 'in_progress', dueDate: daysFromNow(7), summary: 'Final polish and seeded client-facing visibility in progress.' },
            ],
        },
        {
            name: 'Phase 2 Mobile Planning',
            status: 'Proposed',
            phase: 'Discovery',
            description: 'A future extension focused on mobile approvals, project notifications, and executive status snapshots.',
            startDate: daysFromNow(28),
            deadline: daysFromNow(75),
            progress: 18,
            budgetUsd: 6200,
            requirements: [
                'Mobile-friendly approval workflow',
                'Condensed reporting cards',
                'Push-style notification strategy',
            ],
            deliverables: [
                'Scope document',
                'Wireframe pack',
                'MVP roadmap',
            ],
            notes: 'Recommended as the next follow-up project once the current platform is delivered and feedback is captured.',
            milestones: [
                { title: 'Requirements workshop', status: 'up_next', dueDate: daysFromNow(32), summary: 'Align feature priorities for mobile visibility and approvals.' },
                { title: 'Wireframe and scope approval', status: 'up_next', dueDate: daysFromNow(46), summary: 'Approve MVP scope before technical planning begins.' },
            ],
        },
    ],
};

async function ensureDemoSoftwareClient() {
    let user = await User.findOne({ email: DEMO_SOFTWARE_CLIENT_EMAIL });

    if (!user) {
        user = await User.create({
            userCode: await generateUniqueCode('USR', User, 'userCode'),
            role: 'software-client',
            email: DEMO_SOFTWARE_CLIENT_EMAIL,
            password: DEMO_SOFTWARE_CLIENT_PASSWORD,
            status: 'active',
            isVerified: true,
            profileCompletionStatus: true,
        });
    } else {
        user.role = 'software-client';
        user.password = DEMO_SOFTWARE_CLIENT_PASSWORD;
        user.status = 'active';
        user.isVerified = true;
        user.profileCompletionStatus = true;
    }

    let profile = null;
    if (user.softwareClientProfileId) {
        profile = await SoftwareClientProfile.findById(user.softwareClientProfileId);
    }
    if (!profile) {
        profile = await SoftwareClientProfile.findOne({ userId: user._id });
    }

    if (!profile) {
        profile = await SoftwareClientProfile.create({
            softwareClientProfileId: await generateUniqueCode('SCL', SoftwareClientProfile, 'softwareClientProfileId'),
            userId: user._id,
            ...SOFTWARE_CLIENT_PROFILE,
        });
    } else {
        Object.assign(profile, SOFTWARE_CLIENT_PROFILE);
        await profile.save();
    }

    user.softwareClientProfileId = profile._id;
    user.brandProfileId = undefined;
    user.influencerProfileId = undefined;
    await user.save();

    return {
        email: DEMO_SOFTWARE_CLIENT_EMAIL,
        password: DEMO_SOFTWARE_CLIENT_PASSWORD,
        projectName: profile.overview.projectName,
    };
}

module.exports = {
    ensureDemoSoftwareClient,
    DEMO_SOFTWARE_CLIENT_EMAIL,
    DEMO_SOFTWARE_CLIENT_PASSWORD,
};
