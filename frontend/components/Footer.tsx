import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    const links = {
        Platform: ['Smart Matching', 'For Brands', 'For Influencers', 'Analytics'],
        Company: ['About', 'Sign Up', 'Sign In', 'Contact'],
    };

    return (
        <footer style={{ position: 'relative', borderTop: '1px solid rgba(17,19,24,0.08)', background: 'rgba(255,251,244,0.72)' }}>
            {/* Top glow line */}
            <div style={{ position: 'absolute', top: '-1px', left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(155,111,80,0.45), transparent)' }} />

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 24px 40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '60px', marginBottom: '48px', flexWrap: 'wrap' }} className="flex flex-col sm:grid">
                    {/* Brand */}
                    <div>
                        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '16px' }}>
                            <Image src="/porchest-logo.png" alt="Porchest" width={156} height={38} style={{ width: '156px', height: 'auto' }} />
                        </Link>
                        <p style={{ color: '#6e665d', fontSize: '14px', lineHeight: '1.65', maxWidth: '260px' }}>
                            The platform connecting brands with creators through clear discovery, collaboration, and analytics.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            {['X', 'in', 'ig'].map((s) => (
                                <a key={s} href="#"
                                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(17,19,24,0.04)', border: '1px solid rgba(17,19,24,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#6e665d', textDecoration: 'none', transition: 'all 200ms ease' }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(155,111,80,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(155,111,80,0.26)'; (e.currentTarget as HTMLElement).style.color = '#9b6f50'; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(17,19,24,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(17,19,24,0.08)'; (e.currentTarget as HTMLElement).style.color = '#6e665d'; }}>
                                    {s}
                                </a>
                            ))}
                        </div>
                    </div>

                    {Object.entries(links).map(([section, items]) => (
                        <div key={section}>
                            <p style={{ fontSize: '11px', fontWeight: '700', color: '#8b8176', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>{section}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                                {items.map((item) => (
                                    <a key={item} href="#"
                                        style={{ fontSize: '14px', color: '#5f5b55', textDecoration: 'none', transition: 'color 180ms ease' }}
                                        onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#9b6f50')}
                                        onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#5f5b55')}>
                                        {item}
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(17,19,24,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <p style={{ color: '#8b8176', fontSize: '13px' }}>© 2026 Porchest. All rights reserved.</p>
                    <p style={{ color: '#8b8176', fontSize: '13px' }}>
                        <a href="https://porchest.com" style={{ color: 'rgba(155,111,80,0.6)', textDecoration: 'none' }}>porchest.com</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
