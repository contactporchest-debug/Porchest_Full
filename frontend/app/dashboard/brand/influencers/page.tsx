'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import InfluencerDiscovery from '@/components/brand/InfluencerDiscovery';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';
import { motion } from 'framer-motion';

type BrandProfileResponse = {
    profileComplete?: boolean;
};

export default function BrandInfluencersRoute() {
    const { data, loading } = useApi('/profile/brand/me');
    const profile = data as BrandProfileResponse | null;
    const profileComplete = !!profile?.profileComplete;

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                {loading ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-sm text-white/50">
                        Loading profile status...
                    </div>
                ) : !profileComplete ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.16)]"
                    >
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Profile incomplete</p>
                        <h1 className="mt-2 text-2xl font-semibold text-white">Complete your brand profile first</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
                            Complete your brand profile first to browse influencers. This helps us calculate how well your target audience matches each influencer.
                        </p>
                        <Link
                            href="/dashboard/brand/profile"
                            className="mt-6 inline-flex items-center rounded-2xl bg-gradient-to-r from-[#8f6a45] to-[#c79b6a] px-5 py-3 text-sm font-semibold text-white transition-shadow hover:shadow-[0_18px_36px_rgba(199,155,106,0.25)]"
                        >
                            Go to profile
                        </Link>
                    </motion.div>
                ) : (
                    <InfluencerDiscovery />
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
