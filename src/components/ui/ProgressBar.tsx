import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  color?: 'default' | 'emerald' | 'amber' | 'red' | 'blue';
  animated?: boolean;
  className?: string;
}

const colorMap = {
  default: 'from-[#6B35B0] to-[#4BC8C8]',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  red: 'from-red-500 to-rose-500',
  blue: 'from-blue-500 to-cyan-500',
};

const sizeMap = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
};

export function ProgressBar({ value, max = 100, size = 'sm', showLabel, color = 'default', className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const autoColor = color === 'default'
    ? pct >= 75 ? 'default' : pct >= 40 ? 'amber' : 'red'
    : color;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('flex-1 bg-white/5 rounded-full overflow-hidden', sizeMap[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          className={cn('h-full rounded-full bg-gradient-to-r', colorMap[autoColor], 'relative')}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </motion.div>
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-400 w-8 text-right">{Math.round(pct)}%</span>
      )}
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function CircularProgress({ value, size = 80, strokeWidth = 6, color = '#6B35B0', label }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold text-white">{value}%</span>
        {label && <span className="text-xs text-slate-500">{label}</span>}
      </div>
    </div>
  );
}
