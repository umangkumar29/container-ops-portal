import type { ContainerStatus } from '../components/StatusBadge';

export interface Environment {
  id: string;
  name: string;
  type: 'PROD' | 'QA' | 'DEV' | 'INTEGRATION';
  resourceGroup: string;
  frontend: {
    name: string;
    status: ContainerStatus;
  };
  backend: {
    name: string;
    status: ContainerStatus;
  };
  costToday: number;
  mtdCost: number;
  lastRestart: string;
  costTrend: number; // Weekly trend percentage (positive = increase, negative = decrease)
  history: {
    date: string;
    cost: number;
  }[];
  breakdown: {
    frontend: number;
    backend: number;
  };
}
