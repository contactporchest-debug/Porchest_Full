'use client';
import { motion } from 'framer-motion';
import { X, BarChart3, TrendingUp } from 'lucide-react';

interface Props { onClose: () => void; }

export default function AnalyticsPanel({ onClose }: Props) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(26,10,0,0.5)', backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '24px' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                style={{ maxWidth: '720px', margin: '0 auto', background: '#FDF6EE', border: '1px solid #EDD9BC', borderRadius: '24px', boxShadow: '0 16px 40px rgba(26,10,0,0.1)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(194,52,10,0.1)', border: '1px solid rgba(194,52,10,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C2340A' }}>
                            <BarChart3 size={18} />
                        </div>
                        <div>
                            <h2 style={{ fontWeight: 800, fontSize: '18px', color: '#1A0A00', letterSpacing: '-0.02em', marginBottom: '2px' }}>Campaign Analytics</h2>
                            <p style={{ fontSize: '13px', color: '#7A5030', fontWeight: 500 }}>Live performance data</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.8)', border: '1px solid #EDD9BC', color: '#1A0A00', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}>
                        <X size={18} />
                    </button>
                </div>

                {/* Empty state */}
                <div style={{ padding: '80px 32px', textAlign: 'center' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'rgba(255,255,255,0.6)', border: '1px dashed #EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#C4A882' }}>
                        <TrendingUp size={30} />
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: '20px', color: '#1A0A00', marginBottom: '12px' }}>
                        Analytics Coming Soon
                    </h3>
                    <p style={{ fontSize: '15px', color: '#7A5030', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto' }}>
                        Campaign performance metrics will appear here once your influencer posts content and it gets verified by our team.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
