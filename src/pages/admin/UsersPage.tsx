import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, MoreVertical, UserCheck, UserX, Edit2, Award, Mail, Building2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { getUsers, getDepartments, getPositions, updateUser, updateUserStatus, createUser } from '../../lib/api';
import type { User, Department, Position } from '../../types';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'employee',
    department_id: '', position_id: '', hire_date: '',
  });

  const load = async () => {
    setLoading(true);
    const [{ data: u }, { data: d }, { data: p }] = await Promise.all([
      getUsers(), getDepartments(), getPositions(),
    ]);
    setUsers((u as User[]) ?? []);
    setDepartments((d as Department[]) ?? []);
    setPositions((p as Position[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchDept = !deptFilter || u.department_id === deptFilter;
    return matchSearch && matchRole && matchDept;
  });

  const getDept = (id: string) => departments.find(d => d.id === id)?.name ?? '—';
  const getPos = (id: string) => positions.find(p => p.id === id)?.name ?? '—';

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'employee', department_id: '', position_id: '', hire_date: '' });
    setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, department_id: user.department_id ?? '', position_id: user.position_id ?? '', hire_date: user.hire_date ?? '' });
    setIsModalOpen(true);
    setMenuOpen(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Preencha nome e e-mail');
    setSaving(true);
    try {
      if (editUser) {
        const { error } = await updateUser(editUser.id, {
          name: form.name,
          role: form.role,
          department_id: form.department_id || null,
          position_id: form.position_id || null,
          hire_date: form.hire_date || null,
        });
        if (error) throw error;
        toast.success('Usuário atualizado!');
      } else {
        if (!form.password) return toast.error('Informe uma senha provisória');
        await createUser(form);
        toast.success('Usuário criado! Um e-mail de confirmação foi enviado.');
      }
      setIsModalOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    setMenuOpen(null);
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const { error } = await updateUserStatus(user.id, newStatus);
    if (error) return toast.error('Erro ao alterar status');
    toast.success(`Usuário ${newStatus === 'active' ? 'reativado' : 'inativado'}!`);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  return (
    <div className="max-w-screen-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestão de Usuários</h2>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} colaboradores encontrados</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={16} />}>Novo Colaborador</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou e-mail..." className="input-base pl-10" />
        </div>
        <Select options={[{ value: '', label: 'Todos os perfis' }, { value: 'admin', label: 'Admin' }, { value: 'manager', label: 'Gestor' }, { value: 'employee', label: 'Colaborador' }]} value={roleFilter} onChange={setRoleFilter} className="w-48" />
        <Select options={[{ value: '', label: 'Todos os departamentos' }, ...departments.map(d => ({ value: d.id, label: d.name }))]} value={deptFilter} onChange={setDeptFilter} className="w-52" />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Colaborador', 'Departamento', 'Cargo', 'Perfil', 'Status', 'Admissão', ''].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={container} initial="hidden" animate="show">
              {filtered.map(user => (
                <motion.tr key={user.id} variants={item} className="border-b border-white/5 hover:bg-white/2 transition-colors group">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} src={user.avatar_url} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Building2 size={13} className="text-slate-600" />
                      {getDept(user.department_id)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">{getPos(user.position_id)}</td>
                  <td className="px-4 py-4"><StatusBadge status={user.role} /></td>
                  <td className="px-4 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(user.hire_date)}</td>
                  <td className="px-4 py-4">
                    <div className="relative">
                      <button onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                        <MoreVertical size={14} />
                      </button>
                      {menuOpen === user.id && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-8 w-48 glass-card rounded-xl border border-white/10 shadow-2xl z-20 overflow-hidden">
                          {[
                            { icon: <Edit2 size={13} />, label: 'Editar', action: () => openEdit(user) },
                            { icon: <Award size={13} />, label: 'Ver certificados', action: () => { setMenuOpen(null); toast('Em breve!'); } },
                            {
                              icon: user.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />,
                              label: user.status === 'active' ? 'Inativar' : 'Reativar',
                              action: () => handleToggleStatus(user),
                            },
                          ].map(action => (
                            <button key={action.label} onClick={action.action} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-left">
                              <span className="text-slate-500">{action.icon}</span>
                              {action.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-600">Nenhum usuário encontrado.</div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editUser ? 'Editar Colaborador' : 'Novo Colaborador'} size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              {editUser ? 'Salvar alterações' : 'Criar colaborador'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Nome completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="João da Silva" />
          </div>
          <div className="col-span-2">
            <Input label="E-mail" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="joao@saludigital.com.br" icon={<Mail size={14} />} disabled={!!editUser} />
          </div>
          {!editUser && (
            <div className="col-span-2">
              <Input label="Senha provisória" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
            </div>
          )}
          <Select label="Perfil de acesso" options={[{ value: 'employee', label: 'Colaborador' }, { value: 'manager', label: 'Gestor' }, { value: 'admin', label: 'Administrador' }]} value={form.role} onChange={v => setForm({ ...form, role: v })} />
          <Input label="Data de admissão" type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} />
          <Select label="Departamento" options={[{ value: '', label: 'Selecione...' }, ...departments.map(d => ({ value: d.id, label: d.name }))]} value={form.department_id} onChange={v => setForm({ ...form, department_id: v, position_id: '' })} />
          <Select label="Cargo" options={[{ value: '', label: 'Selecione...' }, ...positions.filter(p => !form.department_id || p.department_id === form.department_id).map(p => ({ value: p.id, label: p.name }))]} value={form.position_id} onChange={v => setForm({ ...form, position_id: v })} />
        </div>
      </Modal>
    </div>
  );
}
