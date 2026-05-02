'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Star, ArrowRight, Zap } from 'lucide-react';

const roleCards = [
    {
        icon: <Building2 size={28} />,
        role: 'Brand',
        color: '#a78bfa',
        href: '/signup/brand',
        tagline: 'Scale with clarity',
        desc: 'Create campaigns, match with creators, and manage every collaboration from one place.',
        perks: ['Influencer discovery', 'Campaign coordination', 'Live request tracking'],
    },
    {
        icon: <Star size={28} />,
        role: 'Influencer',
        color: '#60a5fa',
        href: '/signup/influencer',
        tagline: 'Monetize with confidence',
        desc: 'Receive brand requests, showcase your profile, and keep your collaborations organized.',
        perks: ['Brand request inbox', 'Profile visibility', 'Collaboration workflow'],
    },
];

export default function SignupPage() {
    return (
        <main style={{ minHeight: '100vh', padding: '48px 20px 64px', background: '#0c0c0c', position: 'relative', overflow: 'hidden' }}>
            <div className="neon-grid" />
            <div style={{ position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(123,63,242,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '24px' }}>
                        <Image src="/porchest-logo.png" alt="Porchest" width={168} height={42} priority style={{ width: '168px', height: 'auto', filter: 'brightness(10)' }} />
                    </Link>

                    <h1 className="display-text" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', marginBottom: '14px', color: '#fff' }}>
                        Choose how you want to join
                    </h1>
                    <p style={{ maxWidth: '520px', margin: '0 auto', fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                        Porchest gives brands and influencers tailored workflows. Pick the role that fits.
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
                    {roleCards.map((card, index) => (
                        <motion.div key={card.role} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}>
                            <Link href={card.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                                <div style={{
                                    height: '100%', padding: '32px', borderRadius: '20px',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    minHeight: '360px', transition: 'all 400ms cubic-bezier(0.23,1,0.32,1)', cursor: 'pointer',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                    <div>
                                        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${card.color}15`, border: `1px solid ${card.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, marginBottom: '24px' }}>
                                            {card.icon}
                                        </div>

                                        <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '999px', background: `${card.color}12`, color: card.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                                            {card.tagline}
                                        </div>

                                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '26px', letterSpacing: '-0.03em', color: '#fff', marginBottom: '12px' }}>
                                            I&apos;m a {card.role}
                                        </h2>
                                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: '24px' }}>
                                            {card.desc}
                                        </p>

                                        <div style={{ display: 'grid', gap: '10px' }}>
                                            {card.perks.map(perk => (
                                                <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: `${card.color}14`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Zap size={9} style={{ color: card.color }} />
                                                    </span>
                                                    {perk}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '28px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: card.color }}>Get started</span>
                                        <ArrowRight size={16} style={{ color: card.color }} />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
                </p>
            </div>
        </main>
    );
}
