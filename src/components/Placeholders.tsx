import React from 'react';
import { UserProfile, Store } from '../types';

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 italic">Esta funcionalidade está sendo implementada para a versão profissional do LUDY soft.</p>
  </div>
);

export const Finance: React.FC<{ user: UserProfile | null; store: Store | null }> = () => <Placeholder title="Gestão Financeira" />;
export const Users: React.FC<{ user: UserProfile | null; store: Store | null }> = () => <Placeholder title="Gestão de Usuários" />;
export const Reports: React.FC<{ user: UserProfile | null; store: Store | null }> = () => <Placeholder title="Relatórios e Exportação" />;
export const Logs: React.FC<{ user: UserProfile | null; store: Store | null }> = () => <Placeholder title="Auditoria e Logs" />;
export const Settings: React.FC<{ user: UserProfile | null; store: Store | null }> = () => <Placeholder title="Configurações do Sistema" />;
export const Movements: React.FC<{ user: UserProfile | null; store: Store | null }> = () => <Placeholder title="Movimentação de Estoque" />;
