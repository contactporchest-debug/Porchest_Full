'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import OverviewPage from './OverviewPage';
import { useApi } from '@/hooks/useApi';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

type BrandProfileResponse = {
    profileComplete?: boolean;
    logo?: string;
    logoUrl?: string;
    businessName?: string;
    brandName?: string;
};

export default function BrandPortalOverview() {
    const { data: profile, loading } = useApi<BrandProfileResponse>('/profile/brand/me');
    const profileComplete = !!profile?.profileComplete;
    const brandLogo = profile?.logo || profile?.logoUrl || '';
    const brandName = profile?.businessName || profile?.brandName || '';

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                {loading ? (
                    <div style={{ padding: '24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', fontSize: '14px', color: '#7A5030' }}>
                        Loading brand profile...
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {!profileComplete && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    borderRadius: '14px',
                                    border: '1px solid rgba(255,107,26,0.3)',
                                    background: 'rgba(255,107,26,0.1)',
                                    padding: '24px',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <AlertCircle size={14} style={{ color: '#E8400A' }} />
                                            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#E8400A', fontWeight: 600 }}>Action required</p>
                                        </div>
                                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A0A00' }}>Complete your brand profile first</h2>
                                        <p style={{ marginTop: '8px', fontSize: '14px', color: '#7A5030', lineHeight: 1.65, maxWidth: '600px' }}>
                                            You need a complete brand profile before you can browse influencers. Finish your business, audience, and campaign preferences in the profile page.
                                        </p>
                                    </div>
                                    <Link
                                        href="/dashboard/brand/profile"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            borderRadius: '8px', background: '#C2340A', color: '#fff',
                                            padding: '11px 24px', fontSize: '13px', fontWeight: 500,
                                            textDecoration: 'none', transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E8400A'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#C2340A'; }}
                                    >
                                        Complete profile
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        <OverviewPage profileCompleteOverride={profileComplete} brandLogo={brandLogo} brandName={brandName} />
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
