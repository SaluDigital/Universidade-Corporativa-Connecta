import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center text-4xl mb-6 text-[#737373]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#D4D4D4] mb-2">{title}</h3>
      {description && <p className="text-[#737373] text-sm max-w-xs mb-6">{description}</p>}
      {action}
    </motion.div>
  );
}
