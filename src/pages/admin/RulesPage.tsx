import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Zap, GitBranch, Building2, Briefcase, ArrowRight, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Input';
import { getRules, getTracks, getDepartments, getPositions, createRule, deleteRule } from '../../lib/api';
import type { Track, Department, Position } from '../../types';
import toast from 'react-hot-toast';

interface Rule {
  id: string;
  track_id: string;
  department_id?: string;
  position_id?: string;
  auto_assign: boolean;
  track?: Track;
  department?: Department;
  position?: Position;
}

export function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ track_id: '', department_id: '', position_id: '', auto_assign: true });

  const load = async () => {
    setLoading(true);
    const [{ data: r }, { data: t }, { data: d }, { data: p }] = await Promise.all([
      getRules(), getTracks(), getDepartments(), getPositions(),
    ]);
    setRules((r as Rule[]) ?? []);
    setTracks((t as Track[]) ?? []);
    setDepartments((d as Department[]) ?? []);
    setPositions((p as Position[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await deleteRule(id);
    if (error) return toast.error('Erro ao remover regra');
    toast.success('Regra removida!');
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleAdd = async () => {
    if (!form.track_id) return toast.error('Selecione uma trilha');
    setSaving(true);
    try {
      const { error } = await createRule({
        track_id: form.track_id,
        department_id: form.department_id || null,
        position_id: form.position_id || null,
        auto_assign: form.auto_assign,
      });
      if (error) throw error;
      toast.success('Regra criada com sucesso!');
      setIsModalOpen(false);
      setForm({ track_id: '', department_id: '', position_id: '', auto_assign: true });
      await load();
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao criar regra');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  return (
    <div className="max-w-screen-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Regras de Atribuição</h2>
          <p className="text-slate-500 text-sm mt-1">Defina quem recebe qual trilha automaticamente</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>Nova Regra</Button>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#6B35B0]/10 border border-[#6B35B0]/20">
        <Zap size={18} className="text-[#9B6FD4] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#C4A8E8]">Atribuição automática inteligente</p>
          <p className="text-xs text-slate-500 mt-1">Quando um colaborador é cadastrado ou tem seu cargo/área alterado, o sistema atribui automaticamente as trilhas baseadas nas regras abaixo.</p>
        </div>
      </div>

      <div className="space-y-3">
        {rules.map((rule, i) => {
          const dept = rule.department?.name;
          const pos = rule.position?.name;

          return (
            <motion.div key={rule.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="glass-card rounded-2xl p-5 flex items-center gap-4 group">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#6B35B0]/15 flex items-center justify-center flex-shrink-0">
                  {!dept && !pos ? <Target size={18} className="text-[#9B6FD4]" /> : dept ? <Building2 size={18} className="text-[#4BC8C8]" /> : <Briefcase size={18} className="text-emerald-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {!dept && !pos && <Badge variant="purple">Todos os colaboradores</Badge>}
                    {dept && <Badge variant="cyan">{dept}</Badge>}
                    {pos && <Badge variant="emerald">{pos}</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">
                    {!dept && !pos ? 'Qualquer cargo ou departamento' : dept ? `Departamento: ${dept}` : `Cargo: ${pos}`}
                  </p>
                </div>
              </div>

              <ArrowRight size={16} className="text-slate-600 flex-shrink-0" />

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#4BC8C8]/15 flex items-center justify-center flex-shrink-0">
                  <GitBranch size={18} className="text-[#4BC8C8]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{rule.track?.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {rule.track?.is_mandatory && <Badge variant="red">Obrigatória</Badge>}
                    {rule.track?.is_blocking && <Badge variant="amber">Bloqueante</Badge>}
                    {rule.track?.deadline_days && <span className="text-xs text-slate-500">{rule.track.deadline_days} dias</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {rule.auto_assign ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                    <CheckCircle size={12} /> Auto
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">Manual</div>
                )}
                <button onClick={() => handleDelete(rule.id)} className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}

        {rules.length === 0 && (
          <div className="py-16 text-center text-slate-600">Nenhuma regra cadastrada.</div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Regra de Atribuição"
        footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button onClick={handleAdd} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}Criar regra</Button></>}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Configure qual trilha será atribuída com base em departamento e/ou cargo.</p>
          <Select label="Trilha" options={[{ value: '', label: 'Selecione a trilha...' }, ...tracks.map(t => ({ value: t.id, label: t.title }))]} value={form.track_id} onChange={v => setForm({ ...form, track_id: v })} />
          <Select label="Departamento (opcional)" options={[{ value: '', label: 'Todos os departamentos' }, ...departments.map(d => ({ value: d.id, label: d.name }))]} value={form.department_id} onChange={v => setForm({ ...form, department_id: v })} />
          <Select label="Cargo (opcional)" options={[{ value: '', label: 'Todos os cargos' }, ...positions.map(p => ({ value: p.id, label: p.name }))]} value={form.position_id} onChange={v => setForm({ ...form, position_id: v })} />
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.auto_assign} onChange={e => setForm({ ...form, auto_assign: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#6B35B0] cursor-pointer" />
            <span className="text-sm text-slate-300">Atribuição automática ao cadastrar colaborador</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
