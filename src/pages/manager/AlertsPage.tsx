import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Send, CheckCircle } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useAuthStore } from '../../store/authStore';
import { mockUsers, mockUserTracks } from '../../data/mock';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function AlertsPage() {
  const { user } = useAuthStore();
  const team = mockUsers.filter(u => u.manager_id === user?.id);
  const teamIds = team.map(u => u.id);
  const [notified, setNotified] = useState<string[]>([]);

  const overdueItems = mockUserTracks
    .filter(t => teamIds.includes(t.user_id) && (t.status === 'overdue' || t.status === 'not_started'))
    .map(t => ({ ...t, user: mockUsers.find(u => u.id === t.user_id) }));

  const sendNotification = (userId: string, name: string) => {
    setNotified(prev => [...prev, userId]);
    toast.success(`Notificação enviada para ${name}!`);
  };

  return (
    <div className="max-w-screen-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Alertas de Atraso</h2>
        <p className="text-slate-500 text-sm mt-1">{overdueItems.length} itens requerem sua atenção</p>
      </div>

      {overdueItems.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-emerald-400 font-medium">Tudo em dia!</p>
          <p className="text-slate-500 text-sm mt-1">Sua equipe está no prazo com todas as trilhas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {overdueItems.map((item, i) => {
            const isNotified = notified.includes(item.user_id);
            const isOverdue = item.status === 'overdue';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`glass-card rounded-2xl p-5 flex items-center gap-4 border
                  ${isOverdue ? 'border-red-500/20 bg-red-500/3' : 'border-amber-500/15 bg-amber-500/3'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isOverdue ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
                  {isOverdue ? <AlertTriangle size={18} className="text-red-400" /> : <Clock size={18} className="text-amber-400" />}
                </div>

                <Avatar name={item.user?.name ?? 'U'} size="sm" />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{item.user?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isOverdue ? 'Trilha vencida' : 'Trilha não iniciada'} · {item.progress_percent}% concluído
                  </p>
                  <ProgressBar value={item.progress_percent} size="xs" className="mt-2 max-w-xs" color={isOverdue ? 'red' : 'amber'} />
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isNotified ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                      <CheckCircle size={12} /> Notificado
                    </span>
                  ) : (
                    <button
                      onClick={() => sendNotification(item.user_id, item.user?.name ?? '')}
                      className="flex items-center gap-1.5 text-xs text-white bg-[#6B35B0]/20 border border-[#6B35B0]/30 hover:bg-[#6B35B0]/35 px-3 py-2 rounded-xl transition-all"
                    >
                      <Send size={12} /> Cobrar
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
