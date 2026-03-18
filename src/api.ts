import { UserProfile, Store, Product, Sale, SaleItem } from './types';

const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('ludysoft_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<{ user: UserProfile, token: string }> => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error('Credenciais inválidas');
      const data = await res.json();
      localStorage.setItem('ludysoft_token', data.token);
      localStorage.setItem('ludysoft_user', JSON.stringify(data.user));
      return data;
    },
    setup: async (): Promise<void> => {
      const res = await fetch(`${API_BASE}/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Erro no setup');
    },
    logout: () => {
      localStorage.removeItem('ludysoft_token');
      localStorage.removeItem('ludysoft_user');
    },
    getCurrentUser: (): UserProfile | null => {
      const user = localStorage.getItem('ludysoft_user');
      return user ? JSON.parse(user) : null;
    }
  },
  store: {
    get: async (): Promise<Store> => {
      const res = await fetch(`${API_BASE}/store`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar loja');
      return res.json();
    },
    update: async (store: Partial<Store>): Promise<Store> => {
      const res = await fetch(`${API_BASE}/store`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(store)
      });
      if (!res.ok) throw new Error('Erro ao atualizar loja');
      return res.json();
    }
  },
  products: {
    list: async (): Promise<Product[]> => {
      const res = await fetch(`${API_BASE}/products`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar produtos');
      return res.json();
    },
    create: async (product: Partial<Product>): Promise<Product> => {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(product)
      });
      if (!res.ok) throw new Error('Erro ao criar produto');
      return res.json();
    },
    update: async (id: string, product: Partial<Product>): Promise<Product> => {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(product)
      });
      if (!res.ok) throw new Error('Erro ao atualizar produto');
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Erro ao excluir produto');
    }
  },
  sales: {
    list: async (): Promise<Sale[]> => {
      const res = await fetch(`${API_BASE}/sales`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar vendas');
      return res.json();
    },
    create: async (sale: Partial<Sale>): Promise<Sale> => {
      const res = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(sale)
      });
      if (!res.ok) throw new Error('Erro ao registrar venda');
      return res.json();
    }
  },
  logs: {
    list: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE}/logs`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar logs');
      return res.json();
    },
    create: async (log: any): Promise<any> => {
      const res = await fetch(`${API_BASE}/logs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(log)
      });
      if (!res.ok) throw new Error('Erro ao registrar log');
      return res.json();
    }
  },
  movements: {
    list: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE}/movements`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar movimentos');
      return res.json();
    },
    create: async (movement: any): Promise<any> => {
      const res = await fetch(`${API_BASE}/movements`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(movement)
      });
      if (!res.ok) throw new Error('Erro ao registrar movimento');
      return res.json();
    }
  },
  users: {
    list: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar usuários');
      return res.json();
    },
    create: async (user: any): Promise<any> => {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(user)
      });
      if (!res.ok) throw new Error('Erro ao criar usuário');
      return res.json();
    }
  }
};
