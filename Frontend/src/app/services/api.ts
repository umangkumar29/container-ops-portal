import type { Environment } from '../data/environments';
import type { EnvironmentData } from '../components/AddEnvironmentModal';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// In-Memory cache to prevent redundant Azure API calls
const azureCache: {
    resourceGroups?: string[];
    containerApps: Record<string, string[]>;
} = {
    containerApps: {}
};

export const environmentService = {
    async getEnvironments(): Promise<Environment[]> {
        const response = await fetch(`${API_BASE_URL}/environments/`);
        if (!response.ok) {
            throw new Error(`Failed to fetch environments: ${response.statusText}`);
        }
        const data = await response.json();

        // Map backend DB structure to frontend Environment structure
        return data.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            type: item.type || 'DEV',
            resourceGroup: item.resource_group,
            frontend: { name: item.frontend_app_name, status: 'Stopped' }, // Default until polled
            backend: { name: item.backend_app_name, status: 'Stopped' },
            costToday: 0,
            mtdCost: 0,
            lastRestart: 'Unknown',
            costTrend: 0,
            history: [],
            breakdown: { frontend: 50, backend: 50 }
        }));
    },

    async createEnvironment(data: EnvironmentData): Promise<Environment> {
        const response = await fetch(`${API_BASE_URL}/environments/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: data.name,
                resource_group: data.resourceGroup,
                frontend_app_name: data.frontendName,
                backend_app_name: data.backendName,
                type: data.type,
                is_active: true
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `Failed to create environment: ${response.statusText}`);
        }

        const item = await response.json();
        return {
            id: item.id.toString(),
            name: item.name,
            type: data.type,
            resourceGroup: item.resource_group,
            frontend: { name: item.frontend_app_name, status: 'Stopped' },
            backend: { name: item.backend_app_name, status: 'Stopped' },
            costToday: 0,
            mtdCost: 0,
            lastRestart: 'Just now',
            costTrend: 0,
            history: [],
            breakdown: { frontend: 50, backend: 50 }
        };
    },

    async getEnvironmentStatus(id: string): Promise<{ frontend_status: string, backend_status: string }> {
        const response = await fetch(`${API_BASE_URL}/environments/${id}/status`);
        if (!response.ok) {
            throw new Error(`Failed to fetch status: ${response.statusText}`);
        }
        return response.json();
    },

    async restartEnvironment(id: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/environments/${id}/restart`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`Failed to restart environment: ${response.statusText}`);
        }
        return response.json();
    },

    async startEnvironment(id: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/environments/${id}/start`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`Failed to start environment: ${response.statusText}`);
        }
        return response.json();
    },

    async stopEnvironment(id: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/environments/${id}/stop`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`Failed to stop environment: ${response.statusText}`);
        }
        return response.json();
    },

    async deleteEnvironment(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/environments/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`Failed to delete environment: ${response.statusText}`);
        }
    },

    async getEnvironmentCost(id: string, days: number = 30): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/cost/app/${id}?days=${days}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch cost data: ${response.statusText}`);
        }
        return response.json();
    },

    async getAzureResourceGroups(): Promise<string[]> {
        if (azureCache.resourceGroups) {
            return azureCache.resourceGroups; // Return cached
        }

        const response = await fetch(`${API_BASE_URL}/azure/resource-groups`);
        if (!response.ok) {
            throw new Error(`Failed to fetch resource groups: ${response.statusText}`);
        }
        const data = await response.json();
        azureCache.resourceGroups = data; // Set cache
        return data;
    },

    async getAzureContainerApps(resourceGroupName: string): Promise<string[]> {
        if (azureCache.containerApps[resourceGroupName]) {
            return azureCache.containerApps[resourceGroupName]; // Return cached
        }

        const response = await fetch(`${API_BASE_URL}/azure/resource-groups/${resourceGroupName}/container-apps`);
        if (!response.ok) {
            throw new Error(`Failed to fetch container apps: ${response.statusText}`);
        }
        const data = await response.json();
        azureCache.containerApps[resourceGroupName] = data; // Set cache
        return data;
    }
};
