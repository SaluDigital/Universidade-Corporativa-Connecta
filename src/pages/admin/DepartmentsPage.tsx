import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Layers, Users, Edit2, Briefcase, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { getDepartments, getPositions, getUsers, createDepartment, updateDepartment, createPosition, deletePosition } from '../../lib/api';
import type { Department, Position, User } from '../../types';
import toast from 'react-hot-toast';

const deptColors = [
  'from-[#6B35B0]/20 to-purple-900/10 border-[#6B35B0]/20',
  'from-[#4BC8C8]/20 to-teal-900/10 border-[#4BC8C8]/20',
  'from-emerald-500/20 to-teal-900/10 border-emerald-500/20',
  'from-amber-500/20 to-orange-900/10 border-amber-500/20',
  'from-pink-500/20 to-rose-900/10 border-pink-500/20',
  'from-cyan-500/20 to-blue-900/10 border-cyan-500/20',
];

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [posForm, setPosForm] = useState({ name: '', description: '' });

  const load = async () => {
    setLoading(true);
    const [{ data: d }, { data: p }, { data: u }] = await Promise.all([
      getDepartments(), getPositions(), getUsers(),
    ]);
    setDepartments((d as Department[]) ?? []);
    setPositions((p as Position[]) ?? []);
    setUsers((u as User[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getUserCount = (deptId: string) => users.filter(u => u.department_id === deptId).length;
  const getDeptPositions = (deptId: string) => positions.filter(p => p.department_id === deptId);

  const openCreate = () => { setEditDept(null); setForm({ name: '', description: '' }); setIsModalOpen(true); };
  const openEdit = (dept: Department) => { setEditDept(dept); setForm({ name: dept.name, description: dept.description ?? '' }); setIsModalOpen(true); };

  const handleSaveDept = async () => {
    if (!form.name) return toast.error('Informe o nome do departamento');
    setSaving(true);
    try {
      if (editDept) {
        const { error } = await updateDepartment(editDept.id, form);
        if (error) throw error;
        toast.success('Departamento atualizado!');
      } else {
        const { error } = await createDepartment(form);
        if (error) throw error;
        toast.success('Departamento criado!');
      }
      setIsModalOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePos = async () => {
    if (!posForm.name || !selectedDeptId) return toast.error('Informe o nome do cargo');
    setSaving(true);
    try {
      const { error } = await createPosition({ name: posForm.name, department_id: selectedDeptId, description: posForm.description });
      if (error) throw error;
      toast.success('Cargo criado!');
      setIsPosModalOpen(false);
      setPosForm({ name: '', description: '' });
      await load();
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePos = async (id: string) => {
    const { error } = await deletePosition(id);
    if (error) return toast.error('Erro ao excluir cargo');
    toast.success('Cargo removido!');
    setPositions(prev => prev.filter(p => p.id !== id));
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
          <h2 className="text-2xl font-bold text-white">Departamentos e Cargos</h2>
          <p className="text-slate-500 text-sm mt-1">{departments.length} departamentos cadastrados</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={16} />}>Novo Departamento</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept, i) => {
          const deptPositions = getDeptPositions(dept.id);
          const userCount = getUserCount(dept.id);
          const color = deptColors[i % deptColors.length];
          const [bg1, bg2, border] = color.split(' ');

          return (
            <motion.div key={dept.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`glass-card rounded-2xl overflow-hidden border ${border}`}>
              <div className={`bg-gradient-to-br ${bg1} ${bg2} p-5`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Layers size={18} className="text-white/70" />
                  </div>
                  <button onClick={() => openEdit(dept)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <Edit2 size={13} />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{dept.name}</h3>
                <p className="text-white/50 text-sm">{dept.description}</p>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><Users size={13} /> {userCount} colaboradores</span>
                  <span className="flex items-center gap-1.5"><Briefcase size={13} /> {deptPositions.length} cargos</span>
                </div>

                {deptPositions.length > 0 && (
                  <div className="space-y-1.5">
                    {deptPositions.map(pos => (
                      <div key={pos.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/3 border border-white/5 hover:border-white/10 transition-all group">
                        <span className="text-sm text-slate-400">{pos.name}</span>
                        <button onClick={() => handleDeletePos(pos.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-red-400 transition-all">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => { setSelectedDeptId(dept.id); setPosForm({ name: '', description: '' }); setIsPosModalOpen(true); }} className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/10 text-xs text-slate-600 hover:text-slate-400 hover:border-[#6B35B0]/30 transition-all">
                  <Plus size={12} /> Novo cargo
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editDept ? 'Editar Departamento' : 'Novo Departamento'}
        footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveDept} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}{editDept ? 'Salvar' : 'Criar'}</Button></>}
      >
        <div className="space-y-4">
          <Input label="Nome do departamento" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Comercial" />
          <Textarea label="Descrição" value={form.description} onChange={v => setForm({ ...form, description: v })} rows={3} />
        </div>
      </Modal>

      <Modal isOpen={isPosModalOpen} onClose={() => setIsPosModalOpen(false)} title="Novo Cargo"
        footer={<><Button variant="secondary" onClick={() => setIsPosModalOpen(false)}>Cancelar</Button><Button onClick={handleSavePos} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}Criar</Button></>}
      >
        <div className="space-y-4">
          <Input label="Nome do cargo" value={posForm.name} onChange={e => setPosForm({ ...posForm, name: e.target.value })} placeholder="Ex: Consultor de Vendas" />
          <Textarea label="Descrição" value={posForm.description} onChange={v => setPosForm({ ...posForm, description: v })} rows={3} />
        </div>
      </Modal>
    </div>
  );
}
