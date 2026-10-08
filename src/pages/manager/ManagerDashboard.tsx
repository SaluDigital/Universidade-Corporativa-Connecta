import { motion } from 'framer-motion';
import { Users, TrendingUp, AlertTriangle, Award, ArrowRight, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StatCard } from '../../components/ui/Card';
import { ProgressBar, CircularProgress } from '../../components/ui/ProgressBar';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { mockUsers, mockUserTracks, mockCourses } from '../../data/mock';
import { useNavigate } from 'react-router-dom';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const COLORS = ['#10b981', '#4BC8C8', '#f59e0b', '#ef4444'];

export function ManagerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const team = mockUsers.filter(u => u.manager_id === user?.id);
  const teamIds = team.map(u => u.id);
  const teamTracks = mockUserTracks.filter(t => teamIds.includes(t.user_id));

  const overdueTracks = teamTracks.filter(t => t.status === 'overdue');
  const completedTracks = teamTracks.filter(t => t.status === 'completed');
  const avgProgress = teamTracks.length > 0
    ? Math.round(teamTracks.reduce((acc, t) => acc + t.progress_percent, 0) / teamTracks.length)
    : 0;

  const statusData = [
    { name: 'Concluído', value: completedTracks.length },
    { name: 'Em andamento', value: teamTracks.filter(t => t.status === 'in_progress').length },
    { name: 'Pendente', value: teamTracks.filter(t => t.status === 'not_started').length },
    { name: 'Vencido', value: overdueTracks.length },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-screen-xl space-y-6">
      {/* Welcome */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-[#6B35B0]/20 via-[#4BC8C8]/10 to-teal-600/10 border border-[#6B35B0]/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B35B0]/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <p className="text-[#9B6FD4] text-sm font-medium mb-1">Painel do Gestor</p>
          <h2 className="text-2xl font-bold text-white mb-1">Olá, {user?.name.split(' ')[0]}!</h2>
          <p className="text-slate-400 text-sm">
            Você tem <span className="text-white font-semibold">{team.length} colaboradores</span> na sua equipe.
            {overdueTracks.length > 0 && (
              <span className="text-red-400"> {overdueTracks.length} trilha(s) vencidas requerem atenção.</span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Equipe" value={team.length} subtitle="colaboradores" icon={<Users />} color="blue" />
        <StatCard title="Média de progresso" value={`${avgProgress}%`} subtitle="nas trilhas" icon={<TrendingUp />} color="cyan" />
        <StatCard title="Trilhas vencidas" value={overdueTracks.length} subtitle="precisam de atenção" icon={<AlertTriangle />} color="red" />
        <StatCard title="Certificados" value={completedTracks.length} subtitle="emitidos" icon={<Award />} color="emerald" />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Team progress */}
        <motion.div variants={item} className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Progresso da Equipe</h3>
              <p className="text-slate-500 text-sm">Trilhas por colaborador</p>
            </div>
            <button
              onClick={() => navigate('/manager/team')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-4">
            {team.map(member => {
              const memberTracks = teamTracks.filter(t => t.user_id === member.id);
              const progress = memberTracks.length > 0
                ? Math.round(memberTracks.reduce((a, t) => a + t.progress_percent, 0) / memberTracks.length)
                : 0;
              const hasOverdue = memberTracks.some(t => t.status === 'overdue');
              const status = hasOverdue ? 'overdue' : memberTracks.every(t => t.status === 'completed') ? 'completed' : 'in_progress';

              return (
                <motion.div
                  key={member.id}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 cursor-pointer p-2 rounded-xl hover:bg-white/3 transition-all"
                  onClick={() => navigate('/manager/progress')}
                >
                  <Avatar name={member.name} src={member.avatar_url} size="sm" ring={hasOverdue} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-medium text-white">{member.name}</p>
                      {hasOverdue && <span className="text-xs text-red-400">⚠ Atrasado</span>}
                    </div>
                    <ProgressBar value={progress} size="sm" showLabel />
                  </div>
                  <StatusBadge status={status} />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Status chart */}
        <motion.div variants={item} className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-1">Status das Trilhas</h3>
          <p className="text-slate-500 text-sm mb-4">Distribuição da equipe</p>
          <div className="flex justify-center mb-6">
            <CircularProgress value={avgProgress} size={120} label="progresso" />
          </div>
          <div className="space-y-2">
            {statusData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                <span className="text-sm text-slate-400 flex-1">{s.name}</span>
                <span className="text-sm font-semibold text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Overdue alerts */}
      {overdueTracks.length > 0 && (
        <motion.div variants={item} className="glass-card rounded-2xl p-5 border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="font-semibold text-white">Alertas de Atraso</h3>
            <span className="ml-auto text-xs text-red-400 bg-red-500/15 border border-red-500/25 px-2.5 py-1 rounded-full">{overdueTracks.length} pendentes</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {overdueTracks.map(track => {
              const member = mockUsers.find(u => u.id === track.user_id);
              return (
                <div key={track.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/8 border border-red-500/15">
                  <Avatar name={member?.name ?? 'U'} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{member?.name}</p>
                    <p className="text-xs text-red-400">{track.progress_percent}% concluído · Vencida</p>
                  </div>
                  <button className="text-xs text-white bg-[#6B35B0]/20 border border-[#6B35B0]/30 hover:bg-[#6B35B0]/35 px-2 py-1 rounded-lg transition-all">
                    Cobrar
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
