'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

/* ─── NAV ─── */
function LandingNav() {
    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };
    return (
        <header style={{
            position: 'sticky', top: 0, zIndex: 50, width: '100%',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', height: '64px', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Logo */}
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <Image src="/logo.png" alt="Porchest" width={36} height={36} style={{ borderRadius: '8px' }} />
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#fff' }}>Porchest</span>
                </Link>

                {/* Nav links */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    {[
                        { label: 'Features', id: 'features' },
                        { label: 'How It Works', id: 'how-it-works' },
                        { label: 'Contact', id: 'contact' },
                    ].map(item => (
                        <button key={item.id} onClick={() => scrollTo(item.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'rgba(255,255,255,0.55)', fontFamily: 'inherit', transition: 'color 200ms ease' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Auth */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link href="/login" style={{ padding: '8px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '14px', fontWeight: '600', textDecoration: 'none', transition: 'background 200ms ease' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                        Sign In
                    </Link>
                    <Link href="/signup" style={{ padding: '8px 20px', borderRadius: '10px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', color: '#fff', fontSize: '14px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 0 20px rgba(123,63,242,0.35)' }}>
                        Sign Up
                    </Link>
                </div>
            </div>
        </header>
    );
}

/* ─── HERO ─── */
function Hero() {
    return (
        <section style={{ position: 'relative', display: 'flex', minHeight: '92vh', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#000', paddingTop: '60px' }}>
            {/* Orbs */}
            <div style={{ position: 'absolute', top: '-160px', right: '-160px', width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,63,242,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-160px', left: '-160px', width: '480px', height: '480px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', textAlign: 'center', padding: '0 24px' }}>
                {/* Badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 18px', borderRadius: '99px', background: 'rgba(123,63,242,0.1)', border: '1px solid rgba(123,63,242,0.3)', marginBottom: '36px', boxShadow: '0 0 30px rgba(123,63,242,0.15)' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 10px #7B3FF2', display: 'inline-block' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#a78bfa', letterSpacing: '0.04em' }}>AI-Powered Influencer Marketing Platform</span>
                </div>

                {/* Headline */}
                <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', letterSpacing: '-0.04em', lineHeight: '1.02', color: '#fff', marginBottom: '24px' }}>
                    Unlock Influencer{' '}
                    <span style={{ background: 'linear-gradient(90deg,#7B3FF2,#A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        Intelligence
                    </span>
                </h1>

                <p style={{ fontSize: 'clamp(1rem,2.2vw,1.2rem)', color: 'rgba(255,255,255,0.5)', maxWidth: '560px', margin: '0 auto 44px', lineHeight: '1.65' }}>
                    Discover authentic influencers, analyze audience demographics, and measure campaign ROI with precision.
                </p>

                {/* CTAs */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px', marginBottom: '64px' }}>
                    <a href="https://wa.me/923477437615" target="_blank" rel="noopener noreferrer"
                        style={{ padding: '15px 36px', borderRadius: '14px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', color: '#fff', fontWeight: '700', fontSize: '15px', textDecoration: 'none', boxShadow: '0 0 28px rgba(123,63,242,0.4)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        💬 Chat on WhatsApp
                    </a>
                    <a href="mailto:info@porchest.com"
                        style={{ padding: '15px 36px', borderRadius: '14px', border: '1px solid rgba(123,63,242,0.45)', color: '#fff', fontWeight: '700', fontSize: '15px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        ✉️ Send Email
                    </a>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '48px', maxWidth: '600px', margin: '0 auto' }}>
                    {[
                        { val: '10K+', label: 'Influencers Tracked' },
                        { val: '50M+', label: 'Audience Analyzed' },
                        { val: '95%', label: 'Accuracy Rate' },
                    ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '2.2rem', background: 'linear-gradient(90deg,#7B3FF2,#A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.val}</div>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── FEATURES ─── */
const FEATURES = [
    { icon: '📊', title: 'Audience Analytics', description: 'Deep insights into follower demographics, engagement patterns, and audience growth trends.' },
    { icon: '🎯', title: 'Influencer Discovery', description: 'Find perfectly matched influencers based on niche, audience size, and engagement rates.' },
    { icon: '💰', title: 'ROI Measurement', description: 'Track campaign performance and calculate exact return on investment for every collaboration.' },
    { icon: '🔍', title: 'Authenticity Check', description: 'Identify fake followers and bots to ensure authentic brand partnerships.' },
    { icon: '📈', title: 'Growth Tracking', description: 'Monitor influencer growth metrics and historical performance data over time.' },
    { icon: '🤝', title: 'Campaign Management', description: 'Manage multiple influencer campaigns with detailed collaboration and payment tracking.' },
];

function Features() {
    return (
        <section id="features" style={{ background: '#000', padding: '100px 24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '-0.03em', color: '#fff', marginBottom: '16px' }}>
                        Everything you need for{' '}
                        <span style={{ background: 'linear-gradient(90deg,#7B3FF2,#A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            Influencer Marketing
                        </span>
                    </h2>
                    <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', maxWidth: '560px', margin: '0 auto', lineHeight: '1.65' }}>
                        Comprehensive tools to discover, analyze, and collaborate with influencers that drive real results.
                    </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '20px' }}>
                    {FEATURES.map((f) => (
                        <div key={f.title} style={{
                            padding: '32px', borderRadius: '24px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            transition: 'border-color 260ms ease, box-shadow 260ms ease',
                        }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,63,242,0.4)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(123,63,242,0.1)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                            <div style={{ fontSize: '36px', marginBottom: '16px' }}>{f.icon}</div>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '18px', color: '#fff', marginBottom: '10px' }}>{f.title}</h3>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.65' }}>{f.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── HOW IT WORKS ─── */
const STEPS = [
    { number: '01', title: 'Define Your Goals', description: 'Specify your campaign objectives, budget, and target audience demographics.' },
    { number: '02', title: 'Discover Influencers', description: 'Browse our database of 10,000+ verified influencers filtered by niche and metrics.' },
    { number: '03', title: 'Analyze Performance', description: 'Review detailed analytics on audience quality, engagement rates, and past collaborations.' },
    { number: '04', title: 'Launch Campaign', description: 'Collaborate with influencers and track real-time campaign performance and ROI.' },
];

function HowItWorks() {
    return (
        <section id="how-it-works" style={{ background: '#000', padding: '100px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '-0.03em', color: '#fff', marginBottom: '16px' }}>
                        How It Works
                    </h2>
                    <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', maxWidth: '460px', margin: '0 auto' }}>
                        Get started with influencer marketing in four simple steps.
                    </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '32px' }}>
                    {STEPS.map((step, i) => (
                        <div key={step.number} style={{ position: 'relative' }}>
                            <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '4rem', color: '#7B3FF2', opacity: 0.2, lineHeight: 1, marginBottom: '12px' }}>{step.number}</div>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '18px', color: '#fff', marginBottom: '10px' }}>{step.title}</h3>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.65' }}>{step.description}</p>
                            {i < STEPS.length - 1 && (
                                <div style={{ position: 'absolute', right: 0, top: '32px', width: '40px', height: '2px', background: 'linear-gradient(90deg,#7B3FF2,transparent)' }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── CONTACT ─── */
function Contact() {
    return (
        <section id="contact" style={{ background: '#000', padding: '100px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ padding: '56px', borderRadius: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '44px' }}>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: 'clamp(1.8rem,4vw,2.8rem)', letterSpacing: '-0.03em', color: '#fff', marginBottom: '14px' }}>
                            Ready to Start?
                        </h2>
                        <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>
                            Get in touch with our team to discuss your influencer marketing goals.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '20px' }}>
                        {[
                            { icon: '💬', title: 'Chat on WhatsApp', desc: 'Quick response guaranteed', link: 'https://wa.me/923477437615', cta: 'Open WhatsApp →', external: true },
                            { icon: '✉️', title: 'Send Email', desc: 'info@porchest.com', link: 'mailto:info@porchest.com', cta: 'Send Email →', external: false },
                        ].map(item => (
                            <a key={item.title} href={item.link} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 24px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none', transition: 'border-color 220ms ease, box-shadow 220ms ease' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,63,242,0.4)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(123,63,242,0.1)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                                <div style={{ fontSize: '40px', marginBottom: '14px' }}>{item.icon}</div>
                                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '17px', color: '#fff', marginBottom: '6px' }}>{item.title}</h3>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '16px' }}>{item.desc}</p>
                                <span style={{ fontSize: '14px', color: '#a78bfa', fontWeight: '600' }}>{item.cta}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── FOOTER ─── */
function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#000', padding: '56px 24px 32px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '40px', marginBottom: '48px' }}>
                    {/* Brand */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <Image src="/logo.png" alt="Porchest" width={28} height={28} style={{ borderRadius: '6px' }} />
                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '16px', color: '#fff' }}>Porchest</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6' }}>
                            Unlock influencer intelligence for smarter marketing decisions.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Product</h4>
                        {['Features', 'How It Works', 'Pricing', 'API'].map(l => (
                            <p key={l} style={{ marginBottom: '10px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 180ms' }}
                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#fff')}
                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)')}>{l}</a></p>
                        ))}
                    </div>

                    {/* Company */}
                    <div>
                        <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Company</h4>
                        {['About', 'Blog', 'Careers', 'Press'].map(l => (
                            <p key={l} style={{ marginBottom: '10px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#fff')}
                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)')}>{l}</a></p>
                        ))}
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Legal</h4>
                        {['Privacy', 'Terms', 'Cookies', 'Contact'].map(l => (
                            <p key={l} style={{ marginBottom: '10px' }}><a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#fff')}
                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)')}>{l}</a></p>
                        ))}
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '28px', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© {year} Porchest. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

/* ─── PAGE ─── */
export default function Home() {
    return (
        <main style={{ background: '#000', minHeight: '100vh' }}>
            <LandingNav />
            <Hero />
            <Features />
            <HowItWorks />
            <Contact />
            <Footer />
        </main>
    );
}
