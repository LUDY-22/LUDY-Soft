import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import fs from 'fs/promises';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(process.cwd(), 'db.json');
const JWT_SECRET = 'ludysoft-super-secret-key-2026';

// Initial DB state
const initialDB = {
  users: [],
  stores: [],
  products: [],
  sales: [],
  movements: [],
  logs: []
};

async function getDB() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    const db = JSON.parse(data);
    // Ensure all keys from initialDB are present
    return { ...initialDB, ...db };
  } catch (error) {
    await fs.writeFile(DB_FILE, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
}

async function saveDB(db: any) {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // Auth: Login
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const db = await getDB();
    const user = db.users.find((u: any) => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ uid: user.uid, role: user.role, storeId: user.storeId }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  });

  // Auth: Setup (Initial)
  app.post('/api/auth/setup', async (req, res) => {
    const db = await getDB();
    if (db.users.length > 0) {
      return res.status(400).json({ error: 'Sistema já configurado' });
    }

    const storeId = 'main-store';
    const store = {
      id: storeId,
      name: 'LUDY soft Matriz',
      address: 'Luanda, Angola',
      phone: '+244 900 000 000',
      receiptHeader: 'LUDY soft - Gestão Inteligente',
      receiptFooter: 'Obrigado pela preferência!',
      createdAt: new Date().toISOString()
    };

    const adminUid = 'admin-123';
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = {
      uid: adminUid,
      email: 'admin@ludysoft.com',
      password: hashedPassword,
      displayName: 'Administrador',
      role: 'admin',
      storeId: storeId,
      createdAt: new Date().toISOString()
    };

    db.stores.push(store);
    db.users.push(admin);
    await saveDB(db);

    res.json({ message: 'Setup concluído com sucesso' });
  });

  // Middleware to verify token
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Não autorizado' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  };

  // Store
  app.get('/api/store', authenticate, async (req: any, res) => {
    const db = await getDB();
    const store = db.stores.find((s: any) => s.id === req.user.storeId);
    res.json(store);
  });

  app.put('/api/store', authenticate, async (req: any, res) => {
    const db = await getDB();
    const index = db.stores.findIndex((s: any) => s.id === req.user.storeId);
    if (index === -1) return res.status(404).json({ error: 'Loja não encontrada' });

    db.stores[index] = { ...db.stores[index], ...req.body };
    await saveDB(db);
    res.json(db.stores[index]);
  });

  // Products
  app.get('/api/products', authenticate, async (req: any, res) => {
    const db = await getDB();
    const products = db.products.filter((p: any) => p.storeId === req.user.storeId);
    res.json(products);
  });

  app.post('/api/products', authenticate, async (req: any, res) => {
    const db = await getDB();
    const newProduct = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      storeId: req.user.storeId,
      createdAt: new Date().toISOString()
    };
    db.products.push(newProduct);
    await saveDB(db);
    res.json(newProduct);
  });

  app.put('/api/products/:id', authenticate, async (req: any, res) => {
    const db = await getDB();
    const index = db.products.findIndex((p: any) => p.id === req.params.id && p.storeId === req.user.storeId);
    if (index === -1) return res.status(404).json({ error: 'Produto não encontrado' });

    db.products[index] = { ...db.products[index], ...req.body, updatedAt: new Date().toISOString() };
    await saveDB(db);
    res.json(db.products[index]);
  });

  app.delete('/api/products/:id', authenticate, async (req: any, res) => {
    const db = await getDB();
    db.products = db.products.filter((p: any) => !(p.id === req.params.id && p.storeId === req.user.storeId));
    await saveDB(db);
    res.sendStatus(204);
  });

  // Movements
  app.get('/api/movements', authenticate, async (req: any, res) => {
    const db = await getDB();
    const movements = db.movements.filter((m: any) => m.storeId === req.user.storeId);
    res.json(movements);
  });

  app.post('/api/movements', authenticate, async (req: any, res) => {
    const db = await getDB();
    const movement = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      storeId: req.user.storeId,
      userId: req.user.uid,
      timestamp: new Date().toISOString()
    };

    // Update stock
    const product = db.products.find((p: any) => p.id === movement.productId);
    if (product) {
      if (movement.type === 'in') {
        product.stock += movement.quantity;
      } else {
        product.stock -= movement.quantity;
      }
    }

    db.movements.push(movement);
    await saveDB(db);
    res.json(movement);
  });

  // Sales
  app.get('/api/sales', authenticate, async (req: any, res) => {
    const db = await getDB();
    const sales = db.sales.filter((s: any) => s.storeId === req.user.storeId);
    res.json(sales);
  });

  app.post('/api/sales', authenticate, async (req: any, res) => {
    const db = await getDB();
    const sale = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      storeId: req.user.storeId,
      cashierId: req.user.uid,
      timestamp: new Date().toISOString()
    };

    // Update stock and create movements
    for (const item of sale.items) {
      const product = db.products.find((p: any) => p.id === item.productId);
      if (product) {
        product.stock -= item.quantity;
        
        // Create movement record for the sale
        db.movements.push({
          id: Math.random().toString(36).substr(2, 9),
          storeId: req.user.storeId,
          productId: item.productId,
          productName: item.name,
          type: 'out',
          quantity: item.quantity,
          reason: `Venda #${sale.id.slice(-6).toUpperCase()}`,
          userId: req.user.uid,
          timestamp: new Date().toISOString()
        });
      }
    }

    db.sales.push(sale);
    await saveDB(db);
    res.json(sale);
  });

  // Logs
  app.get('/api/logs', authenticate, async (req: any, res) => {
    const db = await getDB();
    const logs = db.logs.filter((l: any) => l.storeId === req.user.storeId);
    res.json(logs);
  });

  app.post('/api/logs', authenticate, async (req: any, res) => {
    const db = await getDB();
    const log = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      storeId: req.user.storeId,
      userId: req.user.uid,
      timestamp: new Date().toISOString()
    };
    db.logs.push(log);
    await saveDB(db);
    res.json(log);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
