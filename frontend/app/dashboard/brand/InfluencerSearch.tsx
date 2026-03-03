'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, TrendingUp, BarChart3, Send, Loader2, UserX, DollarSign } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import CreateRequestModal from './CreateRequestModal';
import toast from 'react-hot-toast';

const NICHES = ['All', 'Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty', 'Gaming', 'Lifestyle', 'Education', 'Entertainment', 'Finance'];
const FOLLOWER_RANGES = ['Any', '10K–100K', '100K–500K', '500K+'];

const NICHE_COLORS: Record<string, string> = {
    Fashion: '#A855F7', Fitness: '#4ade80', Tech: '#60d5f8', Food: '#fb923c',
    Travel: '#facc15', Beauty: '#f472b6', Gaming: '#7B3FF2', Lifestyle: '#e879f9',
    Education: '#38bdf8', Entertainment: '#f97316', Finance: '#34d399',
};

export default function InfluencerSearch() {
    const [influencers, setInfluencers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [niche, setNiche] = useState('All');
    const [followerRange, setFollowerRange] = useState('Any');
    const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);

    const fetchInfluencers = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = {};
            if (niche !== 'All') params.niche = niche;
            if (followerRange === '10K–100K') { params.minFollowers = 10000; params.maxFollowers = 100000; }
            if (followerRange === '100K–500K') { params.minFollowers = 100000; params.maxFollowers = 500000; }
            if (followerRange === '500K+') { params.minFollowers = 500000; }
            const res = await brandAPI.getInfluencers(params);
            setInfluencers(res.data.influencers || []);
        } catch {
            toast.error('Failed to load influencers');
        } finally {
            setLoading(false);
        }
    }, [niche, followerRange]);

    useEffect(() => { fetchInfluencers(); }, [fetchInfluencers]);

    const filtered = influencers.filter(inf =>
        !query || inf.fullName?.toLowerCase().includes(query.toLowerCase()) ||
        inf.niche?.toLowerCase().includes(query.toLowerCase())
    );

    const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
        <button onClick={onClick} style={{
            padding: '6px 14px', borderRadius: '99px',
            border: `1px solid ${active ? 'rgba(123,63,242,0.6)' : 'rgba(255,255,255,0.08)'}`,
            background: active ? 'rgba(123,63,242,0.18)' : 'rgba(255,255,255,0.03)',
            color: active ? '#c084fc' : 'rgba(255,255,255,0.4)',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 180ms ease',
            boxShadow: active ? '0 0 16px rgba(123,63,242,0.25)' : 'none',
        }}>{label}</button>
    );

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                    Discover Influencers
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                    {loading ? 'Loading from database…' : `${filtered.length} influencer${filtered.length !== 1 ? 's' : ''} found`}
                </p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '18px' }}>
                <Search size={15} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                <input value={query} onChange={e => setQuery(e.target.value)} type="text"
                    placeholder="Search by name or niche…"
                    className="input-dark" style={{ paddingLeft: '46px', height: '50px', fontSize: '14px', borderRadius: '16px' }} />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Niche</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {NICHES.map(n => <Pill key={n} label={n} active={niche === n} onClick={() => setNiche(n)} />)}
                    </div>
                </div>
                <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Followers</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {FOLLOWER_RANGES.map(f => <Pill key={f} label={f} active={followerRange === f} onClick={() => setFollowerRange(f)} />)}
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
                    <Loader2 size={32} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
                    <p style={{ fontSize: '14px' }}>Loading influencers…</p>
                </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
                <div className="glass-card" style={{ padding: '60px', borderRadius: '28px', textAlign: 'center' }}>
                    <UserX size={44} style={{ color: 'rgba(123,63,242,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '8px' }}>
                        {influencers.length === 0 ? 'No Registered Influencers Yet' : 'No Matches Found'}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', maxWidth: '380px', margin: '0 auto', lineHeight: '1.6' }}>
                        {influencers.length === 0
                            ? 'No registered influencers yet. Influencers will appear here once they sign up and complete their profile.'
                            : 'Try adjusting your filters or search term.'}
                    </p>
                </div>
            )}

            {/* Results grid */}
            {!loading && filtered.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    <AnimatePresence>
                        {filtered.map((inf, i) => {
                            const nc = NICHE_COLORS[inf.niche] || '#a78bfa';
                            const initials = (inf.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                            const hasDP = inf.instagramDPURL && inf.instagramDPURL.startsWith('http');
                            return (
                                <motion.div key={inf._id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04, duration: 0.35 }}
                                    className="glass-card" style={{ padding: '22px', borderRadius: '26px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                                    {/* Header: DP + Name + Niche */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg, #7B3FF2, ${nc})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '17px', color: '#fff', boxShadow: `0 0 18px ${nc}50` }}>
                                            {hasDP ? <img src={inf.instagramDPURL} alt={inf.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: '#fff', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inf.fullName || 'Influencer'}</p>
                                            {inf.country && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                    <Globe size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{inf.country}</p>
                                                </div>
                                            )}
                                        </div>
                                        {inf.niche && <span style={{ padding: '3px 10px', borderRadius: '99px', background: `${nc}18`, border: `1px solid ${nc}35`, color: nc, fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 }}>{inf.niche}</span>}
                                    </div>

                                    {/* Stats grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {[
                                            { icon: <TrendingUp size={11} />, label: 'Followers', val: inf.followers > 0 ? `${(inf.followers / 1000).toFixed(0)}K` : '—' },
                                            { icon: <BarChart3 size={11} />, label: 'Engagement', val: inf.engagementRate > 0 ? `${inf.engagementRate}%` : '—' },
                                        ].map(s => (
                                            <div key={s.label} style={{ padding: '9px 12px', borderRadius: '11px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px' }}>{s.icon}<span style={{ fontSize: '10px' }}>{s.label}</span></div>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: '#fff' }}>{s.val}</p>
                                            </div>
                                        ))}
                                        {[
                                            { label: 'Post Rate', val: inf.avgPostCostUSD > 0 ? `$${inf.avgPostCostUSD.toLocaleString()}` : '—' },
                                            { label: 'Reel Rate', val: inf.avgReelCostUSD > 0 ? `$${inf.avgReelCostUSD.toLocaleString()}` : '—' },
                                        ].map(s => (
                                            <div key={s.label} style={{ padding: '9px 12px', borderRadius: '11px', background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.1)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(74,222,128,0.5)', marginBottom: '3px' }}><DollarSign size={11} /><span style={{ fontSize: '10px' }}>{s.label}</span></div>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: '#4ade80' }}>{s.val}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <button onClick={() => setSelectedInfluencer(inf)}
                                        style={{ width: '100%', padding: '11px', borderRadius: '13px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 200ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', boxShadow: '0 0 20px rgba(123,63,242,0.3)' }}
                                        onMouseEnter={e => { (e.currentTarget).style.boxShadow = '0 0 30px rgba(123,63,242,0.5)'; (e.currentTarget).style.transform = 'translateY(-1px)'; }}
                                        onMouseLeave={e => { (e.currentTarget).style.boxShadow = '0 0 20px rgba(123,63,242,0.3)'; (e.currentTarget).style.transform = ''; }}>
                                        <Send size={13} /> Send Campaign Request
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Create Request Modal */}
            {selectedInfluencer && (
                <CreateRequestModal
                    influencer={selectedInfluencer}
                    onClose={() => setSelectedInfluencer(null)}
                    onSuccess={() => setSelectedInfluencer(null)}
                />
            )}
        </div>
    );
}
