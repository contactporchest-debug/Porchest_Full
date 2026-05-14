'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

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
            const res = await api.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${getAuthToken() || ''}`,
                },
            });

            setData(res.data);
        } catch (e) {
            const status = e?.response?.status;
            if (status === 401) {
                clearAuthAndRedirect();
            }
            setError(e?.response?.data?.error || e?.response?.data?.message || e.message || 'Request failed');
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
    const token = getAuthToken() || '';
    const res = await api.request({
        url: endpoint,
        method,
        data: body || {},
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (res?.status === 401) {
        clearAuthAndRedirect();
    }

    return res.data;
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
