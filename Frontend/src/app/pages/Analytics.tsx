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

  // Filter history based on date range
  const daysMap: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 };
  const days = daysMap[dateRange] ?? 30;
  const chartData = environment.history.slice(-days).map(h => ({
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

  const avgDailyCost = chartData.length > 0
    ? chartData.reduce((s, d) => s + d.cost, 0) / chartData.length
    : 0;
  const projectedEOM = avgDailyCost * 30;

  const handleRestart = async () => {
    setIsRestarting(true);
    await new Promise(r => setTimeout(r, 3000));
    setIsRestarting(false);
  };

  const overviewCards = [
    {
      title: 'Total Cost (MTD)',
      value: `₹${environment.mtdCost.toLocaleString('en-IN')}`,
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
      value: `₹${environment.costToday.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      sub: <span className="text-muted-foreground">Updated 15 mins ago</span>,
      icon: Zap,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      border: 'border-border/50',
    },
    {
      title: 'Projected EOM',
      value: `₹${projectedEOM.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      sub: <span className="text-muted-foreground">Based on {days}d average</span>,
      icon: Target,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      border: 'border-border/50',
    },
    {
      title: 'Avg. Daily Cost',
      value: `₹${avgDailyCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
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
                <h1 className="text-2xl font-bold text-foreground">{environment.name}</h1>
                <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wider border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
                  {typeConfig.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                Resource Group: <span className="text-foreground">{environment.resourceGroup}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[160px] bg-card border-border text-foreground">
                  <Calendar className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
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
                className="gap-2 border-[#6366F1]/30 text-[#6366F1] hover:bg-[#6366F1]/10 cursor-pointer"
              >
                <motion.div
                  animate={isRestarting ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 0.8, repeat: isRestarting ? Infinity : 0, ease: 'linear' }}
                >
                  <RotateCw className="w-4 h-4" />
                </motion.div>
                {isRestarting ? 'Restarting...' : 'Restart Env'}
              </Button>

              <Button
                variant="destructive"
                className="gap-2 cursor-pointer"
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
                <Card className={`bg-card/60 backdrop-blur-sm ${card.border} hover:border-[rgba(99,102,241,0.25)] transition-all duration-200`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${card.iconBg}`}>
                        <Icon className={`w-4 h-4 ${card.iconColor}`} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">{card.value}</div>
                    <div className="text-[11px] text-muted-foreground mb-1.5">{card.title}</div>
                    <div className="text-xs">{card.sub}</div>
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
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="trend" className="data-[state=active]:bg-[rgba(99,102,241,0.15)] data-[state=active]:text-[#6366F1]">
                Cost Trend
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="data-[state=active]:bg-[rgba(99,102,241,0.15)] data-[state=active]:text-[#6366F1]">
                Service Breakdown
              </TabsTrigger>
              <TabsTrigger value="weekly" className="data-[state=active]:bg-[rgba(99,102,241,0.15)] data-[state=active]:text-[#6366F1]">
                Weekly View
              </TabsTrigger>
            </TabsList>

            {/* Trend Tab */}
            <TabsContent value="trend">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="lg:col-span-2 bg-card/60 backdrop-blur-sm border-border/50">
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
                <Card className="bg-card/60 backdrop-blur-sm border-border/50">
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
              <Card className="bg-card/60 backdrop-blur-sm border-border/50">
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
              <Card className="bg-card/60 backdrop-blur-sm border-border/50">
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
          </Tabs>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-5"
        >
          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
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
