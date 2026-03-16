import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  ArrowLeft, AlertCircle, RotateCw, Calendar,
  IndianRupee, Cpu, Zap, Target, Info, BarChart2, TrendingUp,
} from 'lucide-react';
import { environmentService } from '../services/api';
import { DashboardLayout } from '../components/DashboardLayout';
import { QUERY_KEYS, QUERY_CONFIG } from '../config/queryConfig';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, Cell,
} from 'recharts';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const APP_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name?: string; color?: string }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
      <div className="text-muted-foreground mb-1.5">
        {label ? new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : label}
      </div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-foreground font-semibold">
            {p.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
          {p.name && <span className="text-muted-foreground">{p.name}</span>}
        </div>
      ))}
    </div>
  );
}

export function Analytics() {
  const { subscriptionId, resourceGroup } = useParams<{ subscriptionId: string; resourceGroup: string }>();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30d');

  const daysMap: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 };
  const days = daysMap[dateRange] ?? 30;

  const decodedRG = resourceGroup ? decodeURIComponent(resourceGroup) : '';

  // Fetch subscriptions for the sidebar
  const { data: apps = [] } = useQuery({
    queryKey: QUERY_KEYS.APPS,
    queryFn: environmentService.discoverAll,
    ...QUERY_CONFIG.APPS,
  });

  const uniqueSubscriptions = Array.from(new Set(apps.map(a => JSON.stringify({ id: a.subscriptionId, name: a.subscriptionName }))))
    .map(s => JSON.parse(s)) as { id: string; name: string }[];

  // ─── RG cost query — cached per (subscriptionId, resourceGroup, days) ──────
  const {
    data: costData,
    isFetching: loading,
    error: queryError,
  } = useQuery({
    queryKey: QUERY_KEYS.RG_COST(subscriptionId ?? '', decodedRG, days),
    queryFn: () => environmentService.fetchResourceGroupCost(subscriptionId!, decodedRG, days),
    enabled: Boolean(subscriptionId && resourceGroup),
    ...QUERY_CONFIG.RG_COST,
  });

  const error = queryError ? (queryError as Error).message : null;

  const currencySymbol = costData?.currency === 'USD' ? '$' : '₹';
  const chartData = (costData?.daily_costs || []).map(d => ({ name: d.date, cost: d.cost }));
  const perAppData = costData?.per_app_costs || [];
  const totalCost = costData?.total_cost || 0;
  const avgDailyCost = chartData.length > 0 ? chartData.reduce((s, d) => s + d.cost, 0) / chartData.length : 0;
  const projectedEOM = avgDailyCost * 30;
  const costToday = chartData.length > 0 ? chartData[chartData.length - 1].cost : 0;
  const lastUpdated = costData?.last_updated ?? null;

  // Weekly aggregation
  const weeklyData = [
    { week: 'Week 1', cost: chartData.slice(0, 7).reduce((s, d) => s + d.cost, 0) },
    { week: 'Week 2', cost: chartData.slice(7, 14).reduce((s, d) => s + d.cost, 0) },
    { week: 'Week 3', cost: chartData.slice(14, 21).reduce((s, d) => s + d.cost, 0) },
    { week: 'Week 4', cost: chartData.slice(21, 28).reduce((s, d) => s + d.cost, 0) },
  ].filter(w => w.cost > 0);

  // Live performance (simulated — Azure Metrics API is separate integration)
  const performanceData = Array.from({ length: 24 }).map((_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    cpu: Number((Math.random() * 1.5 + 0.2).toFixed(2)),
    memory: Number((Math.random() * 2.0 + 0.5).toFixed(2)),
    replicas: Math.floor(i / 6) % 2 === 0 ? 2 : 4,
  }));

  const overviewCards = [
    {
      title: 'Total Cost',
      value: loading ? '…' : `${currencySymbol}${totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      sub: <span className="text-muted-foreground">Last {days} days · MTD</span>,
      icon: IndianRupee, iconColor: 'text-violet-400', iconBg: 'bg-violet-500/10',
    },
    {
      title: 'Cost Today',
      value: loading ? '…' : `${currencySymbol}${costToday.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      sub: <span className="text-muted-foreground">{lastUpdated ? `Data as of ${lastUpdated}` : 'Delayed 24-48h'}</span>,
      icon: Zap, iconColor: 'text-amber-400', iconBg: 'bg-amber-500/10',
    },
    {
      title: 'Projected EOM',
      value: loading ? '…' : `${currencySymbol}${projectedEOM.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      sub: <span className="text-muted-foreground">Based on {days}d average</span>,
      icon: Target, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10',
    },
    {
      title: 'Avg. Daily Cost',
      value: loading ? '…' : `${currencySymbol}${avgDailyCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      sub: <span className="text-muted-foreground">Over last {days} days</span>,
      icon: Cpu, iconColor: 'text-purple-400', iconBg: 'bg-purple-500/10',
    },
  ];

  if (!subscriptionId || !resourceGroup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-foreground font-semibold">Missing resource group context</p>
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mt-4">Go back</Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      userName="Superadmin" 
      userRole="System" 
      activeSub={subscriptionId}
      subscriptions={uniqueSubscriptions}
    >
      <div className="relative max-w-[1600px] mx-auto w-full">
        {/* Background glows */}
        <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-violet-500/5 dark:bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="fixed bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="group pl-1 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors mb-5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <BarChart2 className="w-6 h-6 text-violet-500" />
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Cost Analytics
                </h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-mono text-sm">
                Resource Group: <span className="text-slate-700 dark:text-slate-300">{decodedRG}</span>
              </p>
              {lastUpdated && (
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Azure cost data is delayed 24-48h · Last updated: {lastUpdated}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[160px] bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg h-10">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                    <SelectValue placeholder="Date Range" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800">
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="14d">Last 14 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {overviewCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl shadow-none">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      {loading ? (
                        <div className="w-24 h-8 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                      ) : (
                        <h3 className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">{card.value}</h3>
                      )}
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                    </div>
                    <div className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">{card.sub}</div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs defaultValue="trend" className="space-y-4">
            <TabsList className="bg-slate-100/40 dark:bg-[#0f172a]/40 border-b border-slate-200 dark:border-slate-800 rounded-none p-0 overflow-x-auto flex flex-nowrap min-w-max h-auto py-3 px-4 justify-start gap-2">
              {['trend', 'per-app', 'weekly', 'performance'].map(tab => (
                <TabsTrigger key={tab} value={tab}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm border-none capitalize">
                  {tab === 'per-app' ? 'Per App Cost' : tab === 'trend' ? 'Cost Trend' : tab === 'weekly' ? 'Weekly View' : 'Performance'}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Trend Tab */}
            <TabsContent value="trend">
              <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Daily Cost Trend</CardTitle>
                      <CardDescription className="text-xs">Total cost per day for the last {days} days · {decodedRG}</CardDescription>
                    </div>
                    {chartData.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {days}d view
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="h-[320px] pt-2">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <RotateCw className="w-8 h-8 text-violet-500 animate-spin" />
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Info className="w-8 h-8" />
                      <p className="text-sm">No cost data available for this period.</p>
                      <p className="text-xs">Azure Cost Management data may be delayed 24-48h.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="currentColor"
                          className="text-muted-foreground" tickFormatter={v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          interval={Math.floor(chartData.length / 6)} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}`} width={60} stroke="currentColor" className="text-muted-foreground" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="cost" stroke="#8B5CF6" strokeWidth={2} fill="url(#costGrad)"
                          dot={false} activeDot={{ r: 5, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Per App Cost Tab */}
            <TabsContent value="per-app">
              <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base">Cost Per Container App</CardTitle>
                  <CardDescription className="text-xs">Breakdown of spend per container app in {decodedRG} over last {days} days</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-48 flex items-center justify-center">
                      <RotateCw className="w-8 h-8 text-violet-500 animate-spin" />
                    </div>
                  ) : perAppData.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Info className="w-8 h-8" />
                      <p className="text-sm">No per-app cost data available.</p>
                    </div>
                  ) : (
                    <>
                      {/* Bar chart */}
                      <div className="h-[260px] mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={perAppData} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                            <XAxis dataKey="app_name" fontSize={11} tickLine={false} axisLine={false}
                              stroke="currentColor" className="text-muted-foreground"
                              angle={-20} textAnchor="end" interval={0} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="currentColor"
                              className="text-muted-foreground" width={60} />
                            <Tooltip content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
                                  <div className="font-semibold text-foreground">{payload[0].payload.app_name}</div>
                                  <div className="text-muted-foreground">{currencySymbol}{Number(payload[0].value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                </div>
                              );
                            }} />
                            <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                              {perAppData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={APP_COLORS[index % APP_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {/* List with progress bars */}
                      <div className="space-y-3">
                        {perAppData.map((app, i) => {
                          const pct = totalCost > 0 ? (app.cost / totalCost) * 100 : 0;
                          return (
                            <div key={app.app_name} className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: APP_COLORS[i % APP_COLORS.length] }} />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 w-48 truncate">{app.app_name}</span>
                              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: APP_COLORS[i % APP_COLORS.length] }} />
                              </div>
                              <span className="text-xs text-slate-500 w-20 text-right">{currencySymbol}{app.cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                              <span className="text-xs text-slate-400 w-10 text-right">{pct.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Weekly Tab */}
            <TabsContent value="weekly">
              <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base">Weekly Cost Comparison</CardTitle>
                  <CardDescription className="text-xs">Total cost aggregated by week</CardDescription>
                </CardHeader>
                <CardContent className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                      <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={55} stroke="currentColor" className="text-muted-foreground" />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
                            <div className="text-muted-foreground mb-1">{label}</div>
                            <div className="font-semibold text-foreground">{currencySymbol}{Number(payload[0].value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                          </div>
                        );
                      }} />
                      <Bar dataKey="cost" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-5">
              <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Active Replicas Timeline (Simulated)</CardTitle>
                  <CardDescription className="text-xs">Scaling events over the last 24 hours · Live metrics require Azure Monitor integration</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                      <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" interval={3} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" width={30} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                      <Line type="stepAfter" dataKey="replicas" name="Replicas" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">CPU Usage (Cores) — Simulated</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px] pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                        <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" interval={5} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" width={40} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="cpu" name="CPU" stroke="#6366F1" strokeWidth={2} fill="url(#cpuGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Memory Usage (GiB) — Simulated</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px] pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                        <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" interval={5} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" width={40} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                        <Line type="monotone" dataKey="memory" name="Memory" stroke="#10B981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
