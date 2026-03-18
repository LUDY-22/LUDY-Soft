import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Printer, 
  Loader2, 
  History,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { api } from '../api';
import { UserProfile, Store, Sale } from '../types';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateReceiptPDF, generateInvoicePDF } from '../utils/pdfGenerator';

interface ReportsProps {
  user: UserProfile | null;
  store: Store | null;
}

const Reports: React.FC<ReportsProps> = ({ user, store }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    if (!store) return;
    fetchSales();
  }, [store, dateRange]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const allSales = await api.sales.list();
      const filtered = allSales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= startOfDay(new Date(dateRange.start)) && 
               saleDate <= endOfDay(new Date(dateRange.end));
      });
      setSales(filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => 
    sale.id.toLowerCase().includes(search.toLowerCase()) ||
    sale.items.some(item => item.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-xs text-gray-500">Histórico de vendas e faturas</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Total</p>
          <h3 className="text-sm font-bold text-gray-900">Kz {totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Vendas</p>
          <h3 className="text-sm font-bold text-gray-900">{filteredSales.length}</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Pesquisar venda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Início</label>
            <input 
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Fim</label>
            <input 
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredSales.length > 0 ? (
          filteredSales.map((sale) => (
            <div key={sale.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setSelectedSale(selectedSale === sale.id ? null : sale.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <History size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">#{sale.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-500">
                      {format(new Date(sale.timestamp), 'dd MMM, HH:mm', { locale: ptBR })} • {sale.paymentMethod}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="mr-2">
                    <p className="text-sm font-bold text-gray-900">Kz {sale.total.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">Pago</p>
                  </div>
                  {selectedSale === sale.id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </div>
              </div>

              {selectedSale === sale.id && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-50 bg-gray-50/30">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-600">{item.quantity}x {item.name}</span>
                          <span className="font-medium text-gray-900">Kz {item.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          generateReceiptPDF(sale, store);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                      >
                        <Printer size={14} />
                        Recibo
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          generateInvoicePDF(sale, store);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800"
                      >
                        <FileText size={14} />
                        Fatura
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            Nenhuma venda encontrada no período.
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
