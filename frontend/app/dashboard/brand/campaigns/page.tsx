'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CampaignsPage from '../CampaignsPage';
import InfluencerSearch from '../InfluencerSearch';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

export default function BrandCampaignRoute() {
    const [showSearch, setShowSearch] = useState(false);

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                {/* Quick-access: propose new deal */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <button onClick={() => setShowSearch(s => !s)}
                        style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '14px', background: showSearch ? 'rgba(123,63,242,0.15)' : 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: showSearch ? '1px solid rgba(123,63,242,0.3)' : 'none', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: showSearch ? 'none' : '0 0 22px rgba(123,63,242,0.35)', transition: 'all 200ms ease' }}>
                        <Send size={13} /> {showSearch ? 'Cancel' : 'Propose Deal to Influencer'}
                    </button>
                </div>

                {/* Influencer search (optional, toggled) */}
                {showSearch && (
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                        className="glass-card" style={{ padding: '26px', borderRadius: '28px', marginBottom: '24px' }}>
                        <InfluencerSearch />
                    </motion.div>
                )}

                <CampaignsPage />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
