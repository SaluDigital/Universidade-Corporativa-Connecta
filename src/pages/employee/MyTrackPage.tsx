import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, BookOpen, Clock, Award, ChevronRight, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { ProgressBar, CircularProgress } from '../../components/ui/ProgressBar';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { getUserTracks, getUserCourseProgress } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export function MyTrackPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [userTracks, setUserTracks] = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: ut }, { data: cp }] = await Promise.all([
        getUserTracks(user.id),
        getUserCourseProgress(user.id),
      ]);
      setUserTracks(ut ?? []);
      setCourseProgress(cp ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Minha Trilha</h2>
        <p className="text-slate-500 text-sm mt-1">Seu caminho de desenvolvimento na SaluDigital</p>
      </div>

      {userTracks.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <GitBranch size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma trilha atribuída ainda</p>
          <p className="text-slate-600 text-sm mt-1">Fale com seu gestor para ser matriculado em uma trilha.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userTracks.map((ut, i) => {
            const track = ut.track;
            const isOverdue = ut.status === 'overdue';
            const isCompleted = ut.status === 'completed';
            const courses = track?.courses ?? [];

            return (
              <motion.div key={ut.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`glass-card rounded-2xl overflow-hidden border ${isOverdue ? 'border-red-500/25' : isCompleted ? 'border-emerald-500/20' : 'border-[#6B35B0]/15'}`}
              >
                <div className={`p-5 ${isCompleted ? 'bg-gradient-to-r from-emerald-600/15 to-teal-900/5' : isOverdue ? 'bg-gradient-to-r from-red-600/15 to-rose-900/5' : 'bg-gradient-to-r from-[#6B35B0]/15 to-[#4BC8C8]/5'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-emerald-500/20' : isOverdue ? 'bg-red-500/20' : 'bg-[#6B35B0]/20'}`}>
                        {isCompleted ? <CheckCircle size={24} className="text-emerald-400" /> :
                          isOverdue ? <AlertTriangle size={24} className="text-red-400" /> :
                          <GitBranch size={24} className="text-[#9B6FD4]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white">{track?.title}</h3>
                          {track?.is_mandatory && <Badge variant="red">Obrigatória</Badge>}
                          {track?.is_blocking && <Badge variant="amber">Bloqueante</Badge>}
                        </div>
                        <p className="text-slate-400 text-sm">{track?.description}</p>
                        {ut.deadline_at && (
                          <p className={`text-xs mt-1 flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                            <Clock size={11} />
                            Prazo: {new Date(ut.deadline_at).toLocaleDateString('pt-BR')}
                            {isOverdue && ' — Vencido!'}
                          </p>
                        )}
                      </div>
                    </div>
                    <CircularProgress
                      value={courses.length === 0 ? 0 : Math.round(
                        courses.reduce((sum: number, tc: any) => {
                          const cp = courseProgress.find((p: any) => p.course_id === tc.course?.id);
                          return sum + (cp?.progress_percent ?? 0);
                        }, 0) / courses.length
                      )}
                      size={70}
                      color={isCompleted ? '#10b981' : isOverdue ? '#ef4444' : '#6B35B0'}
                    />
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">Cursos nesta trilha</h4>
                  {courses.length === 0 ? (
                    <p className="text-sm text-slate-600">Nenhum curso nesta trilha ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {courses.map((tc: any, j: number) => {
                        const course = tc.course;
                        const cp = courseProgress.find((p: any) => p.course_id === course?.id);
                        const courseStatus = cp?.status ?? 'not_started';

                        return (
                          <motion.div key={tc.id} whileHover={{ x: 4 }} onClick={() => navigate(`/employee/courses/${course?.id}`)}
                            className={`flex items-center gap-4 p-3.5 rounded-xl border cursor-pointer transition-all group
                              ${courseStatus === 'completed' ? 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30' :
                                courseStatus === 'in_progress' ? 'bg-[#6B35B0]/5 border-[#6B35B0]/15 hover:border-[#6B35B0]/30' :
                                'bg-white/3 border-white/5 hover:border-[#6B35B0]/20'}`}
                          >
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0
                              ${courseStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                courseStatus === 'in_progress' ? 'bg-[#6B35B0]/20 text-[#9B6FD4]' :
                                'bg-white/5 text-slate-600'}`}>
                              {courseStatus === 'completed' ? '✓' : j + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-white">{course?.title}</p>
                                <StatusBadge status={courseStatus} />
                              </div>
                              {cp && <ProgressBar value={cp.progress_percent} size="xs" />}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                              <span className="flex items-center gap-1"><Clock size={10} />{course?.workload_hours}h</span>
                              {course?.has_certificate && <Award size={12} className="text-amber-400" />}
                              <ChevronRight size={13} className="text-slate-600 group-hover:text-[#9B6FD4] transition-colors" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="px-5 pb-4">
                  <StatusBadge status={ut.status} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
