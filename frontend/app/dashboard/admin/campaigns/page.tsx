'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PostVerificationQueue from '@/components/admin/PostVerificationQueue';
import BrandTrackingSetup from '@/components/admin/BrandTrackingSetup';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, Loader2, Search, ShieldAlert, XCircle } from 'lucide-react';

type CampaignStatus = 'all' | 'running' | 'paused' | 'completed' | 'pending';

interface Campaign {
    _id: string;
    name?: string;
    status?: string;
    brand?: { companyName?: string; _id?: string } | string;
    influencers?: Array<{ influencer?: { fullName?: string; _id?: string } | string; status?: string }>;
    startDate?: string;
    endDate?: string;
    budget?: number;
}

const STATUS_FILTERS: Array<{ value: CampaignStatus; label: string }> = [
    { value: 'all', label: 'All campaigns' },
    { value: 'pending', label: 'Pending admin approval' },
    { value: 'running', label: 'Running' },
    { value: 'completed', label: 'Completed' },
    { value: 'paused', label: 'Paused' },
];

function money(value?: number) {
    return value == null ? '—' : `$${Number(value).toLocaleString()}`;
}

function daysBetween(date?: string) {
    if (!date) return '—';
    const start = new Date(date).getTime();
    const diff = Math.max(0, Date.now() - start);
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))}d`;
}

export default function AdminCampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<CampaignStatus>('all');
    const [actioningId, setActioningId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await adminAPI.getCampaigns(status === 'all' ? {} : { status });
            setCampaigns(data?.campaigns || []);
        } catch {
            toast.error('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [status]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return campaigns;
        return campaigns.filter((campaign) => {
            const brandName = typeof campaign.brand === 'string' ? campaign.brand : campaign.brand?.companyName || '';
            const influencerName = campaign.influencers?.map((item) => {
                const influencer = item.influencer;
                return typeof influencer === 'string' ? influencer : influencer?.fullName || '';
            }).join(' ') || '';
            return `${campaign.name || ''} ${brandName} ${influencerName}`.toLowerCase().includes(q);
        });
    }, [campaigns, search]);

    const updateStatus = async (id: string, next: 'running' | 'paused' | 'completed') => {
        setActioningId(id);
        try {
            await adminAPI.updateCampaignStatus(id, next);
            toast.success(`Campaign marked as ${next}`);
            await load();
        } catch {
            toast.error('Unable to update campaign');
        } finally {
            setActioningId(null);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div style={{ display: 'grid', gap: 24 }}>
                    <div style={{ borderRadius: 18, border: '1px solid rgba(194,52,10,0.16)', background: 'rgba(194,52,10,0.06)', padding: 24 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#C2340A' }}>Campaign oversight</p>
                        <h1 style={{ marginTop: 8, fontSize: 30, fontWeight: 800, color: '#1A0A00' }}>Campaigns</h1>
                        <p style={{ marginTop: 8, color: '#7A5030', lineHeight: 1.6 }}>
                            Monitor campaign status, review posts, and keep tracking connected.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: 20 }}>
                        <PostVerificationQueue />
                        <BrandTrackingSetup />
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#C4A882' }} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search campaign, brand, influencer..."
                                style={{
                                    width: '100%',
                                    padding: '12px 16px 12px 40px',
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.6)',
                                    border: '1px solid #EDD9BC',
                                    color: '#1A0A00',
                                    outline: 'none',
                                    fontSize: 14,
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {STATUS_FILTERS.map((item) => (
                                <button
                                    key={item.value}
                                    onClick={() => setStatus(item.value)}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: 999,
                                        border: '1px solid #EDD9BC',
                                        background: status === item.value ? '#C2340A' : 'rgba(255,255,255,0.65)',
                                        color: status === item.value ? '#fff' : '#7A5030',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderRadius: 24, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EDD9BC' }}>
                            <h2 style={{ fontWeight: 800, fontSize: 16, color: '#1A0A00' }}>Campaigns ({filtered.length})</h2>
                        </div>
                        {loading ? (
                            <div style={{ padding: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Loader2 size={24} style={{ color: '#C2340A', animation: 'spin 1s linear infinite' }} />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: 80, textAlign: 'center', color: '#7A5030', fontSize: 15 }}>No campaigns found</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.2)' }}>
                                            {['Campaign', 'Brand', 'Influencer', 'Status', 'Dates', 'Budget', 'Actions'].map((header) => (
                                                <th key={header} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((campaign) => {
                                            const brandName = typeof campaign.brand === 'string' ? campaign.brand : campaign.brand?.companyName || '—';
                                            const influencerName = campaign.influencers?.[0]?.influencer
                                                ? typeof campaign.influencers[0].influencer === 'string'
                                                    ? campaign.influencers[0].influencer
                                                    : campaign.influencers[0].influencer?.fullName || '—'
                                                : '—';
                                            return (
                                                <tr key={campaign._id} style={{ borderBottom: '1px solid #EDD9BC' }}>
                                                    <td style={{ padding: '16px 24px', fontWeight: 700, color: '#1A0A00' }}>{campaign.name || '—'}</td>
                                                    <td style={{ padding: '16px 24px', color: '#C2340A', fontWeight: 600 }}>{brandName}</td>
                                                    <td style={{ padding: '16px 24px', color: '#1A0A00' }}>{influencerName}</td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <span style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.20)', color: '#d97706', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                                                            {campaign.status || 'pending'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', color: '#7A5030' }}>{daysBetween(campaign.startDate)} / {campaign.endDate ? daysBetween(campaign.endDate) : '—'}</td>
                                                    <td style={{ padding: '16px 24px', color: '#C2340A', fontWeight: 700 }}>{money(campaign.budget)}</td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <button onClick={() => void updateStatus(campaign._id, 'running')} disabled={actioningId === campaign._id} style={actionButtonStyle('approve')}>
                                                                <CheckCircle size={14} /> Running
                                                            </button>
                                                            <button onClick={() => void updateStatus(campaign._id, 'paused')} disabled={actioningId === campaign._id} style={actionButtonStyle('neutral')}>
                                                                <ShieldAlert size={14} /> Pause
                                                            </button>
                                                            <button onClick={() => void updateStatus(campaign._id, 'completed')} disabled={actioningId === campaign._id} style={actionButtonStyle('reject')}>
                                                                <XCircle size={14} /> Complete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

function actionButtonStyle(kind: 'approve' | 'neutral' | 'reject') {
    const map = {
        approve: { bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.20)' },
        neutral: { bg: 'rgba(56,189,248,0.10)', color: '#0284c7', border: 'rgba(56,189,248,0.20)' },
        reject: { bg: 'rgba(239,68,68,0.10)', color: '#dc2626', border: 'rgba(239,68,68,0.20)' },
    }[kind];
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        borderRadius: 10,
        border: `1px solid ${map.border}`,
        background: map.bg,
        color: map.color,
        fontWeight: 700,
        cursor: 'pointer',
    };
}
