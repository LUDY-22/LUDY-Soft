import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  User as UserIcon,
  Loader2,
  X,
  Mail,
  UserCheck,
  UserX
} from 'lucide-react';
import { api } from '../api';
import { UserProfile, Store } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface UsersProps {
  user: UserProfile | null;
  store: Store | null;
}

const Users: React.FC<UsersProps> = ({ user, store }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'operator' as 'admin' | 'manager' | 'operator',
    password: ''
  });

  useEffect(() => {
    if (!store) return;
    fetchUsers();
  }, [store]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await api.users.list();
      setUsers(allUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.users.create(formData);
      setShowModal(false);
      setFormData({ name: '', email: '', role: 'operator', password: '' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar usuário. Verifique se o email já existe.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
          <p className="text-xs text-gray-500">Equipe e permissões</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="p-2 bg-red-700 text-white rounded-xl shadow-lg hover:bg-red-800 transition-all"
        >
          <UserPlus size={20} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input 
          type="text"
          placeholder="Pesquisar usuário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-red-700" size={32} />
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <UserIcon size={24} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 text-sm truncate">{u.name}</h4>
                <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                  <Mail size={10} /> {u.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                    u.role === 'admin' ? 'bg-red-50 text-red-600' : 
                    u.role === 'manager' ? 'bg-blue-50 text-blue-600' : 
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {u.role}
                  </span>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
                <MoreVertical size={18} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>

      {/* Modal Novo Usuário */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Novo Usuário</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Nome Completo</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Cargo / Função</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="operator">Operador</option>
                      <option value="manager">Gerente</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Senha Inicial</label>
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-red-700 text-white rounded-2xl font-bold shadow-lg hover:bg-red-800 transition-all mt-4"
                >
                  Criar Usuário
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
