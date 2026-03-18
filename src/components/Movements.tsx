import React, { useState, useEffect } from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Search, 
  Plus, 
  Loader2, 
  History,
  Package,
  X
} from 'lucide-react';
import { api } from '../api';
import { UserProfile, Store, Product } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  timestamp: string;
  userId: string;
}

interface MovementsProps {
  user: UserProfile | null;
  store: Store | null;
}

const Movements: React.FC<MovementsProps> = ({ user, store }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    type: 'in' as 'in' | 'out',
    quantity: 1,
    reason: ''
  });

  useEffect(() => {
    if (!store) return;
    fetchData();
  }, [store]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [movs, prods] = await Promise.all([
        api.movements.list(),
        api.products.list()
      ]);
      setMovements(movs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    try {
      await api.movements.create({
        ...formData,
        productName: product.name
      });
      setShowModal(false);
      setFormData({ productId: '', type: 'in', quantity: 1, reason: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMovements = movements.filter(m => 
    m.productName.toLowerCase().includes(search.toLowerCase()) ||
    m.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Movimentações</h1>
          <p className="text-xs text-gray-500">Entradas e saídas de estoque</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="p-2 bg-red-700 text-white rounded-xl shadow-lg hover:bg-red-800 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input 
          type="text"
          placeholder="Pesquisar movimentação..."
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
        ) : filteredMovements.length > 0 ? (
          filteredMovements.map((mov) => (
            <div key={mov.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                mov.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {mov.type === 'in' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 text-sm truncate">{mov.productName}</h4>
                <p className="text-[10px] text-gray-500 truncate">{mov.reason || (mov.type === 'in' ? 'Entrada manual' : 'Saída manual')}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {format(new Date(mov.timestamp), 'dd MMM, HH:mm', { locale: ptBR })}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${mov.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {mov.type === 'in' ? '+' : '-'}{mov.quantity}
                </p>
                <p className="text-[10px] text-gray-400 uppercase font-bold">{mov.type === 'in' ? 'Entrada' : 'Saída'}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            Nenhuma movimentação encontrada.
          </div>
        )}
      </div>

      {/* Modal Entradas/Saídas */}
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
                <h3 className="text-lg font-bold text-gray-900">Nova Movimentação</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Produto</label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Selecionar produto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Estoque: {p.stock})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'in' | 'out' })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="in">Entrada (+)</option>
                      <option value="out">Saída (-)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Quantidade</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Motivo / Observação</label>
                  <input
                    type="text"
                    placeholder="Ex: Reposição de estoque, Ajuste..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-red-700 text-white rounded-2xl font-bold shadow-lg hover:bg-red-800 transition-all mt-4"
                >
                  Registrar Movimentação
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Movements;
