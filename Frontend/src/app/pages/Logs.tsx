import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Search, Download, RefreshCw,
  AlertTriangle, XCircle, Info, BarChart2, Copy, ChevronRight, ChevronDown,
} from 'lucide-react';
import { environmentService, type LogEntry, type LogLevel } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type Severity = 'all' | 'warn' | 'error';
type TimeRange = '1' | '6' | '24' | '168';

// ─── Log level helpers ────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<LogLevel, { bar: string; badge: string; text: string; row: string }> = {
  INFO:  { bar: 'bg-blue-500',  badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',  text: 'text-slate-300', row: '' },
  WARN:  { bar: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', text: 'text-slate-300', row: 'bg-amber-500/5' },
  ERROR: { bar: 'bg-red-500',   badge: 'bg-red-500/10 text-red-400 border-red-500/20',     text: 'text-red-300',   row: 'bg-red-500/5' },
};

// ─── Subcomponents ───────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, glowClass, pulseRed = false,
}: { label: string; value: number; icon: React.ReactNode; glowClass: string; pulseRed?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-5 flex flex-col gap-3 border border-white/10 bg-white/[0.03] backdrop-blur-md ${glowClass} group`}>
      <div className="absolute inset-0 bg-gradient-to-br from-current/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-center justify-between z-10">
        <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
          {label}
          {pulseRed && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />}
        </p>
        {icon}
      </div>
      <p className="text-white text-3xl font-bold tracking-tight z-10">{value.toLocaleString()}</p>
    </div>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const s = LEVEL_STYLES[entry.level];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`[${entry.timestamp}] [${entry.level}] [${entry.container}] ${entry.message}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="font-mono text-sm">
      <div
        onClick={() => setExpanded(p => !p)}
        className={`
          flex items-stretch rounded-lg border border-white/5 overflow-hidden cursor-pointer
          transition-all duration-150 group
          hover:border-indigo-500/30 hover:shadow-[0_4px_20px_-5px_rgba(99,102,241,0.15)]
          hover:bg-white/[0.06] ${s.row}
        `}
      >
        {/* colored left bar */}
        <div className={`w-1 shrink-0 ${s.bar}`} />

        <div className="flex-1 px-4 py-3 flex items-center gap-4 min-w-0">
          {/* timestamp */}
          <span className="text-slate-500 shrink-0 w-[190px] text-xs">{entry.timestamp}</span>

          {/* level badge */}
          <span className={`px-2 py-0.5 rounded text-xs font-bold border w-[50px] text-center shrink-0 ${s.badge}`}>
            {entry.level}
          </span>

          {/* container chip */}
          <span className="px-2 py-1 rounded-md bg-white/5 text-slate-300 text-xs border border-white/10 shrink-0 max-w-[140px] truncate">
            {entry.container}
          </span>

          {/* message */}
          <span className={`truncate flex-1 ${s.text}`}>{entry.message}</span>

          {/* actions (shown on hover) */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Copy log line"
            >
              {copied ? (
                <span className="text-xs text-green-400 font-semibold">✓</span>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* expand toggle */}
          <button className="p-1.5 text-slate-500 hover:text-white rounded ml-1 shrink-0 transition-colors">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <pre className={`
              text-xs whitespace-pre-wrap break-all px-6 py-3
              bg-black/40 border border-t-0 border-white/5 rounded-b-lg
              ${s.text}
            `}>
              {entry.message}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Logs() {
  const { subscriptionId, resourceGroup, appName } = useParams<{
    subscriptionId: string;
    resourceGroup: string;
    appName: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [timeRange, setTimeRange] = useState<TimeRange>('1');
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'warn' | 'error'>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounce search input
  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(v), 500);
  };

  const effectiveSeverity: Severity = activeTab !== 'all' ? activeTab : 'all';
  const queryKey = ['logs', subscriptionId, resourceGroup, appName, timeRange, effectiveSeverity, debouncedSearch];

  const { data, isFetching, error } = useQuery({
    queryKey,
    queryFn: () => environmentService.fetchAppLogs(
      subscriptionId!, resourceGroup!, appName!,
      { hours: Number(timeRange), severity: effectiveSeverity, search: debouncedSearch || undefined, limit: 100 },
    ),
    enabled: Boolean(subscriptionId && resourceGroup && appName),
    staleTime: 30_000,   // 30s — logs change quickly
    gcTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    await queryClient.invalidateQueries({ queryKey, refetchType: 'all' });
    setIsSyncing(false);
  }, [queryClient, queryKey]);

  const handleExport = () => {
    if (!data?.entries.length) return;
    const csv = [
      'Timestamp,Level,Container,Message',
      ...data.entries.map(e =>
        `"${e.timestamp}","${e.level}","${e.container}","${e.message.replace(/"/g, '""')}"`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName}-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const total      = data?.total      ?? 0;
  const infoCount  = data?.info_count  ?? 0;
  const warnCount  = data?.warn_count  ?? 0;
  const errorCount = data?.error_count ?? 0;
  const entries    = data?.entries     ?? [];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans relative overflow-x-hidden">

      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── Header ── */}
        <header className="sticky top-0 z-50 bg-white/[0.03] backdrop-blur-md border-b border-white/10">
          <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">

            {/* Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="text-slate-400 hover:text-white p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Log Viewer</span>
                <span className="text-slate-600">/</span>
                <span className="text-white font-semibold">{appName}</span>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-5">
              {/* Live badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Live</span>
              </div>

              {/* Time range */}
              <div className="flex p-1 rounded-lg bg-black/40 border border-white/10">
                {(['1', '6', '24', '168'] as TimeRange[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      timeRange === t ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === '168' ? '7D' : `${t}H`}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-l border-white/10 pl-5">
                <button
                  onClick={handleSync}
                  disabled={isFetching || isSyncing}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 ${isFetching || isSyncing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleExport}
                  disabled={!entries.length}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8 flex flex-col gap-6">

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Events" value={total}      icon={<BarChart2 className="w-5 h-5 text-blue-400" />}   glowClass="shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]" />
            <StatCard label="Info"         value={infoCount}  icon={<Info className="w-5 h-5 text-slate-400" />}        glowClass="shadow-[0_0_20px_-5px_rgba(148,163,184,0.3)]" />
            <StatCard label="Warnings"     value={warnCount}  icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} glowClass="shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]" />
            <StatCard label="Errors"       value={errorCount} icon={<XCircle className="w-5 h-5 text-red-500" />}       glowClass="shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]" pulseRed={errorCount > 0} />
          </div>

          {/* ── Tabs + search ── */}
          <div className="flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-0 border-b border-white/10">
              {([
                { key: 'all',   label: 'All Logs', count: total,       color: 'bg-indigo-500/20 text-indigo-400' },
                { key: 'warn',  label: '⚠ Warnings', count: warnCount,  color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
                { key: 'error', label: '✕ Errors',   count: errorCount, color: 'bg-red-500/10 text-red-400 border border-red-500/20' },
              ] as { key: typeof activeTab; label: string; count: number; color: string }[]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3 border-b-2 -mb-px text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-indigo-500 text-white font-semibold'
                      : 'border-transparent text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${tab.color}`}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search logs..."
                className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-lg py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>

          {/* ── Log list ── */}
          <div className="flex flex-col gap-2">
            {/* Loading skeleton */}
            {isFetching && !entries.length && (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-white/[0.03] border border-white/5 animate-pulse" />
              ))
            )}

            {/* Error state */}
            {error && !isFetching && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-red-400 font-semibold mb-1">Failed to load logs</p>
                <p className="text-slate-500 text-sm">{(error as Error).message}</p>
                {(error as Error).message.includes('not found') && (
                  <p className="text-slate-400 text-xs mt-3">
                    Make sure a <strong>Log Analytics Workspace</strong> is linked to your Container App Environment.<br />
                    Portal → Container Apps Environment → Monitoring → Log Analytics
                  </p>
                )}
              </div>
            )}

            {/* No results */}
            {!isFetching && !error && entries.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-12 text-center">
                <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No logs found</p>
                <p className="text-slate-600 text-sm mt-1">
                  {debouncedSearch ? 'Try a different search term or time range.' : 'No logs in the selected time range.'}
                </p>
              </div>
            )}

            {/* Log rows */}
            {entries.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015, duration: 0.15 }}
              >
                <LogRow entry={entry} />
              </motion.div>
            ))}

            {/* Load more */}
            {data?.has_more && (
              <div className="flex justify-center mt-4 pb-6">
                <button
                  onClick={handleSync}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white/[0.03] hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium text-slate-300 hover:text-white transition-all"
                >
                  Load more logs <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Entry count footer */}
          {entries.length > 0 && (
            <p className="text-center text-slate-600 text-xs pb-4">
              Showing {entries.length} of {total.toLocaleString()} entries
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
