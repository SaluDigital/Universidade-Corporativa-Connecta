import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Clock, Award, CheckCircle, HelpCircle,
  Loader2, AlertCircle, Trophy, RotateCcw, XCircle,
  PlayCircle, ChevronDown, ChevronRight, BookOpen,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import {
  getCourseById, getCourseModules, getCourseQuiz,
  getUserCourseProgress, getUserLessonProgress,
  upsertCourseProgress, upsertLessonProgress,
  saveExamAttempt, getUserExamAttempts,
} from '../../lib/api';
import type { Course, CourseModule, Lesson, Quiz, ExamAttempt, UserLessonProgress } from '../../types';
import toast from 'react-hot-toast';

type Phase = 'viewing' | 'exam' | 'result';
type ModuleWithLessons = CourseModule & { lessons: Lesson[] };

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const categoryColors: Record<string, string> = {
  Onboarding: 'emerald', Cultura: 'cyan', Comercial: 'purple',
  Gestão: 'amber', Marketing: 'pink', Técnico: 'blue',
};

const ALT_LABELS = ['A', 'B', 'C', 'D'];

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [userProgress, setUserProgress] = useState<any | null>(null);
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<string, UserLessonProgress>>({});
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completingLesson, setCompletingLesson] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>('viewing');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Prova
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [examResult, setExamResult] = useState<{ score: number; passed: boolean; correct: number } | null>(null);
  const examStartRef = useRef<string>('');

  useEffect(() => {
    if (courseId && user) loadData();
  }, [courseId, user]);

  const loadData = async () => {
    setLoading(true);
    const [courseRes, progressRes, quizRes, modulesRes] = await Promise.all([
      getCourseById(courseId!),
      getUserCourseProgress(user!.id),
      getCourseQuiz(courseId!),
      getCourseModules(courseId!),
    ]);

    const courseData = courseRes.data as Course;
    setCourse(courseData);

    const prog = (progressRes.data as any[])?.find(p => p.course_id === courseId) ?? null;
    setUserProgress(prog);

    // Montar módulos com aulas ordenadas
    const mods = ((modulesRes.data ?? []) as ModuleWithLessons[]).map(m => ({
      ...m,
      lessons: [...(m.lessons ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    }));
    setModules(mods);
    setExpandedModules(new Set(mods.map(m => m.id)));

    // Progresso das aulas
    const allLessonIds = mods.flatMap(m => m.lessons.map(l => l.id));
    if (allLessonIds.length > 0) {
      const { data: lpData } = await getUserLessonProgress(user!.id, allLessonIds);
      const lpMap = Object.fromEntries(
        ((lpData ?? []) as UserLessonProgress[]).map(p => [p.lesson_id, p])
      );
      setLessonProgressMap(lpMap);
    }

    // Quiz
    if (quizRes.data) {
      const q = quizRes.data as Quiz;
      q.questions = [...(q.questions ?? [])].sort((a, b) => a.sort_order - b.sort_order);
      q.questions.forEach(question => {
        question.answers = [...(question.answers ?? [])].sort((a, b) => a.sort_order - b.sort_order);
      });
      setQuiz(q);
      const { data: attemptsData } = await getUserExamAttempts(user!.id, q.id);
      setAttempts((attemptsData as ExamAttempt[]) ?? []);
    }

    // Inicia progresso na primeira visita
    if (!prog && courseData) {
      await upsertCourseProgress({
        user_id: user!.id,
        course_id: courseId,
        status: 'in_progress',
        progress_percent: 0,
        started_at: new Date().toISOString(),
        last_access_at: new Date().toISOString(),
      });
    }

    setLoading(false);
  };

  // Calcula % de aulas concluídas
  const calcProgress = (newMap?: Record<string, UserLessonProgress>) => {
    const map = newMap ?? lessonProgressMap;
    const allRequired = modules.flatMap(m => m.lessons.filter(l => l.is_required));
    if (allRequired.length === 0) return 0;
    const done = allRequired.filter(l => map[l.id]?.status === 'completed').length;
    return Math.round((done / allRequired.length) * 100);
  };

  const completedLessonsCount = () => {
    return modules.flatMap(m => m.lessons).filter(l => lessonProgressMap[l.id]?.status === 'completed').length;
  };

  const totalLessonsCount = () => modules.flatMap(m => m.lessons).length;

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectLesson = (lesson: Lesson) => {
    setSelectedLesson(prev => prev?.id === lesson.id ? null : lesson);
  };

  const markLessonComplete = async (lesson: Lesson) => {
    if (lessonProgressMap[lesson.id]?.status === 'completed') return;
    setCompletingLesson(lesson.id);
    try {
      await upsertLessonProgress({
        user_id: user!.id,
        lesson_id: lesson.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      const newMap = {
        ...lessonProgressMap,
        [lesson.id]: { status: 'completed' as const, lesson_id: lesson.id, user_id: user!.id, watched_seconds: 0, id: '', completed_at: new Date().toISOString() },
      };
      setLessonProgressMap(newMap);

      const pct = calcProgress(newMap);
      const allDone = pct >= 100;
      const canComplete = allDone && !course!.requires_exam;

      await upsertCourseProgress({
        user_id: user!.id,
        course_id: courseId,
        status: canComplete ? 'completed' : 'in_progress',
        progress_percent: pct,
        completed_at: canComplete ? new Date().toISOString() : null,
        last_access_at: new Date().toISOString(),
      });

      setUserProgress((prev: any) => ({ ...prev, progress_percent: pct, status: canComplete ? 'completed' : 'in_progress' }));

      if (canComplete) {
        toast.success('Parabéns! Você concluiu todas as aulas do curso! 🎉');
      } else {
        toast.success('Aula concluída!');
      }
    } catch {
      toast.error('Erro ao marcar aula como concluída');
    } finally {
      setCompletingLesson(null);
    }
  };

  // ── Prova ──
  const startExam = () => {
    if (!quiz?.questions?.length) return toast.error('Prova ainda não disponível');
    if (progressPct < 100) return toast.error('Conclua 100% das aulas antes de iniciar a avaliação');
    const shuffled = shuffleArray(quiz.questions).slice(0, 10);
    setExamQuestions(shuffled);
    setAnswers({});
    examStartRef.current = new Date().toISOString();
    setPhase('exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitExam = async () => {
    if (Object.keys(answers).length < examQuestions.length) {
      return toast.error('Responda todas as perguntas antes de enviar');
    }
    setSubmitting(true);
    try {
      let correct = 0;
      examQuestions.forEach(q => {
        const correctAnswer = q.answers?.find((a: any) => a.is_correct);
        if (answers[q.id] && correctAnswer && answers[q.id] === correctAnswer.id) correct++;
      });

      const score = Math.round((correct / examQuestions.length) * 100);
      const minimumGrade = quiz?.minimum_grade ?? 70;
      const passed = score >= minimumGrade;

      await saveExamAttempt({
        user_id: user!.id,
        quiz_id: quiz!.id,
        score,
        passed,
        attempt_number: attempts.length + 1,
        started_at: examStartRef.current,
        finished_at: new Date().toISOString(),
      });

      const currentPct = calcProgress();
      await upsertCourseProgress({
        user_id: user!.id,
        course_id: courseId,
        status: passed ? 'completed' : 'in_progress',
        progress_percent: passed ? 100 : currentPct,
        grade: score,
        completed_at: passed ? new Date().toISOString() : null,
        last_access_at: new Date().toISOString(),
      });

      if (passed) {
        setUserProgress((prev: any) => ({ ...prev, status: 'completed', progress_percent: 100, grade: score }));
        setAttempts(prev => [{
          id: '', user_id: user!.id, quiz_id: quiz!.id,
          score, passed, attempt_number: attempts.length + 1,
          started_at: examStartRef.current, created_at: new Date().toISOString(),
        }, ...prev]);
      }

      setExamResult({ score, passed, correct });
      setPhase('result');
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao enviar respostas');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  if (!course) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-500">Curso não encontrado.</p>
    </div>
  );

  const isCompleted = userProgress?.status === 'completed';
  const progressPct = userProgress?.progress_percent ?? 0;
  const hasQuiz = !!quiz && (quiz.questions?.length ?? 0) > 0;
  const minimumGrade = quiz?.minimum_grade ?? 70;
  const alreadyPassed = attempts.some(a => a.passed);
  const totalLessons = totalLessonsCount();
  const doneLessons = completedLessonsCount();

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {course.thumbnail_url ? (
          <div className="relative h-48 w-full">
            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <button
              onClick={() => navigate('/employee/courses')}
              className="absolute top-3 left-3 p-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/70 hover:text-white transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {course.category && <Badge variant={(categoryColors[course.category] ?? 'slate') as any}>{course.category}</Badge>}
                {isCompleted && <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium"><CheckCircle size={12} /> Concluído</span>}
              </div>
              <h2 className="text-xl font-bold text-white leading-snug">{course.title}</h2>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Clock size={10} />{course.workload_hours}h</span>
                <span className="flex items-center gap-1"><BookOpen size={10} />{totalLessons} aulas</span>
                {course.has_certificate && <span className="flex items-center gap-1 text-amber-400"><Award size={10} />Certifica</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4">
            <button
              onClick={() => navigate('/employee/courses')}
              className="mt-1 p-2 rounded-xl glass border border-white/5 text-slate-500 hover:text-white transition-all flex-shrink-0"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {course.category && <Badge variant={(categoryColors[course.category] ?? 'slate') as any}>{course.category}</Badge>}
                {isCompleted && <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium"><CheckCircle size={12} /> Concluído</span>}
              </div>
              <h2 className="text-xl font-bold text-white leading-snug">{course.title}</h2>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock size={10} />{course.workload_hours}h</span>
                <span className="flex items-center gap-1"><BookOpen size={10} />{totalLessons} aulas</span>
                {course.has_certificate && <span className="flex items-center gap-1 text-amber-400"><Award size={10} />Certifica</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">

        {/* ── FASE: ASSISTINDO ── */}
        {phase === 'viewing' && (
          <motion.div key="viewing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Barra de progresso */}
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Progresso do curso</span>
                <span className="text-xs font-bold text-white">{doneLessons}/{totalLessons} aulas · {progressPct}%</span>
              </div>
              <ProgressBar value={progressPct} size="sm" />
            </div>

            {/* Player da aula selecionada */}
            <AnimatePresence>
              {selectedLesson && (
                <motion.div
                  key={selectedLesson.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-card rounded-2xl overflow-hidden"
                >
                  {/* Título da aula */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Assistindo agora</p>
                      <p className="text-sm font-semibold text-white">{selectedLesson.title}</p>
                    </div>
                    {lessonProgressMap[selectedLesson.id]?.status === 'completed' && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <CheckCircle size={13} /> Concluída
                      </span>
                    )}
                  </div>

                  {/* Vídeo YouTube */}
                  {selectedLesson.content_url && extractYouTubeId(selectedLesson.content_url) ? (
                    <div className="relative w-full aspect-video bg-black">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(selectedLesson.content_url)}?rel=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=0`}
                        title={selectedLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        className="absolute inset-0 w-full h-full"
                      />
                      {/* Bloqueia título + canal clicáveis no topo */}
                      <div className="absolute top-0 left-0 right-0 h-16 z-10" style={{ pointerEvents: 'all', background: 'transparent' }} />
                      {/* Bloqueia ícone de copiar link (canto inferior esquerdo) */}
                      <div className="absolute bottom-0 left-0 w-20 h-16 z-10" style={{ pointerEvents: 'all', background: 'transparent' }} />
                      {/* Bloqueia "Assistir no YouTube" + logo (canto inferior direito) */}
                      <div className="absolute bottom-0 right-0 w-64 h-16 z-10" style={{ pointerEvents: 'all', background: 'transparent' }} />
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-900 flex items-center justify-center">
                      <p className="text-slate-600 text-sm">Vídeo não configurado</p>
                    </div>
                  )}

                  {/* Botão concluir aula */}
                  {lessonProgressMap[selectedLesson.id]?.status !== 'completed' && (
                    <div className="px-4 pb-4 pt-3">
                      <Button
                        onClick={() => markLessonComplete(selectedLesson)}
                        disabled={completingLesson === selectedLesson.id}
                        icon={completingLesson === selectedLesson.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <CheckCircle size={14} />}
                        className="w-full justify-center"
                      >
                        {completingLesson === selectedLesson.id ? 'Salvando...' : 'Marcar aula como concluída'}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Módulos e Aulas */}
            {modules.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <BookOpen size={32} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">Conteúdo em preparação.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {modules.map((mod, modIdx) => {
                  const modDone = mod.lessons.filter(l => lessonProgressMap[l.id]?.status === 'completed').length;
                  const modTotal = mod.lessons.length;
                  const modPct = modTotal > 0 ? Math.round((modDone / modTotal) * 100) : 0;

                  return (
                    <div key={mod.id} className="glass-card rounded-2xl overflow-hidden">
                      {/* Cabeçalho do módulo */}
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/2 transition-all"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[#6B35B0]/20 flex items-center justify-center text-xs font-bold text-[#C4A8E8] flex-shrink-0">
                          {modIdx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{mod.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{modDone}/{modTotal} aulas concluídas</p>
                        </div>
                        {modPct === 100 && <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />}
                        {expandedModules.has(mod.id)
                          ? <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
                          : <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
                        }
                      </button>

                      {/* Aulas */}
                      <AnimatePresence>
                        {expandedModules.has(mod.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-white/5 divide-y divide-white/3">
                              {mod.lessons.map((lesson, lessonIdx) => {
                                const isLessonDone = lessonProgressMap[lesson.id]?.status === 'completed';
                                const isSelected = selectedLesson?.id === lesson.id;

                                return (
                                  <button
                                    key={lesson.id}
                                    onClick={() => selectLesson(lesson)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                                      isSelected
                                        ? 'bg-[#6B35B0]/10 border-l-2 border-[#6B35B0]'
                                        : 'hover:bg-white/2'
                                    }`}
                                  >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                      isLessonDone
                                        ? 'bg-emerald-500/20 border border-emerald-500/30'
                                        : isSelected
                                        ? 'bg-[#6B35B0]/30 border border-[#6B35B0]/40'
                                        : 'bg-white/5 border border-white/10'
                                    }`}>
                                      {isLessonDone
                                        ? <CheckCircle size={12} className="text-emerald-400" />
                                        : <PlayCircle size={12} className={isSelected ? 'text-[#C4A8E8]' : 'text-slate-600'} />
                                      }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm truncate ${isLessonDone ? 'text-slate-400' : isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                                        <span className="text-slate-600 text-xs mr-1.5">{modIdx + 1}.{lessonIdx + 1}</span>
                                        {lesson.title}
                                      </p>
                                    </div>
                                    {lesson.duration_minutes && (
                                      <span className="text-xs text-slate-600 flex-shrink-0 flex items-center gap-1">
                                        <Clock size={9} />{lesson.duration_minutes}min
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Seção de avaliação */}
            {course.requires_exam && (
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <HelpCircle size={15} className="text-[#9B6FD4]" />
                  <h3 className="text-sm font-semibold text-white">Avaliação Final</h3>
                </div>

                {isCompleted ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Trophy size={18} className="text-emerald-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-300">Aprovado!</p>
                      <p className="text-xs text-emerald-400/70">Nota: {userProgress?.grade}% · Mínimo: {minimumGrade}%</p>
                    </div>
                    {course.has_certificate && (
                      <Button variant="secondary" onClick={() => navigate('/employee/certificates')} icon={<Award size={13} />}>
                        Certificado
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>• Prova com <span className="text-white">10 perguntas</span> selecionadas aleatoriamente</p>
                      <p>• Nota mínima: <span className="text-white">{minimumGrade}%</span></p>
                      <p>• Sem limite de tentativas</p>
                    </div>

                    {attempts.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Tentativas</p>
                        {attempts.slice(0, 3).map((a, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/5 text-xs">
                            <span className="text-slate-500">Tentativa {a.attempt_number}</span>
                            <span className={a.passed ? 'text-emerald-400 font-medium' : 'text-red-400'}>{a.score}%</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!hasQuiz ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                        <AlertCircle size={13} /> Avaliação em preparação.
                      </div>
                    ) : progressPct < 100 ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-500/10 border border-slate-500/20 text-xs text-slate-400">
                        <AlertCircle size={13} /> Conclua todas as aulas para liberar a avaliação ({progressPct}% concluído).
                      </div>
                    ) : (
                      <Button onClick={startExam} icon={<HelpCircle size={14} />} className="w-full justify-center">
                        Iniciar Avaliação
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Concluir sem prova */}
            {!course.requires_exam && !isCompleted && totalLessons > 0 && progressPct >= 100 && (
              <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5 text-center">
                <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white mb-1">Todas as aulas concluídas!</p>
                {course.has_certificate && (
                  <Button onClick={() => navigate('/employee/certificates')} icon={<Award size={14} />} className="mt-2">
                    Ver certificado
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── FASE: PROVA ── */}
        {phase === 'exam' && (
          <motion.div key="exam" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle size={15} className="text-[#9B6FD4]" />
                <span className="text-sm font-semibold text-white">Avaliação Final</span>
              </div>
              <span className="text-xs text-slate-500">{Object.keys(answers).length}/{examQuestions.length} respondidas</span>
            </div>

            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${(Object.keys(answers).length / examQuestions.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-[#6B35B0] to-[#4BC8C8] rounded-full"
              />
            </div>

            <div className="space-y-4">
              {examQuestions.map((q, qi) => (
                <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.04 }} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="w-7 h-7 rounded-lg bg-[#6B35B0]/20 border border-[#6B35B0]/20 flex items-center justify-center text-xs font-bold text-[#C4A8E8] flex-shrink-0">
                      {qi + 1}
                    </span>
                    <p className="text-sm font-medium text-white leading-relaxed">{q.question_text}</p>
                  </div>
                  <div className="space-y-2 pl-10">
                    {[...(q.answers ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order).map((ans: any, ai: number) => (
                      <button
                        key={ans.id}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: ans.id }))}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${
                          answers[q.id] === ans.id
                            ? 'bg-[#6B35B0]/20 border-[#6B35B0]/40 text-white'
                            : 'border-white/5 text-slate-400 hover:border-[#6B35B0]/20 hover:text-white'
                        }`}
                      >
                        <span className={`text-xs font-bold w-5 flex-shrink-0 ${answers[q.id] === ans.id ? 'text-[#C4A8E8]' : 'text-slate-600'}`}>
                          {ALT_LABELS[ai]}.
                        </span>
                        {ans.answer_text}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setPhase('viewing')}><ChevronLeft size={15} /> Voltar</Button>
              <Button
                onClick={submitExam}
                disabled={submitting || Object.keys(answers).length < examQuestions.length}
                className="flex-1 justify-center"
                icon={submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              >
                {submitting ? 'Enviando...' : 'Enviar Respostas'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── FASE: RESULTADO ── */}
        {phase === 'result' && examResult && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className={`glass-card rounded-2xl p-8 text-center border ${examResult.passed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }} className="mb-4">
                {examResult.passed
                  ? <Trophy size={52} className="text-amber-400 mx-auto" />
                  : <XCircle size={52} className="text-red-400 mx-auto" />}
              </motion.div>
              <h3 className={`text-2xl font-bold mb-1 ${examResult.passed ? 'text-emerald-300' : 'text-red-300'}`}>
                {examResult.passed ? 'Aprovado!' : 'Não aprovado'}
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                {examResult.passed ? 'Parabéns! Você atingiu a nota mínima.' : `Nota mínima: ${minimumGrade}%. Tente novamente!`}
              </p>

              <div className="flex items-center justify-center gap-8 mb-6">
                <div>
                  <p className={`text-4xl font-bold ${examResult.passed ? 'text-emerald-400' : 'text-red-400'}`}>{examResult.score}%</p>
                  <p className="text-xs text-slate-600 mt-0.5">sua nota</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-4xl font-bold text-slate-300">{examResult.correct}/10</p>
                  <p className="text-xs text-slate-600 mt-0.5">acertos</p>
                </div>
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                {examResult.passed ? (
                  <>
                    {course.has_certificate && (
                      <Button onClick={() => navigate('/employee/certificates')} icon={<Award size={14} />}>Ver certificado</Button>
                    )}
                    <Button variant="secondary" onClick={() => setPhase('viewing')}>Voltar ao curso</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => { setExamResult(null); startExam(); }} icon={<RotateCcw size={14} />}>Tentar novamente</Button>
                    <Button variant="secondary" onClick={() => setPhase('viewing')}>Voltar ao curso</Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
