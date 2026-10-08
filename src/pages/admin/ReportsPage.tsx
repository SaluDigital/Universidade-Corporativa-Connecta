import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download, TrendingUp, Users, Award, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar } from '../../components/ui/Avatar';
import { getCourses, getCertificates, getOverdueTracks, getUsers } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const COLORS = ['#6B35B0', '#4BC8C8', '#10b981', '#f59e0b', '#9B6FD4'];
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 rounded-xl border border-white/10 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [overdueTracks, setOverdueTracks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [
        { data: progress },
        { data: certs },
        { data: overdue },
        { data: usersData },
      ] = await Promise.all([
        supabase
          .from('user_course_progress')
          .select('id, user_id, course_id, status, progress_percent, completed_at, course:courses(id,title,category)'),
        getCertificates(),
        getOverdueTracks(),
        getUsers(),
      ]);
      setAllProgress(progress ?? []);
      setCertificates(certs ?? []);
      setOverdueTracks(overdue ?? []);
      setUsers(usersData ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  const completed = allProgress.filter(p => p.status === 'completed');
  const inProgress = allProgress.filter(p => p.status === 'in_progress');
  const completionRate = allProgress.length > 0 ? Math.round((completed.length / allProgress.length) * 100) : 0;

  const now = new Date();
  const certsThisMonth = certificates.filter(c => {
    const d = new Date(c.issued_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  // Monthly data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: MONTH_NAMES[d.getMonth()], year: d.getFullYear(), mo: d.getMonth(), completions: 0, certificates: 0 };
  });
  completed.forEach(p => {
    if (!p.completed_at) return;
    const d = new Date(p.completed_at);
    const idx = monthlyData.findIndex(m => m.year === d.getFullYear() && m.mo === d.getMonth());
    if (idx >= 0) monthlyData[idx].completions++;
  });
  certificates.forEach(c => {
    const d = new Date(c.issued_at);
    const idx = monthlyData.findIndex(m => m.year === d.getFullYear() && m.mo === d.getMonth());
    if (idx >= 0) monthlyData[idx].certificates++;
  });

  // Department completion (client-side)
  const deptMap: Record<string, { name: string; total: Set<string>; completedSet: Set<string> }> = {};
  users.forEach((u: any) => {
    if (!u.department_id) return;
    const dname = u.department?.name ?? 'Sem departamento';
    if (!deptMap[u.department_id]) deptMap[u.department_id] = { name: dname, total: new Set(), completedSet: new Set() };
    deptMap[u.department_id].total.add(u.id);
  });
  const userDeptLookup: Record<string, string> = {};
  users.forEach((u: any) => { if (u.department_id) userDeptLookup[u.id] = u.department_id; });
  completed.forEach(p => {
    const deptId = userDeptLookup[p.user_id];
    if (deptId && deptMap[deptId]) deptMap[deptId].completedSet.add(p.user_id);
  });
  const deptData = Object.values(deptMap)
    .filter(d => d.total.size > 0)
    .map(d => ({ name: d.name, rate: Math.round((d.completedSet.size / d.total.size) * 100), completed: d.completedSet.size, total: d.total.size }))
    .sort((a, b) => b.rate - a.rate);

  // Radar by category
  const catMap: Record<string, { total: number; done: number }> = {};
  allProgress.forEach(p => {
    const cat = (p.course as any)?.category ?? 'Outros';
    if (!catMap[cat]) catMap[cat] = { total: 0, done: 0 };
    catMap[cat].total++;
    if (p.status === 'completed') catMap[cat].done++;
  });
  const radarData = Object.entries(catMap).map(([subject, v]) => ({
    subject,
    A: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
    fullMark: 100,
  }));

  // Top courses by completion count
  const courseCompMap: Record<string, { name: string; completions: number }> = {};
  completed.forEach(p => {
    if (!p.course_id) return;
    if (!courseCompMap[p.course_id]) courseCompMap[p.course_id] = { name: (p.course as any)?.title ?? 'Sem título', completions: 0 };
    courseCompMap[p.course_id].completions++;
  });
  const topCourses = Object.values(courseCompMap).sort((a, b) => b.completions - a.completions).slice(0, 5);
  const maxComp = topCourses[0]?.completions || 1;
  const topCoursesData = topCourses.map(c => ({ ...c, rate: Math.round((c.completions / maxComp) * 100) }));

  return (
    <div className="max-w-screen-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Relatórios e Analytics</h2>
          <p className="text-slate-500 text-sm mt-1">Inteligência de dados para decisões estratégicas</p>
        </div>
        <Button variant="secondary" icon={<Download size={15} />} onClick={() => toast('Exportando relatório...')}>
          Exportar PDF
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Taxa de conclusão geral" value={`${completionRate}%`} subtitle="Cursos com progresso" icon={<TrendingUp />} color="emerald" />
        <StatCard title="Trilhas vencidas" value={String(overdueTracks.length)} subtitle="Requerem atenção" icon={<AlertTriangle />} color="red" />
        <StatCard title="Em andamento" value={String(inProgress.length)} subtitle="Cursos em progresso" icon={<Clock />} color="amber" />
        <StatCard title="Certificados no mês" value={String(certsThisMonth.length)} subtitle={`${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`} icon={<Award />} color="purple" />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-1">Evolução de Conclusões</h3>
          <p className="text-slate-500 text-sm mb-4">Cursos concluídos e certificados emitidos por mês</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="certificates" stroke="#6B35B0" strokeWidth={2.5} dot={{ r: 4, fill: '#6B35B0', strokeWidth: 0 }} name="Certificados" />
              <Line type="monotone" dataKey="completions" stroke="#4BC8C8" strokeWidth={2} dot={{ r: 3, fill: '#4BC8C8', strokeWidth: 0 }} strokeDasharray="4 2" name="Conclusões" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-1">Radar por Categoria</h3>
          <p className="text-slate-500 text-sm mb-4">Taxa de conclusão por área</p>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} />
                <Radar dataKey="A" stroke="#6B35B0" fill="#6B35B0" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Sem dados</div>
          )}
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.15 } }} className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-1">Taxa por Departamento</h3>
          <p className="text-slate-500 text-sm mb-4">Colaboradores com ao menos 1 curso concluído</p>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" name="% Conclusão" radius={[6, 6, 0, 0]}>
                  {deptData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Nenhum departamento com dados</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-1">Cursos mais concluídos</h3>
          <p className="text-slate-500 text-sm mb-4">Top 5 por número de conclusões</p>
          {topCoursesData.length > 0 ? (
            <div className="space-y-4">
              {topCoursesData.map((course, i) => (
                <div key={course.name} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600 w-5">{i + 1}</span>
                    <span className="text-sm text-slate-400 flex-1 truncate">{course.name}</span>
                    <span className="text-sm font-semibold text-white w-16 text-right">{course.completions} concl.</span>
                  </div>
                  <ProgressBar value={course.rate} size="xs" className="ml-7" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Nenhuma conclusão registrada</div>
          )}
        </motion.div>
      </div>

      {/* Bottom: overdue users */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-400" />
            <h3 className="font-semibold text-white">Colaboradores com Atraso</h3>
            <span className="ml-auto text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">{overdueTracks.length}</span>
          </div>
          {overdueTracks.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-sm">Nenhum atraso registrado</div>
          ) : (
            <div className="space-y-2">
              {overdueTracks.map((track: any) => (
                <div key={track.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <Avatar name={track.user_name ?? 'U'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{track.user_name}</p>
                    <p className="text-xs text-slate-500 truncate">{track.track_title}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-red-400">Atrasado</p>
                    <p className="text-xs text-slate-600">{track.progress_percent ?? 0}% concl.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-[#9B6FD4]" />
            <h3 className="font-semibold text-white">Resumo Geral</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
              <span className="text-sm text-slate-400">Total de colaboradores</span>
              <span className="text-sm font-bold text-white">{users.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
              <span className="text-sm text-slate-400">Cursos iniciados</span>
              <span className="text-sm font-bold text-white">{allProgress.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
              <span className="text-sm text-slate-400">Cursos concluídos</span>
              <span className="text-sm font-bold text-emerald-400">{completed.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
              <span className="text-sm text-slate-400">Certificados emitidos</span>
              <span className="text-sm font-bold text-amber-400">{certificates.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#6B35B0]/10 border border-[#6B35B0]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Taxa de conclusão</span>
                <span className="text-sm font-bold text-[#9B6FD4]">{completionRate}%</span>
              </div>
              <ProgressBar value={completionRate} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
