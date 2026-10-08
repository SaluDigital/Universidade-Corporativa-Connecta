import { motion } from 'framer-motion';
import { Award, Download, Users } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import { mockUsers, mockCertificates, mockCourses } from '../../data/mock';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function ManagerCertificatesPage() {
  const { user } = useAuthStore();
  const team = mockUsers.filter(u => u.manager_id === user?.id);
  const teamIds = team.map(u => u.id);
  const teamCerts = mockCertificates.filter(c => teamIds.includes(c.user_id)).map(cert => ({
    ...cert,
    user: mockUsers.find(u => u.id === cert.user_id),
    course: mockCourses.find(c => c.id === cert.course_id),
  }));

  return (
    <div className="max-w-screen-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Certificados da Equipe</h2>
          <p className="text-slate-500 text-sm mt-1">{teamCerts.length} certificados emitidos</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 glass px-4 py-2 rounded-xl border border-white/5">
          <Users size={14} />
          {team.length} colaboradores
        </div>
      </div>

      {teamCerts.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Award size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum certificado emitido ainda</p>
          <p className="text-slate-600 text-sm mt-1">Os certificados aparecerão aqui quando seus colaboradores concluírem os cursos.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamCerts.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl overflow-hidden hover:border-amber-500/20 transition-all"
            >
              <div className="bg-gradient-to-br from-amber-600/20 to-orange-900/10 p-5">
                <div className="flex items-center justify-between">
                  <Award size={28} className="text-amber-400" />
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">Válido</span>
                </div>
                <h4 className="font-bold text-white mt-3 line-clamp-2">{cert.course?.title}</h4>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={cert.user?.name ?? 'U'} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-white">{cert.user?.name}</p>
                    <p className="text-xs text-slate-500">{formatDate(cert.issued_at)}</p>
                  </div>
                </div>
                <button
                  onClick={() => toast('Baixando certificado...')}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-all"
                >
                  <Download size={12} /> Baixar PDF
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
