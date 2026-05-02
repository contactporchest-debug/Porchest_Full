'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import OverviewPage from './OverviewPage';
import ConnectInstagramBanner from '@/components/shared/ConnectInstagramBanner';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function BrandPortalOverview() {
    const { user } = useAuth();
    const { data: profile, loading } = useApi('/profile/brand/me');
    const profileComplete = !!profile?.profileComplete;
    const instagramConnected = !!(profile?.igUsername || user?.instagramConnected || user?.instagramConnectionStatus === 'connected');

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                {loading ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-sm text-white/50">
                        Loading brand profile...
                    </div>
                ) : (
                    <div className="space-y-6">
                        {!profileComplete && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.16)]"
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/70">Action required</p>
                                        <h2 className="mt-1 text-xl font-semibold text-white">Complete your brand profile first</h2>
                                        <p className="mt-2 max-w-2xl text-sm text-white/60">
                                            You need a complete brand profile before you can browse influencers. Finish your business, audience, and campaign preferences in the profile page.
                                        </p>
                                    </div>
                                    <Link
                                        href="/dashboard/brand/profile"
                                        className="inline-flex items-center justify-center rounded-2xl border border-amber-200/30 bg-amber-200/10 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/15"
                                    >
                                        Complete profile
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        {!instagramConnected && <ConnectInstagramBanner role="brand" />}
                        <OverviewPage profileCompleteOverride={profileComplete} />
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
