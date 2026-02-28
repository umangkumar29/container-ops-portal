import { motion } from 'motion/react';

export type ContainerStatus = 'Running' | 'Starting' | 'Error' | 'Stopped';

interface StatusBadgeProps {
  status: ContainerStatus;
}

const STATUS_CONFIG: Record<ContainerStatus, {
  bg: string;
  border: string;
  text: string;
  dot: string;
  glow: string;
  pulse: boolean;
}> = {
  Running: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-500',
    dot: 'bg-emerald-500',
    glow: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
    pulse: true,
  },
  Starting: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    dot: 'bg-amber-500',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.3)]',
    pulse: false,
  },
  Error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-500',
    dot: 'bg-red-500',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.3)]',
    pulse: false,
  },
  Stopped: {
    bg: 'bg-muted/50',
    border: 'border-muted-foreground/20',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
    glow: '',
    pulse: false,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        border ${config.bg} ${config.border} ${config.text} ${config.glow}
        transition-all duration-300 flex-shrink-0
      `}
    >
      <motion.div
        className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
        animate={
          status === 'Running'
            ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
            : status === 'Starting'
            ? { opacity: [1, 0.4, 1] }
            : status === 'Error'
            ? { scale: [1, 1.2, 1] }
            : {}
        }
        transition={{
          duration: status === 'Running' ? 2 : status === 'Starting' ? 0.8 : 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {status}
    </motion.div>
  );
}
