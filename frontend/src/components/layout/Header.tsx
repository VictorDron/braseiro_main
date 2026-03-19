import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Search, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-dark-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <AnimatePresence>
          {searchOpen ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="relative"
            >
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="input-field pl-9 py-1.5 text-sm"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            </motion.div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg hover:bg-dark-100 transition-colors text-dark-400"
            >
              <Search size={18} />
            </button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-dark-100 transition-colors text-dark-400">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-dark-200">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-dark-800 leading-tight">{user?.name}</p>
            <p className="text-[11px] text-dark-400 leading-tight">
              {user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
