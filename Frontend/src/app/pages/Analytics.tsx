import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft, TrendingUp, TrendingDown, AlertCircle, StopCircle,
  RotateCw, Calendar, IndianRupee, Cpu, Zap, Target, Info,
} from 'lucide-react';
import { type Environment } from '../data/environments';
import { environmentService } from '../services/api';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  BarChart, Bar, Legend,
} from 'recharts';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const TYPE_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PROD: { label: 'PROD', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  QA: { label: 'QA', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  DEV: { label: 'DEV', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  INTEGRATION: { label: 'INT', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

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
        {label ? new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
      </div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-foreground font-semibold">₹{p.value?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          {p.name && <span className="text-muted-foreground">{p.name}</span>}
        </div>
      ))}
    </div>
  );
}

export function Analytics() {
  const { envId } = useParams<{ envId: string }>();
  const navigate = useNavigate();
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [isRestarting, setIsRestarting] = useState(false);
  const [costData, setCostData] = useState<any>(null);
  const [costLoading, setCostLoading] = useState(false);

  useEffect(() => {
    const loadEnv = async () => {
      try {
        const envs = await environmentService.getEnvironments();
        const found = envs.find(e => e.id === envId);
        if (found) {
            setEnvironment(found);
        }
      } catch (e) {
        console.error("Failed to fetch env", e);
      } finally {
        setLoading(false);
      }
    };
    loadEnv();
  }, [envId]);

  // Filter history based on date range
  const daysMap: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 };
  const days = daysMap[dateRange] ?? 30;

  useEffect(() => {
    if (!environment) return;
    const fetchCost = async () => {
      setCostLoading(true);
      try {
        const data = await environmentService.getEnvironmentCost(environment.id, days);
        setCostData(data);
      } catch (err) {
        console.error("Failed to fetch custom cost data", err);
      } finally {
        setCostLoading(false);
      }
    };
    fetchCost();
  }, [environment, days]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RotateCw className="w-12 h-12 text-[#6366F1] mx-auto mb-4 animate-spin" />
        </div>
      </div>
    );
  }

  if (!environment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-foreground font-semibold">Environment not found</p>
          <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">Go back</Button>
        </div>
      </div>
    );
  }

  const typeConfig = TYPE_LABELS[environment.type];

  const rawDailyCosts: { date: string, cost: number }[] = costData?.daily_costs || [];
  
  const chartData = rawDailyCosts.map(h => ({
    name: h.date,
    cost: h.cost,
    frontend: Math.round(h.cost * (environment.breakdown.frontend / 100)),
    backend: Math.round(h.cost * (environment.breakdown.backend / 100)),
  }));

  const pieData = [
    { name: 'Frontend', value: environment.breakdown.frontend, color: '#6366F1' },
    { name: 'Backend', value: environment.breakdown.backend, color: '#10B981' },
  ];

  // Weekly comparison data
  const weeklyData = [
    { week: 'Week 1', cost: chartData.slice(0, 7).reduce((s, d) => s + d.cost, 0) },
    { week: 'Week 2', cost: chartData.slice(7, 14).reduce((s, d) => s + d.cost, 0) },
    { week: 'Week 3', cost: chartData.slice(14, 21).reduce((s, d) => s + d.cost, 0) },
    { week: 'Week 4', cost: chartData.slice(21, 28).reduce((s, d) => s + d.cost, 0) },
  ].filter(w => w.cost > 0);

  // Live Performance & Scaling Dummy Data (24h)
  const performanceData = Array.from({ length: 24 }).map((_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    frontendCpu: Number((Math.random() * 0.8 + 0.2).toFixed(2)),
    backendCpu: Number((Math.random() * 1.5 + 0.5).toFixed(2)),
    frontendMem: Number((Math.random() * 1.5 + 0.5).toFixed(2)),
    backendMem: Number((Math.random() * 2.5 + 1.0).toFixed(2)),
    frontReplicas: Math.floor(i / 4) % 2 === 0 ? 2 : 4,
    backReplicas: Math.floor(i / 6) % 2 === 0 ? 3 : 5,
  }));

  const avgDailyCost = chartData.length > 0
    ? chartData.reduce((s, d) => s + d.cost, 0) / chartData.length
    : 0;
  const projectedEOM = avgDailyCost * 30;

  const handleRestart = async () => {
    setIsRestarting(true);
    await new Promise(r => setTimeout(r, 3000));
    setIsRestarting(false);
  };

  const totalCost = costData?.total_cost || 0;
  const lastUpdated = costData?.last_updated ? costData.last_updated : 'Unknown (Delayed 24h)';
  const costTodayValue = rawDailyCosts.length > 0 ? rawDailyCosts[rawDailyCosts.length - 1].cost : 0;
  const currencySymbol = costData?.currency === 'USD' ? '$' : '₹';

  const overviewCards = [
    {
      title: 'Total Cost',
      value: costLoading ? 'Loading...' : `${currencySymbol}${totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      sub: (
        <span className={`flex items-center gap-1 ${environment.costTrend > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          {environment.costTrend > 0
            ? <TrendingUp className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />
          }
          {Math.abs(environment.costTrend)}% vs last week
        </span>
      ),
      icon: IndianRupee,
      iconColor: 'text-[#6366F1]',
      iconBg: 'bg-[rgba(99,102,241,0.1)]',
      border: environment.costTrend > 10 ? 'border-red-500/30' : 'border-border/50',
    },
    {
      title: 'Cost Today',
      value: costLoading ? 'Loading...' : `${currencySymbol}${costTodayValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      sub: <span className="text-muted-foreground">{costData?.last_updated ? `Data as of ${lastUpdated}` : 'Waiting on Azure...'}</span>,
      icon: Zap,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      border: 'border-border/50',
    },
    {
      title: 'Projected EOM',
      value: costLoading ? 'Loading...' : `${currencySymbol}${projectedEOM.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      sub: <span className="text-muted-foreground">Based on {days}d average</span>,
      icon: Target,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      border: 'border-border/50',
    },
    {
      title: 'Avg. Daily Cost',
      value: costLoading ? 'Loading...' : `${currencySymbol}${avgDailyCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      sub: <span className="text-muted-foreground">Over last {days} days</span>,
      icon: Cpu,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      border: 'border-border/50',
    },
  ];

  return (
    <DashboardLayout userName="Alex Rivera" userRole="Superadmin">
      <div className="relative max-w-[1600px] mx-auto w-full">
        {/* Background glow effects */}
        <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-[#6366f1]/5 dark:bg-[#6366f1]/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="fixed bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-[#8b5cf6]/5 dark:bg-[#8b5cf6]/10 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Back + Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="group pl-1 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors mb-5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{environment.name}</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
                  {typeConfig.label}
                </span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">Live</span>
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-mono text-sm">
                Resource Group: <span className="text-slate-700 dark:text-slate-300">{environment.resourceGroup}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[160px] bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all rounded-lg h-10">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                    <SelectValue placeholder="Date Range" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="14d">Last 14 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last Quarter</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={handleRestart}
                disabled={isRestarting}
                className="gap-2 bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-all rounded-lg h-10 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <motion.div
                  animate={isRestarting ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 0.8, repeat: isRestarting ? Infinity : 0, ease: 'linear' }}
                >
                  <RotateCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </motion.div>
                {isRestarting ? 'Restarting...' : 'Restart Env'}
              </Button>

              <Button
                variant="destructive"
                className="gap-2 cursor-pointer h-10 rounded-lg font-medium"
              >
                <StopCircle className="w-4 h-4" />
                Stop Env
              </Button>
            </div>
          </div>
        </motion.div>

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
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-none">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">{card.value}</h3>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                    </div>
                    <div className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      {card.sub}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="trend" className="space-y-4">
            <TabsList className="bg-slate-100/40 dark:bg-[#0f172a]/40 border-b border-slate-200 dark:border-slate-800 rounded-none p-0 overflow-x-auto flex flex-nowrap min-w-max h-auto py-3 px-4 justify-start gap-2">
              <TabsTrigger value="trend" className="px-5 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm border-none">
                Cost Trend
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="px-5 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm border-none">
                Service Breakdown
              </TabsTrigger>
              <TabsTrigger value="weekly" className="px-5 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm border-none">
                Weekly View
              </TabsTrigger>
              <TabsTrigger value="performance" className="px-5 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm border-none">
                Performance & Scaling
              </TabsTrigger>
            </TabsList>

            {/* Trend Tab */}
            <TabsContent value="trend">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="lg:col-span-2 bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Cost Trend</CardTitle>
                        <CardDescription className="text-xs">Daily cost for the last {days} days</CardDescription>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg
                        ${environment.costTrend > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {environment.costTrend > 0
                          ? <TrendingUp className="w-3.5 h-3.5" />
                          : <TrendingDown className="w-3.5 h-3.5" />
                        }
                        {Math.abs(environment.costTrend)}% trend
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[300px] pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="currentColor"
                          className="text-muted-foreground"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          interval={Math.floor(chartData.length / 6)}
                        />
                        <YAxis
                          stroke="currentColor"
                          className="text-muted-foreground"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={v => `₹${v}`}
                          width={55}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="cost"
                          stroke="#6366F1"
                          strokeWidth={2}
                          fill="url(#costGradient)"
                          dot={false}
                          activeDot={{ r: 5, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Donut Chart */}
                <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Cost Allocation</CardTitle>
                    <CardDescription className="text-xs">Frontend vs Backend</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center pt-0">
                    <div className="h-[180px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="bg-card border border-border rounded-lg p-2.5 shadow-xl text-xs">
                                  <div className="font-semibold text-foreground">{payload[0].name}</div>
                                  <div className="text-muted-foreground">{payload[0].value}% of total</div>
                                </div>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center label */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                          <div className="text-lg font-bold text-foreground">100%</div>
                          <div className="text-[10px] text-muted-foreground">Allocated</div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full space-y-3 mt-2">
                      {pieData.map(item => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${item.value}%`, backgroundColor: item.color }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">{item.value}%</span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-border/50">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Info className="w-3 h-3" />
                          Based on current month allocation
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Breakdown Tab */}
            <TabsContent value="breakdown">
              <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base">Frontend vs Backend Cost Split</CardTitle>
                  <CardDescription className="text-xs">Daily cost breakdown by service over last {days} days</CardDescription>
                </CardHeader>
                <CardContent className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="frontendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="backendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        interval={Math.floor(chartData.length / 6)}
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={v => `₹${v}`}
                        width={55}
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                        formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                      />
                      <Area type="monotone" dataKey="frontend" name="Frontend" stroke="#6366F1" strokeWidth={2} fill="url(#frontendGrad)" dot={false} />
                      <Area type="monotone" dataKey="backend" name="Backend" stroke="#10B981" strokeWidth={2} fill="url(#backendGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
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
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                      <XAxis
                        dataKey="week"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                        width={55}
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
                              <div className="text-muted-foreground mb-1">{label}</div>
                              <div className="font-semibold text-foreground">
                                ₹{payload[0].value?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="cost" name="Cost" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance & Scaling Tab */}
            <TabsContent value="performance" className="space-y-5">
              {/* Active Replicas Step Chart */}
              <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-foreground">Active Replicas Timeline</CardTitle>
                  <CardDescription className="text-xs">Container scaling events over the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                      <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" interval={3} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" width={30} />
                      <Tooltip content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
                              <div className="text-muted-foreground mb-1.5">{label}</div>
                              {payload.map((p: any, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span className="text-foreground font-semibold">{p.value}</span>
                                  <span className="text-muted-foreground">{p.name} instances</span>
                                </div>
                              ))}
                            </div>
                          );
                      }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                      <Line type="stepAfter" dataKey="frontReplicas" name="Frontend" stroke="#6366F1" strokeWidth={2} dot={false} />
                      <Line type="stepAfter" dataKey="backReplicas" name="Backend" stroke="#10B981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* CPU & Memory Split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-foreground">CPU Consumption (Cores)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px] pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="cpuGrad1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="cpuGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                        <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" interval={5} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" width={40} />
                        <Tooltip content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
                                <div className="text-muted-foreground mb-1.5">{label}</div>
                                {payload.map((p: any, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                    <span className="text-foreground font-semibold">{p.value}</span>
                                    <span className="text-muted-foreground">{p.name} Cores</span>
                                  </div>
                                ))}
                              </div>
                            );
                        }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                        <Area type="monotone" dataKey="frontendCpu" name="Frontend" stroke="#6366F1" strokeWidth={2} fill="url(#cpuGrad1)" />
                        <Area type="monotone" dataKey="backendCpu" name="Backend" stroke="#10B981" strokeWidth={2} fill="url(#cpuGrad2)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-foreground">Memory Usage (GiB)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px] pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                        <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" interval={5} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" width={40} />
                        <Tooltip content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
                                <div className="text-muted-foreground mb-1.5">{label}</div>
                                {payload.map((p: any, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                    <span className="text-foreground font-semibold">{p.value}</span>
                                    <span className="text-muted-foreground">{p.name} GiB</span>
                                  </div>
                                ))}
                              </div>
                            );
                        }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                        <Line type="monotone" dataKey="frontendMem" name="Frontend" stroke="#6366F1" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="backendMem" name="Backend" stroke="#10B981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-5"
        >
          <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-none rounded-2xl overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[rgba(99,102,241,0.1)]">
                  <Zap className="w-4 h-4 text-[#6366F1]" />
                </div>
                <div>
                  <CardTitle className="text-base">Optimization Recommendations</CardTitle>
                  <CardDescription className="text-xs">Actionable insights to reduce infrastructure spend</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recommendation 1 */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 hover:border-orange-500/25 transition-colors duration-200">
                  <div className="p-2 rounded-lg bg-orange-500/10 flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground">Idle Resources Detected</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">HIGH</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The backend container has been idle for 6+ hours during off-peak shifts. Auto-scaling to zero could save ~₹1,800/month.
                    </p>
                    <Button size="sm" variant="outline" className="mt-3 h-7 text-xs border-orange-500/20 text-orange-400 hover:bg-orange-500/10 cursor-pointer">
                      Review Rules
                    </Button>
                  </div>
                </div>

                {/* Recommendation 2 */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/25 transition-colors duration-200">
                  <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0 mt-0.5">
                    <TrendingDown className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground">Rightsizing Opportunity</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">MED</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Frontend memory usage is consistently below 40%. Reducing memory allocation could save ~₹2,400/month.
                    </p>
                    <Button size="sm" variant="outline" className="mt-3 h-7 text-xs border-blue-500/20 text-blue-400 hover:bg-blue-500/10 cursor-pointer">
                      Resize Now
                    </Button>
                  </div>
                </div>

                {/* Recommendation 3 */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/25 transition-colors duration-200">
                  <div className="p-2 rounded-lg bg-emerald-500/10 flex-shrink-0 mt-0.5">
                    <Target className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground">Reserved Capacity Savings</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">LOW</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Switching to 1-year reserved capacity for production workloads could yield up to 30% cost reduction.
                    </p>
                    <Button size="sm" variant="outline" className="mt-3 h-7 text-xs border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer">
                      Learn More
                    </Button>
                  </div>
                </div>

                {/* Recommendation 4 */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/25 transition-colors duration-200">
                  <div className="p-2 rounded-lg bg-purple-500/10 flex-shrink-0 mt-0.5">
                    <Cpu className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground">CPU Burst Pattern</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">LOW</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      CPU spikes detected between 10–11 AM daily. Consider pre-warming replicas to prevent cold start latency costs.
                    </p>
                    <Button size="sm" variant="outline" className="mt-3 h-7 text-xs border-purple-500/20 text-purple-400 hover:bg-purple-500/10 cursor-pointer">
                      View Patterns
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
