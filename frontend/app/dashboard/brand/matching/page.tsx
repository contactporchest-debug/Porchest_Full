'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion } from 'framer-motion';
import { Bot, UserX, ArrowRight, Loader2 } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import InfluencerSearch from '../InfluencerSearch';
import Link from 'next/link';

export default function AiMatchingPage() {
    const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        brandAPI.getDashboard().then(res => {
            setProfileComplete(res.data.dashboard.profileComplete);
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }, []);

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
                    </div>
                ) : profileComplete ? (
                    <InfluencerSearch />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.03em', marginBottom: '4px' }}>AI Matching</h1>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Intelligent influencer recommendations for your brand</p>
                        </div>

                        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                            className="glass-card" style={{ padding: '80px 40px', borderRadius: '36px', textAlign: 'center', border: '1px solid rgba(123,63,242,0.15)', position: 'relative', overflow: 'hidden' }}>
                            {/* Glow */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(123,63,242,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(123,63,242,0.12)', border: '1px solid rgba(123,63,242,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px rgba(123,63,242,0.2)' }}>
                                    <UserX size={40} style={{ color: '#a78bfa' }} />
                                </div>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', marginBottom: '10px' }}>Action Required: Complete Your Profile</p>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', maxWidth: '420px', margin: '0 auto 28px', lineHeight: '1.7' }}>
                                    To unlock our intelligent matchmaking system and discover influencers, you must first complete your brand profile 100%.
                                </p>
                                <Link href="/dashboard/brand/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '99px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', color: '#fff', fontSize: '14px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 0 30px rgba(123,63,242,0.4)', transition: 'all 200ms ease' }}>
                                    Go to Profile <ArrowRight size={15} />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
