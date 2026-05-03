'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CampaignsFlow from '@/components/influencer/CampaignsFlow';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';
import { motion } from 'framer-motion';

type InfluencerProfileResponse = {
    profileComplete?: boolean;
};

export default function InfluencerCollaborationsRoute() {
    const { data, loading } = useApi('/profile/influencer/me');
    const profile = data as InfluencerProfileResponse | null;
    const profileComplete = !!profile?.profileComplete;

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                {loading ? (
                    <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-6 text-sm text-gray-400">
                        Loading profile status...
                    </div>
                ) : !profileComplete ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-6"
                    >
                        <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/70">Profile incomplete</p>
                        <h1 className="mt-2 text-2xl font-semibold text-white">Complete your profile first</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">
                            Complete your profile first to see campaign opportunities and collaboration workflows.
                        </p>
                        <Link
                            href="/dashboard/influencer/profile"
                            className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                            Go to profile
                        </Link>
                    </motion.div>
                ) : (
                    <CampaignsFlow />
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
