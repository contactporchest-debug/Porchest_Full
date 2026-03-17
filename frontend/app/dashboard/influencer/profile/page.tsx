'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Globe, ChevronDown, Instagram, Link2,
    DollarSign, TrendingUp, Save, Loader2, CheckCircle2,
    AlertCircle, RefreshCw, Unlink, Lock, Zap, MapPin,
    ExternalLink, Clock,
} from 'lucide-react';
import { influencerAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';

const NICHES = [
    'Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty',
    'Gaming', 'Lifestyle', 'Parenting', 'Education', 'Business',
    'Health', 'Entertainment', 'Finance', 'Other',
];

const COUNTRIES = [
    'Pakistan', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'India', 'United Arab Emirates', 'Saudi Arabia', 'Germany', 'France',
    'Netherlands', 'Singapore', 'Malaysia', 'Turkey', 'South Africa',
    'Nigeria', 'Kenya', 'Bangladesh', 'Philippines', 'Indonesia', 'Other',
];

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(14,12,26,0.75)', border: '1px solid rgba(123,63,242,0.15)', borderRadius: '28px', padding: '28px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(123,63,242,0.12)', border: '1px solid rgba(123,63,242,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                {icon}
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: '#fff' }}>{title}</h3>
        </div>
        {children}
    </motion.div>
);

const iStyle: React.CSSProperties = {
    width: '100%', padding: '11px 15px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 200ms ease',
};

const fh = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.target.style.borderColor = 'rgba(168,85,247,0.5)';
        (e.target as HTMLElement).style.background = 'rgba(123,63,242,0.06)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.target.style.borderColor = 'rgba(255,255,255,0.09)';
        (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
    },
};

const Label = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {children}{req && <span style={{ color: '#f87171', marginLeft: '3px' }}>*</span>}
    </label>
);

const FieldErr = ({ msg }: { msg?: string }) => msg
    ? <p style={{ fontSize: '11px', color: '#f87171', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={10} />{msg}</p>
    : null;

const SyncField = ({ label, value }: { label: string; value?: string | number }) => (
    <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '5px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.18)' }}>
                <Lock size={8} style={{ color: '#4ade80' }} />
                <span style={{ fontSize: '9px', color: '#4ade80', fontWeight: '700' }}>API</span>
            </div>
        </div>
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: '#fff' }}>{value || '—'}</p>
    </div>
);

interface IGConn {
    isConnected: boolean;
    username?: string;
    profilePictureURL?: string;
    followersCount?: number;
    followsCount?: number;
    mediaCount?: number;
    lastSyncedAt?: string;
    syncStatus?: string;
    accountType?: string;
    biography?: string;
}

