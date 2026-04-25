'use client';

import Link from 'next/link';
import Image from 'next/image';

function LandingNav() {
    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <header style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%', borderBottom: '1px solid rgba(148,163,184,0.16)', background: 'rgba(252,250,244,0.88)', backdropFilter: 'blur(18px)' }}>
            <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px', display: 'flex', height: '72px', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <Image src="/logo.png" alt="Porchest" width={40} height={40} style={{ borderRadius: '12px', boxShadow: '0 10px 24px rgba(123,63,242,0.14)' }} />
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '22px', color: '#172033', letterSpacing: '-0.03em' }}>
                        Porchest
                    </span>
                </Link>

                <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                    {[
                        { label: 'Features', id: 'features' },
                        { label: 'How It Works', id: 'how-it-works' },
                        { label: 'Contact', id: 'contact' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => scrollTo(item.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#667085', fontFamily: 'inherit', fontWeight: 600 }}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link href="/login" style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.20)', color: '#172033', fontSize: '14px', fontWeight: 700, textDecoration: 'none', background: 'rgba(255,255,255,0.7)' }}>
                        Sign In
                    </Link>
                    <Link href="/signup" style={{ padding: '10px 18px', borderRadius: '12px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 14px 30px rgba(123,63,242,0.20)' }}>
                        Sign Up
                    </Link>
                </div>
            </div>
        </header>
    );
}

function Hero() {
    return (
        <section style={{ position: 'relative', padding: '88px 24px 72px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,63,242,0.14) 0%, transparent 72%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: '-140px', bottom: '-160px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 72%)', pointerEvents: 'none' }} />

            <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(320px,0.9fr)', gap: '32px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '999px', background: 'rgba(123,63,242,0.08)', border: '1px solid rgba(123,63,242,0.14)', marginBottom: '26px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7B3FF2', display: 'inline-block' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#7B3FF2', letterSpacing: '0.04em' }}>Smart Influencer Marketing Platform</span>
                    </div>

                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(3rem, 7vw, 5.6rem)', lineHeight: 1.02, letterSpacing: '-0.06em', color: '#172033', marginBottom: '20px' }}>
                        Unlock influencer <span className="gradient-text">intelligence</span> without the guesswork
                    </h1>

                    <p style={{ fontSize: '18px', color: '#667085', lineHeight: 1.8, maxWidth: '620px', marginBottom: '34px' }}>
                        Discover authentic creators, review profile quality, and run brand collaborations from one balanced workspace built for clarity.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '40px' }}>
                        <a href="https://wa.me/923477437615" target="_blank" rel="noopener noreferrer" style={{ padding: '15px 24px', borderRadius: '14px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', color: '#fff', fontWeight: 700, fontSize: '15px', textDecoration: 'none', boxShadow: '0 16px 30px rgba(123,63,242,0.18)' }}>
                            Chat on WhatsApp
                        </a>
                        <a href="mailto:info@porchest.com" style={{ padding: '15px 24px', borderRadius: '14px', border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.78)', color: '#172033', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>
                            Send Email
                        </a>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', maxWidth: '620px' }}>
                        {[
                            { val: '10K+', label: 'Influencers tracked' },
                            { val: '50M+', label: 'Audience signals analyzed' },
                            { val: '95%', label: 'Matching confidence rate' },
                        ].map((item) => (
                            <div key={item.label} className="glass-card" style={{ padding: '20px', borderRadius: '22px' }}>
                                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '30px', letterSpacing: '-0.04em' }} className="gradient-text">{item.val}</div>
                                <p style={{ marginTop: '8px', fontSize: '13px', color: '#667085', lineHeight: 1.5 }}>{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '28px', borderRadius: '34px' }}>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div style={{ padding: '18px', borderRadius: '20px', background: 'rgba(123,63,242,0.08)', border: '1px solid rgba(123,63,242,0.12)' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7B3FF2', marginBottom: '8px' }}>Audience analytics</p>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '24px', color: '#172033', marginBottom: '6px' }}>See who actually matters</h3>
                            <p style={{ fontSize: '14px', color: '#667085', lineHeight: 1.7 }}>Review follower quality, engagement health, and collaboration fit before outreach begins.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '16px' }}>
                            {[
                                ['Verified creators', '8.4K'],
                                ['Active requests', '1.2K'],
                                ['Brand workspaces', '940'],
                                ['Avg. response time', '< 3h'],
                            ].map(([label, value]) => (
                                <div key={label} style={{ padding: '18px', borderRadius: '20px', background: 'rgba(255,255,255,0.74)', border: '1px solid rgba(148,163,184,0.18)' }}>
                                    <p style={{ fontSize: '12px', color: '#667085', marginBottom: '8px' }}>{label}</p>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '28px', color: '#172033', letterSpacing: '-0.04em' }}>{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Features() {
    const features = [
        { title: 'Audience Analytics', desc: 'Understand demographics, engagement patterns, and quality signals before reaching out.' },
        { title: 'Influencer Discovery', desc: 'Filter creators by niche, location, pricing, and credibility without messy spreadsheets.' },
        { title: 'Request Workflows', desc: 'Send structured collaboration requests and keep negotiations in one clean inbox.' },
        { title: 'Campaign Monitoring', desc: 'Track statuses, approvals, verification, and deliverables with less back and forth.' },
        { title: 'Profile Completion', desc: 'Help users finish the right details so profiles are useful, readable, and consistent.' },
        { title: 'Admin Oversight', desc: 'Manage users and campaign activity from a central control panel built for operations.' },
    ];

    return (
        <section id="features" style={{ padding: '54px 24px 80px' }}>
            <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', lineHeight: 1.08, letterSpacing: '-0.05em', color: '#172033', marginBottom: '14px' }}>
                        Built for organized <span className="gradient-text">brand-creator collaboration</span>
                    </h2>
                    <p style={{ maxWidth: '620px', margin: '0 auto', fontSize: '16px', color: '#667085', lineHeight: 1.8 }}>
                        Porchest keeps the workflow simple: discover, review, invite, negotiate, verify, and track.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                    {features.map((feature) => (
                        <div key={feature.title} className="glass-card" style={{ padding: '28px', borderRadius: '28px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(123,63,242,0.10)', color: '#7B3FF2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '16px' }}>
                                {feature.title.charAt(0)}
                            </div>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '22px', color: '#172033', letterSpacing: '-0.03em', marginBottom: '10px' }}>{feature.title}</h3>
                            <p style={{ fontSize: '14px', color: '#667085', lineHeight: 1.7 }}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HowItWorks() {
    const steps = [
        { number: '01', title: 'Set your goal', desc: 'Define campaign objectives, audience fit, and collaboration scope.' },
        { number: '02', title: 'Review profiles', desc: 'Check profile strength, pricing, and audience quality in one place.' },
        { number: '03', title: 'Send requests', desc: 'Share terms clearly so brands and influencers see the same details.' },
        { number: '04', title: 'Track outcomes', desc: 'Follow collaboration progress, verification, and platform activity.' },
    ];

    return (
        <section id="how-it-works" style={{ padding: '18px 24px 86px' }}>
            <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
                <div className="glass-card" style={{ padding: '38px', borderRadius: '34px' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(1.9rem,4vw,3rem)', lineHeight: 1.08, letterSpacing: '-0.05em', color: '#172033', marginBottom: '12px' }}>
                            A simple workflow that stays balanced
                        </h2>
                        <p style={{ fontSize: '16px', color: '#667085', maxWidth: '620px', lineHeight: 1.8 }}>
                            Every step is structured so the platform feels manageable for both brands and creators.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                        {steps.map((step) => (
                            <div key={step.number} style={{ padding: '22px', borderRadius: '22px', background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(148,163,184,0.18)' }}>
                                <div className="gradient-text" style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '38px', letterSpacing: '-0.05em', marginBottom: '10px' }}>{step.number}</div>
                                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '20px', color: '#172033', marginBottom: '10px' }}>{step.title}</h3>
                                <p style={{ fontSize: '14px', color: '#667085', lineHeight: 1.7 }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function Contact() {
    return (
        <section id="contact" style={{ padding: '0 24px 88px' }}>
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
                <div className="glass-card" style={{ padding: '40px', borderRadius: '34px', textAlign: 'center' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(1.9rem,4vw,2.8rem)', lineHeight: 1.08, letterSpacing: '-0.05em', color: '#172033', marginBottom: '14px' }}>
                        Ready to talk about your workflow?
                    </h2>
                    <p style={{ maxWidth: '560px', margin: '0 auto 28px', fontSize: '16px', color: '#667085', lineHeight: 1.8 }}>
                        Reach the Porchest team for onboarding, product questions, or help planning your creator operations.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                        <a href="https://wa.me/923477437615" target="_blank" rel="noopener noreferrer" className="glass-card" style={{ padding: '28px', borderRadius: '24px', textDecoration: 'none' }}>
                            <div style={{ fontSize: '36px', marginBottom: '12px' }}>💬</div>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '20px', color: '#172033', marginBottom: '8px' }}>Chat on WhatsApp</h3>
                            <p style={{ fontSize: '14px', color: '#667085', marginBottom: '14px' }}>Fast replies for quick questions.</p>
                            <span style={{ color: '#7B3FF2', fontWeight: 700, fontSize: '14px' }}>Open WhatsApp</span>
                        </a>

                        <a href="mailto:info@porchest.com" className="glass-card" style={{ padding: '28px', borderRadius: '24px', textDecoration: 'none' }}>
                            <div style={{ fontSize: '36px', marginBottom: '12px' }}>✉️</div>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '20px', color: '#172033', marginBottom: '8px' }}>Send an email</h3>
                            <p style={{ fontSize: '14px', color: '#667085', marginBottom: '14px' }}>info@porchest.com</p>
                            <span style={{ color: '#7B3FF2', fontWeight: 700, fontSize: '14px' }}>Write to us</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer style={{ borderTop: '1px solid rgba(148,163,184,0.16)', padding: '28px 24px 36px' }}>
            <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Image src="/logo.png" alt="Porchest" width={28} height={28} style={{ borderRadius: '8px' }} />
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '16px', color: '#172033' }}>Porchest</span>
                </div>
                <p style={{ fontSize: '13px', color: '#667085' }}>© {year} Porchest. Built for smarter creator collaboration.</p>
            </div>
        </footer>
    );
}

export default function LandingPage() {
    return (
        <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fcfaf4 0%, #f4efe4 100%)', position: 'relative', overflow: 'hidden' }}>
            <div className="landing-texture-grid" />
            <LandingNav />
            <Hero />
            <Features />
            <HowItWorks />
            <Contact />
            <Footer />
        </main>
    );
}
