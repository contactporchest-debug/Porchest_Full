'use client';
import { motion } from 'framer-motion';
import { X, BarChart3, TrendingUp } from 'lucide-react';

interface Props { onClose: () => void; }

export default function AnalyticsPanel({ onClose }: Props) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(241,245,249,0.82)', backdropFilter: 'blur(12px)', overflowY: 'auto', padding: '24px' }}>
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                style={{ maxWidth: '720px', margin: '0 auto', background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(123,63,242,0.14)', borderRadius: '36px', boxShadow: '0 32px 80px rgba(15,23,42,0.16)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '28px 32px', borderBottom: '1px solid rgba(148,163,184,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#f5f3ff,#eff6ff)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(123,63,242,0.15)', border: '1px solid rgba(123,63,242,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                            <BarChart3 size={18} />
                        </div>
                        <div>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '17px', color: '#0f172a', letterSpacing: '-0.02em' }}>Campaign Analytics</h2>
                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Live performance data</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.84)', border: '1px solid rgba(148,163,184,0.22)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Empty state */}
                <div style={{ padding: '80px 32px', textAlign: 'center' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: 'rgba(123,63,242,0.08)', border: '1px solid rgba(123,63,242,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'rgba(123,63,242,0.5)' }}>
                        <TrendingUp size={30} />
                    </div>
                    <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '18px', color: '#0f172a', marginBottom: '10px' }}>
                        Analytics Coming Soon
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.7', maxWidth: '340px', margin: '0 auto' }}>
                        Campaign performance metrics will appear here once your influencer posts content and it gets verified by our team.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
