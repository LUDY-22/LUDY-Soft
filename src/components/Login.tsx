import React, { useState } from 'react';
import { api } from '../api';
import { motion } from 'motion/react';
import { Store, Lock, Mail, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.auth.login(email, password);
      onLogin(data.user);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitialSetup = async () => {
    setLoading(true);
    setError('');
    try {
      await api.auth.setup();
      alert('Sistema configurado! Use:\nEmail: admin@ludysoft.com\nSenha: admin123');
      setEmail('admin@ludysoft.com');
      setPassword('admin123');
    } catch (err: any) {
      console.error(err);
      setError('Erro no setup: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gray-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
      >
        <div className="bg-red-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold opacity-10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gold opacity-10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          
          <div className="w-20 h-20 bg-gold rounded-2xl flex items-center justify-center mx-auto shadow-xl mb-4 relative z-10">
            <Store className="text-red-900" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 relative z-10">LUDY soft</h1>
          <p className="text-gold-light opacity-80 relative z-10">Sistema Profissional ERP & POS</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3 rounded"
              >
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Entrar no Sistema
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-4">
            <button 
              onClick={() => setShowSetup(!showSetup)}
              className="text-xs text-gray-400 hover:text-red-700 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <Sparkles size={12} />
              Primeiro acesso? Configurar sistema
            </button>

            {showSetup && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gold/10 p-4 rounded-xl border border-gold/20"
              >
                <p className="text-xs text-gray-600 mb-3">
                  Isso criará uma loja padrão e um usuário administrador.
                </p>
                <button
                  onClick={handleInitialSetup}
                  disabled={loading}
                  className="text-xs bg-gold text-red-900 font-bold px-4 py-2 rounded-lg hover:bg-gold-dark transition-all"
                >
                  Configurar Agora
                </button>
              </motion.div>
            )}

            <p className="text-[10px] text-gray-400">
              &copy; 2026 LUDY soft. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
