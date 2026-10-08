import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*, department:departments(*), position:positions(*)')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        set({ user: profile as User, isAuthenticated: true, loading: false });
        return;
      }
    }

    set({ loading: false });

    // Ouvir mudanças de sessão (login/logout em outra aba, token refresh)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*, department:departments(*), position:positions(*)')
          .eq('id', session.user.id)
          .single();

        set({ user: profile as User ?? null, isAuthenticated: !!profile });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    });
  },

  login: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.session) return false;

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*, department:departments(*), position:positions(*)')
        .eq('id', data.session.user.id)
        .single();

      if (profileError || !profile) return false;

      set({ user: profile as User, isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user: User) => set({ user }),
}));

export const getRoleLabel = (role: UserRole): string => {
  const labels = { admin: 'Administrador', manager: 'Gestor', employee: 'Colaborador' };
  return labels[role];
};
