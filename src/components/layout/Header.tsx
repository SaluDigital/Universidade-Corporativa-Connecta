import { motion } from 'framer-motion';
import { Bell, Search, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../ui/Avatar';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-[#070711]/80 backdrop-blur-xl"
    >
      {/* Title */}
      <div className="flex-1">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
      </div>

      {/* Search */}
      <motion.div
        animate={{ width: searchOpen ? 280 : 40 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative overflow-hidden"
      >
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors z-10"
        >
          <Search size={16} />
        </button>
        {searchOpen && (
          <motion.input
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            placeholder="Buscar..."
            autoFocus
            onBlur={() => setSearchOpen(false)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:border-[#6B35B0]/40"
          />
        )}
        {!searchOpen && (
          <div className="w-10 h-10 flex items-center justify-center rounded-xl glass hover:bg-white/10 transition-all cursor-pointer">
            <Search size={16} className="text-slate-500" />
          </div>
        )}
      </motion.div>

      {/* Notifications */}
      <button className="relative w-10 h-10 flex items-center justify-center rounded-xl glass hover:bg-white/10 transition-all">
        <Bell size={16} className="text-slate-400" />
        <span className="absolute top-2 right-2 w-2 h-2 bg-[#6B35B0] rounded-full" />
      </button>

      {/* AI Badge */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6B35B0]/10 border border-[#6B35B0]/20 text-white text-xs font-semibold">
        <Zap size={11} />
        SaluDigital LMS
      </div>

      {/* Avatar */}
      {user && <Avatar name={user.name} src={user.avatar_url} size="sm" ring />}
    </motion.header>
  );
}
