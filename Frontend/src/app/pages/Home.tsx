import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { EnvironmentCard } from '../components/EnvironmentCard';
import { AddEnvironmentModal, type EnvironmentData } from '../components/AddEnvironmentModal';
import { motion } from 'motion/react';
import { Plus, Activity, AlertTriangle, CheckCircle2, Loader2, Server, IndianRupee } from 'lucide-react';
import { Button } from '../components/ui/button';
import { type Environment } from '../data/environments';
import { environmentService } from '../services/api';

function generateHistory(baseCost: number, variance: number, days = 30) {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    cost: Math.round((baseCost + (Math.random() - 0.5) * 2 * variance) * 100) / 100,
  }));
}

export function Home() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const fetchEnvironments = async () => {
    try {
      setIsLoading(true);
      const data = await environmentService.getEnvironments();
      setEnvironments(data);
    } catch (error) {
      console.error("Failed to load environments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEnvironment = async (data: EnvironmentData) => {
    try {
      const newEnv = await environmentService.createEnvironment(data);
      setEnvironments(prev => [...prev, newEnv]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Failed to add environment:", error);
    }
  };

  // Stats
  const totalEnvs = environments.length;
  const healthy = environments.filter(
    e => e.frontend.status === 'Running' && e.backend.status === 'Running'
  ).length;
  const starting = environments.filter(
    e => e.frontend.status === 'Starting' || e.backend.status === 'Starting'
  ).length;
  const errored = environments.filter(
    e => e.frontend.status === 'Error' || e.backend.status === 'Error'
  ).length;
  const totalMtdCost = environments.reduce((sum, e) => sum + e.mtdCost, 0);

  const stats = [
    {
      label: 'Total Environments',
      value: totalEnvs,
      icon: Server,
      color: 'text-[#6366F1]',
      bg: 'bg-[rgba(99,102,241,0.08)]',
      border: 'border-[rgba(99,102,241,0.15)]',
    },
    {
      label: 'Fully Operational',
      value: healthy,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/[0.08]',
      border: 'border-emerald-500/[0.15]',
    },
    {
      label: 'Starting Up',
      value: starting,
      icon: Loader2,
      color: 'text-amber-400',
      bg: 'bg-amber-500/[0.08]',
      border: 'border-amber-500/[0.15]',
    },
    {
      label: 'Needs Attention',
      value: errored,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/[0.08]',
      border: 'border-red-500/[0.15]',
    },
  ];

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Background gradient effects — dark mode only */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none dark:opacity-100 opacity-0 transition-opacity duration-300">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-[#6366F1] rounded-full blur-[140px] opacity-[0.12]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#8B5CF6] rounded-full blur-[140px] opacity-[0.10]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1E2538] rounded-full blur-[120px] opacity-20" />
      </div>

      <Navigation userRole="Administrator" />

      <main className="relative max-w-[1600px] mx-auto px-6 py-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-[#6366F1]" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                Live Dashboard
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All systems monitored
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground via-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
              Container Environments
            </h2>
            <p className="text-muted-foreground">
              Manage and restart Azure Container Apps across your infrastructure.
            </p>
          </div>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#6366F1] hover:bg-[#5558E3] text-white shadow-lg shadow-[rgba(99,102,241,0.25)] border-none font-medium transition-all duration-200 h-10 px-5 rounded-xl flex items-center gap-2 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Environment
          </Button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                className={`p-4 rounded-xl bg-card border ${stat.border} backdrop-blur-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Monthly Cost Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-8 p-4 rounded-xl bg-gradient-to-r from-[rgba(99,102,241,0.08)] via-[rgba(139,92,246,0.06)] to-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)]">
              <IndianRupee className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
                Total Infrastructure Cost (MTD)
              </div>
              <div className="text-xl font-bold text-foreground">
                ₹{totalMtdCost.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground sm:text-right">
            <span className="text-emerald-400 font-semibold">Click on any cost tile</span> below to view detailed analytics
          </div>
        </motion.div>

        {/* Environment Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {environments.map((env, index) => (
            <motion.div
              key={env.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.07 }}
              className="h-full"
            >
              <EnvironmentCard environment={env} />
            </motion.div>
          ))}

          {/* Add Environment Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + environments.length * 0.07 }}
            onClick={() => setIsAddModalOpen(true)}
            className="cursor-pointer group"
          >
            <div className="h-full min-h-[260px] rounded-xl border-2 border-dashed border-border hover:border-[#6366F1]/50 transition-all duration-300 flex flex-col items-center justify-center gap-3 bg-muted/10 hover:bg-[rgba(99,102,241,0.03)]">
              <div className="w-12 h-12 rounded-full bg-muted/50 group-hover:bg-[rgba(99,102,241,0.1)] border border-border group-hover:border-[rgba(99,102,241,0.3)] flex items-center justify-center transition-all duration-300">
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-[#6366F1] transition-colors duration-300" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  Add New Environment
                </div>
                <div className="text-xs text-muted-foreground/60 mt-0.5">
                  Connect Azure Container Apps
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <AddEnvironmentModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleAddEnvironment}
      />
    </div>
  );
}