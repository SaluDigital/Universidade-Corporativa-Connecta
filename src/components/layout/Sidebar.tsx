import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, GitBranch, Settings, BarChart3,
  Award, FileText, LogOut, ChevronLeft, ChevronRight, Layers,
  Target, Bell, GraduationCap, PlayCircle, Trophy, History,
  AlertTriangle, UserCheck, Shield, Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../ui/Avatar';
import type { UserRole } from '../../types';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Usuários', path: '/admin/users', icon: <Users size={18} /> },
  { label: 'Departamentos', path: '/admin/departments', icon: <Layers size={18} /> },
  { label: 'Cursos', path: '/admin/courses', icon: <BookOpen size={18} /> },
  { label: 'Trilhas', path: '/admin/tracks', icon: <GitBranch size={18} /> },
  { label: 'Regras', path: '/admin/rules', icon: <Target size={18} /> },
  { label: 'Relatórios', path: '/admin/reports', icon: <BarChart3 size={18} /> },
  { label: 'Certificados', path: '/admin/certificates', icon: <Award size={18} /> },
  { label: 'Logs', path: '/admin/logs', icon: <FileText size={18} /> },
];

const managerNav: NavItem[] = [
  { label: 'Minha Equipe', path: '/manager', icon: <LayoutDashboard size={18} /> },
  { label: 'Colaboradores', path: '/manager/team', icon: <Users size={18} /> },
  { label: 'Progresso', path: '/manager/progress', icon: <BarChart3 size={18} /> },
  { label: 'Certificados', path: '/manager/certificates', icon: <Award size={18} /> },
  { label: 'Alertas', path: '/manager/alerts', icon: <AlertTriangle size={18} />, badge: 3 },
];

const employeeNav: NavItem[] = [
  { label: 'Minha Trilha', path: '/employee', icon: <GitBranch size={18} /> },
  { label: 'Meus Cursos', path: '/employee/courses', icon: <BookOpen size={18} /> },
  { label: 'Aula Atual', path: '/employee/lesson', icon: <PlayCircle size={18} /> },
  { label: 'Certificados', path: '/employee/certificates', icon: <Trophy size={18} /> },
  { label: 'Histórico', path: '/employee/history', icon: <History size={18} /> },
];

const navByRole: Record<UserRole, NavItem[]> = {
  admin: adminNav,
  manager: managerNav,
  employee: employeeNav,
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  employee: 'Colaborador',
};

const roleColors: Record<UserRole, string> = {
  admin: 'text-[#9B6FD4]',
  manager: 'text-blue-400',
  employee: 'text-emerald-400',
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <Shield size={10} />,
  manager: <UserCheck size={10} />,
  employee: <GraduationCap size={10} />,
};

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const nav = navByRole[user.role];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col bg-[#0a0a1a] border-r border-white/5 h-screen flex-shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <motion.div
          animate={{ rotate: collapsed ? 0 : 0 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B35B0] to-[#4BC8C8] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#6B35B0]/30"
        >
          <GraduationCap size={20} className="text-white" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="font-bold text-white text-sm leading-tight">SaluDigital</p>
              <p className="text-[#4BC8C8] text-xs font-medium">Academy</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {nav.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/admin' && item.path !== '/manager' && item.path !== '/employee' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive: linkActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                (isActive || linkActive)
                  ? 'bg-[#6B35B0]/15 text-[#C4A8E8] border border-[#6B35B0]/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              )}
            >
              {({ isActive: linkActive }) => (
                <>
                  {/* Active indicator */}
                  {(isActive || linkActive) && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-[#6B35B0] to-[#4BC8C8] rounded-r-full"
                    />
                  )}

                  <span className={cn('flex-shrink-0', (isActive || linkActive) ? 'text-[#9B6FD4]' : 'text-slate-500 group-hover:text-slate-400')}>
                    {item.icon}
                  </span>

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium flex-1 whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {item.badge && !collapsed && (
                    <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded-full font-semibold">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/5 p-3">
        <div className={cn('flex items-center gap-3 px-2 py-2.5 rounded-xl', !collapsed && 'glass')}>
          <Avatar name={user.name} size="sm" ring />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-white truncate">{user.name.split(' ')[0]}</p>
                <div className={cn('flex items-center gap-1 text-xs font-semibold', roleColors[user.role])}>
                  {roleIcons[user.role]}
                  {roleLabels[user.role]}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 glass border border-white/10 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-all z-10 shadow-lg"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
