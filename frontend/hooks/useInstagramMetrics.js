'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function useInstagramMetrics() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [syncing, setSyncing] = useState(false);

    const fetchMetrics = async () => {
        try {
            const res = await api.get('/instagram/metrics');
            setMetrics(res.data.metrics || res.data);
            setError(null);
        } catch (err) {
            setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to fetch Instagram metrics');
            setMetrics(null);
        } finally {
            setLoading(false);
        }
    };

    const triggerSync = async () => {
        setSyncing(true);
        try {
            const res = await api.post('/instagram/sync', {});
            await fetchMetrics();
            return res.data;
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    return { metrics, loading, error, syncing, triggerSync, refetch: fetchMetrics };
}
