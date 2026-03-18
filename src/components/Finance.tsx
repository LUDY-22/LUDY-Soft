import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart as PieChartIcon
} from 'lucide-react';
import { api } from '../api';
import { UserProfile, Store, Sale } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface FinanceProps {
  user: UserProfile | null;
  store: Store | null;
}

const Finance: React.FC<FinanceProps> = ({ user, store }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store) return;
    fetchSales();
  }, [store]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const allSales = await api.sales.list();
      setSales(allSales);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentMonthSales = sales.filter(s => {
    const date = new Date(s.timestamp);
    return date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
  });

  const totalRevenue = currentMonthSales.reduce((acc, s) => acc + s.total, 0);
  const totalProfit = currentMonthSales.reduce((acc, s) => {
    const saleProfit = s.items.reduce((itemAcc, item) => itemAcc + (item.profit || 0), 0);
    return acc + saleProfit;
  }, 0);

  const paymentMethodsData = [
    { name: 'Dinheiro', value: currentMonthSales.filter(s => s.paymentMethod === 'cash').reduce((acc, s) => acc + s.total, 0) },
    { name: 'TPA', value: currentMonthSales.filter(s => s.paymentMethod === 'card').reduce((acc, s) => acc + s.total, 0) },
    { name: 'Transferência', value: currentMonthSales.filter(s => s.paymentMethod === 'transfer').reduce((acc, s) => acc + s.total, 0) },
  ].filter(d => d.value > 0);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-red-700" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-xs text-gray-500">Resumo de faturamento mensal</p>
      </div>

      <div className="bg-red-800 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10">
          <p className="text-xs opacity-80 font-bold uppercase tracking-wider mb-1">Saldo do Mês</p>
          <h2 className="text-3xl font-bold mb-6">Kz {totalRevenue.toLocaleString()}</h2>
          <div className="flex gap-4">
            <div className="flex-1 bg-white/10 p-3 rounded-2xl backdrop-blur-md">
              <p className="text-[10px] opacity-70 mb-1">Lucro Estimado</p>
              <p className="text-sm font-bold">Kz {totalProfit.toLocaleString()}</p>
            </div>
            <div className="flex-1 bg-white/10 p-3 rounded-2xl backdrop-blur-md">
              <p className="text-[10px] opacity-70 mb-1">Vendas</p>
              <p className="text-sm font-bold">{currentMonthSales.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
            <PieChartIcon size={18} className="text-red-700" />
            Métodos de Pagamento
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {paymentMethodsData.map((entry, index) => (
              <div key={entry.name} className="text-center">
                <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <p className="text-[10px] text-gray-500 truncate">{entry.name}</p>
                <p className="text-[10px] font-bold text-gray-800">Kz {entry.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-6">Transações Recentes</h3>
          <div className="space-y-4">
            {currentMonthSales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ArrowUpRight size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Venda #{sale.id.slice(-4).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-500">{format(new Date(sale.timestamp), 'dd MMM, HH:mm', { locale: ptBR })}</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-emerald-600">+Kz {sale.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
