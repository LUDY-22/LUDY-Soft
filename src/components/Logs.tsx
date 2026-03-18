import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Calendar,
  Loader2,
  Clock,
  User as UserIcon,
  Tag
} from 'lucide-react';
import { api } from '../api';
import { UserProfile, Store } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Log {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

interface LogsProps {
  user: UserProfile | null;
  store: Store | null;
}

const Logs: React.FC<LogsProps> = ({ user, store }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!store) return;
    fetchLogs();
  }, [store]);

  const fetchLogs = async () => {
    if (!store) return;
    setLoading(true);
    try {
      const allLogs = await api.logs.list(store.id);
      setLogs(allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Logs de Atividade</h1>
        <p className="text-xs text-gray-500">Histórico de ações no sistema</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input 
          type="text"
          placeholder="Pesquisar logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-red-700" size={32} />
          </div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div key={log.id} className="relative pl-8 pb-6 border-l-2 border-gray-100 last:pb-0">
              <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-red-700" />
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserIcon size={12} className="text-gray-500" />
                    </div>
                    <span className="text-xs font-bold text-gray-800">{log.userName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock size={10} />
                    {format(new Date(log.timestamp), 'dd MMM, HH:mm', { locale: ptBR })}
                  </div>
                </div>
                <p className="text-xs font-bold text-red-700 mb-1">{log.action}</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">{log.details}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            Nenhum log encontrado.
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
