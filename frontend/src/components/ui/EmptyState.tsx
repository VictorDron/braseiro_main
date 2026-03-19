import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-16 h-16 rounded-full bg-dark-100 flex items-center justify-center text-dark-300 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-dark-800 mb-1">{title}</h3>
      <p className="text-sm text-dark-400 text-center max-w-sm mb-4">{description}</p>
      {action}
    </motion.div>
  );
}
