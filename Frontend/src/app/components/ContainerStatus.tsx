import { Globe, Server } from 'lucide-react';
import { StatusBadge, type ContainerStatus as Status } from './StatusBadge';
import { motion } from 'motion/react';

interface ContainerStatusProps {
  type: 'frontend' | 'backend';
  name: string;
  status: Status;
}

export function ContainerStatus({ type, name, status }: ContainerStatusProps) {
  const Icon = type === 'frontend' ? Globe : Server;
  const label = type === 'frontend' ? 'Frontend' : 'Backend';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted/50 transition-all duration-200"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
          type === 'frontend'
            ? 'bg-[rgba(99,102,241,0.1)] dark:bg-[rgba(99,102,241,0.1)]'
            : 'bg-[rgba(16,185,129,0.1)] dark:bg-[rgba(16,185,129,0.1)]'
        }`}>
          <Icon className={`w-3.5 h-3.5 ${
            type === 'frontend' ? 'text-[#6366F1]' : 'text-[#10B981]'
          }`} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</div>
          <div className="text-xs text-foreground font-medium truncate max-w-[160px]">{name}</div>
        </div>
      </div>
      <StatusBadge status={status} />
    </motion.div>
  );
}
