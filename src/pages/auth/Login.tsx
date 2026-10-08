import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { GraduationCap, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [stats, setStats] = useState({ courses: 0, tracks: 0, certificates: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: courses }, { count: tracks }, { count: certificates }] = await Promise.all([
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('tracks').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('certificates').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ courses: courses ?? 0, tracks: tracks ?? 0, certificates: certificates ?? 0 });
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setErrorMsg('');
    setLoading(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        const { user } = useAuthStore.getState();
        if (user?.role === 'admin') navigate('/admin');
        else if (user?.role === 'manager') navigate('/manager');
        else navigate('/employee');
      } else {
        setErrorMsg('E-mail ou senha incorretos.');
      }
    } catch {
      setErrorMsg('Erro ao conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e1e3a', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' } }} />
      {/* Left panel */}
      <div className="hidden lg:flex w-[55%] relative flex-col items-center justify-center p-16">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#070711] via-[#0d0d25] to-[#070711]">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6B35B0]/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4BC8C8]/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-3/4 left-1/3 w-48 h-48 bg-[#4BC8C8]/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Floating cards decoration */}
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [-2, 2, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-16 glass p-4 rounded-2xl border border-white/10 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <span className="text-emerald-400 text-lg">✓</span>
            </div>
            <div>
              <p className="text-xs text-slate-400">Trilha concluída</p>
              <p className="text-sm font-semibold text-white">Onboarding Geral</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [10, -10, 10], rotate: [1, -1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-32 left-16 glass p-4 rounded-2xl border border-white/10 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏆</span>
            </div>
            <div>
              <p className="text-xs text-slate-400">Certificado emitido</p>
              <p className="text-sm font-semibold text-white">CRM e Funil</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [-5, 15, -5] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-1/2 left-8 glass p-4 rounded-2xl border border-white/10 shadow-xl"
        >
          <div className="text-center">
            <p className="text-2xl font-bold gradient-text">94%</p>
            <p className="text-xs text-slate-500">Taxa de conclusão</p>
          </div>
        </motion.div>

        {/* Main content */}
        <div className="relative z-10 text-center max-w-lg">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            className="w-24 h-24 bg-gradient-to-br from-[#6B35B0] to-[#4BC8C8] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#6B35B0]/40"
          >
            <GraduationCap size={44} className="text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-black text-white mb-4 leading-tight"
          >
            SaluDigital
            <span className="block gradient-text">Academy</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 text-lg leading-relaxed"
          >
            A plataforma de aprendizagem que transforma colaboradores em protagonistas do crescimento.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-8 mt-10"
          >
            {[
              { value: stats.courses, label: 'Cursos' },
              { value: stats.tracks, label: 'Trilhas' },
              { value: stats.certificates, label: 'Certificados' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Right panel — Login form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[#0a0a1a]" />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6B35B0] to-[#4BC8C8] rounded-xl flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white">SaluDigital</p>
              <p className="text-[#4BC8C8] text-xs">SaluDigital Academy</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta</h2>
            <p className="text-slate-500">Continue sua jornada de aprendizado</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">E-mail corporativo</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@saludigital.com.br"
                  className="input-base pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#6B35B0] to-[#4BC8C8] hover:from-[#7D45C5] hover:to-[#5DDADA] text-white font-semibold transition-all shadow-lg shadow-[#6B35B0]/25 hover:shadow-[#6B35B0]/40 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar na plataforma <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6">
            SaluDigital Academy © 2026
          </p>
        </motion.div>
      </div>
    </div>
  );
}
