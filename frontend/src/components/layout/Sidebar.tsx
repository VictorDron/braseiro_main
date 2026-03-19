import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ScrollText,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/assets', icon: Package, label: 'Patrimônio' },
  { to: '/procurement', icon: ShoppingCart, label: 'Compras' },
];

const adminItems = [
  { to: '/users', icon: Users, label: 'Usuários' },
  { to: '/audit', icon: ScrollText, label: 'Auditoria' },
];

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      className="relative flex flex-col bg-white border-r border-dark-200"
      animate={{ width: open ? 240 : 68 }}
      transition={{ duration: 0.2 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-200">
        <div className="flex items-center justify-center w-9 h-9 bg-primary-500 rounded-lg flex-shrink-0">
          <span className="text-white font-display font-bold text-sm">B</span>
        </div>
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-display font-semibold text-lg text-dark-800 whitespace-nowrap overflow-hidden"
            >
              Braseiro
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-dark-200 rounded-full flex items-center justify-center hover:bg-dark-50 transition-colors z-10 shadow-sm"
      >
        <ChevronLeft
          size={12}
          className={`text-dark-500 transition-transform ${!open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {open && (
          <span className="px-3 mb-2 block text-[10px] font-semibold text-dark-400 uppercase tracking-widest">
            Principal
          </span>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-800 font-medium'
                  : 'text-dark-500 hover:text-dark-800 hover:bg-dark-50'
              }`
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            <AnimatePresence>
              {open && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            {open && (
              <span className="px-3 mt-6 mb-2 block text-[10px] font-semibold text-dark-400 uppercase tracking-widest">
                Administração
              </span>
            )}
            {!open && <div className="my-3 mx-3 border-t border-dark-200" />}
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-800 font-medium'
                      : 'text-dark-500 hover:text-dark-800 hover:bg-dark-50'
                  }`
                }
              >
                <item.icon size={18} className="flex-shrink-0" />
                <AnimatePresence>
                  {open && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-dark-200">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary-700">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-dark-800 truncate">{user?.name}</p>
                <p className="text-xs text-dark-400 truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 mt-1 rounded-lg text-dark-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut size={16} className="flex-shrink-0" />
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
