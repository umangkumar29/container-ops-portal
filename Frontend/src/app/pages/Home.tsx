import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  IndianRupee, Search, ChevronDown,
  Box, RefreshCw, StopCircle, PlayCircle, Network, Loader2, BarChart2
} from 'lucide-react';
import { environmentService, type EnvironmentApp } from '../services/api';
import { toast } from 'sonner';
import { DashboardLayout } from '../components/DashboardLayout';
import { QUERY_KEYS, QUERY_CONFIG } from '../config/queryConfig';

export function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [openRGs, setOpenRGs] = useState<Record<string, boolean>>({});
  const [processingApps, setProcessingApps] = useState<Record<string, string>>({});
  const [activeSub, setActiveSub] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  // ─── Apps query ───────────────────────────────────────────────────────────
  const { data: apps = [], isFetching: isLoading } = useQuery<EnvironmentApp[]>({
    queryKey: QUERY_KEYS.APPS,
    queryFn: () => environmentService.discoverAll(),
    ...QUERY_CONFIG.APPS,
    // After fresh data arrives, sync dependent local state
    select: (data) => data,
  });

  // Open all RGs by default when apps first load, and set active subscription
  useEffect(() => {
    if (apps.length === 0) return;
    setOpenRGs(prev => {
      const rgs: Record<string, boolean> = {};
      apps.forEach(e => { rgs[e.resourceGroup] = prev[e.resourceGroup] ?? true; });
      return rgs;
    });
    if (!activeSub) setActiveSub(apps[0].subscriptionId);
  }, [apps]);

  // ─── Subscription cost query (depends on activeSub) ───────────────────────
  const { data: costData, isFetching: isCostLoading } = useQuery({
    queryKey: QUERY_KEYS.SUBSCRIPTION_COST(activeSub),
    queryFn: () => environmentService.fetchSubscriptionCost(activeSub),
    enabled: Boolean(activeSub), // only run when we have a subscription
    ...QUERY_CONFIG.SUBSCRIPTION_COST,
  });

  // ─── Derived state ─────────────────────────────────────────────────────────
  const filteredApps = activeSub ? apps.filter(app => app.subscriptionId === activeSub) : apps;

  const grouped = filteredApps.reduce((acc, app) => {
    if (!acc[app.resourceGroup]) acc[app.resourceGroup] = [];
    acc[app.resourceGroup].push(app);
    return acc;
  }, {} as Record<string, EnvironmentApp[]>);

  const totalContainers = filteredApps.length;
  let running = 0, stopped = 0, failed = 0;
  filteredApps.forEach(app => {
    if (app.status === 'Running') running++;
    else if (app.status === 'Stopped') stopped++;
    else if (app.status === 'Failed' || app.status === 'Error') failed++;
  });

  const uniqueSubscriptions = Array.from(
    new Map(apps.map(app => [app.subscriptionId, app.subscriptionName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const filteredRGs = Object.entries(grouped).filter(([rg]) =>
    rg.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const toggleRg = (rg: string) => setOpenRGs(prev => ({ ...prev, [rg]: !prev[rg] }));
  const handleSubChange = (id: string) => setActiveSub(id);

  const formatCost = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  // ─── App actions: after each action invalidate the apps cache ──────────────
  const withProcessing = (
    app: EnvironmentApp,
    label: string,
    action: () => Promise<any>,
    successMsg: string,
    failMsg: string,
  ) => async (e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingApps(prev => ({ ...prev, [app.id]: label }));
    try {
      await action();
      toast.success(successMsg);
      // Invalidate so the next time the query runs it fetches fresh data
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPS });
    } catch {
      toast.error(failMsg);
    } finally {
      setProcessingApps(prev => { const next = { ...prev }; delete next[app.id]; return next; });
    }
  };

  const handleStart   = (app: EnvironmentApp, e: React.MouseEvent) =>
    withProcessing(app, 'Starting...', () => environmentService.startApp(app.subscriptionId, app.resourceGroup, app.name), 'Started', 'Start failed')(e);
  const handleStop    = (app: EnvironmentApp, e: React.MouseEvent) =>
    withProcessing(app, 'Stopping...', () => environmentService.stopApp(app.subscriptionId, app.resourceGroup, app.name), 'Stopped', 'Stop failed')(e);
  const handleRestart = (app: EnvironmentApp, e: React.MouseEvent) =>
    withProcessing(app, 'Restarting...', () => environmentService.restartApp(app.subscriptionId, app.resourceGroup, app.name), 'Restarted', 'Restart failed')(e);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // refetchType: 'all' forces an immediate network call even if data is within staleTime
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPS, refetchType: 'all' }),
        activeSub
          ? queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUBSCRIPTION_COST(activeSub), refetchType: 'all' })
          : Promise.resolve(),
      ]);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <DashboardLayout
      userName="Superadmin"
      userRole="System"
      onSync={handleSync}
      isSyncing={isSyncing}
      subscriptions={uniqueSubscriptions}
      activeSub={activeSub}
      onSubChange={handleSubChange}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 dark:bg-[rgba(30,41,59,0.4)] backdrop-blur-md border border-slate-200 dark:border-blue-500/15 p-6 rounded-2xl relative overflow-hidden group shadow-sm dark:shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Subscription Cost (MTD)</span>
            <IndianRupee className="text-blue-500 w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-2">
            {isCostLoading ? (
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            ) : costData ? (
              <>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {formatCost(costData.total_cost, costData.currency)}
                </h2>
                <span className="text-blue-400 text-xs font-semibold">{costData.currency}</span>
              </>
            ) : (
              <h2 className="text-xl font-bold text-slate-500">—</h2>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            {costData?.last_updated ? `Last updated: ${costData.last_updated}` : 'Month-to-date · 24-48h delay'}
          </p>
        </div>

        <div className="md:col-span-3 bg-white/80 dark:bg-[rgba(30,41,59,0.4)] backdrop-blur-md border border-slate-200 dark:border-blue-500/15 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-6 shadow-sm dark:shadow-lg">
          <div className="flex flex-col gap-1 md:border-r border-slate-200 dark:border-white/10 pr-8">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">System Health</span>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{isLoading ? '...' : totalContainers}</h2>
              <span className="text-slate-500 text-sm font-medium">Total Apps</span>
            </div>
          </div>
          
          <div className="flex flex-1 justify-around px-4">
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Running</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{running}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Stopped</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                <span className="text-xl font-bold text-slate-400">{stopped}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Failed</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                <span className="text-xl font-bold text-rose-500">{failed}</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex pl-8 border-l border-slate-200 dark:border-white/10 items-center justify-center">
             <div className="w-16 h-16 rounded-full border-4 border-blue-500/10 flex items-center justify-center relative">
               <span className="text-xs font-bold text-blue-500">100%</span>
               <div className="absolute inset-0 border-4 border-blue-500 rounded-full"></div>
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <Network className="text-slate-400 w-5 h-5" />
            Resource Groups
          </h3>
          <div className="flex gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Search className="w-4 h-4"/></span>
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:ring-blue-500 focus:border-blue-500 w-64 text-slate-300 placeholder-slate-500 outline-none transition-all" 
                placeholder="Filter groups..." 
              />
            </div>
          </div>
        </div>
        
        {isLoading && filteredRGs.length === 0 && (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col justify-center items-center gap-4">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              Scanning Azure Subscription for Apps...
            </div>
        )}

        {Object.entries(grouped).map(([rg, envs]) => {
          const isOpen = openRGs[rg] || false;
          
          return (
            <div key={rg} className="bg-white/50 dark:bg-[rgba(30,41,59,0.3)] backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm dark:shadow-md">
              <div 
                className="flex cursor-pointer select-none items-center justify-between p-5 hover:bg-blue-500/5 transition-colors"
                onClick={() => toggleRg(rg)}
              >
                <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <ChevronDown className={`w-5 h-5 text-blue-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    <span className="font-bold text-slate-900 dark:text-slate-100">{rg}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                    {envs.length} Apps
                  </span>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/analytics/${envs[0].subscriptionId}/${encodeURIComponent(rg)}`);
                    }}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Cost Analytics
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 pt-2">
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 shadow-inner">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                              <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest leading-none">Container App Name</th>
                              <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest leading-none">Status</th>
                              <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-right leading-none">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {envs.map(app => (
                                <tr key={app.id} className="hover:bg-blue-500/5 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                        <Box className="w-4 h-4" />
                                      </div>
                                      <span className="font-semibold text-slate-900 dark:text-slate-100">{app.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <StatusBadge status={app.status} processingState={processingApps[app.id]} />
                                  </td>
                                  <td className="px-6 py-4">
                                    <ActionButtons 
                                      status={app.status} 
                                      onStart={(e) => handleStart(app, e)} 
                                      onStop={(e) => handleStop(app, e)} 
                                      onRestart={(e) => handleRestart(app, e)} 
                                      isProcessing={!!processingApps[app.id]}
                                    />
                                  </td>
                                </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {!isLoading && filteredRGs.length === 0 && (
          <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
            No resource groups found. Try syncing Azure!
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status, processingState }: { status: string, processingState?: string }) {
  if (processingState) {
    return (
      <div className="flex items-center gap-2 bg-blue-500/10 text-blue-500 w-fit px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20 shadow-sm">
        <Loader2 className="w-3 h-3 animate-spin" />
        {processingState}
      </div>
    );
  }
  if (status === 'Running') {
    return (
      <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 w-fit px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Running
      </div>
    );
  }
  if (status === 'Error' || status === 'Failed') {
    return (
      <div className="flex items-center gap-2 bg-rose-500/10 text-rose-500 w-fit px-3 py-1 rounded-full text-xs font-bold border border-rose-500/20 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
        Failed
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-slate-200/50 dark:bg-slate-400/10 text-slate-500 dark:text-slate-400 w-fit px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-white/5">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
      {status || 'Unknown'}
    </div>
  );
}

function ActionButtons({ 
  status, 
  onStart, 
  onStop, 
  onRestart,
  isProcessing
}: { 
  status: string, 
  onStart: (e:any)=>void, 
  onStop: (e:any)=>void, 
  onRestart: (e:any)=>void,
  isProcessing?: boolean
}) {
  const isRunning = status === 'Running';
  
  return (
    <div className="flex justify-end gap-2">
      {/* Start Button - Green */}
      <button 
        onClick={onStart}
        disabled={isRunning || isProcessing}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all border border-transparent ${
          !isRunning && !isProcessing
            ? 'text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/30' 
            : 'text-slate-400 bg-slate-500/10 cursor-not-allowed opacity-50' 
        }`}
        title="Start"
      >
        <PlayCircle className="w-4 h-4" />
      </button>

      {/* Stop Button - Red */}
      <button 
        onClick={onStop}
        disabled={!isRunning || isProcessing}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all border border-transparent ${
          isRunning && !isProcessing
            ? 'text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/30'
            : 'text-slate-400 bg-slate-500/10 cursor-not-allowed opacity-50'
        }`}
        title="Stop"
      >
        <StopCircle className="w-4 h-4" />
      </button>

      {/* Restart Button - Blue */}
      <button 
        onClick={onRestart}
        disabled={!isRunning || isProcessing}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all border border-transparent ${
          isRunning && !isProcessing
            ? 'text-blue-500 hover:bg-blue-500/20 hover:border-blue-500/30' 
            : 'text-slate-400 bg-slate-500/10 cursor-not-allowed opacity-50' 
        }`}
        title="Restart"
      >
        <RefreshCw className="w-4 h-4" />
      </button>


    </div>
  );
}