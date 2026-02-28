import type { Environment } from '../data/environments';
import type { EnvironmentData } from '../components/AddEnvironmentModal';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

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
            type: item.name.includes('Prod') ? 'PROD' :
                item.name.includes('QA') ? 'QA' :
                    item.name.includes('Integration') ? 'INTEGRATION' : 'DEV',
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
                is_active: true
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create environment: ${response.statusText}`);
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
    }
};
