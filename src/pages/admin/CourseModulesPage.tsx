import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Plus, Trash2, Edit2, Loader2, Save,
  PlayCircle, ChevronDown, ChevronRight, Layers, GripVertical,
  Clock, AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import {
  getCourseById, getCourseModules,
  createModule, updateModule, deleteModule,
  createLesson, updateLesson, deleteLesson,
} from '../../lib/api';
import type { Course, CourseModule, Lesson } from '../../types';
import toast from 'react-hot-toast';

type ModuleWithLessons = CourseModule & { lessons: Lesson[] };

interface ModuleForm { title: string; description: string }
interface LessonForm { title: string; description: string; content_url: string; duration_minutes: string }

const emptyModuleForm = (): ModuleForm => ({ title: '', description: '' });
const emptyLessonForm = (): LessonForm => ({ title: '', description: '', content_url: '', duration_minutes: '' });

export function CourseModulesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal de módulo
  const [moduleModal, setModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleWithLessons | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(emptyModuleForm());

  // Modal de aula
  const [lessonModal, setLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonTargetModuleId, setLessonTargetModuleId] = useState<string>('');
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLessonForm());

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: courseData }, { data: modulesData }] = await Promise.all([
      getCourseById(courseId!),
      getCourseModules(courseId!),
    ]);
    setCourse(courseData as Course);
    const sorted = ((modulesData ?? []) as ModuleWithLessons[]).map(m => ({
      ...m,
      lessons: [...(m.lessons ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    }));
    setModules(sorted);
    // Expandir todos os módulos por padrão
    setExpandedModules(new Set(sorted.map(m => m.id)));
    setLoading(false);
  };

  const toggleExpanded = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Módulo ──
  const openCreateModule = () => {
    setEditingModule(null);
    setModuleForm(emptyModuleForm());
    setModuleModal(true);
  };

  const openEditModule = (m: ModuleWithLessons) => {
    setEditingModule(m);
    setModuleForm({ title: m.title, description: m.description ?? '' });
    setModuleModal(true);
  };

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) return toast.error('Informe o título do módulo');
    setSaving(true);
    try {
      if (editingModule) {
        const { error } = await updateModule(editingModule.id, { title: moduleForm.title, description: moduleForm.description });
        if (error) throw error;
        toast.success('Módulo atualizado!');
      } else {
        const { error } = await createModule({
          course_id: courseId,
          title: moduleForm.title,
          description: moduleForm.description,
          sort_order: modules.length,
        });
        if (error) throw error;
        toast.success('Módulo criado!');
      }
      setModuleModal(false);
      await loadData();
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar módulo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    setDeletingId(id);
    const { error } = await deleteModule(id);
    if (error) toast.error('Erro ao excluir módulo');
    else {
      toast.success('Módulo removido');
      setModules(prev => prev.filter(m => m.id !== id));
    }
    setDeletingId(null);
  };

  // ── Aula ──
  const openCreateLesson = (moduleId: string) => {
    setEditingLesson(null);
    setLessonTargetModuleId(moduleId);
    setLessonForm(emptyLessonForm());
    setLessonModal(true);
  };

  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonTargetModuleId(lesson.module_id);
    setLessonForm({
      title: lesson.title,
      description: lesson.description ?? '',
      content_url: lesson.content_url ?? '',
      duration_minutes: lesson.duration_minutes?.toString() ?? '',
    });
    setLessonModal(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) return toast.error('Informe o título da aula');
    if (!lessonForm.content_url.trim()) return toast.error('Informe o link do vídeo no YouTube');
    setSaving(true);
    try {
      const mod = modules.find(m => m.id === lessonTargetModuleId);
      if (editingLesson) {
        const { error } = await updateLesson(editingLesson.id, {
          title: lessonForm.title,
          description: lessonForm.description,
          content_url: lessonForm.content_url,
          duration_minutes: parseInt(lessonForm.duration_minutes) || null,
        });
        if (error) throw error;
        toast.success('Aula atualizada!');
      } else {
        const { error } = await createLesson({
          module_id: lessonTargetModuleId,
          title: lessonForm.title,
          description: lessonForm.description,
          content_type: 'video',
          content_url: lessonForm.content_url,
          duration_minutes: parseInt(lessonForm.duration_minutes) || null,
          sort_order: mod?.lessons.length ?? 0,
          is_required: true,
        });
        if (error) throw error;
        toast.success('Aula adicionada!');
      }
      setLessonModal(false);
      await loadData();
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar aula');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
    setDeletingId(lessonId);
    const { error } = await deleteLesson(lessonId);
    if (error) toast.error('Erro ao excluir aula');
    else {
      toast.success('Aula removida');
      setModules(prev => prev.map(m =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m
      ));
    }
    setDeletingId(null);
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/admin/courses')}
          className="mt-1 p-2 rounded-xl glass border border-white/5 text-slate-500 hover:text-white transition-all flex-shrink-0"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">Módulos e Aulas</h2>
          <p className="text-slate-500 text-sm mt-0.5">{course?.title}</p>
        </div>
        <Button onClick={openCreateModule} icon={<Plus size={15} />}>Novo Módulo</Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6B35B0]/20 flex items-center justify-center">
            <Layers size={16} className="text-[#9B6FD4]" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{modules.length}</p>
            <p className="text-xs text-slate-500">módulos</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#4BC8C8]/15 flex items-center justify-center">
            <PlayCircle size={16} className="text-[#4BC8C8]" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{totalLessons}</p>
            <p className="text-xs text-slate-500">aulas no total</p>
          </div>
        </div>
      </div>

      {/* Lista de módulos */}
      <div className="space-y-3">
        <AnimatePresence>
          {modules.map((mod, modIdx) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: modIdx * 0.04 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              {/* Cabeçalho do módulo */}
              <div className="flex items-center gap-3 p-4">
                <GripVertical size={15} className="text-slate-700 flex-shrink-0" />
                <button
                  onClick={() => toggleExpanded(mod.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#6B35B0]/20 flex items-center justify-center text-xs font-bold text-[#C4A8E8] flex-shrink-0">
                    {modIdx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{mod.title}</p>
                    <p className="text-xs text-slate-600">{mod.lessons.length} aula(s)</p>
                  </div>
                  {expandedModules.has(mod.id)
                    ? <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
                    : <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
                  }
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEditModule(mod)} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/10 transition-all" title="Editar módulo">
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(mod.id)}
                    disabled={deletingId === mod.id}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                    title="Excluir módulo"
                  >
                    {deletingId === mod.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>

              {/* Aulas do módulo */}
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
                      {mod.lessons.map((lesson, lessonIdx) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-all">
                          <GripVertical size={13} className="text-slate-800 flex-shrink-0" />
                          <div className="w-5 h-5 rounded-md bg-[#4BC8C8]/15 flex items-center justify-center flex-shrink-0">
                            <PlayCircle size={11} className="text-[#4BC8C8]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              <span className="text-slate-600 mr-1">{modIdx + 1}.{lessonIdx + 1}</span>
                              {lesson.title}
                            </p>
                            {lesson.duration_minutes && (
                              <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                                <Clock size={9} /> {lesson.duration_minutes} min
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => openEditLesson(lesson)} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/10 transition-all" title="Editar aula">
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson.id, mod.id)}
                              disabled={deletingId === lesson.id}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                              title="Excluir aula"
                            >
                              {deletingId === lesson.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Botão nova aula */}
                      <div className="px-4 py-3">
                        <button
                          onClick={() => openCreateLesson(mod.id)}
                          className="flex items-center gap-2 text-xs text-slate-600 hover:text-[#4BC8C8] transition-colors"
                        >
                          <Plus size={13} /> Nova aula neste módulo
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {modules.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <AlertCircle size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhum módulo cadastrado</p>
            <p className="text-slate-600 text-sm mt-1">Clique em "Novo Módulo" para começar.</p>
          </div>
        )}
      </div>

      {/* Modal — Módulo */}
      <Modal
        isOpen={moduleModal}
        onClose={() => setModuleModal(false)}
        title={editingModule ? 'Editar Módulo' : 'Novo Módulo'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModuleModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveModule} disabled={saving} icon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}>
              {editingModule ? 'Salvar' : 'Criar módulo'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Título do módulo" value={moduleForm.title} onChange={e => setModuleForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Introdução" />
          <Textarea label="Descrição (opcional)" value={moduleForm.description} onChange={v => setModuleForm(p => ({ ...p, description: v }))} placeholder="Descreva o conteúdo deste módulo..." rows={2} />
        </div>
      </Modal>

      {/* Modal — Aula */}
      <Modal
        isOpen={lessonModal}
        onClose={() => setLessonModal(false)}
        title={editingLesson ? 'Editar Aula' : 'Nova Aula'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLessonModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveLesson} disabled={saving} icon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}>
              {editingLesson ? 'Salvar' : 'Adicionar aula'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Título da aula" value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Bem-vindo à SaluDigital" />
          <Input
            label="Link do vídeo (YouTube)"
            value={lessonForm.content_url}
            onChange={e => setLessonForm(p => ({ ...p, content_url: e.target.value }))}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duração (minutos)" type="number" value={lessonForm.duration_minutes} onChange={e => setLessonForm(p => ({ ...p, duration_minutes: e.target.value }))} placeholder="15" />
          </div>
          <Textarea label="Descrição (opcional)" value={lessonForm.description} onChange={v => setLessonForm(p => ({ ...p, description: v }))} placeholder="Descreva o conteúdo desta aula..." rows={2} />
        </div>
      </Modal>
    </div>
  );
}
