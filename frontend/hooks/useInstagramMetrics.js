'use client';

import { useState, useEffect } from 'react';

export function useInstagramMetrics() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [syncing, setSyncing] = useState(false);

    const fetchMetrics = async () => {
        try {
            const token = localStorage.getItem('porchest_token') || localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instagram/metrics`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.message || 'Failed to fetch Instagram metrics');
            }
            setMetrics(data.metrics || data);
            setError(null);
        } catch (err) {
            setError(err);
            setMetrics(null);
        } finally {
            setLoading(false);
        }
    };

    const triggerSync = async () => {
        setSyncing(true);
        try {
            const token = localStorage.getItem('porchest_token') || localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instagram/sync`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.message || 'Sync failed');
            }
            await fetchMetrics();
            return data;
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    return { metrics, loading, error, syncing, triggerSync, refetch: fetchMetrics };
}
