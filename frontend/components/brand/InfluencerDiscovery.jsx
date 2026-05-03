'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import InfluencerProfileMetrics from './InfluencerProfileMetrics';
import RequestCollaborationButton from './RequestCollaborationButton';
import { Search, ShieldCheck, Users, MapPin, Star, Target } from 'lucide-react';

const TIERS = ['nano', 'micro', 'macro', 'mega'];
const NICHES = ['fashion', 'beauty', 'tech', 'food', 'travel', 'fitness', 'gaming', 'finance', 'education', 'lifestyle'];

const getPillColor = (niche) => {
    const colors = {
        fashion: { bg: 'rgba(56, 189, 248, 0.1)', border: 'rgba(56, 189, 248, 0.2)', text: '#0284c7' },
        fitness: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', text: '#059669' },
        food: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', text: '#d97706' },
        beauty: { bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.2)', text: '#db2777' },
        tech: { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.2)', text: '#0891b2' },
    };
    return colors[niche?.toLowerCase()] || { bg: 'rgba(255,255,255,0.6)', border: '#EDD9BC', text: '#7A5030' };
};

export default function InfluencerDiscovery() {
    const [filters, setFilters] = useState({ search: '', niche: '', tier: '', minER: '', minScore: '', maxRate: '' });
    const [selectedId, setSelectedId] = useState(null);
    const query = useMemo(() => new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))).toString(), [filters]);
    const { data, loading, error } = useApi(`/discover/influencers?${query}`);
    const influencers = data?.influencers || [];

    const IS = {
        width: '100%', borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)',
        padding: '12px 16px', fontSize: '14px', color: '#1A0A00', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ borderRadius: '16px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.35)', padding: '24px', backdropFilter: 'blur(12px)' }}>
                <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative', flex: '1 1 240px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#C4A882', pointerEvents: 'none' }} />
                        <input style={{ ...IS, paddingLeft: '44px' }} placeholder="Search by username or name..." value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>
                    <div style={{ borderRadius: '99px', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} /> Verified profiles
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <p style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A5030' }}>Tier</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {TIERS.map((tier) => (
                                <button key={tier} onClick={() => setFilters((f) => ({ ...f, tier: f.tier === tier ? '' : tier }))}
                                    style={{
                                        padding: '6px 16px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, transition: 'all 0.15s', cursor: 'pointer', fontFamily: 'inherit',
                                        border: `1px solid ${filters.tier === tier ? '#C2340A' : '#EDD9BC'}`,
                                        background: filters.tier === tier ? 'rgba(194,52,10,0.1)' : 'rgba(255,255,255,0.6)',
                                        color: filters.tier === tier ? '#C2340A' : '#7A5030',
                                    }}
                                    onMouseEnter={e => { if (filters.tier !== tier) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1A0A00'; } }}
                                    onMouseLeave={e => { if (filters.tier !== tier) { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#7A5030'; } }}
                                >
                                    {tier}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A5030' }}>Niche</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {NICHES.map((niche) => (
                                <button key={niche} onClick={() => setFilters((f) => ({ ...f, niche: f.niche === niche ? '' : niche }))}
                                    style={{
                                        padding: '6px 16px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, transition: 'all 0.15s', cursor: 'pointer', fontFamily: 'inherit',
                                        border: `1px solid ${filters.niche === niche ? '#C2340A' : '#EDD9BC'}`,
                                        background: filters.niche === niche ? 'rgba(194,52,10,0.1)' : 'rgba(255,255,255,0.6)',
                                        color: filters.niche === niche ? '#C2340A' : '#7A5030',
                                    }}
                                    onMouseEnter={e => { if (filters.niche !== niche) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1A0A00'; } }}
                                    onMouseLeave={e => { if (filters.niche !== niche) { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#7A5030'; } }}
                                >
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                        <input type="number" style={IS} placeholder="Min ER%" value={filters.minER} onChange={(e) => setFilters((f) => ({ ...f, minER: e.target.value }))} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                        <input type="number" style={IS} placeholder="Min score" value={filters.minScore} onChange={(e) => setFilters((f) => ({ ...f, minScore: e.target.value }))} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                        <input type="number" style={IS} placeholder="Max rate" value={filters.maxRate} onChange={(e) => setFilters((f) => ({ ...f, maxRate: e.target.value }))} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>
                </div>
            </div>

            {loading && <p style={{ fontSize: '14px', fontWeight: 500, color: '#C4A882' }}>Finding influencers...</p>}
            {error && <p style={{ fontSize: '14px', fontWeight: 500, color: '#E8400A' }}>{error}</p>}

            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                <AnimatePresence>
                    {influencers.map((inf, i) => {
                        const primaryNiche = inf.niche?.[0] || 'lifestyle';
                        const avatar = inf.avatar || inf.profilePictureURL || inf.igProfileUrl;
                        const followerCount = inf.followersCount || inf.igFollowersCount || inf.audienceSize || 0;
                        const engagementRate = inf.avgEngagementRate || inf.engagementRate || inf.overallEngagementRate;
                        const pColor = getPillColor(primaryNiche);
                        
                        return (
                            <motion.div key={inf._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ overflow: 'hidden', borderRadius: '16px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.4)', boxShadow: '0 4px 20px rgba(26,10,0,0.05)' }}>
                                <div style={{ height: '4px', background: 'linear-gradient(to right, #C2340A, #E8400A, #FF6B1A)' }} />
                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                        {avatar ? (
                                            <img src={avatar} alt="" style={{ height: '64px', width: '64px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0, border: '1px solid #EDD9BC' }} />
                                        ) : (
                                            <div style={{ display: 'flex', height: '64px', width: '64px', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', background: '#FDF6EE', fontSize: '20px', fontWeight: 700, color: '#C2340A', flexShrink: 0, border: '1px solid #EDD9BC' }}>
                                                {(inf.displayName || inf.igUsername || 'C')[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                                <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '16px', fontWeight: 700, color: '#1A0A00' }}>{inf.displayName || inf.igUsername || 'Creator'}</p>
                                                {inf.followerTier && <span style={{ borderRadius: '99px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '4px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A5030' }}>{inf.followerTier}</span>}
                                            </div>
                                            <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030' }}>@{inf.igUsername} <span style={{ margin: '0 4px' }}>•</span> {inf.country || 'Global'}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#C4A882', fontWeight: 700 }}>Fit</p>
                                            <p style={{ fontSize: '24px', fontWeight: 700, color: '#C2340A' }}>4.8</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                        <div style={{ borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '12px' }}>
                                            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A5030', fontWeight: 700 }}>Followers</p>
                                            <p style={{ marginTop: '4px', fontSize: '16px', fontWeight: 700, color: '#1A0A00' }}>{Number(followerCount).toLocaleString()}</p>
                                        </div>
                                        <div style={{ borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '12px' }}>
                                            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A5030', fontWeight: 700 }}>ER</p>
                                            <p style={{ marginTop: '4px', fontSize: '16px', fontWeight: 700, color: '#1A0A00' }}>{engagementRate != null ? `${Number(engagementRate).toFixed(1)}%` : '—'}</p>
                                        </div>
                                        <div style={{ borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '12px' }}>
                                            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A5030', fontWeight: 700 }}>Tier</p>
                                            <p style={{ marginTop: '4px', fontSize: '16px', fontWeight: 700, textTransform: 'capitalize', color: '#1A0A00' }}>{inf.followerTier || '—'}</p>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: '13px', lineHeight: 1.65, color: '#7A5030', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {inf.bio || `Creative ${primaryNiche} influencer focusing on authentic content and engaging storytelling.`}
                                    </p>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        <span style={{ borderRadius: '99px', border: `1px solid ${pColor.border}`, padding: '4px 12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: pColor.bg, color: pColor.text }}>
                                            {primaryNiche}
                                        </span>
                                        {inf.city && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '99px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '4px 12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A5030' }}>
                                                <MapPin size={10} /> {inf.city}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                        <div style={{ borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '16px' }}>
                                            <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: '#C2340A' }}>
                                                <Star size={12} />
                                                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>IG Post</span>
                                            </div>
                                            <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A0A00' }}>${inf.rates?.postPrice || inf.avgPostPrice || 250}</p>
                                        </div>
                                        <div style={{ borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '16px' }}>
                                            <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: '#059669' }}>
                                                <Target size={12} />
                                                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>IG Reel</span>
                                            </div>
                                            <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A0A00' }}>${inf.rates?.reelPrice || inf.avgReelPrice || 350}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button type="button" onClick={() => setSelectedId(selectedId === inf._id ? null : inf._id)} style={{ flex: 1, borderRadius: '8px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.8)', padding: '12px 16px', fontSize: '14px', fontWeight: 700, color: '#7A5030', transition: 'all 0.15s', cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1A0A00'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; e.currentTarget.style.color = '#7A5030'; }}>
                                            {selectedId === inf._id ? 'Hide Profile' : 'View Profile'}
                                        </button>
                                        <button type="button" onClick={() => setSelectedId(inf._id)} style={{ flex: 1.5, borderRadius: '8px', background: '#C2340A', padding: '12px 16px', fontSize: '14px', fontWeight: 700, color: '#fff', border: 'none', transition: 'all 0.15s', cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={e => e.currentTarget.style.background = '#E8400A'} onMouseLeave={e => e.currentTarget.style.background = '#C2340A'}>
                                            Request
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {selectedId === inf._id && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid #EDD9BC', paddingTop: '20px' }}>
                                                    <InfluencerProfileMetrics influencerId={inf._id} />
                                                    <RequestCollaborationButton influencerId={inf._id} influencerName={inf.igUsername || inf.displayName} rates={inf.rates || { reelPrice: inf.avgReelPrice, postPrice: inf.avgPostPrice }} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {!loading && influencers.length === 0 && (
                <div style={{ borderRadius: '16px', border: '1px dashed #EDD9BC', background: 'rgba(255,255,255,0.4)', padding: '40px', textAlign: 'center' }}>
                    <Users style={{ margin: '0 auto 16px', color: '#C4A882' }} size={44} />
                    <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A0A00' }}>No influencers found</p>
                    <p style={{ marginTop: '8px', fontSize: '14px', color: '#7A5030' }}>Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    );
}
