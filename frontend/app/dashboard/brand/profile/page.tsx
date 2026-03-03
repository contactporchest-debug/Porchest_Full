'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Building2, Globe, ChevronDown, FileText, Image,
    DollarSign, Save, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { brandAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const NICHES = ['Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty', 'Gaming', 'Lifestyle', 'Education', 'Entertainment', 'Finance', 'Other'];

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(14,12,26,0.75)', border: '1px solid rgba(123,63,242,0.15)', borderRadius: '28px', padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(123,63,242,0.12)', border: '1px solid rgba(123,63,242,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                {icon}
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: '#fff' }}>{title}</h3>
        </div>
        {children}
    </motion.div>
);

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 15px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 200ms ease',
};

const Label = ({ children }: { children: React.ReactNode }) => (
    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {children}
    </label>
);

export default function BrandProfilePage() {
    const { user, updateUser } = useAuth();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        companyName: '', brandNiche: '', brandGoal: '', approxBudgetUSD: '', profileImageURL: '', website: '',
    });

    useEffect(() => {
        if (user) {
            setForm({
                companyName: user.companyName || '',
                brandNiche: user.brandNiche || '',
                brandGoal: user.brandGoal || '',
                approxBudgetUSD: user.approxBudgetUSD ? String(user.approxBudgetUSD) : '',
                profileImageURL: user.profileImageURL || '',
                website: user.website || '',
            });
        }
    }, [user]);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
    const wordCount = form.brandGoal.trim() ? form.brandGoal.trim().split(/\s+/).length : 0;

    const completionScore = (() => {
        const fields = [form.companyName, form.brandNiche, form.brandGoal];
        return Math.round((fields.filter(Boolean).length / fields.length) * 100);
    })();

    const handleSave = async () => {
        if (!form.companyName) return toast.error('Company name is required');
        if (!form.brandNiche) return toast.error('Please select your niche');
        if (wordCount > 150) return toast.error('Brand Goal must be 150 words or less');
        setSaving(true);
        try {
            const res = await brandAPI.updateProfile({
                ...form,
                approxBudgetUSD: form.approxBudgetUSD ? Number(form.approxBudgetUSD) : undefined,
            });
            if (updateUser) updateUser(res.data.user);
            toast.success('Profile updated successfully! ✅');
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '720px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>Brand Profile</h1>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Manage your brand identity and requirements</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '99px', background: completionScore === 100 ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)', border: `1px solid ${completionScore === 100 ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
                    {completionScore === 100 ? <CheckCircle2 size={14} style={{ color: '#4ade80' }} /> : <AlertCircle size={14} style={{ color: '#fbbf24' }} />}
                    <span style={{ fontSize: '12px', fontWeight: '700', color: completionScore === 100 ? '#4ade80' : '#fbbf24' }}>{completionScore}% complete</span>
                </div>
            </div>

            {/* Basic Info */}
            <SectionCard title="Company Information" icon={<Building2 size={16} />}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Label>Company Name *</Label>
                        <input style={inputStyle} placeholder="Your brand name" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
                    </div>
                    <div>
                        <Label>Brand Niche *</Label>
                        <div style={{ position: 'relative' }}>
                            <select style={{ ...inputStyle, appearance: 'none', color: form.brandNiche ? '#fff' : 'rgba(255,255,255,0.3)' }}
                                value={form.brandNiche} onChange={(e) => set('brandNiche', e.target.value)}>
                                <option value="">Select niche</option>
                                {NICHES.map((n) => <option key={n} value={n} style={{ background: '#0d0118' }}>{n}</option>)}
                            </select>
                            <ChevronDown size={12} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                        </div>
                    </div>
                    <div>
                        <Label>Website</Label>
                        <div style={{ position: 'relative' }}>
                            <Globe size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                            <input style={{ ...inputStyle, paddingLeft: '36px' }} placeholder="https://brand.com" value={form.website} onChange={(e) => set('website', e.target.value)} />
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Brand Goal */}
            <SectionCard title="Brand Strategy" icon={<FileText size={16} />}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                        <Label>Brand Goal *</Label>
                        <span style={{ fontSize: '10px', color: wordCount > 150 ? '#f87171' : 'rgba(255,255,255,0.25)' }}>{wordCount}/150 words</span>
                    </div>
                    <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '120px', lineHeight: '1.6' }}
                        placeholder="What are your goals for influencer marketing? (e.g. brand awareness, lead gen)"
                        value={form.brandGoal} onChange={(e) => set('brandGoal', e.target.value)} />
                </div>
                <div style={{ marginTop: '16px' }}>
                    <Label>Approx. Monthly Budget (USD)</Label>
                    <div style={{ position: 'relative' }}>
                        <DollarSign size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                        <input type="number" min={0} style={{ ...inputStyle, paddingLeft: '32px' }} placeholder="e.g. 5000" value={form.approxBudgetUSD} onChange={(e) => set('approxBudgetUSD', e.target.value)} />
                    </div>
                </div>
            </SectionCard>

            {/* Visuals */}
            <SectionCard title="Brand Assets" icon={<Image size={16} />}>
                <div>
                    <Label>Profile Image URL</Label>
                    <input style={inputStyle} placeholder="https://brand.com/logo.png" value={form.profileImageURL} onChange={(e) => set('profileImageURL', e.target.value)} />
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '6px' }}>Direct link to your brand logo (.png, .jpg)</p>
                </div>
            </SectionCard>

            {/* Save Button */}
            <button onClick={handleSave} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '15px', borderRadius: '16px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 0 32px rgba(123,63,242,0.4)', transition: 'all 200ms ease', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
                {saving ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={17} />}
                {saving ? 'Saving…' : 'Update Brand Profile'}
            </button>
        </motion.div>
    );
}
