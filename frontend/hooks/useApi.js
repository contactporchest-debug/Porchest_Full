'use client';

import { useState, useEffect, useCallback } from 'react';

function getAuthToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || localStorage.getItem('porchest_token');
}

export function useApi(endpoint, { immediate = true } = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(Boolean(immediate));
    const [error, setError] = useState(null);

    const fetch_ = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${getAuthToken() || ''}`,
                    'Content-Type': 'application/json',
                },
            });

            const json = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(json?.error || json?.message || `HTTP ${res.status}`);
            }

            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Request failed');
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        if (immediate) fetch_();
    }, [fetch_, immediate]);

    return { data, loading, error, refetch: fetch_ };
}

export async function apiPost(endpoint, body) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${getAuthToken() || ''}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body || {}),
    });

    return res.json();
}
