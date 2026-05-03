'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CollaborationsFlow from '@/components/brand/CollaborationsFlow';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';
import { motion } from 'framer-motion';

type BrandProfileResponse = {
    profileComplete?: boolean;
};

export default function BrandCollaborationsRoute() {
    const { data, loading } = useApi('/profile/brand/me');
    const profile = data as BrandProfileResponse | null;
    const profileComplete = !!profile?.profileComplete;

    return (
        <ProtectedRoute allowedRoles={['brand']}>
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
                        <h1 className="mt-2 text-2xl font-semibold text-white">Complete your brand profile first</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">
                            Complete your brand profile first to manage collaborations and campaign workflows.
                        </p>
                        <Link
                            href="/dashboard/brand/profile"
                            className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                            Go to profile
                        </Link>
                    </motion.div>
                ) : (
                    <>
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Collaborations</h2>
                            <p className="mt-1 text-sm text-white/45">Manage your active campaigns, pending requests, and influencer posts.</p>
                        </div>
                        <CollaborationsFlow />
                    </>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
