import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Award, AlertTriangle, BookOpen, GitBranch } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import { ProgressBar, CircularProgress } from '../../components/ui/ProgressBar';
import { useAuthStore } from '../../store/authStore';
import { mockUsers, mockUserTracks, mockCourseProgress, mockCertificates, mockDepartments, mockPositions } from '../../data/mock';
import { Modal } from '../../components/ui/Modal';
import type { User } from '../../types';
import toast from 'react-hot-toast';

export function TeamPage() {
  const { user } = useAuthStore();
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const team = mockUsers.filter(u => u.manager_id === user?.id);

  const getMemberTracks = (userId: string) => mockUserTracks.filter(t => t.user_id === userId);
  const getMemberCourses = (userId: string) => mockCourseProgress.filter(c => c.user_id === userId);
  const getMemberCerts = (userId: string) => mockCertificates.filter(c => c.user_id === userId);
  const getMemberProgress = (userId: string) => {
    const tracks = getMemberTracks(userId);
    if (!tracks.length) return 0;
    return Math.round(tracks.reduce((a, t) => a + t.progress_percent, 0) / tracks.length);
  };

  const getDept = (id: string) => mockDepartments.find(d => d.id === id)?.name ?? '—';
  const getPos = (id: string) => mockPositions.find(p => p.id === id)?.name ?? '—';

  return (
    <div className="max-w-screen-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Minha Equipe</h2>
        <p className="text-slate-500 text-sm mt-1">{team.length} colaboradores sob sua gestão</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member, i) => {
          const tracks = getMemberTracks(member.id);
          const certs = getMemberCerts(member.id);
          const progress = getMemberProgress(member.id);
          const hasOverdue = tracks.some(t => t.status === 'overdue');

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setSelectedMember(member)}
              className={`glass-card rounded-2xl p-5 cursor-pointer hover:border-[#6B35B0]/25 transition-all group
                ${hasOverdue ? 'border border-red-500/20 bg-red-500/3' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatar_url} size="md" ring={hasOverdue} />
                  <div>
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-xs text-slate-500">{getPos(member.position_id)}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-[#9B6FD4] transition-colors mt-1" />
              </div>

              {hasOverdue && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5 mb-3">
                  <AlertTriangle size={11} />
                  Trilha vencida — requer atenção
                </div>
              )}

              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Progresso geral</span>
                  <span className="text-white font-semibold">{progress}%</span>
                </div>
                <ProgressBar value={progress} size="sm" />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <GitBranch size={12} />
                  {tracks.length} trilhas
                </div>
                <div className="flex items-center gap-1.5">
                  <Award size={12} className="text-amber-400" />
                  {certs.length} certificados
                </div>
                <StatusBadge status={member.status} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Member detail modal */}
      {selectedMember && (
        <Modal
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={selectedMember.name}
          size="lg"
          footer={
            <button
              onClick={() => { toast.success('Cobrança enviada por e-mail!'); setSelectedMember(null); }}
              className="btn-primary px-5 py-2.5 text-sm font-semibold rounded-xl text-white relative z-10"
            >
              Enviar cobrança
            </button>
          }
        >
          <div className="space-y-5">
            {/* Profile */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
              <Avatar name={selectedMember.name} src={selectedMember.avatar_url} size="lg" />
              <div>
                <p className="font-semibold text-white text-lg">{selectedMember.name}</p>
                <p className="text-slate-400 text-sm">{selectedMember.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedMember.role} />
                  <span className="text-xs text-slate-600">{getDept(selectedMember.department_id)}</span>
                </div>
              </div>
              <div className="ml-auto">
                <CircularProgress value={getMemberProgress(selectedMember.id)} size={70} />
              </div>
            </div>

            {/* Tracks */}
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-2">Trilhas</h4>
              <div className="space-y-2">
                {getMemberTracks(selectedMember.id).map(track => (
                  <div key={track.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                    <GitBranch size={14} className="text-[#9B6FD4] flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-white">Trilha {track.track_id}</span>
                        <StatusBadge status={track.status} />
                      </div>
                      <ProgressBar value={track.progress_percent} size="xs" showLabel />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificates */}
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-2">Certificados ({getMemberCerts(selectedMember.id).length})</h4>
              <div className="space-y-2">
                {getMemberCerts(selectedMember.id).map(cert => (
                  <div key={cert.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <Award size={14} className="text-amber-400" />
                    <span className="text-sm text-white flex-1">Curso {cert.course_id}</span>
                    <span className="text-xs text-slate-500 font-mono">{cert.certificate_code}</span>
                  </div>
                ))}
                {getMemberCerts(selectedMember.id).length === 0 && (
                  <p className="text-sm text-slate-600 text-center py-4">Nenhum certificado ainda</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
