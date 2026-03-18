import React, { useState, useEffect } from 'react';
import { 
  Store as StoreIcon, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  MapPin
} from 'lucide-react';
import { api } from '../api';
import { UserProfile, Store } from '../types';

interface SettingsProps {
  user: UserProfile | null;
  store: Store | null;
}

const Settings: React.FC<SettingsProps> = ({ user, store: initialStore }) => {
  const [store, setStore] = useState<Store | null>(initialStore);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: initialStore?.name || '',
    address: initialStore?.address || '',
    phone: initialStore?.phone || '',
    receiptHeader: initialStore?.receiptHeader || '',
    receiptFooter: initialStore?.receiptFooter || ''
  });

  useEffect(() => {
    if (initialStore) {
      setStore(initialStore);
      setFormData({
        name: initialStore.name,
        address: initialStore.address,
        phone: initialStore.phone,
        receiptHeader: initialStore.receiptHeader,
        receiptFooter: initialStore.receiptFooter
      });
    }
  }, [initialStore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const updatedStore = await api.store.update(formData);
      setStore(updatedStore);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
        <p className="text-xs text-gray-500">Gerencie sua loja e recibos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <StoreIcon className="w-4 h-4 text-red-700" />
              Dados da Loja
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nome da Empresa</label>
              <div className="relative">
                <StoreIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Endereço</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={2}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <FileText className="w-4 h-4 text-red-700" />
              Recibos e Faturas
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Cabeçalho</label>
              <textarea 
                value={formData.receiptHeader}
                onChange={(e) => setFormData({...formData, receiptHeader: e.target.value})}
                rows={3}
                placeholder="Ex: NIF, Endereço, etc."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Rodapé</label>
              <textarea 
                value={formData.receiptFooter}
                onChange={(e) => setFormData({...formData, receiptFooter: e.target.value})}
                rows={3}
                placeholder="Ex: Obrigado pela preferência!"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        <div className="fixed bottom-24 left-0 right-0 px-8 pointer-events-none">
          <div className="max-w-[430px] mx-auto pointer-events-auto">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-red-700 text-white rounded-2xl font-bold shadow-xl hover:bg-red-800 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Salvar Alterações
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Configurações salvas!
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default Settings;
