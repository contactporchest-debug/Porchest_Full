'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

export default function AiMatchingPage() {
    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.03em', marginBottom: '4px' }}>AI Matching</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Intelligent influencer recommendations for your brand</p>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                        className="glass-card" style={{ padding: '80px 40px', borderRadius: '36px', textAlign: 'center', border: '1px solid rgba(123,63,242,0.15)', position: 'relative', overflow: 'hidden' }}>
                        {/* Glow */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(123,63,242,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                        {/* Grid */}
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(123,63,242,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(123,63,242,0.03) 1px,transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none', borderRadius: 'inherit' }} />
                        <div style={{ position: 'relative' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(123,63,242,0.12)', border: '1px solid rgba(123,63,242,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px rgba(123,63,242,0.2)' }}>
                                <Bot size={40} style={{ color: '#a78bfa' }} />
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '99px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', marginBottom: '18px' }}>
                                <Sparkles size={11} style={{ color: '#fbbf24' }} />
                                <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '700', letterSpacing: '0.08em' }}>COMING SOON</span>
                            </div>
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', marginBottom: '10px' }}>AI-Powered Influencer Matching</p>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', maxWidth: '420px', margin: '0 auto', lineHeight: '1.7' }}>
                                Our AI engine will analyze your brand profile, campaign goals, and audience fit to recommend the best-matched influencers — automatically.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
