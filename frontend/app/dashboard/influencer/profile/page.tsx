'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import InstagramConnect from '@/components/shared/InstagramConnect';
import ProfileForm from '@/components/influencer/ProfileForm';

export default function InfluencerProfilePage() {
    return (
        <ProtectedRoute allowedRoles={['influencer']}>
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
                            <div>
                                <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7A5030', fontWeight: 700 }}>Influencer profile</p>
                                <h1 style={{ marginTop: '8px', fontSize: '30px', fontWeight: 800, letterSpacing: '-0.04em', color: '#1A0A00' }}>Profile Setup</h1>
                                <p style={{ marginTop: '8px', maxWidth: '672px', fontSize: '14px', color: '#7A5030', lineHeight: 1.6 }}>
                                    Your profile is shown to brands searching for influencers. Keep your Instagram, identity, niche, languages, and rates up to date.
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    borderRadius: '99px',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    background: 'rgba(16,185,129,0.1)',
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: '#059669',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Profile ready
                                </div>
                                <a
                                    href="#profile-form"
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

                    <InstagramConnect role="influencer" />
                    <div id="profile-form">
                        <ProfileForm />
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
