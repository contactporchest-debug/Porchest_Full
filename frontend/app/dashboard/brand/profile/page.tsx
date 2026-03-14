'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Mail, Globe, ChevronDown, Save, Loader2,
    CheckCircle2, AlertCircle, DollarSign, Link2, User, FileText,
    Instagram, Zap, RefreshCw, Unlink, Lock, ExternalLink, Clock,
    Target, BarChart2,
} from 'lucide-react';
import { brandAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';

const BRAND_NICHES = [
    'Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty',
    'Gaming', 'Lifestyle', 'Education', 'Entertainment', 'Finance',
    'Health', 'Business', 'Other',
];

const COUNTRIES = [
    'Pakistan', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'India', 'United Arab Emirates', 'Saudi Arabia', 'Germany', 'France',
    'Netherlands', 'Singapore', 'Malaysia', 'Turkey', 'South Africa',
    'Nigeria', 'Kenya', 'Bangladesh', 'Philippines', 'Indonesia', 'Other',
];

// ─── Shared UI Primitives (anti-gravity design) ───────────────────

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

const Label = ({ children, req, optional }: { children: React.ReactNode; req?: boolean; optional?: boolean }) => (
    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {children}
        {req && <span style={{ color: '#f87171', marginLeft: '3px' }}>*</span>}
        {optional && <span style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'none', fontWeight: '400', fontSize: '10px', marginLeft: '4px' }}>(optional)</span>}
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
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: '#fff' }}>{value ?? '—'}</p>
    </div>
);

// ─── Instagram Connection Block (Brand-specific) ──────────────────

interface IGConn {
    isConnected: boolean;
    username?: string;
    profilePictureURL?: string;
    followersCount?: number;
    followsCount?: number;
    mediaCount?: number;
    lastSyncedAt?: string;
    syncStatus?: string;
    tokenStatus?: string;
    accountType?: string;
    biography?: string;
    linkedPageName?: string;
}

