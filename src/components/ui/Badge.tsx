import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'purple' | 'blue' | 'emerald' | 'amber' | 'red' | 'slate' | 'cyan' | 'pink';
  className?: string;
  dot?: boolean;
}

const variants = {
  purple: 'bg-[#FF9C3A]/15 text-[#FF9C3A] border-[#FF9C3A]/25',
  blue: 'bg-white/10 text-white border-white/20',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  red: 'bg-red-500/15 text-red-300 border-red-500/25',
  slate: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  cyan: 'bg-[#FF9C3A]/12 text-[#FF9C3A] border-[#FF9C3A]/25',
  pink: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
};

const dotColors = {
  purple: 'bg-[#FF9C3A]',
  blue: 'bg-white',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
  slate: 'bg-slate-400',
  cyan: 'bg-[#FF9C3A]',
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
