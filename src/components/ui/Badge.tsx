import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'purple' | 'blue' | 'emerald' | 'amber' | 'red' | 'slate' | 'cyan' | 'pink';
  className?: string;
  dot?: boolean;
}

const variants = {
  purple: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  blue: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  red: 'bg-red-500/15 text-red-300 border-red-500/25',
  slate: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  pink: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
};

const dotColors = {
  purple: 'bg-violet-400',
  blue: 'bg-blue-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
  slate: 'bg-slate-400',
  cyan: 'bg-cyan-400',
  pink: 'bg-pink-400',
};

export function Badge({ children, variant = 'slate', className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide',
      variants[variant], className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    not_started: { label: 'Não iniciado', variant: 'slate' },
    in_progress: { label: 'Em andamento', variant: 'blue' },
    completed: { label: 'Concluído', variant: 'emerald' },
    overdue: { label: 'Vencido', variant: 'red' },
    failed: { label: 'Reprovado', variant: 'red' },
    active: { label: 'Ativo', variant: 'emerald' },
    inactive: { label: 'Inativo', variant: 'red' },
    admin: { label: 'Administrador', variant: 'purple' },
    manager: { label: 'Gestor', variant: 'blue' },
    employee: { label: 'Colaborador', variant: 'slate' },
  };
  const cfg = config[status] ?? { label: status, variant: 'slate' as const };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}
