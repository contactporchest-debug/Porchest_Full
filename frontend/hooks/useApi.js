'use client';

import { useState, useEffect, useCallback } from 'react';

function getAuthToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || localStorage.getItem('porchest_token');
}

function clearAuthAndRedirect() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('porchest_token');
    localStorage.removeItem('porchest_user');
    window.location.href = '/login';
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
                if (res.status === 401 || res.status === 403) {
                    clearAuthAndRedirect();
                }
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

async function apiRequest(endpoint, body, method = 'POST') {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method,
        headers: {
            Authorization: `Bearer ${getAuthToken() || ''}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body || {}),
    });

    if (res.status === 401 || res.status === 403) {
        clearAuthAndRedirect();
    }

    return res.json();
}

export async function apiPost(endpoint, body) {
    return apiRequest(endpoint, body, 'POST');
}

export async function apiPut(endpoint, body) {
    return apiRequest(endpoint, body, 'PUT');
}

export async function apiPatch(endpoint, body) {
    return apiRequest(endpoint, body, 'PATCH');
}
