import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api';
import { UserProfile, Store } from './types';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Finance from './components/Finance';
import Users from './components/Users';
import Reports from './components/Reports';
import Logs from './components/Logs';
import Settings from './components/Settings';
import Movements from './components/Movements';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = api.auth.getCurrentUser();
      if (currentUser) {
        try {
          setUser(currentUser);
          const storeData = await api.store.get();
          setStore(storeData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          api.auth.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
    api.store.get().then(setStore).catch(console.error);
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setStore(null);
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-red-700 mx-auto mb-4" size={48} />
          <p className="text-gray-600 font-medium">Carregando LUDY soft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:w-[430px] sm:h-[932px] bg-white sm:rounded-[3rem] sm:shadow-2xl sm:border-[12px] sm:border-gray-800 overflow-hidden relative flex flex-col">
        {/* Notch for mobile look */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-800 rounded-b-2xl z-[100]"></div>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          <Router>
            <Routes>
              <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
              
              <Route path="/" element={user ? <Layout user={user} store={store} onLogout={handleLogout}><Dashboard user={user} store={store} /></Layout> : <Navigate to="/login" />} />
              <Route path="/pos" element={user ? <Layout user={user} store={store} onLogout={handleLogout}><POS user={user} store={store} /></Layout> : <Navigate to="/login" />} />
              <Route path="/inventory" element={user ? <Layout user={user} store={store} onLogout={handleLogout}><Inventory user={user} store={store} /></Layout> : <Navigate to="/login" />} />
              <Route path="/movements" element={user ? <Layout user={user} store={store} onLogout={handleLogout}><Movements user={user} store={store} /></Layout> : <Navigate to="/login" />} />
              <Route path="/finance" element={user ? <Layout user={user} store={store} onLogout={handleLogout}><Finance user={user} store={store} /></Layout> : <Navigate to="/login" />} />
              <Route path="/reports" element={user ? <Layout user={user} store={store} onLogout={handleLogout}><Reports user={user} store={store} /></Layout> : <Navigate to="/login" />} />
              <Route path="/logs" element={user ? <Layout user={user} store={store} onLogout={handleLogout}><Logs user={user} store={store} /></Layout> : <Navigate to="/login" />} />
              <Route path="/users" element={user ? <Layout user={user} store={store} onLogout={handleLogout}><Users user={user} store={store} /></Layout> : <Navigate to="/login" />} />
              <Route path="/settings" element={user ? <Layout user={user} store={store} onLogout={handleLogout}><Settings user={user} store={store} /></Layout> : <Navigate to="/login" />} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </div>
      </div>
    </div>
  );
};

export default App;
