import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Search, RefreshCw, Shield, Calendar, BookOpen, Hash, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { getCertificates } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await getCertificates();
      setCertificates(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = certificates.filter(cert =>
    !search ||
    cert.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    cert.course?.title?.toLowerCase().includes(search.toLowerCase()) ||
    cert.certificate_code?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );

  return (
    <div className="max-w-screen-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Certificados Emitidos</h2>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} certificados encontrados</p>
        </div>
        <Button variant="secondary" icon={<Download size={15} />} onClick={() => toast('Exportando...')}>
          Exportar CSV
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por colaborador, curso ou código..." className="input-base pl-10" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cert, i) => (
          <motion.div key={cert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl overflow-hidden group hover:border-amber-500/20 transition-all hover:shadow-xl hover:shadow-amber-500/5"
          >
            <div className="relative bg-gradient-to-br from-amber-600/20 to-orange-900/10 p-5 border-b border-white/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Award size={24} className="text-amber-400" />
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                  <Shield size={11} /> Válido
                </div>
              </div>
              <h4 className="font-bold text-white mt-4 line-clamp-2">{cert.course?.title}</h4>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={cert.user?.name ?? 'U'} size="sm" />
                <div>
                  <p className="text-sm font-medium text-white">{cert.user?.name}</p>
                  <p className="text-xs text-slate-500">{cert.user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><Calendar size={11} />{formatDate(cert.issued_at)}</div>
                <div className="flex items-center gap-1.5"><BookOpen size={11} />{cert.course?.workload_hours}h</div>
                <div className="flex items-center gap-1.5 col-span-2"><Hash size={11} /><span className="font-mono text-slate-600 truncate">{cert.certificate_code}</span></div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => toast('Baixando certificado...')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-all">
                  <Download size={12} /> Baixar PDF
                </button>
                <button onClick={() => toast.success('Certificado reenviado!')} className="flex items-center justify-center p-2 rounded-xl glass border border-white/10 text-slate-500 hover:text-white hover:border-[#6B35B0]/20 transition-all" title="Reemitir">
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Award size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum certificado encontrado.</p>
        </div>
      )}
    </div>
  );
}