function InstagramSection({ conn, onRefresh }: { conn: IGConn | null; onRefresh: () => void }) {
    const [connecting, setConnecting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    const handleConnect = async () => {
        setConnecting(true);
        try {
            const res = await influencerAPI.getInstagramConnectURL();
            const { authURL } = res.data;
            if (authURL) window.location.href = authURL;
            else toast.error('Could not get Instagram auth URL. Check server config.');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to initiate Instagram connect');
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Disconnecting will remove all API-synced metrics. Continue?')) return;
        setDisconnecting(true);
        try {
            await influencerAPI.disconnectInstagram();
            toast.success('Instagram disconnected');
            onRefresh();
        } catch { toast.error('Failed to disconnect'); }
        finally { setDisconnecting(false); }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await influencerAPI.refreshInstagramSync();
            toast.success('Instagram data refreshed! ✅');
            onRefresh();
        } catch (err: any) {
            const code = err?.response?.data?.code;
            if (code === 'TOKEN_EXPIRED') toast.error('Token expired. Please reconnect your Instagram account.');
            else toast.error(err?.response?.data?.message || 'Refresh failed');
        } finally { setRefreshing(false); }
    };

    const isConn = conn?.isConnected;
    const lastSync = conn?.lastSyncedAt ? new Date(conn.lastSyncedAt).toLocaleString() : null;

    return (
        <SectionCard title="Instagram Integration" icon={<Instagram size={16} />}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(131,58,180,0.4)', flexShrink: 0 }}>
                    <Instagram size={17} style={{ color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: '#fff' }}>Meta / Instagram OAuth</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Secure server-side token exchange</p>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', background: isConn ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)', border: `1px solid ${isConn ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`, color: isConn ? '#4ade80' : '#fbbf24' }}>
                    {isConn ? <><Zap size={10} /> Connected</> : <><AlertCircle size={10} /> Not Connected</>}
                </span>
            </div>

            <AnimatePresence mode="wait">
                {!isConn ? (
                    <motion.div key="nc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ textAlign: 'center', padding: '32px 20px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#833ab480,#fd1d1d40,#fcb04530)', border: '1px solid rgba(131,58,180,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(131,58,180,0.2)' }}>
                            <Instagram size={28} style={{ color: '#fff' }} />
                        </div>
                        <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '8px' }}>Connect Your Instagram</h4>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', maxWidth: '340px', margin: '0 auto 24px' }}>Link your Business or Creator account to auto-sync followers, engagement rate, and analytics. Brands use this to discover you.</p>
                        <button onClick={handleConnect} disabled={connecting}
                            style={{ padding: '13px 32px', borderRadius: '99px', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 30px rgba(131,58,180,0.4)', fontFamily: 'inherit' }}>
                            {connecting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Instagram size={16} />}
                            {connecting ? 'Redirecting to Meta…' : 'Connect Instagram via Meta'}
                        </button>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '12px' }}>Porchest never stores your Instagram password</p>
                    </motion.div>
                ) : (
                    <motion.div key="conn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '16px', background: 'rgba(123,63,242,0.06)', border: '1px solid rgba(123,63,242,0.15)', marginBottom: '14px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                {conn?.profilePictureURL ? <img src={conn.profilePictureURL} alt="IG" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Instagram size={20} style={{ color: '#fff' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: '#fff', fontSize: '15px' }}>@{conn?.username || '—'}</p>
                                {conn?.accountType && <span style={{ fontSize: '11px', color: '#a78bfa', background: 'rgba(123,63,242,0.15)', border: '1px solid rgba(123,63,242,0.3)', padding: '1px 8px', borderRadius: '6px' }}>{conn.accountType}</span>}
                            </div>
                            {conn?.username && (
                                <a href={`https://instagram.com/${conn.username}`} target="_blank" rel="noreferrer"
                                    style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', textDecoration: 'none', flexShrink: 0 }}>
                                    <ExternalLink size={13} /> View
                                </a>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
                            <SyncField label="Followers" value={conn?.followersCount?.toLocaleString()} />
                            <SyncField label="Following" value={conn?.followsCount?.toLocaleString()} />
                            <SyncField label="Posts" value={conn?.mediaCount?.toLocaleString()} />
                        </div>

                        {lastSync && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                <Clock size={10} /><span>Last synced: {lastSync}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={handleRefresh} disabled={refreshing}
                                style={{ flex: 1, minWidth: '130px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(123,63,242,0.12)', border: '1px solid rgba(123,63,242,0.25)', color: '#a78bfa', fontSize: '13px', fontWeight: '600', cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontFamily: 'inherit' }}>
                                <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                                {refreshing ? 'Refreshing…' : 'Refresh Sync'}
                            </button>
                            <button onClick={handleDisconnect} disabled={disconnecting}
                                style={{ padding: '10px 16px', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: '13px', fontWeight: '600', cursor: disconnecting ? 'not-allowed' : 'pointer', opacity: disconnecting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '7px', fontFamily: 'inherit' }}>
                                <Unlink size={13} />{disconnecting ? 'Disconnecting…' : 'Disconnect'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </SectionCard>
    );
}

function calcScore(form: Record<string, string>, isConnected: boolean): number {
    const fields = [form.fullName, form.contactEmail, form.country, form.niche, form.avgPostCostUSD, form.avgReelCostUSD, form.shortBio];
    const filledCount = fields.filter(f => f && String(f).trim().length > 0).length;
    const totalPossible = fields.length + 1;
    return Math.round(((filledCount + (isConnected ? 1 : 0)) / totalPossible) * 100);
}

export default function InfluencerProfilePage() {
    const { user, updateUser } = useAuth();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [igConn, setIgConn] = useState<IGConn | null>(null);
    const [errs, setErrs] = useState<Record<string, string>>({});
    const [form, setForm] = useState({
        fullName: '', age: '', country: '', city: '', contactEmail: '',
        niche: '', shortBio: '', avgPostCostUSD: '', avgReelCostUSD: '',
        instagramUsername: '', instagramProfileURL: '',
    });

    const loadProfile = useCallback(async () => {
        try {
            const res = await influencerAPI.getProfile();
            const { user: u, instagramConnection } = res.data;
            setForm({
                fullName: u.fullName || '',
                age: u.age ? String(u.age) : '',
                country: u.country || '',
                city: u.city || '',
                contactEmail: u.contactEmail || u.email || '',
                niche: u.niche || '',
                shortBio: u.shortBio || u.bio || '',
                avgPostCostUSD: u.avgPostCostUSD ? String(u.avgPostCostUSD) : '',
                avgReelCostUSD: u.avgReelCostUSD ? String(u.avgReelCostUSD) : '',
                instagramUsername: u.instagramUsername || '',
                instagramProfileURL: u.instagramProfileURL || '',
            });
            if (updateUser) updateUser(u);
            setIgConn(instagramConnection);
        } catch { toast.error('Failed to load profile'); }
        finally { setLoading(false); }
    }, [updateUser]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const p = new URLSearchParams(window.location.search);
            if (p.get('ig_connected') === '1') { toast.success('Instagram connected! ✅'); window.history.replaceState({}, '', window.location.pathname); }
            if (p.get('ig_error')) {
                const errType = p.get('ig_error')!;
                const details = p.get('details') ? ` (${decodeURIComponent(p.get('details')!)})` : '';
                const m: Record<string, string> = { 
                    invalid_state: 'Security check failed.', 
                    missing_code: 'Authorization cancelled.', 
                    sync_failed: 'Sync failed. Try again.', 
                    token_expired: 'Token expired. Reconnect.',
                    auth_denied: 'You declined the connection.',
                    invalid_state_format: 'Session corrupted.'
                };
                toast.error((m[errType] || 'Instagram connection failed.') + details);
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
        loadProfile();
    }, [loadProfile]);

    const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); if (errs[k]) setErrs(e => ({ ...e, [k]: '' })); };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.fullName.trim()) e.fullName = 'Full name is required';
        if (!form.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = 'Valid email required';
        if (form.age) { const a = Number(form.age); if (isNaN(a) || a < 13 || a > 100) e.age = 'Age must be 13–100'; }
        if (!form.country) e.country = 'Country is required';
        if (!form.niche) e.niche = 'Please select your niche';
        if (form.avgPostCostUSD === '' || Number(form.avgPostCostUSD) < 0) e.avgPostCostUSD = 'Valid post rate required (can be 0)';
        if (form.avgReelCostUSD === '' || Number(form.avgReelCostUSD) < 0) e.avgReelCostUSD = 'Valid reel rate required (can be 0)';
        if (form.shortBio) { const w = form.shortBio.trim().split(/\s+/).filter(Boolean).length; if (w > 100) e.shortBio = `Bio too long (${w}/100 words)`; }
        setErrs(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) { toast.error('Please fix the highlighted fields'); return; }
        setSaving(true);
        try {
            const res = await influencerAPI.updateProfile({
                fullName: form.fullName.trim(),
                age: form.age ? Number(form.age) : undefined,
                country: form.country,
                city: form.city.trim() || undefined,
                contactEmail: form.contactEmail.trim(),
                niche: form.niche,
                shortBio: form.shortBio.trim() || undefined,
                bio: form.shortBio.trim() || undefined,
                avgPostCostUSD: Number(form.avgPostCostUSD),
                avgReelCostUSD: Number(form.avgReelCostUSD),
                instagramUsername: !igConn?.isConnected ? (form.instagramUsername.trim() || undefined) : undefined,
                instagramProfileURL: !igConn?.isConnected ? (form.instagramProfileURL.trim() || undefined) : undefined,
            });
            if (updateUser) updateUser(res.data.user);
            toast.success('Profile saved! ✅');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save profile');
        } finally { setSaving(false); }
    };

    const score = calcScore(form, !!igConn?.isConnected);
    const bioWords = form.shortBio.trim() ? form.shortBio.trim().split(/\s+/).filter(Boolean).length : 0;

    if (loading) return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '760px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>My Profile</h1>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Your profile is shown to brands searching for influencers</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '99px', background: score === 100 ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)', border: `1px solid ${score === 100 ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
                            {score === 100 ? <CheckCircle2 size={14} style={{ color: '#4ade80' }} /> : <AlertCircle size={14} style={{ color: '#fbbf24' }} />}
                            <span style={{ fontSize: '13px', fontWeight: '700', color: score === 100 ? '#4ade80' : '#fbbf24' }}>{score}% complete</span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: '24px' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                            style={{ height: '100%', borderRadius: '2px', background: score === 100 ? 'linear-gradient(90deg,#4ade80,#22c55e)' : 'linear-gradient(90deg,#7B3FF2,#A855F7)', boxShadow: `0 0 12px ${score === 100 ? 'rgba(74,222,128,0.4)' : 'rgba(123,63,242,0.4)'}` }} />
                    </div>

                    {/* Instagram Integration */}
                    <InstagramSection conn={igConn} onRefresh={loadProfile} />

                    {/* Basic Information */}
                    <SectionCard title="Basic Information" icon={<User size={16} />}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <Label req>Full Name</Label>
                                <input style={{ ...iStyle, borderColor: errs.fullName ? 'rgba(248,113,113,0.5)' : undefined }} placeholder="Your full name" value={form.fullName} onChange={e => set('fullName', e.target.value)} {...fh} />
                                <FieldErr msg={errs.fullName} />
                            </div>
                            <div>
                                <Label>Age</Label>
                                <input type="number" min={13} max={100} style={{ ...iStyle, borderColor: errs.age ? 'rgba(248,113,113,0.5)' : undefined }} placeholder="e.g. 25" value={form.age} onChange={e => set('age', e.target.value)} {...fh} />
                                <FieldErr msg={errs.age} />
                            </div>
                            <div>
                                <Label req>Contact Email</Label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                    <input type="email" style={{ ...iStyle, paddingLeft: '36px', borderColor: errs.contactEmail ? 'rgba(248,113,113,0.5)' : undefined }} placeholder="contact@you.com" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} {...fh} />
                                </div>
                                <FieldErr msg={errs.contactEmail} />
                            </div>
                            <div>
                                <Label req>Country of Residence</Label>
                                <div style={{ position: 'relative' }}>
                                    <Globe size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                    <select style={{ ...iStyle, paddingLeft: '36px', appearance: 'none', borderColor: errs.country ? 'rgba(248,113,113,0.5)' : undefined, color: form.country ? '#fff' : 'rgba(255,255,255,0.3)' }} value={form.country} onChange={e => set('country', e.target.value)} {...fh}>
                                        <option value="">Select country</option>
                                        {COUNTRIES.map(c => <option key={c} value={c} style={{ background: '#0d0118' }}>{c}</option>)}
                                    </select>
                                    <ChevronDown size={12} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                </div>
                                <FieldErr msg={errs.country} />
                            </div>
                            <div>
                                <Label>City <span style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'none', fontWeight: '400', fontSize: '10px' }}>(optional)</span></Label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                    <input style={{ ...iStyle, paddingLeft: '36px' }} placeholder="e.g. Karachi" value={form.city} onChange={e => set('city', e.target.value)} {...fh} />
                                </div>
                            </div>
                            <div>
                                <Label req>Niche / Category</Label>
                                <div style={{ position: 'relative' }}>
                                    <select style={{ ...iStyle, appearance: 'none', paddingRight: '32px', borderColor: errs.niche ? 'rgba(248,113,113,0.5)' : undefined, color: form.niche ? '#fff' : 'rgba(255,255,255,0.3)' }} value={form.niche} onChange={e => set('niche', e.target.value)} {...fh}>
                                        <option value="">Select niche</option>
                                        {NICHES.map(n => <option key={n} value={n} style={{ background: '#0d0118' }}>{n}</option>)}
                                    </select>
                                    <ChevronDown size={12} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                </div>
                                <FieldErr msg={errs.niche} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <Label>Short Bio <span style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'none', fontWeight: '400', fontSize: '10px' }}>(max 100 words)</span></Label>
                                <textarea style={{ ...iStyle, resize: 'vertical', minHeight: '88px', lineHeight: '1.6', borderColor: errs.shortBio ? 'rgba(248,113,113,0.5)' : undefined }}
                                    placeholder="Describe yourself and your audience…" value={form.shortBio} onChange={e => set('shortBio', e.target.value)} {...fh} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <FieldErr msg={errs.shortBio} />
                                    <span style={{ fontSize: '11px', color: bioWords > 100 ? '#f87171' : 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>{bioWords}/100 words</span>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Manual Instagram fields (pre-connect) */}
                    {!igConn?.isConnected && (
                        <SectionCard title="Instagram Handle (Manual)" icon={<Instagram size={16} />}>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px', lineHeight: '1.6', padding: '10px 14px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '12px' }}>
                                ⚠️ These fields are editable until you connect Instagram via OAuth above. After connecting, they are auto-filled and locked.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <Label>Instagram Username</Label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>@</span>
                                        <input style={{ ...iStyle, paddingLeft: '28px' }} placeholder="yourhandle" value={form.instagramUsername} onChange={e => set('instagramUsername', e.target.value)} {...fh} />
                                    </div>
                                </div>
                                <div>
                                    <Label>Instagram Profile URL</Label>
                                    <div style={{ position: 'relative' }}>
                                        <Link2 size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                        <input style={{ ...iStyle, paddingLeft: '36px' }} placeholder="https://instagram.com/yourhandle" value={form.instagramProfileURL} onChange={e => set('instagramProfileURL', e.target.value)} {...fh} />
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {/* Locked synced fields panel */}
                    {igConn?.isConnected && (
                        <SectionCard title="Synced Instagram Metrics" icon={<Lock size={16} />}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                                <SyncField label="Followers" value={igConn?.followersCount?.toLocaleString()} />
                                <SyncField label="Following" value={igConn?.followsCount?.toLocaleString()} />
                                <SyncField label="Posts" value={igConn?.mediaCount?.toLocaleString()} />
                                <SyncField label="Eng. Rate" value={user?.engagementRate ? `${user.engagementRate}%` : '—'} />
                                <SyncField label="Avg Likes" value={user?.avgLikes?.toLocaleString()} />
                                <SyncField label="Avg Comments" value={user?.avgComments?.toLocaleString()} />
                            </div>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '12px' }}>These metrics are read-only — updated automatically from Meta API via Refresh Sync.</p>
                        </SectionCard>
                    )}

                    {/* Collaboration Pricing */}
                    <SectionCard title="Collaboration Pricing" icon={<DollarSign size={16} />}>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px', lineHeight: '1.6' }}>
                            Set your rates so brands can evaluate you. These appear on your discovery card.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div>
                                <Label req>Avg. Post Rate (USD)</Label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>$</span>
                                    <input type="number" min={0} style={{ ...iStyle, paddingLeft: '26px', borderColor: errs.avgPostCostUSD ? 'rgba(248,113,113,0.5)' : undefined }} placeholder="e.g. 200" value={form.avgPostCostUSD} onChange={e => set('avgPostCostUSD', e.target.value)} {...fh} />
                                </div>
                                <FieldErr msg={errs.avgPostCostUSD} />
                            </div>
                            <div>
                                <Label req>Avg. Reel Rate (USD)</Label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>$</span>
                                    <input type="number" min={0} style={{ ...iStyle, paddingLeft: '26px', borderColor: errs.avgReelCostUSD ? 'rgba(248,113,113,0.5)' : undefined }} placeholder="e.g. 350" value={form.avgReelCostUSD} onChange={e => set('avgReelCostUSD', e.target.value)} {...fh} />
                                </div>
                                <FieldErr msg={errs.avgReelCostUSD} />
                            </div>
                        </div>
                        {form.avgPostCostUSD && form.avgReelCostUSD && (
                            <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={13} style={{ color: '#4ade80' }} />
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                    Est. monthly (4 posts + 4 reels):{' '}
                                    <span style={{ color: '#4ade80', fontWeight: '700' }}>${((Number(form.avgPostCostUSD) * 4) + (Number(form.avgReelCostUSD) * 4)).toLocaleString()}</span>
                                </p>
                            </div>
                        )}
                    </SectionCard>

                    {/* Save Button */}
                    <button onClick={handleSave} disabled={saving}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', width: '100%', padding: '16px', borderRadius: '16px', background: saving ? 'rgba(123,63,242,0.4)' : 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 0 32px rgba(123,63,242,0.4)', transition: 'all 200ms', fontFamily: 'inherit' }}>
                        {saving ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Save size={18} /> Save Profile</>}
                    </button>
                </motion.div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
