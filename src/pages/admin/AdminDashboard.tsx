import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, GitBranch, Award, TrendingUp, AlertTriangle,
  Clock, CheckCircle2, BarChart2, Zap, Activity, ArrowUpRight, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { StatCard } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar } from '../../components/ui/Avatar';
import {
  getUsers, getCourses, getTracks, getCertificates,
  getCompletionByDepartment, getOverdueTracks,
  getMonthlyCompletions, getMonthlyCertificates,
  getTopCourses, getRecentActivity,
} from '../../lib/api';
import { formatDate } from '../../lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const COLORS = ['#6B35B0', '#4BC8C8', '#10b981', '#f59e0b', '#9B6FD4', '#ec4899'];

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function buildMonthlyData(completions: { completed_at: string }[], certs: { issued_at: string }[]) {
  const now = new Date();
  const months: { month: string; completions: number; certificates: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: MONTH_NAMES[d.getMonth()], completions: 0, certificates: 0 });
  }
  completions.forEach(c => {
    const d = new Date(c.completed_at);
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (diff >= 0 && diff < 6) months[5 - diff].completions++;
  });
  certs.forEach(c => {
    const d = new Date(c.issued_at);
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (diff >= 0 && diff < 6) months[5 - diff].certificates++;
  });
  return months;
}

