import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, BookOpen, Clock, Award, CheckCircle, Edit2,
  ToggleLeft, Star, Loader2, ToggleRight, HelpCircle, Layers,
  Trash2, ImagePlus, X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import {
  getCourses, createCourse, updateCourse,
  toggleCourseActive, deleteCourse, uploadCourseThumbnail,
} from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import type { Course } from '../../types';
import toast from 'react-hot-toast';

const categoryColors: Record<string, string> = {
  Onboarding: 'emerald', Cultura: 'cyan', Comercial: 'purple',
  Gestão: 'amber', Marketing: 'pink', Técnico: 'blue',
};

const courseGradients = [
  'from-[#6B35B0]/30 to-purple-900/20',
  'from-[#4BC8C8]/30 to-teal-900/20',
  'from-emerald-600/30 to-teal-900/20',
  'from-amber-600/30 to-orange-900/20',
  'from-pink-600/30 to-rose-900/20',
  'from-cyan-600/30 to-blue-900/20',
];

export function CoursesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal de criação/edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', category: '', workload_hours: '',
    has_certificate: false, requires_exam: false, minimum_grade: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

  // Modal de exclusão
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await getCourses();
    setCourses((data as Course[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditCourse(null);
    setForm({ title: '', description: '', category: '', workload_hours: '', has_certificate: false, requires_exam: false, minimum_grade: '' });
    setThumbnailFile(null);
    setThumbnailPreview('');
    setIsModalOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditCourse(course);
    setForm({
      title: course.title, description: course.description ?? '', category: course.category ?? '',
      workload_hours: course.workload_hours.toString(), has_certificate: course.has_certificate,
      requires_exam: course.requires_exam, minimum_grade: course.minimum_grade?.toString() ?? '',
    });
    setThumbnailFile(null);
    setThumbnailPreview(course.thumbnail_url ?? '');
    setIsModalOpen(true);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Selecione uma imagem válida');
    if (file.size > 2 * 1024 * 1024) return toast.error('A imagem deve ter no máximo 2MB');
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.title) return toast.error('Informe o título do curso');
    setSaving(true);
    try {
      let thumbnailUrl = editCourse?.thumbnail_url ?? null;

      if (thumbnailFile) {
        thumbnailUrl = await uploadCourseThumbnail(thumbnailFile);
      } else if (!thumbnailPreview) {
        thumbnailUrl = null;
      }

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        workload_hours: parseFloat(form.workload_hours) || 1,
        thumbnail_url: thumbnailUrl,
        has_certificate: form.has_certificate,
        requires_exam: form.requires_exam,
        minimum_grade: form.requires_exam ? (parseFloat(form.minimum_grade) || 70) : null,
        created_by: user?.id,
      };

      if (editCourse) {
        const { error } = await updateCourse(editCourse.id, payload);
        if (error) throw error;
        toast.success('Curso atualizado!');
      } else {
        const { error } = await createCourse(payload);
        if (error) throw error;
        toast.success('Curso criado!');
      }
      setIsModalOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar curso');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (course: Course) => {
    const { error } = await toggleCourseActive(course.id, !course.is_active);
    if (error) return toast.error('Erro ao alterar status');
    toast.success(course.is_active ? 'Curso desativado!' : 'Curso ativado!');
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_active: !c.is_active } : c));
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    setDeleting(true);
    const { error } = await deleteCourse(courseToDelete.id);
    if (error) {
      toast.error('Erro ao excluir curso');
    } else {
      toast.success('Curso excluído!');
      setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      setCourseToDelete(null);
    }
    setDeleting(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  return (
    <div className="max-w-screen-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestão de Cursos</h2>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} cursos cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 glass rounded-xl border border-white/5">
            {(['grid', 'list'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === mode ? 'bg-[#6B35B0]/20 text-[#C4A8E8]' : 'text-slate-500 hover:text-slate-300'}`}>
                {mode === 'grid' ? 'Grid' : 'Lista'}
              </button>
            ))}
          </div>
          <Button onClick={openCreate} icon={<Plus size={16} />}>Novo Curso</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cursos..." className="input-base pl-10" />
      </div>

      {/* Grid / List */}
      <motion.div layout className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
        <AnimatePresence>
          {filtered.map((course, i) => (
            <motion.div
              key={course.id} layout
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04 }}
              className={`glass-card rounded-2xl overflow-hidden ${viewMode === 'list' ? 'flex items-center gap-4 p-4' : ''}`}
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Capa */}
                  <div className={`relative h-36 overflow-hidden ${!course.thumbnail_url ? `bg-gradient-to-br ${courseGradients[i % courseGradients.length]}` : ''} flex items-center justify-center`}>
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={40} className="text-white/20" />
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge variant={(categoryColors[course.category ?? ''] || 'slate') as any}>{course.category}</Badge>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1">
                      {course.has_certificate && (
                        <span className="w-6 h-6 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center justify-center" title="Emite certificado">
                          <Award size={11} className="text-amber-400" />
                        </span>
                      )}
                      {!course.is_active && (
                        <span className="w-6 h-6 bg-slate-800/80 border border-slate-600/30 rounded-lg flex items-center justify-center" title="Inativo">
                          <ToggleLeft size={11} className="text-slate-400" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Corpo */}
                  <div className="p-4">
                    <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2">{course.title}</h4>
                    <p className="text-slate-500 text-xs mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1"><Clock size={11} /> {course.workload_hours}h</span>
                      {course.requires_exam && <span className="flex items-center gap-1"><CheckCircle size={11} className="text-[#4BC8C8]" /> Avaliação</span>}
                      <span className="flex items-center gap-1 ml-auto"><Star size={11} className="text-slate-600" /> v{course.version}</span>
                    </div>

                    {/* Ações sempre visíveis */}
                    <div className="grid grid-cols-5 gap-0.5 border-t border-white/5 pt-3">
                      <button onClick={() => openEdit(course)} className="flex flex-col items-center gap-1 py-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all text-[10px]">
                        <Edit2 size={13} /> Editar
                      </button>
                      <button onClick={() => navigate(`/admin/courses/${course.id}/modules`)} className="flex flex-col items-center gap-1 py-1.5 rounded-lg text-slate-500 hover:text-[#4BC8C8] hover:bg-[#4BC8C8]/8 transition-all text-[10px]">
                        <Layers size={13} /> Módulos
                      </button>
                      <button onClick={() => navigate(`/admin/courses/${course.id}/exam`)} className="flex flex-col items-center gap-1 py-1.5 rounded-lg text-slate-500 hover:text-[#9B6FD4] hover:bg-[#9B6FD4]/8 transition-all text-[10px]">
                        <HelpCircle size={13} /> Prova
                      </button>
                      <button onClick={() => handleToggleActive(course)} className="flex flex-col items-center gap-1 py-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all text-[10px]">
                        {course.is_active ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                        {course.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => setCourseToDelete(course)} className="flex flex-col items-center gap-1 py-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/8 transition-all text-[10px]">
                        <Trash2 size={13} /> Excluir
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Thumbnail lista */}
                  <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${!course.thumbnail_url ? `bg-gradient-to-br ${courseGradients[i % courseGradients.length]} flex items-center justify-center` : ''}`}>
                    {course.thumbnail_url
                      ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      : <BookOpen size={20} className="text-white/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-medium text-white text-sm">{course.title}</h4>
                      <Badge variant={(categoryColors[course.category ?? ''] || 'slate') as any}>{course.category}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{course.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
                    <span className="flex items-center gap-1"><Clock size={11} /> {course.workload_hours}h</span>
                    {course.has_certificate && <Award size={13} className="text-amber-400" />}
                    <StatusBadge status={course.is_active ? 'active' : 'inactive'} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(course)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all" title="Editar"><Edit2 size={14} /></button>
                    <button onClick={() => navigate(`/admin/courses/${course.id}/modules`)} className="p-2 rounded-lg text-slate-500 hover:text-[#4BC8C8] hover:bg-white/10 transition-all" title="Módulos"><Layers size={14} /></button>
                    <button onClick={() => navigate(`/admin/courses/${course.id}/exam`)} className="p-2 rounded-lg text-slate-500 hover:text-[#9B6FD4] hover:bg-white/10 transition-all" title="Prova"><HelpCircle size={14} /></button>
                    <button onClick={() => handleToggleActive(course)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all" title={course.is_active ? 'Desativar' : 'Ativar'}>
                      {course.is_active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                    </button>
                    <button onClick={() => setCourseToDelete(course)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Excluir"><Trash2 size={14} /></button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && !loading && (
        <div className="py-16 text-center text-slate-600">Nenhum curso encontrado.</div>
      )}

      {/* Modal — Criar/Editar curso */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editCourse ? 'Editar Curso' : 'Novo Curso'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} icon={saving ? <Loader2 size={14} className="animate-spin" /> : undefined}>
              {editCourse ? 'Salvar alterações' : 'Criar curso'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Upload de capa */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Capa do curso</p>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
            {thumbnailPreview ? (
              <div className="relative rounded-xl overflow-hidden h-36 bg-slate-900">
                <img src={thumbnailPreview} alt="Capa" className="w-full h-full object-cover" />
                <button
                  onClick={removeThumbnail}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500/80 flex items-center justify-center transition-all"
                >
                  <X size={13} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 rounded-xl border-2 border-dashed border-white/10 hover:border-[#6B35B0]/40 bg-white/2 hover:bg-[#6B35B0]/5 flex flex-col items-center justify-center gap-2 transition-all"
              >
                <ImagePlus size={22} className="text-slate-600" />
                <span className="text-xs text-slate-600">Clique para selecionar uma imagem</span>
                <span className="text-xs text-slate-700">JPG, PNG ou WebP · máx. 2MB</span>
              </button>
            )}
            {!thumbnailPreview && (
              <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-xs text-[#9B6FD4] hover:underline">
                Selecionar arquivo
              </button>
            )}
          </div>

          <Input label="Título do curso" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Onboarding Geral" />
          <Textarea label="Descrição" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Descreva o objetivo do curso..." />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Categoria"
              options={[
                { value: '', label: 'Selecione...' },
                { value: 'Onboarding', label: 'Onboarding' },
                { value: 'Cultura', label: 'Cultura' },
                { value: 'Comercial', label: 'Comercial' },
                { value: 'Gestão', label: 'Gestão' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'Técnico', label: 'Técnico' },
              ]}
              value={form.category}
              onChange={v => setForm({ ...form, category: v })}
            />
            <Input label="Carga horária (h)" type="number" value={form.workload_hours} onChange={e => setForm({ ...form, workload_hours: e.target.value })} placeholder="8" />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.has_certificate} onChange={e => setForm({ ...form, has_certificate: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#6B35B0] cursor-pointer" />
              <span className="text-sm text-slate-300">Emite certificado</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.requires_exam} onChange={e => setForm({ ...form, requires_exam: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#6B35B0] cursor-pointer" />
              <span className="text-sm text-slate-300">Requer avaliação</span>
            </label>
          </div>
          {form.requires_exam && (
            <Input label="Nota mínima (%)" type="number" value={form.minimum_grade} onChange={e => setForm({ ...form, minimum_grade: e.target.value })} placeholder="70" />
          )}
        </div>
      </Modal>

      {/* Modal — Confirmar exclusão */}
      <Modal
        isOpen={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        title="Excluir curso"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCourseToDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting} icon={deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}>
              {deleting ? 'Excluindo...' : 'Excluir curso'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-slate-300 text-sm">
            Tem certeza que deseja excluir o curso <span className="font-semibold text-white">"{courseToDelete?.title}"</span>?
          </p>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 space-y-1">
            <p className="font-medium">Esta ação é irreversível e removerá:</p>
            <p>• Todos os módulos e aulas do curso</p>
            <p>• Todo o progresso dos colaboradores</p>
            <p>• Todos os certificados emitidos</p>
            <p>• As perguntas da prova</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
