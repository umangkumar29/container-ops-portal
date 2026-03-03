export interface EnvironmentApp {
    id: string; // The Azure Resource ID
    name: string; // The Container App name
    resourceGroup: string; // The parent Resource Group
    subscriptionId: string;
    subscriptionName: string;
    status: string; // Running, Stopped, Failed, etc.
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const environmentService = {
    async discoverAll(): Promise<EnvironmentApp[]> {
        const response = await fetch(`${API_BASE_URL}/azure/discover-all`);
        if (!response.ok) {
            throw new Error(`Failed to discover environments: ${response.statusText}`);
        }
        return response.json();
    },

    async startApp(subscriptionId: string, resourceGroup: string, appName: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/azure/${subscriptionId}/${resourceGroup}/${appName}/start`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`Failed to start app: ${response.statusText}`);
        }
        return response.json();
    },

    async stopApp(subscriptionId: string, resourceGroup: string, appName: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/azure/${subscriptionId}/${resourceGroup}/${appName}/stop`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`Failed to stop app: ${response.statusText}`);
        }
        return response.json();
    },

    async restartApp(subscriptionId: string, resourceGroup: string, appName: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/azure/${subscriptionId}/${resourceGroup}/${appName}/restart`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`Failed to restart app: ${response.statusText}`);
        }
        return response.json();
    },

    async fetchSubscriptionCost(subscriptionId: string): Promise<{
        currency: string;
        total_cost: number;
        last_updated: string | null;
        daily_costs: { date: string; cost: number }[];
    }> {
        const response = await fetch(`${API_BASE_URL}/cost/subscription/${subscriptionId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch cost: ${response.statusText}`);
        }
        return response.json();
    },

    async fetchResourceGroupCost(subscriptionId: string, resourceGroup: string, days: number = 30): Promise<{
        currency: string;
        total_cost: number;
        scope: string;
        last_updated: string | null;
        daily_costs: { date: string; cost: number }[];
        per_app_costs: { app_name: string; cost: number }[];
    }> {
        const response = await fetch(
            `${API_BASE_URL}/cost/resource-group/${subscriptionId}/${resourceGroup}?days=${days}`
        );
        if (!response.ok) {
            throw new Error(`Failed to fetch RG cost: ${response.statusText}`);
        }
        return response.json();
    },
};
