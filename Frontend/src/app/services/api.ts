import { msalInstance, loginRequest, AUTH_BYPASS } from "../authConfig";

export interface EnvironmentApp {
    id: string;
    name: string;
    resourceGroup: string;
    subscriptionId: string;
    subscriptionName: string;
    status: string;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    container: string;
    message: string;
}

export interface LogsResponse {
    app_name: string;
    resource_group: string;
    total: number;
    info_count: number;
    warn_count: number;
    error_count: number;
    entries: LogEntry[];
    has_more: boolean;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

/**
 * Acquire an ARM access token for the currently logged-in user when MSAL is enabled.
 * In CLI mode we skip this entirely so the backend can reuse the local `az login` session.
 */
async function getArmToken(): Promise<string | undefined> {
    if (AUTH_BYPASS || !msalInstance) {
        return undefined;
    }

    const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
    if (!account) return undefined; // No user session → backend relies on CLI/SP credentials

    try {
        const result = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account,
        });
        return result.accessToken;
    } catch {
        // Interaction required (e.g. MFA / consent) → open popup
        const result = await msalInstance.acquireTokenPopup({ ...loginRequest, account });
        return result.accessToken;
    }
}

/** Build fetch headers, injecting the ARM Bearer token when a user is signed in. */
async function authHeaders(): Promise<Record<string, string>> {
    const token = await getArmToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export const environmentService = {
    async discoverAll(): Promise<EnvironmentApp[]> {
        const response = await fetch(`${API_BASE_URL}/azure/discover-all`, {
            headers: await authHeaders(),
        });
        if (!response.ok) throw new Error(`Failed to discover environments: ${response.statusText}`);
        return response.json();
    },

    async startApp(subscriptionId: string, resourceGroup: string, appName: string): Promise<any> {
        const response = await fetch(
            `${API_BASE_URL}/azure/${subscriptionId}/${resourceGroup}/${appName}/start`,
            { method: 'POST', headers: await authHeaders() },
        );
        if (!response.ok) throw new Error(`Failed to start app: ${response.statusText}`);
        return response.json();
    },

    async stopApp(subscriptionId: string, resourceGroup: string, appName: string): Promise<any> {
        const response = await fetch(
            `${API_BASE_URL}/azure/${subscriptionId}/${resourceGroup}/${appName}/stop`,
            { method: 'POST', headers: await authHeaders() },
        );
        if (!response.ok) throw new Error(`Failed to stop app: ${response.statusText}`);
        return response.json();
    },

    async restartApp(subscriptionId: string, resourceGroup: string, appName: string): Promise<any> {
        const response = await fetch(
            `${API_BASE_URL}/azure/${subscriptionId}/${resourceGroup}/${appName}/restart`,
            { method: 'POST', headers: await authHeaders() },
        );
        if (!response.ok) throw new Error(`Failed to restart app: ${response.statusText}`);
        return response.json();
    },

    async fetchSubscriptionCost(subscriptionId: string): Promise<{
        currency: string;
        total_cost: number;
        last_updated: string | null;
        daily_costs: { date: string; cost: number }[];
    }> {
        const response = await fetch(`${API_BASE_URL}/cost/subscription/${subscriptionId}`, {
            headers: await authHeaders(),
        });
        if (!response.ok) throw new Error(`Failed to fetch cost: ${response.statusText}`);
        return response.json();
    },

    async fetchResourceGroupCost(
        subscriptionId: string,
        resourceGroup: string,
        days: number = 30,
    ): Promise<{
        currency: string;
        total_cost: number;
        scope: string;
        last_updated: string | null;
        daily_costs: { date: string; cost: number }[];
        per_app_costs: { app_name: string; cost: number }[];
    }> {
        const response = await fetch(
            `${API_BASE_URL}/cost/resource-group/${subscriptionId}/${resourceGroup}?days=${days}`,
            { headers: await authHeaders() },
        );
        if (!response.ok) throw new Error(`Failed to fetch RG cost: ${response.statusText}`);
        return response.json();
    },

    async fetchAppLogs(
        subscriptionId: string,
        resourceGroup: string,
        appName: string,
        options: { hours?: number; severity?: 'all' | 'warn' | 'error'; search?: string; limit?: number } = {},
    ): Promise<LogsResponse> {
        const params = new URLSearchParams();
        if (options.hours)    params.set('hours', String(options.hours));
        if (options.severity) params.set('severity', options.severity);
        if (options.search)   params.set('search', options.search);
        if (options.limit)    params.set('limit', String(options.limit));

        const response = await fetch(
            `${API_BASE_URL}/logs/${subscriptionId}/${resourceGroup}/${appName}?${params}`,
            { headers: await authHeaders() },
        );
        if (!response.ok) throw new Error(`Failed to fetch logs: ${response.statusText}`);
        return response.json();
    },
};

 
 