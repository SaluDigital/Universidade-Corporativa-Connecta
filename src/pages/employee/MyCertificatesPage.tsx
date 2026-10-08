import { motion } from 'framer-motion';
import { Award, Download, Shield, Calendar, Hash, Clock, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getUserCertificates } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { useState, useEffect } from 'react';

export function MyCertificatesPage() {
  const { user } = useAuthStore();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserCertificates(user.id).then(({ data }) => {
      setCerts(data ?? []);
      setLoading(false);
    });
  }, [user]);

  const handleDownload = (cert: any) => {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Certificado — ${cert.course?.title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .cert { width: 794px; padding: 60px 70px; border: 8px solid #6B35B0; border-radius: 16px; position: relative; background: #fff; }
  .cert::before { content: ''; position: absolute; inset: 12px; border: 2px solid #e9d9ff; border-radius: 10px; pointer-events: none; }
  .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
  .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg,#6B35B0,#4BC8C8); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .logo-icon svg { width: 28px; height: 28px; fill: none; stroke: #fff; stroke-width: 2; }
  .logo-text { font-size: 18px; font-weight: 700; color: #6B35B0; }
  .logo-sub { font-size: 12px; color: #888; }
  .label { font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #9B6FD4; text-transform: uppercase; margin-bottom: 8px; }
  .title { font-size: 36px; font-weight: 900; color: #1a1a2e; margin-bottom: 24px; line-height: 1.2; }
  .certifies { font-size: 14px; color: #666; margin-bottom: 6px; }
  .name { font-size: 32px; font-weight: 700; color: #6B35B0; margin-bottom: 6px; }
  .completed { font-size: 14px; color: #666; margin-bottom: 4px; }
  .course { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 32px; }
  .divider { height: 2px; background: linear-gradient(90deg,#6B35B0,#4BC8C8); border-radius: 2px; margin: 32px 0; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; }
  .meta { font-size: 12px; color: #888; line-height: 1.8; }
  .meta strong { color: #444; }
  .seal { text-align: center; }
  .seal-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg,#6B35B0,#4BC8C8); display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; }
  .seal-circle svg { width: 40px; height: 40px; fill: none; stroke: #fff; stroke-width: 2; }
  .seal-text { font-size: 10px; color: #9B6FD4; font-weight: 600; letter-spacing: 1px; }
  .badge { display: inline-flex; align-items: center; gap: 4px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="cert">
  <div class="logo">
    <div class="logo-icon">
      <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    </div>
    <div>
      <div class="logo-text">SaluDigital Academy</div>
      <div class="logo-sub">Universidade Corporativa</div>
    </div>
    <div style="margin-left:auto"><span class="badge">✓ Válido</span></div>
  </div>

  <div class="label">Certificado de Conclusão</div>
  <div class="certifies">Certificamos que</div>
  <div class="name">${cert.user?.name ?? user?.name}</div>
  <div class="completed">concluiu com êxito o curso</div>
  <div class="course">${cert.course?.title}</div>

  <div class="divider"></div>

  <div class="footer">
    <div class="meta">
      <div><strong>Data de emissão:</strong> ${new Date(cert.issued_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      ${cert.course?.workload_hours ? `<div><strong>Carga horária:</strong> ${cert.course.workload_hours} horas</div>` : ''}
      <div><strong>Código:</strong> ${cert.certificate_code}</div>
    </div>
    <div class="seal">
      <div class="seal-circle">
        <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <div class="seal-text">APROVADO</div>
    </div>
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      toast.error('Permita popups para baixar o certificado');
      return;
    }
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} colors={['#6B35B0', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b']} />}

      <div>
        <h2 className="text-2xl font-bold text-white">Meus Certificados</h2>
        <p className="text-slate-500 text-sm mt-1">{certs.length} certificado{certs.length !== 1 ? 's' : ''} obtido{certs.length !== 1 ? 's' : ''}</p>
      </div>

      {certs.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Award size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-medium text-lg">Nenhum certificado ainda</p>
          <p className="text-slate-600 text-sm mt-2">Conclua seus cursos para ganhar certificados.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {certs.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: 'spring', damping: 15 }}
              className="glass-card rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-amber-500/10 transition-all group"
            >
              <div className="relative bg-gradient-to-br from-amber-600/25 via-orange-600/15 to-red-900/10 p-6 border-b border-white/5">
                <div className="absolute inset-0 opacity-5" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, rgba(251,191,36,0.1) 0px, rgba(251,191,36,0.1) 1px, transparent 1px, transparent 10px)'
                }} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                        <Award size={20} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-amber-400/70 font-semibold uppercase tracking-wide">Certificado</p>
                        <p className="text-xs text-slate-500">de Conclusão</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                      <Shield size={11} /> Válido
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs mb-1">Certificamos que</p>
                  <p className="text-white font-bold text-lg">{user?.name}</p>
                  <p className="text-slate-400 text-xs mt-1">concluiu com êxito o curso</p>
                  <h3 className="text-white font-semibold text-base mt-1 leading-snug">{cert.course?.title}</h3>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-slate-600" />
                    {formatDate(cert.issued_at)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-slate-600" />
                    {cert.course?.workload_hours}h de conteúdo
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Hash size={11} className="text-slate-600" />
                    <span className="font-mono text-slate-600 truncate text-xs">{cert.certificate_code}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(cert)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/25 text-xs font-semibold text-amber-400 hover:from-amber-600/30 hover:to-orange-600/30 transition-all"
                >
                  <Download size={13} /> Baixar / Imprimir certificado
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
