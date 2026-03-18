import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Store as StoreIcon,
  FileText,
  History,
  ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Store } from '../types';
import { useNavigate, useLocation, Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  store: Store | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, store, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    onLogout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Início', path: '/', roles: ['admin', 'manager', 'cashier'] },
    { icon: ShoppingCart, label: 'Vendas', path: '/pos', roles: ['admin', 'manager', 'cashier'] },
    { icon: Package, label: 'Estoque', path: '/inventory', roles: ['admin', 'manager'] },
    { icon: ArrowLeftRight, label: 'Movimentos', path: '/movements', roles: ['admin', 'manager'] },
    { icon: TrendingUp, label: 'Financeiro', path: '/finance', roles: ['admin', 'manager'] },
    { icon: FileText, label: 'Relatórios', path: '/reports', roles: ['admin', 'manager'] },
    { icon: History, label: 'Auditoria', path: '/logs', roles: ['admin', 'manager'] },
    { icon: Users, label: 'Usuários', path: '/users', roles: ['admin'] },
    { icon: Settings, label: 'Ajustes', path: '/settings', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => user && item.roles.includes(user.role));
  
  // Primary items for bottom nav
  const bottomNavItems = filteredMenuItems.slice(0, 4);
  // Rest for the side menu
  const sideMenuItems = filteredMenuItems.slice(4);

  return (
    <div className="min-h-full bg-gray-50 flex flex-col pb-20">
      {/* Top Header */}
      <header className="bg-red-800 text-white p-4 sticky top-0 z-40 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-inner">
            <StoreIcon className="text-red-900" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">LUDY soft</h1>
            <p className="text-[10px] text-gold-light opacity-80 uppercase tracking-widest">{store?.name || 'ERP/POS'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-red-700 rounded-full transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[280px] bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-red-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl border border-white/30">
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{user?.displayName}</p>
                    <p className="text-xs text-red-200 capitalize">{user?.role}</p>
                  </div>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-red-700 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 py-4 overflow-y-auto">
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-2">
                  Menu Principal
                </div>
                {filteredMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-4 px-6 py-4 transition-all ${
                      location.pathname === item.path 
                        ? 'bg-red-50 text-red-800 border-r-4 border-red-800 font-bold' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon size={20} className={location.pathname === item.path ? 'text-red-800' : 'text-gray-400'} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="p-6 border-t border-gray-100">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-4 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold"
                >
                  <LogOut size={20} />
                  <span>Sair do Sistema</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around px-2 py-3 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] sm:w-[430px] sm:left-1/2 sm:-translate-x-1/2 sm:rounded-t-3xl sm:border-x sm:border-gray-800">
        {bottomNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
              location.pathname === item.path 
                ? 'text-red-800' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${location.pathname === item.path ? 'bg-red-100' : ''}`}>
              <item.icon size={22} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1 text-gray-400"
        >
          <div className="p-2">
            <Menu size={22} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Mais</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
