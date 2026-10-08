import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, CheckCircle, PlayCircle, Award, Calendar, Loader2 } from 'lucide-react';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useAuthStore } from '../../store/authStore';
import { getUserCourseProgress, getUserTracks, getUserCertificates } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export function HistoryPage() {
  const { user } = useAuthStore();
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [userTracks, setUserTracks] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: cp }, { data: ut }, { data: certs }] = await Promise.all([
        getUserCourseProgress(user.id),
        getUserTracks(user.id),
        getUserCertificates(user.id),
      ]);
      setCourseProgress(cp ?? []);
      setUserTracks(ut ?? []);
      setCertificates(certs ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  const completedCourses = courseProgress.filter(cp => cp.status === 'completed');
  const completedTracks = userTracks.filter(ut => ut.status === 'completed');

  const timeline = [
    ...completedCourses.map(cp => ({
      date: cp.completed_at ?? cp.last_access_at ?? '',
      title: `Concluiu "${cp.course?.title}"`,
      subtitle: cp.grade != null ? `Nota: ${cp.grade}%` : 'Sem avaliação',
      icon: <CheckCircle size={14} />,
      color: 'emerald',
    })),
    ...courseProgress.filter(cp => cp.status === 'in_progress').map(cp => ({
      date: cp.last_access_at ?? cp.started_at ?? '',
      title: (cp.progress_percent ?? 0) >= 100
        ? `Aguardando aprovação — "${cp.course?.title}"`
        : `Em andamento — "${cp.course?.title}"`,
      subtitle: `${cp.progress_percent ?? 0}% das aulas concluídas${cp.grade != null ? ` · Última nota: ${cp.grade}%` : ''}`,
      icon: <PlayCircle size={14} />,
      color: 'blue',
    })),
    ...certificates.map(cert => ({
      date: cert.issued_at,
      title: `Certificado: ${cert.course?.title}`,
      subtitle: cert.certificate_code,
      icon: <Award size={14} />,
      color: 'amber',
    })),
  ]
    .filter(e => !!e.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    blue: 'bg-[#4BC8C8]/15 text-[#4BC8C8] border-[#4BC8C8]/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Meu Histórico</h2>
        <p className="text-slate-500 text-sm mt-1">Todo o seu progresso de aprendizado</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center border border-emerald-500/15">
          <p className="text-2xl font-bold text-emerald-400">{completedCourses.length}</p>
          <p className="text-xs text-slate-500 mt-1">Cursos concluídos</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center border border-amber-500/15">
          <p className="text-2xl font-bold text-amber-400">{certificates.length}</p>
          <p className="text-xs text-slate-500 mt-1">Certificados</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center border border-[#6B35B0]/15">
          <p className="text-2xl font-bold text-[#9B6FD4]">{completedTracks.length}</p>
          <p className="text-xs text-slate-500 mt-1">Trilhas completas</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-5">Linha do tempo</h3>
        {timeline.length === 0 ? (
          <div className="text-center py-10">
            <History size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600">Nenhuma atividade ainda</p>
          </div>
        ) : (
          <div className="relative space-y-4">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[#6B35B0]/30 to-transparent" />
            {timeline.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 pl-2"
              >
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 z-10 ${colorMap[event.color]}`}>
                  {event.icon}
                </div>
                <div className="flex-1 min-w-0 pb-4 border-b border-white/5 last:border-0">
                  <p className="text-sm font-medium text-white">{event.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{event.subtitle}</p>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <Calendar size={10} />
                    {formatDate(event.date)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Course details table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-semibold text-white">Detalhe dos cursos</h3>
        </div>
        {courseProgress.length === 0 ? (
          <div className="p-10 text-center text-slate-600 text-sm">Nenhum curso iniciado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Curso', 'Status', 'Progresso', 'Nota', 'Último acesso'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courseProgress.map((cp, i) => (
                  <motion.tr
                    key={cp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-white max-w-xs"><span className="truncate block">{cp.course?.title}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                        cp.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                        cp.status === 'in_progress' ? 'bg-[#4BC8C8]/15 text-[#4BC8C8]' :
                        'bg-slate-500/15 text-slate-400'}`}>
                        {cp.status === 'completed' ? 'Concluído' : cp.status === 'in_progress' ? 'Em andamento' : 'Não iniciado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-32"><ProgressBar value={cp.progress_percent ?? 0} size="xs" showLabel /></td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {cp.grade != null
                        ? <span className={cp.grade >= 70 ? 'text-emerald-400' : 'text-red-400'}>{cp.grade}%</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {cp.last_access_at ? formatDate(cp.last_access_at) : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
