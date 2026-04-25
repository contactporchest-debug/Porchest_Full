require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const SoftwareClientProfile = require('../models/SoftwareClientProfile');
const crypto = require('crypto');

async function seedSoftwareClient() {
    console.log('⚠️ STARTING SOFTWARE CLIENT DEMO SEEDING ⚠️');
    if (!process.env.MONGODB_URI) {
        console.error('Error: MONGODB_URI is undefined.');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Delete existing demo user and profile
        const existingUser = await User.findOne({ email: 'soft1@porchest.com' });
        if (existingUser) {
            await SoftwareClientProfile.deleteOne({ userId: existingUser._id });
            await User.deleteOne({ _id: existingUser._id });
            console.log('🗑️ Deleted existing demo user and profile');
        }

        // Create new user
        const demoUser = new User({
            userCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
            email: 'soft1@porchest.com',
            password: 'demo_porchest', // Will be hashed by pre-save hook
            role: 'software-client',
            status: 'active',
            isVerified: true,
            loginProvider: 'local',
            profileCompletionStatus: true
        });

        await demoUser.save();
        console.log('👤 Created User: soft1@porchest.com');

        // Create the SoftwareClientProfile
        const clientProfile = new SoftwareClientProfile({
            softwareClientProfileId: `SCP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            userId: demoUser._id,
            fullName: 'Alex Reynolds',
            companyName: 'NexGen Dynamics',
            roleTitle: 'Chief Product Officer',
            email: 'soft1@porchest.com',
            phone: '+1 (555) 019-8472',
            country: 'United States',
            city: 'San Francisco, CA',
            avatarUrl: 'https://i.pravatar.cc/150?u=soft1',
            clientSince: new Date('2025-06-15T00:00:00Z'),
            preferredContact: 'Email / Slack',
            workingHours: '9:00 AM - 6:00 PM PST',
            companyWebsite: 'https://nexgendynamics.test',
            companyStage: 'Series B',
            industry: 'FinTech / SaaS',
            teamSize: '50-100 Employees',

            overview: {
                projectName: 'NexGen Pay Analytics Dashboard',
                currentStatus: 'On Track',
                simpleDescription: 'Developing a comprehensive, real-time analytics dashboard for B2B payment flows, featuring AI-driven anomaly detection and interactive visualization modules.',
                deadline: new Date('2026-08-30T00:00:00Z'),
                nextProjectProposal: 'Mobile Application for Consumer Insights',
                currentPhase: 'Backend Integration & API Refinement',
                completionPercent: 65,
            },

            currentRequirements: [
                'Integrate Plaid API for bank feed synchronization',
                'Implement robust role-based access control (RBAC)',
                'Build interactive charts using D3.js and Recharts',
                'Ensure SOC2 compliance for data handling'
            ],
            productGoals: [
                'Reduce payment reconciliation time by 40%',
                'Provide actionable insights into cash flow anomalies',
                'Create a seamless, high-performance UI experience'
            ],
            technologyScope: [
                'Next.js (React)', 'Node.js (Express)', 'PostgreSQL', 'Redis', 'AWS (EKS, RDS, S3)'
            ],
            deliverablesSummary: [
                'API Documentation (Swagger)',
                'Frontend Dashboard Application',
                'Infrastructure as Code (Terraform scripts)'
            ],

            activeProject: {
                name: 'NexGen Pay Analytics Dashboard v1.0',
                status: 'running',
                phase: 'Development',
                description: 'The core analytics engine and user interface for the NexGen Pay suite.',
                startDate: new Date('2026-01-10T00:00:00Z'),
                deadline: new Date('2026-08-30T00:00:00Z'),
                progress: 65,
                budgetUsd: 120000,
                requirements: [
                    'Real-time WebSocket updates for transactions',
                    'Dark mode / Light mode support',
                    'Export to PDF / CSV functionality',
                    'Customizable dashboard widgets'
                ],
                deliverables: [
                    'Phase 1: Database Schema & Core APIs (Completed)',
                    'Phase 2: Authentication & User Management (Completed)',
                    'Phase 3: Real-time Analytics Engine (In Progress)',
                    'Phase 4: Frontend UI implementation (In Progress)',
                    'Phase 5: Beta Testing & QA (Up Next)'
                ],
                notes: 'Focus on performance optimization for the analytics queries on large datasets. Client wants sub-second load times for the primary dashboard views.',
                milestones: [
                    { title: 'Project Kickoff & Requirements Finalization', status: 'completed', dueDate: new Date('2026-01-20T00:00:00Z'), summary: 'Finalized scope and technical architecture.' },
                    { title: 'Backend Core APIs Delivered', status: 'completed', dueDate: new Date('2026-03-15T00:00:00Z'), summary: 'All REST and GraphQL endpoints deployed to staging.' },
                    { title: 'Real-time Analytics Engine Integration', status: 'in_progress', dueDate: new Date('2026-05-15T00:00:00Z'), summary: 'Integrating Kafka streams with WebSockets.' },
                    { title: 'User Acceptance Testing (UAT)', status: 'up_next', dueDate: new Date('2026-07-20T00:00:00Z'), summary: 'Client testing phase.' }
                ]
            },
            projects: [
                {
                    name: 'NexGen Legacy Migration',
                    status: 'completed',
                    phase: 'Post-Launch',
                    description: 'Migration of the legacy monolithic application to a microservices architecture.',
                    startDate: new Date('2025-07-01T00:00:00Z'),
                    deadline: new Date('2025-12-15T00:00:00Z'),
                    progress: 100,
                    budgetUsd: 85000,
                    requirements: ['Zero downtime migration', 'AWS transition'],
                    deliverables: ['Microservices architecture', 'Migration scripts', 'Documentation'],
                    notes: 'Completed successfully 2 weeks ahead of schedule.',
                    milestones: [
                        { title: 'Architecture Design', status: 'completed', dueDate: new Date('2025-08-01T00:00:00Z') },
                        { title: 'Data Migration', status: 'completed', dueDate: new Date('2025-10-15T00:00:00Z') },
                        { title: 'Go Live', status: 'completed', dueDate: new Date('2025-12-01T00:00:00Z') }
                    ]
                }
            ]
        });

        await clientProfile.save();
        console.log('🏢 Created SoftwareClientProfile:', clientProfile.softwareClientProfileId);

        // Link profile to user
        demoUser.softwareClientProfileId = clientProfile._id;
        await demoUser.save();
        console.log('🔗 Linked profile to user');

        console.log('✅ SOFTWARE CLIENT DEMO SEEDING COMPLETE');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database.');
        process.exit(0);
    }
}

seedSoftwareClient();
