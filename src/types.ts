export type UserRole = 'admin' | 'manager' | 'cashier';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  storeId: string;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  receiptHeader: string;
  receiptFooter: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  supplierId: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  barcode: string;
  imageUrl: string;
  storeId: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  cashierId: string;
  storeId: string;
  timestamp: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  storeId: string;
}

export interface Log {
  id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
  storeId: string;
}
