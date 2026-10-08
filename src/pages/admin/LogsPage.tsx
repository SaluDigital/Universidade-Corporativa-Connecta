import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, BookOpen, Award, GitBranch, Shield, Loader2 } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { getActivityFeed } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

const actionConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CREATE_USER:      { label: 'Criou usuário',     icon: <User size={13} />,      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  ASSIGN_TRACK:     { label: 'Atribuiu trilha',   icon: <GitBranch size={13} />, color: 'text-[#FEFEFE] bg-[#FEFEFE]/10 border-[#FEFEFE]/20' },
  COMPLETE_LESSON:  { label: 'Concluiu aula',     icon: <BookOpen size={13} />,  color: 'text-[#FF9C3A] bg-[#FF9C3A]/10 border-[#FF9C3A]/20' },
  CREATE_COURSE:    { label: 'Criou curso',       icon: <BookOpen size={13} />,  color: 'text-[#FF9C3A] bg-[#FF9C3A]/10 border-[#FF9C3A]/20' },
  SUBMIT_QUIZ:      { label: 'Enviou avaliação',  icon: <Shield size={13} />,    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ISSUE_CERTIFICATE:{ label: 'Emitiu certificado',icon: <Award size={13} />,     color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
};

export function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await getActivityFeed();
        if (error) throw error;
        setLogs(data ?? []);
      } catch (error) {
        console.error('[LogsPage] Erro ao carregar dados:', error);
        toast.error('Não foi possível carregar os dados. Tente novamente.');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = logs.filter(log => {
    const matchSearch = !search ||
      log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const matchAction = !actionFilter || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#FF9C3A]" />
    </div>
  );

  return (
    <div className="max-w-screen-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Logs de Auditoria</h2>
          <p className="text-[#737373] text-sm mt-1">Histórico completo de ações no sistema</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#FF9C3A] bg-[#FF9C3A]/10 border border-[#FF9C3A]/20 px-3 py-2 rounded-xl">
          <Shield size={13} />
          {filtered.length} registros
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuário ou ação..." className="input-base pl-10" />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="input-base w-48 appearance-none">
          <option value="">Todas as ações</option>
          {Object.keys(actionConfig).map(a => (
            <option key={a} value={a} style={{ background: '#0D0D0D' }}>{actionConfig[a].label}</option>
          ))}
        </select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Usuário', 'Ação', 'Entidade', 'IP', 'Data/Hora'].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-[#737373] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => {
                const action = actionConfig[log.action];
                return (
                  <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={log.user?.name ?? 'S'} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-white">{log.user?.name ?? 'Sistema'}</p>
                          <p className="text-xs text-[#666666] capitalize">{log.user?.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {action ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${action.color}`}>
                          {action.icon}{action.label}
                        </span>
                      ) : (
                        <span className="text-xs text-[#737373] font-mono">{log.action}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-[#737373] max-w-xs"><span className="truncate block">{log.meta ?? `${log.entity_type}:${log.entity_id}`}</span></td>
                    <td className="px-5 py-4 text-xs text-[#666666] font-mono">{log.ip_address ?? '—'}</td>
                    <td className="px-5 py-4 text-xs text-[#737373] whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-[#666666]">Nenhum log encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
}
