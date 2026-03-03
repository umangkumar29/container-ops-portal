/**
 * queryConfig.ts
 *
 * Central configuration for TanStack Query cache behaviour.
 * All values are read from Vite environment variables (VITE_QUERY_*).
 * Set these in your .env file (or Azure App Service → Configuration → App Settings).
 *
 * Variable reference:
 *  VITE_QUERY_STALE_TIME_APPS  — ms before apps list is refetched (default 5 min)
 *  VITE_QUERY_STALE_TIME_COST  — ms before cost data is refetched  (default 5 min)
 *  VITE_QUERY_GC_TIME          — ms to keep unused data in memory  (default 10 min)
 *  VITE_QUERY_RETRY            — number of retries on API failure   (default 2)
 */

const parseMs = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const QUERY_KEYS = {
    APPS: ['apps'] as const,
    SUBSCRIPTION_COST: (subscriptionId: string) => ['cost', 'subscription', subscriptionId] as const,
    RG_COST: (subscriptionId: string, resourceGroup: string, days: number) =>
        ['cost', 'rg', subscriptionId, resourceGroup, days] as const,
} as const;

export const QUERY_CONFIG = {
    /** Apps discovery list: stays fresh for 5 min by default */
    APPS: {
        staleTime: parseMs(import.meta.env.VITE_QUERY_STALE_TIME_APPS, 5 * 60 * 1000),
        gcTime: parseMs(import.meta.env.VITE_QUERY_GC_TIME, 10 * 60 * 1000),
        retry: parseMs(import.meta.env.VITE_QUERY_RETRY, 2),
        refetchOnWindowFocus: false, // avoid hammering Azure on tab switch
    },

    /** Subscription-level cost: same TTL as apps */
    SUBSCRIPTION_COST: {
        staleTime: parseMs(import.meta.env.VITE_QUERY_STALE_TIME_COST, 5 * 60 * 1000),
        gcTime: parseMs(import.meta.env.VITE_QUERY_GC_TIME, 10 * 60 * 1000),
        retry: parseMs(import.meta.env.VITE_QUERY_RETRY, 2),
        refetchOnWindowFocus: false,
    },

    /** Resource group cost: same TTL */
    RG_COST: {
        staleTime: parseMs(import.meta.env.VITE_QUERY_STALE_TIME_COST, 5 * 60 * 1000),
        gcTime: parseMs(import.meta.env.VITE_QUERY_GC_TIME, 10 * 60 * 1000),
        retry: parseMs(import.meta.env.VITE_QUERY_RETRY, 2),
        refetchOnWindowFocus: false,
    },
} as const;
