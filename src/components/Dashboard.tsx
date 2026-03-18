import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { api } from '../api';
import { UserProfile, Store, Sale, Product } from '../types';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: UserProfile | null;
  store: Store | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user, store }) => {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayProfit: 0,
    lowStock: 0,
    totalProducts: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const today = startOfDay(new Date());
        
        // Fetch products for stock stats
        const products = await api.products.list(store.id);
        let lowStockCount = 0;
        products.forEach(p => {
          if (p.stock <= p.minStock) lowStockCount++;
        });

        // Fetch sales
        const sales = await api.sales.list(store.id);
        const todaySales = sales.filter(s => {
          const saleDate = new Date(s.timestamp);
          return saleDate >= today && saleDate <= endOfDay(new Date());
        });

        let todayTotal = todaySales.reduce((acc, s) => acc + s.total, 0);

        setStats({
          todaySales: todayTotal,
          todayProfit: todayTotal * 0.3, // Mock profit calculation
          lowStock: lowStockCount,
          totalProducts: products.length
        });

        // Mock chart data for now
        const mockChartData = Array.from({ length: 7 }).map((_, i) => ({
          name: format(subDays(new Date(), 6 - i), 'EEE', { locale: ptBR }),
          vendas: Math.floor(Math.random() * 5000) + 1000,
          lucro: Math.floor(Math.random() * 2000) + 500
        }));
        setChartData(mockChartData);

        // Recent sales
        setRecentSales(sales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [store]);

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          {trend === 'up' ? (
            <ArrowUpRight size={16} className="text-emerald-500" />
          ) : (
            <ArrowDownRight size={16} className="text-red-500" />
          )}
          <span className={`text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
            {trendValue}%
          </span>
          <span className="text-xs text-gray-400">vs. ontem</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          title="Vendas Hoje" 
          value={`Kz ${stats.todaySales.toLocaleString()}`} 
          icon={DollarSign} 
          color="emerald"
        />
        <StatCard 
          title="Lucro Est." 
          value={`Kz ${stats.todayProfit.toLocaleString()}`} 
          icon={TrendingUp} 
          color="blue"
        />
        <StatCard 
          title="Produtos" 
          value={stats.totalProducts} 
          icon={Package} 
          color="amber"
        />
        <StatCard 
          title="Estoque Baixo" 
          value={stats.lowStock} 
          icon={AlertTriangle} 
          color="red"
        />
      </div>

      <div className="space-y-6">
        {/* Sales Chart */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Vendas (7 dias)</h3>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B91C1C" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#B91C1C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#B91C1C" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVendas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-800">Vendas Recentes</h3>
            <Link to="/reports" className="text-[10px] font-bold text-red-700 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-4">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                    <ShoppingCart size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">
                      Venda #{sale.id.slice(-4).toUpperCase()}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {sale.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-600">
                      +Kz {sale.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400">Nenhuma venda hoje</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
