import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  ArrowRightLeft, 
  Printer, 
  X, 
  CheckCircle2, 
  Barcode,
  Camera,
  Loader2,
  AlertCircle,
  Package
} from 'lucide-react';
import { api } from '../api';
import { UserProfile, Store, Product, SaleItem, Sale } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { generateReceiptPDF } from '../utils/pdfGenerator';

interface POSProps {
  user: UserProfile | null;
  store: Store | null;
}

const POS: React.FC<POSProps> = ({ user, store }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [error, setError] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!store) return;
    fetchProducts();
  }, [store]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const items = await api.products.list();
      setProducts(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode?.includes(search) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      setError(`Produto ${product.name} sem estoque!`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        setError(`Estoque insuficiente para ${product.name}`);
        setTimeout(() => setError(''), 3000);
        return;
      }
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.sellPrice,
        total: product.sellPrice
      }]);
    }
    setSearch('');
    searchInputRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty > product.stock) {
          setError(`Estoque insuficiente para ${product.name}`);
          setTimeout(() => setError(''), 3000);
          return item;
        }
        return newQty === 0 ? null : { ...item, quantity: newQty, total: newQty * item.price };
      }
      return item;
    }).filter(Boolean) as SaleItem[]);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const change = receivedAmount > subtotal ? receivedAmount - subtotal : 0;

  const handleCheckout = async () => {
    if (cart.length === 0 || !store || !user) return;
    setProcessing(true);
    setError('');

    try {
      // 1. Create Sale Record
      const saleData = {
        items: cart,
        total: subtotal,
        paymentMethod,
        cashierId: user.uid,
        storeId: store.id,
        timestamp: new Date().toISOString()
      };

      const sale = await api.sales.create(saleData);
      setLastSale(sale);

      // 2. Log Action
      await api.logs.create({
        userId: user.uid,
        action: 'venda_realizada',
        description: `Venda #${sale.id.slice(-6)} no valor de Kz ${subtotal}`,
        storeId: store.id
      });

      setShowCheckout(false);
      setShowSuccess(true);
      setCart([]);
      setReceivedAmount(0);
      fetchProducts(); // Refresh stock locally
    } catch (err) {
      console.error(err);
      setError('Erro ao processar venda. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    if (lastSale) {
      generateReceiptPDF(lastSale, store);
    }
  };

  const [showCart, setShowCart] = useState(false);

  return (
    <div className="flex flex-col h-full relative">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col min-w-0 pb-24">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 sticky top-0 z-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar produtos..."
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-red-700" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <motion.button
                  key={product.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToCart(product)}
                  className={`bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-left flex flex-col h-full transition-all group ${
                    product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'active:border-red-200'
                  }`}
                >
                  <div className="aspect-square bg-gray-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="text-gray-300" size={24} />
                    )}
                    {product.stock <= product.minStock && product.stock > 0 && (
                      <div className="absolute top-1 right-1 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        Baixo
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-800 text-xs mb-1 line-clamp-1">{product.name}</h4>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-red-700 font-bold text-xs">Kz {product.sellPrice.toLocaleString()}</span>
                    <span className="text-[9px] text-gray-400">{product.stock} un</span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && !showCart && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-30 font-bold"
        >
          <ShoppingCart size={20} className="text-gold" />
          <span>Ver Carrinho ({cart.reduce((acc, item) => acc + item.quantity, 0)})</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">Kz {subtotal.toLocaleString()}</span>
        </motion.button>
      )}

      {/* Cart Overlay / Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white z-[60] shadow-2xl rounded-t-[2.5rem] flex flex-col max-h-[85%] sm:w-[430px] sm:left-1/2 sm:-translate-x-1/2"
            >
              <div className="p-6 bg-red-800 text-white flex items-center justify-between rounded-t-[2.5rem]">
                <div className="flex items-center gap-3">
                  <ShoppingCart size={24} className="text-gold" />
                  <h3 className="text-xl font-bold">Carrinho</h3>
                </div>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-red-700 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-bold text-gray-800 truncate">{item.name}</h5>
                      <p className="text-xs text-gray-500">Kz {item.price.toLocaleString()} / un</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 text-gray-500"><Minus size={14} /></button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 text-gray-500"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="p-2 text-gray-300"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4 pb-10">
                <div className="flex items-center justify-between text-xl">
                  <span className="text-gray-800 font-black">TOTAL</span>
                  <span className="text-red-700 font-black">Kz {subtotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-red-700 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3"
                >
                  Finalizar Venda
                  <ArrowRightLeft size={20} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="bg-red-800 p-6 text-white flex items-center justify-between">
                <h3 className="text-xl font-bold">Pagamento</h3>
                <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-red-700 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="text-center">
                  <p className="text-gray-500 mb-1">Total a Pagar</p>
                  <h2 className="text-4xl font-black text-red-700">Kz {subtotal.toLocaleString()}</h2>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'cash', label: 'Dinheiro', icon: Banknote },
                    { id: 'card', label: 'Cartão', icon: CreditCard },
                    { id: 'transfer', label: 'Transfer.', icon: ArrowRightLeft }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        paymentMethod === method.id 
                          ? 'border-red-700 bg-red-50 text-red-700 shadow-md' 
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <method.icon size={28} />
                      <span className="text-sm font-bold">{method.label}</span>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'cash' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 block">Valor Recebido</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Kz</span>
                        <input
                          type="number"
                          value={receivedAmount || ''}
                          onChange={(e) => setReceivedAmount(Number(e.target.value))}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-700 outline-none transition-all text-2xl font-bold text-gray-800"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <span className="text-emerald-700 font-bold">Troco</span>
                      <span className="text-2xl font-black text-emerald-700">Kz {change.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={processing || (paymentMethod === 'cash' && receivedAmount < subtotal)}
                  className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                  Confirmar Pagamento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Venda Concluída!</h3>
              <p className="text-gray-500 mb-8">A venda foi registrada com sucesso e o estoque atualizado.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 bg-gray-800 text-white font-bold py-4 rounded-2xl hover:bg-gray-900 transition-all"
                >
                  <Printer size={20} />
                  Imprimir
                </button>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="bg-red-700 text-white font-bold py-4 rounded-2xl hover:bg-red-800 transition-all"
                >
                  Nova Venda
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <AlertCircle size={24} />
            <p className="font-bold">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POS;
