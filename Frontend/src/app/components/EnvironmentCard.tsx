import { useState, useEffect } from 'react';
import { RotateCw, TrendingUp, TrendingDown, Clock, DollarSign, ChevronRight, ExternalLink, StopCircle } from 'lucide-react';
import { ContainerStatus } from './ContainerStatus';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import type { Environment } from '../data/environments';
import { environmentService } from '../services/api';
import type { ContainerStatus as StatusType } from './StatusBadge';

interface EnvironmentCardProps {
  environment: Environment;
  onRestart?: (id: string) => void;
}

const TYPE_CONFIG = {
  PROD: { label: 'PROD', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  QA: { label: 'QA', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  DEV: { label: 'DEV', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  INTEGRATION: { label: 'INT', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

export function EnvironmentCard({ environment, onRestart }: EnvironmentCardProps) {
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartSuccess, setRestartSuccess] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [stopSuccess, setStopSuccess] = useState(false);
  
  const [frontendStatus, setFrontendStatus] = useState<StatusType>(environment.frontend.status);
  const [backendStatus, setBackendStatus] = useState<StatusType>(environment.backend.status);

  const navigate = useNavigate();
  const typeConfig = TYPE_CONFIG[environment.type];

  // Poll for live status
  useEffect(() => {
    const fetchStatus = async () => {
      // Don't poll if the window is hidden/minimized
      if (document.hidden) return;
      
      try {
        const statuses = await environmentService.getEnvironmentStatus(environment.id);
        const mapStatus = (s: string): StatusType => {
          if (s.toLowerCase().includes('running') || s.toLowerCase().includes('succeed')) return 'Running';
          if (s.toLowerCase().includes('stop')) return 'Stopped';
          if (s.toLowerCase().includes('fail') || s.toLowerCase().includes('error')) return 'Error';
          return 'Starting';
        };
        setFrontendStatus(mapStatus(statuses.frontend_status));
        setBackendStatus(mapStatus(statuses.backend_status));
      } catch (err) {
        setFrontendStatus('Error');
        setBackendStatus('Error');
      }
    };

    fetchStatus(); // initial fetch
    const interval = setInterval(fetchStatus, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [environment.id]);

  const handleRestart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRestarting(true);
    setRestartSuccess(false);
    
    // Set status to starting immediately
    setFrontendStatus('Starting');
    setBackendStatus('Starting');

    try {
      await environmentService.restartEnvironment(environment.id);
      setRestartSuccess(true);
    } catch (err) {
       console.error("Restart failed", err);
    } finally {
      setIsRestarting(false);
      onRestart?.(environment.id);
      setTimeout(() => setRestartSuccess(false), 3000);
    }
  };

  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStopping(true);
    setStopSuccess(false);

    try {
      await environmentService.stopEnvironment(environment.id);
      setStopSuccess(true);
      setFrontendStatus('Stopped');
      setBackendStatus('Stopped');
    } catch (err) {
      console.error("Stop failed", err);
    } finally {
      setIsStopping(false);
      setTimeout(() => setStopSuccess(false), 3000);
    }
  };

  const handleAnalyticsClick = () => {
    navigate(`/analytics/${environment.id}`);
  };

  const overallStatus = (() => {
    const s = [frontendStatus, backendStatus];
    if (s.includes('Error')) return 'error';
    if (s.includes('Starting')) return 'starting';
    return 'healthy';
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative group h-full"
    >
      {/* Glow effect on hover */}
      <div
        className={`absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
          ${overallStatus === 'error'
            ? 'bg-gradient-to-r from-red-500/10 via-red-500/10 to-red-500/10'
            : overallStatus === 'starting'
            ? 'bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10'
            : 'bg-gradient-to-r from-[#6366F1]/15 via-[#8B5CF6]/15 to-[#6366F1]/15'
          }`}
      />

      {/* Card */}
      <div className="relative bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm hover:border-[rgba(99,102,241,0.3)] transition-all duration-300 flex flex-col h-full">
        {/* Top status stripe */}
        <div className={`h-0.5 w-full ${
          overallStatus === 'error' ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' :
          overallStatus === 'starting' ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent' :
          'bg-gradient-to-r from-transparent via-[#6366F1] to-transparent'
        } opacity-60`} />

        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,255,255,0.02)] to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative p-5 border-b border-border/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 className="text-[15px] font-semibold text-foreground truncate">
                  {environment.name}
                </h3>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider border flex-shrink-0
                  ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
                  {typeConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded font-mono truncate">
                  {environment.resourceGroup}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Stop Button */}
              <motion.button
                onClick={handleStop}
                disabled={isStopping || isRestarting}
                whileHover={!(isStopping || isRestarting) ? { scale: 1.05 } : {}}
                whileTap={!(isStopping || isRestarting) ? { scale: 0.95 } : {}}
                className={`relative flex-shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-all duration-300 cursor-pointer
                  ${stopSuccess
                    ? 'bg-red-500/20 border border-red-500/30 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                    : isStopping
                    ? 'bg-red-500/30 border border-red-500/20 cursor-not-allowed text-red-500'
                    : 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_0_16px_rgba(239,68,68,0.4)]'
                  }`}
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:block">
                  {stopSuccess ? 'Done!' : isStopping ? 'Stopping...' : 'Stop'}
                </span>
              </motion.button>
              
              {/* Restart Button */}
              <motion.button
                onClick={handleRestart}
                disabled={isRestarting || isStopping}
                whileHover={!(isRestarting || isStopping) ? { scale: 1.05 } : {}}
                whileTap={!(isRestarting || isStopping) ? { scale: 0.95 } : {}}
                className={`relative flex-shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-all duration-300 cursor-pointer
                  ${restartSuccess
                    ? 'bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : isRestarting
                    ? 'bg-[#6366F1]/30 border border-[#6366F1]/20 cursor-not-allowed text-[#6366F1]'
                    : 'bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#6366F1] hover:bg-[#6366F1] hover:text-white hover:shadow-[0_0_16px_rgba(99,102,241,0.4)]'
                  }`}
              >
                <motion.div
                  animate={isRestarting ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 0.8, repeat: isRestarting ? Infinity : 0, ease: 'linear' }}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </motion.div>
                <span className="hidden sm:block">
                  {restartSuccess ? 'Done!' : isRestarting ? 'Restarting...' : 'Restart'}
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Container Status Section */}
        <div className="relative p-4 space-y-2.5">
          <ContainerStatus
            type="frontend"
            name={environment.frontend.name}
            status={frontendStatus}
          />
          <ContainerStatus
            type="backend"
            name={environment.backend.name}
            status={backendStatus}
          />
        </div>

        {/* Cost Analytics Tile — Clickable */}
        <motion.div
          onClick={handleAnalyticsClick}
          whileHover={{ backgroundColor: 'rgba(99,102,241,0.05)' }}
          className="relative mx-4 mb-4 p-4 rounded-xl bg-muted/30 border border-border/60 cursor-pointer group/cost hover:border-[rgba(99,102,241,0.3)] transition-all duration-200"
        >
          {/* Hover indicator */}
          <div className="absolute right-3 top-3 opacity-0 group-hover/cost:opacity-100 transition-opacity duration-200">
            <ExternalLink className="w-3.5 h-3.5 text-[#6366F1]" />
          </div>

          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <DollarSign className="w-3.5 h-3.5" />
              Cost Analytics
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded
              ${environment.costTrend > 0
                ? 'text-red-400 bg-red-500/10'
                : 'text-emerald-400 bg-emerald-500/10'
              }`}>
              {environment.costTrend > 0
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              {Math.abs(environment.costTrend)}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Today</div>
              <div className="text-[15px] font-bold text-foreground">
                ₹{environment.costToday.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Month-to-Date</div>
              <div className="text-[15px] font-bold text-foreground">
                ₹{environment.mtdCost.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              Restarted: {environment.lastRestart}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#6366F1] font-medium group-hover/cost:gap-2 transition-all duration-200">
              View Details
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
