import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  gradient?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover, glow, onClick, gradient, padding = 'md' }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -2 } : undefined}
      className={cn(
        'glass-card rounded-2xl',
        paddings[padding],
        hover && 'cursor-pointer transition-all duration-300 hover:border-[#6B35B0]/25 hover:shadow-2xl hover:shadow-[#6B35B0]/10',
        glow && 'glow-sm',
        gradient && 'border-0 bg-gradient-to-br from-[#6B35B0]/10 to-[#4BC8C8]/10',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color: 'purple' | 'blue' | 'cyan' | 'emerald' | 'amber' | 'red' | 'pink';
  trend?: { value: number; label: string };
}

const colorMap = {
  purple: { bg: 'bg-violet-500/15', text: 'text-violet-400', glow: 'shadow-violet-500/20', badge: 'text-violet-300 bg-violet-500/10' },
  blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', glow: 'shadow-blue-500/20', badge: 'text-blue-300 bg-blue-500/10' },
  cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', glow: 'shadow-cyan-500/20', badge: 'text-cyan-300 bg-cyan-500/10' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', glow: 'shadow-emerald-500/20', badge: 'text-emerald-300 bg-emerald-500/10' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', glow: 'shadow-amber-500/20', badge: 'text-amber-300 bg-amber-500/10' },
  red: { bg: 'bg-red-500/15', text: 'text-red-400', glow: 'shadow-red-500/20', badge: 'text-red-300 bg-red-500/10' },
  pink: { bg: 'bg-pink-500/15', text: 'text-pink-400', glow: 'shadow-pink-500/20', badge: 'text-pink-300 bg-pink-500/10' },
};

export function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn('glass-card rounded-2xl p-6 relative overflow-hidden cursor-default group transition-all duration-300 hover:shadow-xl', `hover:${c.glow}`)}
    >
      {/* Background glow */}
      <div className={cn('absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity', c.bg)} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', c.bg)}>
            <span className={cn('text-xl', c.text)}>{icon}</span>
          </div>
          {trend && (
            <span className={cn('text-xs font-semibold px-2 py-1 rounded-lg', c.badge)}>
              {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
            </span>
          )}
        </div>

        <p className="text-slate-400 text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
