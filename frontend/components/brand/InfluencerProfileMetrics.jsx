'use client';

import { motion } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import MetricCard from '../metrics/MetricCard';

export default function InfluencerProfileMetrics({ influencerId }) {
    const { data, loading, error } = useApi(`/instagram/influencer/${influencerId}/metrics`);

    if (loading) return <div style={{ padding: '24px', fontSize: '14px', fontWeight: 600, color: '#7A5030', background: 'rgba(255,255,255,0.45)', borderRadius: '16px', textAlign: 'center', border: '1px solid #EDD9BC', backdropFilter: 'blur(12px)' }}>Loading influencer metrics...</div>;
    if (error) return <div style={{ padding: '24px', fontSize: '14px', fontWeight: 600, color: '#C2340A', background: 'rgba(255,255,255,0.45)', borderRadius: '16px', textAlign: 'center', border: '1px solid #EDD9BC', backdropFilter: 'blur(12px)' }}>Could not load metrics: {error}</div>;
    if (!data) return null;

    const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
    const fmtPct = (n) => (n == null ? '—' : `${Number(n).toFixed(1)}%`);
    const fitScore = data.audienceBrandFitScore ?? null;
    const fitColor = fitScore == null ? '#C4A882' : fitScore >= 70 ? '#059669' : fitScore >= 40 ? '#d97706' : '#dc2626';
    const fitLabel = fitScore == null ? 'No fit data' : fitScore >= 70 ? 'Strong fit' : fitScore >= 40 ? 'Moderate fit' : 'Low fit';
    const audience = data.audienceDemographics || {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: 'rgba(255,255,255,0.4)', border: '1px solid #EDD9BC', borderRadius: '24px' }}>
                {data.igProfileUrl ? (
                    <img
                        src={data.igProfileUrl}
                        alt=""
                        style={{ height: '64px', width: '64px', borderRadius: '16px', border: '1px solid #EDD9BC', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(to bottom right, #C2340A, #E8400A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '24px' }}>
                        {(data.igUsername || 'C')[0].toUpperCase()}
                    </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#1A0A00' }}>@{data.igUsername || '—'}</p>
                    <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px', fontWeight: 500, textTransform: 'capitalize', color: '#7A5030', marginTop: '2px' }}>
                        {data.followerTier || '—'} {data.niche?.length ? `· ${data.niche.join(', ')}` : ''}
                    </p>
                    {data.country ? <p style={{ fontSize: '12px', fontWeight: 500, color: '#C4A882', marginTop: '4px' }}>{data.country}</p> : null}
                </div>
                {fitScore != null ? (
                    <div style={{ marginLeft: 'auto', textAlign: 'right', background: 'rgba(255,255,255,0.6)', padding: '12px 20px', borderRadius: '16px', border: '1px solid #EDD9BC', backdropFilter: 'blur(12px)' }}>
                        <p style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.02em', color: fitColor }}>{Math.round(fitScore)}</p>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Audience fit</p>
                        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', color: fitColor }}>{fitLabel}</p>
                    </div>
                ) : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <MetricCard index={0} label="Porchest score" value={`${Math.round(data.porchestScore ?? 0)} / 100`} accent />
                <MetricCard index={1} label="Followers" value={fmt(data.igFollowersCount)} />
                <MetricCard index={2} label="Engagement rate" value={fmtPct(data.avgEngagementRate)} sub="90 days" />
                <MetricCard index={3} label="Authenticity" value={`${Math.round(data.authenticityScore ?? 0)}%`} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <MetricCard index={4} label="Avg reach / post" value={fmt(data.avgReachPerPost)} />
                <MetricCard index={5} label="Avg saves / post" value={fmt(data.avgSavesPerPost)} />
                <MetricCard index={6} label="Posts / week" value={data.postingFrequency != null ? Number(data.postingFrequency).toFixed(1) : '—'} />
                <MetricCard index={7} label="Total reach (90d)" value={fmt(data.totalReach90d)} />
            </div>

            {audience && Object.keys(audience).length > 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}
                    className="md:grid-cols-2"
                >
                    {audience.topCountries?.length > 0 && (
                        <div style={{ borderRadius: '24px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.45)', padding: '24px', backdropFilter: 'blur(12px)' }}>
                            <p style={{ marginBottom: '16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A5030' }}>Top countries</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(audience.topCountries || []).slice(0, 5).map((item, index) => (
                                    <div key={`${item.country || 'country'}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#C4A882' }}>{index + 1}</div>
                                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>{item.country || item.name || '—'}</span>
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#7A5030', background: 'rgba(255,255,255,0.6)', padding: '4px 10px', borderRadius: '6px' }}>{Math.round(Number(item.value ?? item.pct ?? 0) * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {audience.ageGender && Object.keys(audience.ageGender).length > 0 && (
                        <div style={{ borderRadius: '24px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.45)', padding: '24px', backdropFilter: 'blur(12px)' }}>
                            <p style={{ marginBottom: '16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A5030' }}>Age & gender</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {Object.entries(audience.ageGender || {})
                                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                                    .slice(0, 5)
                                    .map(([key, val], index) => {
                                        let iconColor = '#C4A882';
                                        if (key.includes('F')) iconColor = '#db2777';
                                        if (key.includes('M')) iconColor = '#0284c7';
                                        
                                        return (
                                            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', color: iconColor }}>
                                                        {key.charAt(0)}
                                                    </div>
                                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>{key.replace(/^[FM]\./, '')}</span>
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#7A5030', background: 'rgba(255,255,255,0.6)', padding: '4px 10px', borderRadius: '6px' }}>{Math.round(Number(val) * 100)}%</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </motion.div>
            ) : null}
        </div>
    );
}
