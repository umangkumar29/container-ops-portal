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
    }
};
