import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Award, PlayCircle, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useAuthStore } from '../../store/authStore';
import { getUserCourseProgress, getCourses } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import type { Course } from '../../types';

const courseGradients = [
  'from-[#6B35B0]/25 to-purple-900/15',
  'from-[#4BC8C8]/25 to-teal-900/15',
  'from-emerald-600/25 to-teal-900/15',
  'from-amber-600/25 to-orange-900/15',
  'from-pink-600/25 to-rose-900/15',
];

export function MyCoursesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: allCourses }, { data: progress }] = await Promise.all([
        getCourses(), getUserCourseProgress(user.id),
      ]);
      const progressMap = Object.fromEntries((progress ?? []).map((p: any) => [p.course_id, p]));
      const enriched = ((allCourses as Course[]) ?? []).map(c => ({ ...c, progress: progressMap[c.id] ?? null }));
      setCourses(enriched);
      setLoading(false);
    })();
  }, [user]);

  const inProgress = courses.filter(c => c.progress?.status === 'in_progress');
  const completed = courses.filter(c => c.progress?.status === 'completed');
  const notStarted = courses.filter(c => !c.progress || c.progress.status === 'not_started');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Meus Cursos</h2>
        <p className="text-slate-500 text-sm mt-1">{courses.length} cursos disponíveis</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Em andamento', count: inProgress.length, color: 'text-[#4BC8C8] bg-[#4BC8C8]/10 border-[#4BC8C8]/20' },
          { label: 'Concluídos', count: completed.length, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Disponíveis', count: notStarted.length, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
        ].map(s => (
          <div key={s.label} className={`glass-card rounded-xl p-4 border text-center ${s.color.split(' ').slice(1).join(' ')}`}>
            <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.count}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {inProgress.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Em andamento</h3>
          <div className="space-y-3">
            {inProgress.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                onClick={() => navigate(`/employee/courses/${course.id}`)}
                className="glass-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-[#6B35B0]/30 transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${courseGradients[i % courseGradients.length]} flex items-center justify-center flex-shrink-0`}>
                  <BookOpen size={22} className="text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white mb-1">{course.title}</h4>
                  <div className="flex items-center gap-3 mb-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={10} />{course.workload_hours}h</span>
                    {course.has_certificate && <span className="flex items-center gap-1 text-amber-400"><Award size={10} />Certifica</span>}
                  </div>
                  <ProgressBar value={course.progress?.progress_percent ?? 0} size="sm" showLabel />
                </div>
                <button className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  course.progress?.progress_percent >= 100
                    ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/25'
                    : 'bg-[#6B35B0]/15 border-[#6B35B0]/20 text-white group-hover:bg-[#6B35B0]/25'
                }`}>
                  {course.progress?.progress_percent >= 100
                    ? <><CheckCircle size={13} /> Revisar</>
                    : <><PlayCircle size={13} /> Continuar</>
                  }
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Concluídos</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {completed.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-4 flex items-center gap-3 border border-emerald-500/15 bg-emerald-500/3"
              >
                <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{course.title}</p>
                  {course.progress?.grade != null && <p className="text-xs text-emerald-400 mt-0.5">Nota: {course.progress.grade}%</p>}
                </div>
                {course.has_certificate && <Award size={16} className="text-amber-400 flex-shrink-0" />}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {notStarted.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Disponíveis</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {notStarted.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/employee/courses/${course.id}`)}
                className="glass-card rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-[#6B35B0]/20 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${courseGradients[i % courseGradients.length]} flex items-center justify-center flex-shrink-0`}>
                  <BookOpen size={16} className="text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{course.title}</p>
                  <p className="text-xs text-slate-500">{course.workload_hours}h · {course.category}</p>
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-[#9B6FD4] transition-colors" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div className="glass-card rounded-2xl p-16 text-center">
          <BookOpen size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum curso disponível.</p>
        </div>
      )}
    </div>
  );
}
