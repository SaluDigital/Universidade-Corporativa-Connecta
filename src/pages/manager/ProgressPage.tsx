import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { mockUsers, mockUserTracks, mockCourseProgress, mockCourses } from '../../data/mock';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export function ProgressPage() {
  const { user } = useAuthStore();
  const team = mockUsers.filter(u => u.manager_id === user?.id);

  const teamProgressData = team.map(member => {
    const tracks = mockUserTracks.filter(t => t.user_id === member.id);
    const avgProgress = tracks.length ? Math.round(tracks.reduce((a, t) => a + t.progress_percent, 0) / tracks.length) : 0;
    return { name: member.name.split(' ')[0], progress: avgProgress, full: member.name };
  });

  const allCourseProgress = mockCourseProgress.filter(cp => team.some(u => u.id === cp.user_id));

  return (
    <div className="max-w-screen-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Progresso da Equipe</h2>
        <p className="text-slate-500 text-sm mt-1">Acompanhamento detalhado por colaborador</p>
      </div>

      {/* Bar chart */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4">Progresso médio por colaborador</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={teamProgressData} barSize={36}>
            <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: '#12122b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px' }}
              formatter={(v) => [`${v}%`, 'Progresso']}
            />
            <Bar dataKey="progress" radius={[8, 8, 0, 0]}>
              {teamProgressData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-semibold text-white">Detalhe por curso</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Colaborador', 'Curso', 'Progresso', 'Nota', 'Status', 'Último acesso'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allCourseProgress.map((cp, i) => {
                const member = team.find(u => u.id === cp.user_id);
                const course = mockCourses.find(c => c.id === cp.course_id);
                return (
                  <motion.tr
                    key={cp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={member?.name ?? 'U'} size="xs" />
                        <span className="text-sm text-white">{member?.name?.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400 max-w-xs">
                      <span className="truncate block">{course?.title}</span>
                    </td>
                    <td className="px-5 py-4 w-40">
                      <ProgressBar value={cp.progress_percent} size="sm" showLabel />
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold">
                      {cp.grade != null ? (
                        <span className={cp.grade >= 70 ? 'text-emerald-400' : 'text-red-400'}>{cp.grade}%</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={cp.status} /></td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {cp.last_access_at ? new Date(cp.last_access_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