function BrandInstagramSection({ conn, onRefresh }: { conn: IGConn | null; onRefresh: () => void }) {
    const [connecting, setConnecting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    const handleConnect = async () => {
        setConnecting(true);
        try {
            const res = await brandAPI.getInstagramConnectURL();
            const { authURL } = res.data;
            if (authURL) window.location.href = authURL;
            else toast.error('Could not get Instagram auth URL. Check server config.');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to initiate Instagram connection');
        } finally { setConnecting(false); }
    };

    const handleDisconnect = async () => {
        if (!confirm('Disconnecting will remove all API-synced Instagram data for your brand. Continue?')) return;
        setDisconnecting(true);
        try {
            await brandAPI.disconnectInstagram();
            toast.success('Brand Instagram disconnected');
            onRefresh();
        } catch { toast.error('Failed to disconnect'); }
        finally { setDisconnecting(false); }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await brandAPI.refreshInstagramSync();
            toast.success('Brand Instagram data refreshed! ✅');
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
        <SectionCard title="Brand Instagram Integration" icon={<Instagram size={16} />}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(131,58,180,0.4)', flexShrink: 0 }}>
                    <Instagram size={17} style={{ color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: '#fff' }}>Meta / Instagram OAuth</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Brand-specific connection — separate from influencer data</p>
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
                        <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '8px' }}>Connect Your Brand's Instagram</h4>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', maxWidth: '360px', margin: '0 auto 24px' }}>
                            Link your brand's Business Instagram account. Follower count, account type, and brand content will sync automatically.
                        </p>
                        <button onClick={handleConnect} disabled={connecting}
                            style={{ padding: '13px 32px', borderRadius: '99px', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 30px rgba(131,58,180,0.4)', fontFamily: 'inherit' }}>
                            {connecting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Instagram size={16} />}
                            {connecting ? 'Redirecting to Meta…' : 'Connect via Meta OAuth'}
                        </button>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '12px' }}>Porchest never stores your password. Tokens are server-side only.</p>
                    </motion.div>
                ) : (
                    <motion.div key="conn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* Profile preview row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '16px', background: 'rgba(123,63,242,0.06)', border: '1px solid rgba(123,63,242,0.15)', marginBottom: '14px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                {conn?.profilePictureURL ? <img src={conn.profilePictureURL} alt="IG" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Instagram size={20} style={{ color: '#fff' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: '#fff', fontSize: '15px' }}>@{conn?.username || '—'}</p>
                                    {conn?.accountType && <span style={{ fontSize: '11px', color: '#a78bfa', background: 'rgba(123,63,242,0.15)', border: '1px solid rgba(123,63,242,0.3)', padding: '1px 8px', borderRadius: '6px' }}>{conn.accountType}</span>}
                                </div>
                                {conn?.linkedPageName && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>📄 {conn.linkedPageName}</p>}
                            </div>
                            {conn?.username && (
                                <a href={`https://instagram.com/${conn.username}`} target="_blank" rel="noreferrer"
                                    style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', textDecoration: 'none', flexShrink: 0 }}>
                                    <ExternalLink size={13} /> View
                                </a>
                            )}
                        </div>

                        {/* Synced metrics */}
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

// ─── Score Computation ────────────────────────────────────────────

function calcScore(form: Record<string, string>): number {
    const required = [form.brandName, form.officialEmail, form.contactPersonName, form.brandNiche, form.companyCountry, form.brandGoal];
    return Math.round((required.filter(Boolean).length / required.length) * 100);
}

// ─── Main Page ────────────────────────────────────────────────────

export default function BrandProfilePage() {
    const { user, updateUser } = useAuth();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [igConn, setIgConn] = useState<IGConn | null>(null);
    const [errs, setErrs] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        brandName: '', officialEmail: '', contactPersonName: '',
        brandGoal: '', brandNiche: '', approxBudgetUSD: '',
        companyCountry: '', companyWebsite: '', brandInstagramHandle: '',
        trackingWebsiteURL: '', landingPageURL: '', trackingNotes: '',
    });

    const loadProfile = useCallback(async () => {
        try {
            // Load profile data and Instagram connection in parallel
            const [profileRes, igRes] = await Promise.all([
                brandAPI.getProfile(),
                brandAPI.getInstagramProfile().catch(() => null),
            ]);

            const u = profileRes.data.user;
            const bp = profileRes.data.brandProfile;

            setForm({
                brandName: bp?.brandName || u.brandName || u.companyName || '',
                officialEmail: bp?.officialEmail || u.officialEmail || u.email || '',
                contactPersonName: bp?.contactPersonName || u.contactPersonName || '',
                brandGoal: bp?.brandGoal || u.brandGoal || '',
                brandNiche: bp?.brandNiche || u.brandNiche || '',
                approxBudgetUSD: (bp?.approxBudgetUSD ?? u.approxBudgetUSD) ? String(bp?.approxBudgetUSD ?? u.approxBudgetUSD) : '',
                companyCountry: bp?.companyCountry || u.companyCountry || '',
                companyWebsite: bp?.companyWebsite || u.companyWebsite || u.website || '',
                brandInstagramHandle: bp?.brandInstagramHandle || u.brandInstagramHandle || '',
                trackingWebsiteURL: bp?.trackingWebsiteURL || '',
                landingPageURL: bp?.landingPageURL || '',
                trackingNotes: bp?.trackingNotes || '',
            });

            if (updateUser) updateUser(u);

            // Instagram connection data
            if (igRes?.data?.connection) {
                setIgConn(igRes.data.connection);
            }
        } catch { toast.error('Failed to load brand profile'); }
        finally { setLoading(false); }
    }, [updateUser]);

    useEffect(() => {
        // Handle OAuth callback params
        if (typeof window !== 'undefined') {
            const p = new URLSearchParams(window.location.search);
            if (p.get('ig_connected') === '1') {
                toast.success('Brand Instagram connected! ✅', { id: 'brand-ig-conn' });
                window.history.replaceState({}, '', window.location.pathname);
            }
            if (p.get('ig_error')) {
                const m: Record<string, string> = {
                    invalid_state: 'Security check failed.',
                    missing_code: 'Authorization cancelled.',
                    sync_failed: 'Sync failed. Try again.',
                    auth_denied: 'Instagram authorization was denied.',
                };
                toast.error(m[p.get('ig_error')!] || 'Instagram connection failed.', { id: 'brand-ig-err' });
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
        loadProfile();
    }, [loadProfile]);

    const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); if (errs[k]) setErrs(e => ({ ...e, [k]: '' })); };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.brandName.trim() || form.brandName.trim().length < 2) e.brandName = 'Brand name must be at least 2 characters';
        if (!form.officialEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.officialEmail)) e.officialEmail = 'Valid official email required';
        if (!form.contactPersonName.trim() || form.contactPersonName.trim().length < 2) e.contactPersonName = 'Contact person name required';
        if (!form.brandNiche) e.brandNiche = 'Please select your brand niche';
        if (!form.companyCountry) e.companyCountry = 'Company country is required';
        if (form.brandGoal) {
            const words = form.brandGoal.trim().split(/\s+/).filter(Boolean).length;
            if (words > 150) e.brandGoal = `Goal too long (${words}/150 words)`;
        }
        if (form.approxBudgetUSD && Number(form.approxBudgetUSD) < 0) e.approxBudgetUSD = 'Budget must be a positive number';
        if (form.companyWebsite) {
            try { new URL(form.companyWebsite); } catch { e.companyWebsite = 'Must be a valid URL (include https://)'; }
        }
        if (form.trackingWebsiteURL) {
            try { new URL(form.trackingWebsiteURL); } catch { e.trackingWebsiteURL = 'Must be a valid URL (include https://)'; }
        }
        if (form.landingPageURL) {
            try { new URL(form.landingPageURL); } catch { e.landingPageURL = 'Must be a valid URL (include https://)'; }
        }
        setErrs(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) { toast.error('Please fix the highlighted fields'); return; }
        setSaving(true);
        try {
            await brandAPI.updateProfile({
                brandName: form.brandName.trim(),
                companyName: form.brandName.trim(),
                officialEmail: form.officialEmail.trim(),
                contactPersonName: form.contactPersonName.trim(),
                brandGoal: form.brandGoal.trim() || undefined,
                brandNiche: form.brandNiche,
                approxBudgetUSD: form.approxBudgetUSD ? Number(form.approxBudgetUSD) : undefined,
                companyCountry: form.companyCountry,
                companyWebsite: form.companyWebsite.trim() || undefined,
                website: form.companyWebsite.trim() || undefined,
                brandInstagramHandle: form.brandInstagramHandle.replace('@', '').trim() || undefined,
                trackingWebsiteURL: form.trackingWebsiteURL.trim() || undefined,
                landingPageURL: form.landingPageURL.trim() || undefined,
                trackingNotes: form.trackingNotes.trim() || undefined,
            });
            toast.success('Brand profile saved! ✅');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save brand profile');
        } finally { setSaving(false); }
    };

    const score = calcScore(form);
    const goalWords = form.brandGoal.trim() ? form.brandGoal.trim().split(/\s+/).filter(Boolean).length : 0;

    if (loading) return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '760px' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>Brand Profile</h1>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Complete your brand identity to unlock influencer matching</p>
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

                    <AnimatePresence>
                        {score === 100 && (
                            <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 18 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '16px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)' }}>
                                <CheckCircle2 size={16} style={{ color: '#4ade80', flexShrink: 0 }} />
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                                    Profile is <span style={{ color: '#4ade80', fontWeight: '700' }}>100% complete</span>. AI Matching & Influencer Discovery are now unlocked!
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Brand Instagram Integration ── */}
                    <BrandInstagramSection conn={igConn} onRefresh={loadProfile} />

                    {/* ── Brand Identity ── */}
                    <SectionCard title="Brand Identity" icon={<Briefcase size={16} />}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <Label req>Brand / Company Name</Label>
                                <input style={{ ...iStyle, borderColor: errs.brandName ? 'rgba(248,113,113,0.5)' : undefined }}
                                    placeholder="e.g. Acme Corp" value={form.brandName}
                                    onChange={e => set('brandName', e.target.value)} {...fh} />
                                <FieldErr msg={errs.brandName} />
                            </div>
                            <div>
                                <Label req>Official Email</Label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                    <input type="email" style={{ ...iStyle, paddingLeft: '36px', borderColor: errs.officialEmail ? 'rgba(248,113,113,0.5)' : undefined }}
                                        placeholder="brand@company.com" value={form.officialEmail}
                                        onChange={e => set('officialEmail', e.target.value)} {...fh} />
                                </div>
                                <FieldErr msg={errs.officialEmail} />
                            </div>
                            <div>
                                <Label req>Contact Person Name</Label>
                                <div style={{ position: 'relative' }}>
                                    <User size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                    <input style={{ ...iStyle, paddingLeft: '36px', borderColor: errs.contactPersonName ? 'rgba(248,113,113,0.5)' : undefined }}
                                        placeholder="Your full name" value={form.contactPersonName}
                                        onChange={e => set('contactPersonName', e.target.value)} {...fh} />
                                </div>
                                <FieldErr msg={errs.contactPersonName} />
                            </div>
                            <div>
                                <Label req>Brand Niche</Label>
                                <div style={{ position: 'relative' }}>
                                    <select style={{ ...iStyle, appearance: 'none', paddingRight: '32px', borderColor: errs.brandNiche ? 'rgba(248,113,113,0.5)' : undefined, color: form.brandNiche ? '#fff' : 'rgba(255,255,255,0.3)' }}
                                        value={form.brandNiche} onChange={e => set('brandNiche', e.target.value)} {...fh}>
                                        <option value="">Select niche</option>
                                        {BRAND_NICHES.map(n => <option key={n} value={n} style={{ background: '#0d0118' }}>{n}</option>)}
                                    </select>
                                    <ChevronDown size={12} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                </div>
                                <FieldErr msg={errs.brandNiche} />
                            </div>
                            <div>
                                <Label req>Company Country</Label>
                                <div style={{ position: 'relative' }}>
                                    <Globe size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                    <select style={{ ...iStyle, paddingLeft: '36px', appearance: 'none', borderColor: errs.companyCountry ? 'rgba(248,113,113,0.5)' : undefined, color: form.companyCountry ? '#fff' : 'rgba(255,255,255,0.3)' }}
                                        value={form.companyCountry} onChange={e => set('companyCountry', e.target.value)} {...fh}>
                                        <option value="">Select country</option>
                                        {COUNTRIES.map(c => <option key={c} value={c} style={{ background: '#0d0118' }}>{c}</option>)}
                                    </select>
                                    <ChevronDown size={12} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                </div>
                                <FieldErr msg={errs.companyCountry} />
                            </div>
                            <div>
                                <Label optional>Approx. Budget (USD)</Label>
                                <div style={{ position: 'relative' }}>
                                    <DollarSign size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                    <input type="number" min={0} style={{ ...iStyle, paddingLeft: '36px', borderColor: errs.approxBudgetUSD ? 'rgba(248,113,113,0.5)' : undefined }}
                                        placeholder="e.g. 10000" value={form.approxBudgetUSD}
                                        onChange={e => set('approxBudgetUSD', e.target.value)} {...fh} />
                                </div>
                                <FieldErr msg={errs.approxBudgetUSD} />
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── Campaign Goal ── */}
                    <SectionCard title="Campaign Goal" icon={<FileText size={16} />}>
                        <Label req>What is your typical campaign goal? <span style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'none', fontWeight: '400', fontSize: '10px' }}>(max 150 words)</span></Label>
                        <textarea
                            style={{ ...iStyle, resize: 'vertical', minHeight: '100px', lineHeight: '1.6', borderColor: errs.brandGoal ? 'rgba(248,113,113,0.5)' : undefined }}
                            placeholder="Describe your brand's marketing goal, target audience, and what you want to achieve through influencer collaborations…"
                            value={form.brandGoal}
                            onChange={e => set('brandGoal', e.target.value)}
                            {...fh}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <FieldErr msg={errs.brandGoal} />
                            <span style={{ fontSize: '11px', color: goalWords > 150 ? '#f87171' : 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>{goalWords}/150 words</span>
                        </div>
                    </SectionCard>

                    {/* ── Online Presence ── */}
                    <SectionCard title="Online Presence" icon={<Globe size={16} />}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div>
                                <Label optional>Company Website</Label>
                                <div style={{ position: 'relative' }}>
                                    <Link2 size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                    <input style={{ ...iStyle, paddingLeft: '36px', borderColor: errs.companyWebsite ? 'rgba(248,113,113,0.5)' : undefined }}
                                        placeholder="https://yourcompany.com" value={form.companyWebsite}
                                        onChange={e => set('companyWebsite', e.target.value)} {...fh} />
                                </div>
                                <FieldErr msg={errs.companyWebsite} />
                            </div>
                            <div>
                                <Label optional>Brand Instagram Handle</Label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>@</span>
                                    <input style={{ ...iStyle, paddingLeft: '28px' }}
                                        placeholder="yourbrand" value={form.brandInstagramHandle}
                                        onChange={e => set('brandInstagramHandle', e.target.value)} {...fh} />
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── Website / Link Tracking ── */}
                    <SectionCard title="Website & Link Tracking" icon={<Target size={16} />}>
                        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(96,213,248,0.05)', border: '1px solid rgba(96,213,248,0.15)', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <BarChart2 size={13} style={{ color: '#60d5f8' }} />
                                <p style={{ fontSize: '12px', color: '#60d5f8', fontWeight: '600' }}>Attribution & Tracking</p>
                            </div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6' }}>
                                Store your brand's primary tracking URL and landing page here. These links will be used for future click-through, UTM, and conversion attribution analysis when influencer campaigns go live.
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div>
                                <Label optional>Primary Tracking URL</Label>
                                <div style={{ position: 'relative' }}>
                                    <Link2 size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                    <input style={{ ...iStyle, paddingLeft: '36px', borderColor: errs.trackingWebsiteURL ? 'rgba(248,113,113,0.5)' : undefined }}
                                        placeholder="https://yoursite.com/?utm_source=porchest" value={form.trackingWebsiteURL}
                                        onChange={e => set('trackingWebsiteURL', e.target.value)} {...fh} />
                                </div>
                                <FieldErr msg={errs.trackingWebsiteURL} />
                            </div>
                            <div>
                                <Label optional>Landing Page URL</Label>
                                <div style={{ position: 'relative' }}>
                                    <ExternalLink size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                    <input style={{ ...iStyle, paddingLeft: '36px', borderColor: errs.landingPageURL ? 'rgba(248,113,113,0.5)' : undefined }}
                                        placeholder="https://yoursite.com/offer" value={form.landingPageURL}
                                        onChange={e => set('landingPageURL', e.target.value)} {...fh} />
                                </div>
                                <FieldErr msg={errs.landingPageURL} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <Label optional>Tracking Notes</Label>
                                <textarea
                                    style={{ ...iStyle, resize: 'vertical', minHeight: '70px', lineHeight: '1.6' }}
                                    placeholder="e.g. Use UTM parameters: utm_campaign=porchest_q1_2025, target CPL = $5…"
                                    value={form.trackingNotes}
                                    onChange={e => set('trackingNotes', e.target.value)}
                                    {...fh}
                                />
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── Save Button ── */}
                    <button onClick={handleSave} disabled={saving}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', width: '100%', padding: '16px', borderRadius: '16px', background: saving ? 'rgba(123,63,242,0.4)' : 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 0 32px rgba(123,63,242,0.4)', transition: 'all 200ms', fontFamily: 'inherit' }}>
                        {saving ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Save size={18} /> Save Brand Profile</>}
                    </button>
                    <div style={{ height: '40px' }} />
                </motion.div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
