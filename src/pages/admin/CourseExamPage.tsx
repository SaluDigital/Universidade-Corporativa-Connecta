import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Plus, Trash2, Edit2, HelpCircle, CheckCircle,
  Loader2, AlertCircle, Save,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import {
  getCourseById, getCourseQuiz, createCourseQuiz,
  addExamQuestion, updateExamQuestion, deleteExamQuestion,
  addExamAlternative, updateExamAlternative, deleteExamAlternative,
} from '../../lib/api';
import type { Course, Quiz, QuizQuestion, QuizAnswer } from '../../types';
import toast from 'react-hot-toast';

const MAX_QUESTIONS = 20;
const ALTERNATIVES_COUNT = 4;
const ALT_LABELS = ['A', 'B', 'C', 'D'];

interface QuestionForm {
  question_text: string;
  alternatives: { id?: string; text: string }[];
  correctIndex: number;
}

const emptyForm = (): QuestionForm => ({
  question_text: '',
  alternatives: Array.from({ length: ALTERNATIVES_COUNT }, () => ({ text: '' })),
  correctIndex: 0,
});

export function CourseExamPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    loadData();
  }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: courseData }, { data: quizData }] = await Promise.all([
      getCourseById(courseId!),
      getCourseQuiz(courseId!),
    ]);

    setCourse(courseData as Course);

    if (quizData) {
      setQuiz(quizData as Quiz);
      const sorted = [...((quizData as any).questions ?? [])].sort(
        (a: QuizQuestion, b: QuizQuestion) => a.sort_order - b.sort_order,
      );
      sorted.forEach((q: any) => {
        q.answers = [...(q.answers ?? [])].sort(
          (a: QuizAnswer, b: QuizAnswer) => a.sort_order - b.sort_order,
        );
      });
      setQuestions(sorted);
    } else {
      // Auto-criar quiz para o curso
      const { data: newQuiz, error } = await createCourseQuiz({
        course_id: courseId,
        title: `Prova — ${(courseData as Course)?.title ?? 'Curso'}`,
        minimum_grade: (courseData as Course)?.minimum_grade ?? 70,
        attempt_limit: 99,
      });
      if (error) toast.error('Erro ao inicializar banco de perguntas');
      else setQuiz(newQuiz as Quiz);
    }

    setLoading(false);
  };

  const openCreate = () => {
    setEditingQuestion(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (q: QuizQuestion) => {
    setEditingQuestion(q);
    const answers = [...(q.answers ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const correctIdx = answers.findIndex(a => a.is_correct);
    setForm({
      question_text: q.question_text,
      alternatives: answers.map(a => ({ id: a.id, text: a.answer_text })),
      correctIndex: correctIdx >= 0 ? correctIdx : 0,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!quiz) return;
    if (!form.question_text.trim()) return toast.error('Informe o texto da pergunta');
    if (form.alternatives.some(a => !a.text.trim())) return toast.error('Preencha todas as 4 alternativas');

    setSaving(true);
    try {
      if (editingQuestion) {
        // Atualiza pergunta
        const { error: qErr } = await updateExamQuestion(editingQuestion.id, form.question_text);
        if (qErr) throw qErr;

        // Atualiza cada alternativa
        for (let i = 0; i < form.alternatives.length; i++) {
          const alt = form.alternatives[i];
          if (alt.id) {
            const { error } = await updateExamAlternative(alt.id, {
              answer_text: alt.text,
              is_correct: i === form.correctIndex,
            });
            if (error) throw error;
          } else {
            const { error } = await addExamAlternative({
              question_id: editingQuestion.id,
              answer_text: alt.text,
              is_correct: i === form.correctIndex,
              sort_order: i,
            });
            if (error) throw error;
          }
        }
        toast.success('Pergunta atualizada!');
      } else {
        // Cria nova pergunta
        const { data: newQ, error: qErr } = await addExamQuestion({
          quiz_id: quiz.id,
          question_text: form.question_text,
          sort_order: questions.length,
        });
        if (qErr) throw qErr;

        // Cria as 4 alternativas
        for (let i = 0; i < form.alternatives.length; i++) {
          const { error } = await addExamAlternative({
            question_id: (newQ as any).id,
            answer_text: form.alternatives[i].text,
            is_correct: i === form.correctIndex,
            sort_order: i,
          });
          if (error) throw error;
        }
        toast.success('Pergunta adicionada!');
      }

      setModalOpen(false);
      await loadData();
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar pergunta');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    setDeletingId(questionId);
    const { error } = await deleteExamQuestion(questionId);
    if (error) toast.error('Erro ao excluir pergunta');
    else {
      toast.success('Pergunta removida');
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    }
    setDeletingId(null);
  };

  const setAlternativeText = (idx: number, text: string) => {
    setForm(prev => {
      const alts = [...prev.alternatives];
      alts[idx] = { ...alts[idx], text };
      return { ...prev, alternatives: alts };
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  const canAdd = questions.length < MAX_QUESTIONS;
  const progressPct = Math.round((questions.length / MAX_QUESTIONS) * 100);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/admin/courses')}
          className="mt-1 p-2 rounded-xl glass border border-white/5 text-slate-500 hover:text-white transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">Banco de Perguntas</h2>
          <p className="text-slate-500 text-sm mt-0.5">{course?.title}</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={15} />} disabled={!canAdd}>
          Nova Pergunta
        </Button>
      </div>

      {/* Progresso do banco */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-[#9B6FD4]" />
            <span className="text-sm font-medium text-white">
              {questions.length} / {MAX_QUESTIONS} perguntas cadastradas
            </span>
          </div>
          {questions.length === MAX_QUESTIONS && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <CheckCircle size={13} /> Banco completo
            </span>
          )}
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-[#6B35B0] to-[#4BC8C8]"
          />
        </div>
        {questions.length < 20 && (
          <p className="text-xs text-slate-600 mt-2">
            Adicione pelo menos {MAX_QUESTIONS - questions.length} pergunta(s) para completar o banco da prova.
            A prova usa 10 perguntas aleatórias das {MAX_QUESTIONS} cadastradas.
          </p>
        )}
      </div>

      {/* Lista de perguntas */}
      <div className="space-y-3">
        <AnimatePresence>
          {questions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.03 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-[#6B35B0]/20 border border-[#6B35B0]/20 flex items-center justify-center text-xs font-bold text-[#C4A8E8] flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white mb-3">{q.question_text}</p>
                  <div className="space-y-1.5">
                    {[...(q.answers ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((ans, ai) => (
                      <div
                        key={ans.id}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                          ans.is_correct
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                            : 'text-slate-500 border border-white/4'
                        }`}
                      >
                        <span className={`font-bold w-4 flex-shrink-0 ${ans.is_correct ? 'text-emerald-400' : 'text-slate-600'}`}>
                          {ALT_LABELS[ai]}.
                        </span>
                        <span className="flex-1">{ans.answer_text}</span>
                        {ans.is_correct && <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(q)}
                    className="p-2 rounded-lg text-slate-600 hover:text-white hover:bg-white/10 transition-all"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deletingId === q.id}
                    className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                    title="Excluir"
                  >
                    {deletingId === q.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {questions.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <AlertCircle size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma pergunta cadastrada</p>
            <p className="text-slate-600 text-sm mt-1">Clique em "Nova Pergunta" para começar.</p>
          </div>
        )}
      </div>

      {/* Modal de pergunta */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} icon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}>
              {editingQuestion ? 'Salvar alterações' : 'Adicionar pergunta'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Textarea
            label="Texto da pergunta"
            value={form.question_text}
            onChange={v => setForm(prev => ({ ...prev, question_text: v }))}
            placeholder="Digite a pergunta aqui..."
            rows={3}
          />

          <div>
            <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wide">
              Alternativas — marque a correta
            </p>
            <div className="space-y-2.5">
              {form.alternatives.map((alt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                    <input
                      type="radio"
                      name="correct"
                      checked={form.correctIndex === i}
                      onChange={() => setForm(prev => ({ ...prev, correctIndex: i }))}
                      className="accent-[#6B35B0] w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-xs font-bold w-5 ${form.correctIndex === i ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {ALT_LABELS[i]}.
                    </span>
                  </label>
                  <input
                    type="text"
                    value={alt.text}
                    onChange={e => setAlternativeText(i, e.target.value)}
                    placeholder={`Alternativa ${ALT_LABELS[i]}`}
                    className={`input-base flex-1 text-sm ${form.correctIndex === i ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Selecione o botão ao lado da alternativa correta.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
