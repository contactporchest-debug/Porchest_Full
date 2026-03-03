'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import OverviewPage from './OverviewPage';
import InfluencerSearch from './InfluencerSearch';
import { motion } from 'framer-motion';

export default function BrandPortalOverview() {
    const { user } = useAuth();
    const displayName = user?.companyName || user?.email?.split('@')[0] || 'Brand';

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                {/* Hero Header */}
                <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    style={{ position: 'relative', marginBottom: '30px', padding: '28px 32px', borderRadius: '32px', background: 'rgba(14,12,26,0.75)', border: '1px solid rgba(123,63,242,0.16)', backdropFilter: 'blur(28px)', overflow: 'hidden', boxShadow: '0 0 100px rgba(123,63,242,0.10)' }}>
                    {/* Grid overlay */}
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(123,63,242,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(123,63,242,0.04) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', borderRadius: 'inherit' }} />
                    {/* Radial glow */}
                    <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '250px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(123,63,242,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative' }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px' }}>🚀 Porchest Brand Portal</p>
                        <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: 'clamp(1.5rem,3.5vw,2.4rem)', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '6px' }}>
                            Welcome back,{' '}
                            <span style={{ background: 'linear-gradient(90deg, #7B3FF2, #A855F7, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 18px rgba(123,63,242,0.5))' }}>{displayName}</span>
                        </h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.32)', fontWeight: '500' }}>Your campaign command center — real data, no noise.</p>
                    </div>
                </motion.div>

                <OverviewPage />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
