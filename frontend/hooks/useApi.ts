export type ApiOptions = {
    immediate?: boolean;
};

export type ApiResult<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};

type ApiFn<T> = (endpoint: string, options?: ApiOptions) => ApiResult<T>;

// Re-export the existing JS implementation through typed wrappers so TS pages
// get a usable response type instead of `never`.
import * as apiModule from './useApi.js';

const typedApiModule = apiModule as {
    useApi: ApiFn<any>;
    apiPost: (endpoint: string, body?: any) => Promise<any>;
    apiPut: (endpoint: string, body?: any) => Promise<any>;
    apiPatch: (endpoint: string, body?: any) => Promise<any>;
};

export function useApi<T = any>(endpoint: string, options: ApiOptions = {}): ApiResult<T> {
    return typedApiModule.useApi(endpoint, options) as ApiResult<T>;
}

export function apiPost(endpoint: string, body?: any) {
    return typedApiModule.apiPost(endpoint, body);
}

export function apiPut(endpoint: string, body?: any) {
    return typedApiModule.apiPut(endpoint, body);
}

export function apiPatch(endpoint: string, body?: any) {
    return typedApiModule.apiPatch(endpoint, body);
}
