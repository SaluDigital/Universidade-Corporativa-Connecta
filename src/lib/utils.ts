import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

export function isOverdue(date: string | Date): boolean {
  return isPast(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export function generateCertCode(userId: string, courseId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `SD-${timestamp}-${userId.slice(0, 2).toUpperCase()}${courseId.slice(0, 2).toUpperCase()}`;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    not_started: 'Não iniciado',
    in_progress: 'Em andamento',
    completed: 'Concluído',
    overdue: 'Vencido',
    failed: 'Reprovado',
    active: 'Ativo',
    inactive: 'Inativo',
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    not_started: 'badge-slate',
    in_progress: 'badge-blue',
    completed: 'badge-emerald',
    overdue: 'badge-red',
    failed: 'badge-red',
    active: 'badge-emerald',
    inactive: 'badge-red',
  };
  return colors[status] ?? 'badge-slate';
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: 'badge-purple',
    manager: 'badge-blue',
    employee: 'badge-slate',
  };
  return colors[role] ?? 'badge-slate';
}
