'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import OverviewPage from './OverviewPage';
import ProfileCompletionBanner from './ProfileCompletionBanner';
import { influencerAPI } from '@/lib/api';
import {
    Instagram, CheckCircle, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InfluencerPortal() {
    const { user } = useAuth();
    const [igConnected, setIgConnected] = useState(false);
    const [dashStats, setDashStats] = useState<any>(null);
    const [profileCompletion, setProfileCompletion] = useState<any>(null);

    const displayName = user?.fullName || user?.email?.split('@')[0] || 'Influencer';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const p = new URLSearchParams(window.location.search);
            if (p.get('ig_connected') === '1') {
                toast.success('Instagram connected! ✅', { id: 'ig-conn' });
                window.history.replaceState({}, '', window.location.pathname);
            }
            if (p.get('ig_error')) {
                const m: Record<string, string> = { invalid_state: 'Security check failed.', missing_code: 'Authorization cancelled.', sync_failed: 'Sync failed. Try again.', token_expired: 'Token expired. Reconnect.' };
                toast.error(m[p.get('ig_error')!] || 'Instagram connection failed.', { id: 'ig-err' });
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
        
        influencerAPI.getDashboard()
            .then(res => {
                setDashStats(res.data.dashboard);
                setIgConnected(!!res.data.dashboard?.instagramConnection?.isConnected);
                setProfileCompletion(res.data.dashboard?.profileCompletion || null);
            })
            .catch(() => { });
    }, []);

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                {/* ── HERO HEADER ── */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
                    style={{ position: 'relative', marginBottom: '32px', padding: '28px 34px', borderRadius: '32px', background: 'linear-gradient(135deg,#ffffff 0%, #f8fafc 50%, #f5f3ff 100%)', border: '1px solid rgba(168,85,247,0.14)', backdropFilter: 'blur(30px)', overflow: 'hidden', boxShadow: '0 24px 48px rgba(15,23,42,0.06)' }}>
                    {/* Glow / grid */}
                    <div style={{ position: 'absolute', top: '-40px', left: '40%', width: '500px', height: '260px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(168,85,247,0.11) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(168,85,247,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', borderRadius: 'inherit' }} />

                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 13px', borderRadius: '99px', background: 'rgba(168,85,247,0.09)', border: '1px solid rgba(168,85,247,0.22)', marginBottom: '10px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Creator Control Panel</span>
                            </div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: 'clamp(1.4rem,3.5vw,2.2rem)', color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '6px', lineHeight: '1.1' }}>
                                Welcome,{' '}
                                <span style={{ background: 'linear-gradient(90deg,#A855F7,#7B3FF2,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{displayName}</span>
                            </h1>
                            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Manage your collaborations, track earnings, and keep your profile sharp.</p>
                        </div>

                        {/* Status badges */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ padding: '12px 16px', borderRadius: '16px', background: igConnected ? 'rgba(74,222,128,0.06)' : 'rgba(251,191,36,0.06)', border: `1px solid ${igConnected ? 'rgba(74,222,128,0.18)' : 'rgba(251,191,36,0.18)'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Instagram size={13} style={{ color: igConnected ? '#4ade80' : '#fbbf24' }} />
                                <div>
                                    <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '1px' }}>Instagram</p>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '12px', color: igConnected ? '#4ade80' : '#fbbf24' }}>
                                        {igConnected ? 'Connected' : 'Not Connected'}
                                    </p>
                                </div>
                            </div>
                            <div style={{ padding: '12px 16px', borderRadius: '16px', background: profileCompletion?.isComplete ? 'rgba(74,222,128,0.07)' : 'rgba(251,191,36,0.07)', border: `1px solid ${profileCompletion?.isComplete ? 'rgba(74,222,128,0.18)' : 'rgba(251,191,36,0.18)'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {profileCompletion?.isComplete ? <CheckCircle size={13} style={{ color: '#4ade80' }} /> : <AlertCircle size={13} style={{ color: '#fbbf24' }} />}
                                <div>
                                    <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '1px' }}>Profile</p>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '12px', color: profileCompletion?.isComplete ? '#4ade80' : '#fbbf24' }}>
                                        {profileCompletion?.isComplete ? 'Discoverable' : `${profileCompletion?.percentage || 0}% Complete`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── PROFILE COMPLETION BANNER (only shown when incomplete) ── */}
                <ProfileCompletionBanner completion={profileCompletion} />

                {/* ── CONTENT ── */}
                <OverviewPage stats={dashStats} />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
