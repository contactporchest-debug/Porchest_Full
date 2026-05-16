'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import BrandProfileForm from '@/components/brand/BrandProfileForm';
import { useApi } from '@/hooks/useApi';
import { Building2 } from 'lucide-react';

type BrandProfileResponse = {
    logo?: string;
    logoUrl?: string;
    businessName?: string;
    brandName?: string;
};

export default function BrandProfilePage() {
    const { data: brandProfile } = useApi<BrandProfileResponse>('/profile/brand/me');
    const brandLogo = brandProfile?.logo || brandProfile?.logoUrl || '';
    const brandName = brandProfile?.businessName || brandProfile?.brandName || 'Your profile';

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ margin: '0 auto', display: 'flex', width: '100%', maxWidth: '1152px', flexDirection: 'column', gap: '24px' }}>
                    <div style={{
                        borderRadius: '28px',
                        border: '1px solid #EDD9BC',
                        background: 'rgba(255,255,255,0.4)',
                        backdropFilter: 'blur(12px)',
                        padding: '24px',
                        boxShadow: '0 8px 32px rgba(26,10,0,0.04)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="lg:flex-row lg:items-end lg:justify-between">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '18px',
                                    border: '1px solid #EDD9BC',
                                    background: 'rgba(255,255,255,0.72)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                }}>
                                    {brandLogo ? (
                                        <img src={brandLogo} alt={brandName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Building2 size={26} style={{ color: '#C2340A' }} />
                                    )}
                                </div>
                                <div>
                                <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7A5030', fontWeight: 700 }}>Your profile</p>
                                <h1 style={{ marginTop: '8px', fontSize: '30px', fontWeight: 800, letterSpacing: '-0.04em', color: '#1A0A00' }}>Profile Setup</h1>
                                <p style={{ marginTop: '8px', maxWidth: '672px', fontSize: '14px', color: '#7A5030', lineHeight: 1.6 }}>
                                    Complete your business, audience, and campaign preferences so Porchest can match you with the right creators.
                                </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    borderRadius: '99px',
                                    border: '1px solid #EDD9BC',
                                    background: 'rgba(255,255,255,0.6)',
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: '#C2340A',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    backdropFilter: 'blur(12px)'
                                }}>
                                    Profile ready
                                </div>
                                <a
                                    href="#brand-profile-form"
                                    style={{
                                        borderRadius: '99px',
                                        border: '1px solid #EDD9BC',
                                        background: 'rgba(255,255,255,0.6)',
                                        padding: '8px 16px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: '#1A0A00',
                                        textDecoration: 'none',
                                        transition: 'background-color 0.2s',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}
                                >
                                    Edit profile
                                </a>
                            </div>
                        </div>
                    </div>

                    <div id="brand-profile-form">
                        <BrandProfileForm />
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
