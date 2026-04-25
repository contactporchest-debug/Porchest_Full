'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Star, ArrowRight, Zap } from 'lucide-react';

const roleCards = [
    {
        icon: <Building2 size={30} />,
        role: 'Brand',
        color: '#7B3FF2',
        href: '/signup/brand',
        tagline: 'Scale with clarity',
        desc: 'Create campaigns, match with creators, and manage every collaboration from one place.',
        perks: ['Influencer discovery', 'Campaign coordination', 'Live request tracking'],
    },
    {
        icon: <Star size={30} />,
        role: 'Influencer',
        color: '#0ea5e9',
        href: '/signup/influencer',
        tagline: 'Monetize with confidence',
        desc: 'Receive brand requests, showcase your profile, and keep your collaborations organized.',
        perks: ['Brand request inbox', 'Profile visibility', 'Collaboration workflow'],
    },
];

export default function SignupPage() {
    return (
        <main style={{ minHeight: '100vh', padding: '48px 20px 64px', background: 'linear-gradient(180deg, #fcfaf4 0%, #f4efe4 100%)', position: 'relative', overflow: 'hidden' }}>
            <div className="neon-grid" />
            <div className="edge-glow" />
            <div style={{ position: 'absolute', top: '-140px', right: '-120px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,63,242,0.12) 0%, transparent 72%)' }} />
            <div style={{ position: 'absolute', bottom: '-160px', left: '-100px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 72%)' }} />

            <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '38px' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '18px' }}>
                        <Image src="/porchest-logo.png" alt="Porchest" width={168} height={42} priority style={{ width: '168px', height: 'auto' }} />
                    </Link>

                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', lineHeight: 1.05, letterSpacing: '-0.05em', color: '#172033', marginBottom: '14px' }}>
                        Choose how you want to join
                    </h1>
                    <p style={{ maxWidth: '620px', margin: '0 auto', fontSize: '16px', color: '#667085', lineHeight: 1.7 }}>
                        Porchest gives brands and influencers tailored workflows. Pick the role that fits your work today.
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px', alignItems: 'stretch' }}>
                    {roleCards.map((card, index) => (
                        <motion.div
                            key={card.role}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                        >
                            <Link href={card.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                                <div
                                    className="glass-card"
                                    style={{
                                        height: '100%',
                                        padding: '34px',
                                        borderRadius: '30px',
                                        border: `1px solid ${card.color}24`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        minHeight: '380px',
                                    }}
                                >
                                    <div>
                                        <div style={{ width: '62px', height: '62px', borderRadius: '20px', background: `${card.color}16`, border: `1px solid ${card.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, marginBottom: '22px' }}>
                                            {card.icon}
                                        </div>

                                        <div style={{ display: 'inline-flex', padding: '5px 12px', borderRadius: '999px', background: `${card.color}12`, color: card.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px' }}>
                                            {card.tagline}
                                        </div>

                                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.03em', color: '#172033', marginBottom: '12px' }}>
                                            I&apos;m a {card.role}
                                        </h2>
                                        <p style={{ fontSize: '15px', color: '#667085', lineHeight: 1.7, marginBottom: '22px' }}>
                                            {card.desc}
                                        </p>

                                        <div style={{ display: 'grid', gap: '10px' }}>
                                            {card.perks.map((perk) => (
                                                <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#475467' }}>
                                                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: `${card.color}14`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Zap size={10} style={{ color: card.color }} />
                                                    </span>
                                                    {perk}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '28px', paddingTop: '18px', borderTop: '1px solid rgba(148,163,184,0.16)' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: card.color }}>Get started</span>
                                        <ArrowRight size={16} style={{ color: card.color }} />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: '#667085' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#7B3FF2', fontWeight: 700, textDecoration: 'none' }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
