import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  title?: string;
  subtitle?: string;
}

export function Layout({ title = 'Universidade Corporativa', subtitle }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-[#050505] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#FF9C3A]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-white/4 rounded-full blur-[100px]" />
      </div>

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header title={title} subtitle={subtitle} />

        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#141414',
            color: '#FEFEFE',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#141414' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#141414' } },
        }}
      />
    </div>
  );
}