function buildTopCourses(rows: { course_id: string; courses: { title: string } | null }[]) {
  const map: Record<string, { name: string; completions: number }> = {};
  rows.forEach(r => {
    if (!r.course_id) return;
    if (!map[r.course_id]) map[r.course_id] = { name: (r.courses as any)?.title ?? 'Sem título', completions: 0 };
    map[r.course_id].completions++;
  });
  const sorted = Object.values(map).sort((a, b) => b.completions - a.completions).slice(0, 5);
  const max = sorted[0]?.completions || 1;
  return sorted.map(c => ({ ...c, rate: Math.round((c.completions / max) * 100) }));
}

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  ISSUE_CERTIFICATE: { label: 'obteve certificado', icon: '🏆', color: 'amber' },
  COMPLETE_LESSON:   { label: 'concluiu uma aula', icon: '✓', color: 'emerald' },
  LOGIN:             { label: 'fez login', icon: '→', color: 'blue' },
  CREATE_USER:       { label: 'foi cadastrado', icon: '+', color: 'purple' },
};

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, activeUsers: 0, courses: 0, workloadHours: 0, tracks: 0, mandatoryTracks: 0, certificates: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [topCoursesData, setTopCoursesData] = useState<any[]>([]);
  const [overdueData, setOverdueData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingTracks, setUpcomingTracks] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [
        { data: users },
        { data: courses },
        { data: tracks },
        { data: certs },
        { data: depts },
        { data: overdue },
        { data: completions },
        { data: certDates },
        { data: topRaw },
        { data: activity },
      ] = await Promise.all([
        getUsers(),
        getCourses(),
        getTracks(),
        getCertificates(),
        getCompletionByDepartment(),
        getOverdueTracks(),
        getMonthlyCompletions(),
        getMonthlyCertificates(),
        getTopCourses(),
        getRecentActivity(),
      ]);

      const activeUsers = (users ?? []).filter((u: any) => u.status === 'active').length;
      const totalWorkload = (courses ?? []).reduce((s: number, c: any) => s + (c.workload_hours ?? 0), 0);
      const mandatoryTracks = (tracks ?? []).filter((t: any) => t.is_mandatory).length;

      setStats({
        users: (users ?? []).length,
        activeUsers,
        courses: (courses ?? []).filter((c: any) => c.is_active).length,
        workloadHours: Math.round(totalWorkload),
        tracks: (tracks ?? []).length,
        mandatoryTracks,
        certificates: (certs ?? []).length,
      });

      setMonthlyData(buildMonthlyData(completions ?? [], certDates ?? []));

      setDeptData((depts ?? []).map((d: any) => ({
        name: d.department_name,
        rate: Number(d.completion_rate),
        completed: d.completed_users,
        total: d.total_users,
      })));

      setTopCoursesData(buildTopCourses((topRaw ?? []) as any));
      setOverdueData(overdue ?? []);
      setRecentActivity(activity ?? []);

      // próximos vencimentos: user_tracks in_progress com deadline
      // já vem no overdue, mas para upcoming usamos os in_progress com deadline próximo
      setUpcomingTracks([]);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-screen-xl">
      {/* Welcome banner */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-[#6B35B0]/20 via-[#4BC8C8]/10 to-[#4BC8C8]/5 border border-[#6B35B0]/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B35B0]/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-[#9B6FD4]" />
              <span className="text-[#9B6FD4] text-sm font-medium">Painel Administrativo</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Visão Geral do Sistema</h2>
            <p className="text-slate-400 text-sm">Acompanhe o desempenho da sua universidade corporativa em tempo real.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6B35B0]/15 border border-[#6B35B0]/25 text-white text-sm font-medium">
            <Activity size={14} />
            Sistema operacional
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Colaboradores"
          value={String(stats.users)}
          subtitle={`${stats.activeUsers} ativos`}
          icon={<Users />} color="purple"
        />
        <StatCard
          title="Cursos ativos"
          value={String(stats.courses)}
          subtitle={`${stats.workloadHours}h de conteúdo`}
          icon={<BookOpen />} color="blue"
        />
        <StatCard
          title="Trilhas"
          value={String(stats.tracks)}
          subtitle={`${stats.mandatoryTracks} obrigatórias`}
          icon={<GitBranch />} color="cyan"
        />
        <StatCard
          title="Certificados"
          value={String(stats.certificates)}
          subtitle="total emitidos"
          icon={<Award />} color="emerald"
        />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly chart */}
        <motion.div variants={item} className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white">Progresso Mensal</h3>
              <p className="text-slate-500 text-sm">Conclusões e certificados emitidos</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full inline-block" style={{ background: '#6B35B0' }} />Conclusões</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full inline-block" style={{ background: '#4BC8C8' }} />Certificados</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B35B0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6B35B0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCert" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4BC8C8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4BC8C8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#12122b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px' }}
                cursor={{ stroke: 'rgba(107,53,176,0.2)', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="completions" stroke="#6B35B0" fill="url(#gComp)" strokeWidth={2} dot={false} name="Conclusões" />
              <Area type="monotone" dataKey="certificates" stroke="#4BC8C8" fill="url(#gCert)" strokeWidth={2} dot={false} name="Certificados" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div variants={item} className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-1">Conclusão por Área</h3>
          <p className="text-slate-500 text-sm mb-4">Taxa geral de conclusão</p>
          {deptData.length > 0 ? (
            <>
              <div className="flex justify-center mb-4">
                <PieChart width={160} height={160}>
                  <Pie
                    data={deptData}
                    cx={80} cy={80} innerRadius={50} outerRadius={75}
                    dataKey="rate" nameKey="name" strokeWidth={0}
                  >
                    {deptData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} opacity={0.85} />
                    ))}
                  </Pie>
                </PieChart>
              </div>
              <div className="space-y-2">
                {deptData.slice(0, 4).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                    <span className="text-xs text-slate-400 flex-1 truncate">{d.name}</span>
                    <span className="text-xs font-semibold text-white">{d.rate}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600 text-sm">
              Sem dados ainda
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Department completion */}
        <motion.div variants={item} className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white">Taxa de Conclusão por Área</h3>
              <p className="text-slate-500 text-sm">Desempenho atual dos departamentos</p>
            </div>
          </div>
          {deptData.length > 0 ? (
            <div className="space-y-4">
              {deptData.map((dept, i) => (
                <motion.div
                  key={dept.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <span className="text-sm text-slate-400 w-28 flex-shrink-0">{dept.name}</span>
                  <ProgressBar value={dept.rate} size="md" className="flex-1" />
                  <div className="flex items-center gap-2 w-28 justify-end">
                    <span className="text-sm font-semibold text-white">{dept.rate}%</span>
                    <span className="text-xs text-slate-600">{dept.completed}/{dept.total}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-sm">
              Nenhum departamento com dados ainda
            </div>
          )}
        </motion.div>

        {/* Alerts */}
        <motion.div variants={item} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-400" />
            <h3 className="font-semibold text-white">Trilhas Vencidas</h3>
            <span className="ml-auto text-xs bg-red-500/20 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-full">
              {overdueData.length}
            </span>
          </div>
          <div className="space-y-3">
            {overdueData.slice(0, 3).map((track: any) => (
              <div key={track.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <Avatar name={track.user_name ?? 'U'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{track.user_name}</p>
                  <p className="text-xs text-red-400 truncate">{track.track_title}</p>
                  <p className="text-xs text-slate-600">{track.progress_percent}% concluído</p>
                </div>
              </div>
            ))}
            {overdueData.length === 0 && (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 size={28} className="text-emerald-400 mb-2" />
                <p className="text-sm text-emerald-400 font-medium">Tudo em dia!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top courses + Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Cursos mais concluídos</h3>
            <BarChart2 size={16} className="text-slate-500" />
          </div>
          {topCoursesData.length > 0 ? (
            <div className="space-y-3">
              {topCoursesData.map((course, i) => (
                <div key={course.name} className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-600 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{course.name}</p>
                    <ProgressBar value={course.rate} size="xs" className="mt-1" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{course.completions}</p>
                    <p className="text-xs text-slate-600">concl.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-sm">
              Nenhuma conclusão registrada ainda
            </div>
          )}
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Atividade recente</h3>
            <Activity size={16} className="text-slate-500" />
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((event: any, i: number) => {
                const meta = ACTION_LABELS[event.action] ?? { label: event.action, icon: '•', color: 'blue' };
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0
                      ${meta.color === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' :
                        meta.color === 'blue' ? 'bg-blue-500/15 text-blue-400' :
                        meta.color === 'amber' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-[#6B35B0]/15 text-[#9B6FD4]'}`}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-medium">{event.user?.name ?? 'Sistema'}</span>{' '}
                        {meta.label}
                      </p>
                      <p className="text-xs text-slate-600">{formatDate(event.created_at)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-sm">
              Nenhuma atividade registrada ainda
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
