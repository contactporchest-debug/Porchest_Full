function normalizeOrigin(value: string) {
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
}

export function resolveSocketUrl() {
    const envSocket = process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || '';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || '';

    if (typeof window === 'undefined') {
        return envSocket || appUrl || 'http://localhost:5000';
    }

    if (envSocket) {
        const origin = normalizeOrigin(envSocket);
        const isKnownBadHost = origin?.includes('api.porchest.com');
        if (origin && !isKnownBadHost) return envSocket;
    }

    if (appUrl) {
        const origin = normalizeOrigin(appUrl);
        if (origin) return origin;
    }

    return window.location.origin;
}
