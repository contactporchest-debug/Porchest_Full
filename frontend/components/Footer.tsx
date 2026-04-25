import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    const links = {
        Platform: ['Smart Matching', 'For Brands', 'For Influencers', 'Analytics'],
        Company: ['About', 'Sign Up', 'Sign In', 'Contact'],
    };

    return (
        <footer style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Top glow line */}
            <div style={{ position: 'absolute', top: '-1px', left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(123,63,242,0.5), transparent)' }} />

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 24px 40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '60px', marginBottom: '48px', flexWrap: 'wrap' }} className="flex flex-col sm:grid">
                    {/* Brand */}
                    <div>
                        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '16px' }}>
                            <Image src="/porchest-logo.png" alt="Porchest" width={156} height={38} style={{ width: '156px', height: 'auto' }} />
                        </Link>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', lineHeight: '1.65', maxWidth: '260px' }}>
                            The platform connecting brands with influencers through clear discovery, collaboration, and analytics.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            {['X', 'in', 'ig'].map((s) => (
                                <a key={s} href="#"
                                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'all 200ms ease' }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(123,63,242,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,63,242,0.3)'; (e.currentTarget as HTMLElement).style.color = '#a78bfa'; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}>
                                    {s}
                                </a>
                            ))}
                        </div>
                    </div>

                    {Object.entries(links).map(([section, items]) => (
                        <div key={section}>
                            <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>{section}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                                {items.map((item) => (
                                    <a key={item} href="#"
                                        style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 180ms ease' }}
                                        onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#a78bfa')}
                                        onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.45)')}>
                                        {item}
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>© 2026 Porchest. All rights reserved.</p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
                        <a href="https://porchest.com" style={{ color: 'rgba(123,63,242,0.6)', textDecoration: 'none' }}>porchest.com</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
