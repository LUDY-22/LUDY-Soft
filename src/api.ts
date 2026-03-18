import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { db, auth } from './firebase';
import { UserProfile, Store, Product, Sale, SaleItem, Log } from './types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<{ user: UserProfile }> => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (!userDoc.exists()) throw new Error('Perfil de usuário não encontrado');
        const user = userDoc.data() as UserProfile;
        localStorage.setItem('ludysoft_user', JSON.stringify(user));
        return { user };
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    setup: async (): Promise<void> => {
      try {
        // This is a simplified setup for Firebase. 
        // In a real app, you'd probably have a cloud function or a specific admin action.
        // For now, we'll allow creating the first admin if none exists.
        const adminEmail = 'admin@ludysoft.com';
        const adminPass = 'admin123';
        
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
        const uid = userCredential.user.uid;
        
        const storeId = 'main-store';
        const storeData: Store = {
          id: storeId,
          name: 'LUDY soft Matriz',
          address: 'Luanda, Angola',
          phone: '+244 900 000 000',
          receiptHeader: 'LUDY soft - Gestão Inteligente',
          receiptFooter: 'Obrigado pela preferência!',
        };

        const userData: UserProfile = {
          uid,
          email: adminEmail,
          displayName: 'Administrador',
          role: 'admin',
          storeId,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'stores', storeId), storeData);
        await setDoc(doc(db, 'users', uid), userData);
        
        await updateProfile(userCredential.user, { displayName: 'Administrador' });
      } catch (error) {
        console.error('Setup error:', error);
        throw error;
      }
    },
    logout: async () => {
      await signOut(auth);
      localStorage.removeItem('ludysoft_user');
    },
    getCurrentUser: (): UserProfile | null => {
      const user = localStorage.getItem('ludysoft_user');
      return user ? JSON.parse(user) : null;
    },
    onAuthStateChanged: (callback: (user: UserProfile | null) => void) => {
      return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const user = userDoc.data() as UserProfile;
              localStorage.setItem('ludysoft_user', JSON.stringify(user));
              callback(user);
            } else {
              callback(null);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            callback(null);
          }
        } else {
          localStorage.removeItem('ludysoft_user');
          callback(null);
        }
      });
    }
  },
  store: {
    get: async (storeId: string): Promise<Store> => {
      const path = `stores/${storeId}`;
      try {
        const storeDoc = await getDoc(doc(db, 'stores', storeId));
        if (!storeDoc.exists()) throw new Error('Loja não encontrada');
        return storeDoc.data() as Store;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
        throw error;
      }
    },
    update: async (storeId: string, store: Partial<Store>): Promise<void> => {
      const path = `stores/${storeId}`;
      try {
        await updateDoc(doc(db, 'stores', storeId), store);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  },
  products: {
    list: async (storeId: string): Promise<Product[]> => {
      const path = 'products';
      try {
        const q = query(collection(db, 'products'), where('storeId', '==', storeId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Product);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        throw error;
      }
    },
    create: async (product: Partial<Product>): Promise<Product> => {
      const id = Math.random().toString(36).substr(2, 9);
      const newProduct = {
        ...product,
        id,
        createdAt: new Date().toISOString()
      } as Product;
      
      const path = `products/${id}`;
      try {
        await runTransaction(db, async (transaction) => {
          transaction.set(doc(db, 'products', id), newProduct);
          
          if (newProduct.stock > 0) {
            const movementId = Math.random().toString(36).substr(2, 9);
            transaction.set(doc(db, 'movements', movementId), {
              id: movementId,
              storeId: newProduct.storeId,
              productId: newProduct.id,
              productName: newProduct.name,
              type: 'in',
              quantity: newProduct.stock,
              reason: 'Estoque inicial (Cadastro)',
              userId: auth.currentUser?.uid,
              timestamp: new Date().toISOString()
            });
          }
        });
        return newProduct;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        throw error;
      }
    },
    update: async (id: string, product: Partial<Product>): Promise<void> => {
      const path = `products/${id}`;
      try {
        await runTransaction(db, async (transaction) => {
          const productRef = doc(db, 'products', id);
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) throw new Error('Produto não encontrado');
          
          const oldProduct = productDoc.data() as Product;
          const updatedProduct = { ...oldProduct, ...product };
          
          transaction.update(productRef, product);
          
          if (updatedProduct.stock !== oldProduct.stock) {
            const diff = updatedProduct.stock - oldProduct.stock;
            const movementId = Math.random().toString(36).substr(2, 9);
            transaction.set(doc(db, 'movements', movementId), {
              id: movementId,
              storeId: updatedProduct.storeId,
              productId: updatedProduct.id,
              productName: updatedProduct.name,
              type: diff > 0 ? 'in' : 'out',
              quantity: Math.abs(diff),
              reason: 'Ajuste manual de estoque',
              userId: auth.currentUser?.uid,
              timestamp: new Date().toISOString()
            });
          }
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    delete: async (id: string): Promise<void> => {
      const path = `products/${id}`;
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  },
  sales: {
    list: async (storeId: string): Promise<Sale[]> => {
      const path = 'sales';
      try {
        const q = query(collection(db, 'sales'), where('storeId', '==', storeId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Sale);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        throw error;
      }
    },
    create: async (sale: Partial<Sale>): Promise<Sale> => {
      const id = Math.random().toString(36).substr(2, 9);
      const newSale = {
        ...sale,
        id,
        timestamp: new Date().toISOString()
      } as Sale;
      
      const path = `sales/${id}`;
      try {
        await runTransaction(db, async (transaction) => {
          transaction.set(doc(db, 'sales', id), newSale);
          
          for (const item of newSale.items) {
            const productRef = doc(db, 'products', item.productId);
            const productDoc = await transaction.get(productRef);
            if (productDoc.exists()) {
              const product = productDoc.data() as Product;
              transaction.update(productRef, { stock: product.stock - item.quantity });
              
              const movementId = Math.random().toString(36).substr(2, 9);
              transaction.set(doc(db, 'movements', movementId), {
                id: movementId,
                storeId: newSale.storeId,
                productId: item.productId,
                productName: item.name,
                type: 'out',
                quantity: item.quantity,
                reason: `Venda #${newSale.id.slice(-6).toUpperCase()}`,
                userId: auth.currentUser?.uid,
                timestamp: new Date().toISOString()
              });
            }
          }
        });
        return newSale;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        throw error;
      }
    }
  },
  logs: {
    list: async (storeId: string): Promise<Log[]> => {
      const path = 'logs';
      try {
        const q = query(collection(db, 'logs'), where('storeId', '==', storeId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Log);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        throw error;
      }
    },
    create: async (log: Partial<Log>): Promise<Log> => {
      const id = Math.random().toString(36).substr(2, 9);
      const newLog = {
        ...log,
        id,
        timestamp: new Date().toISOString()
      } as Log;
      const path = `logs/${id}`;
      try {
        await setDoc(doc(db, 'logs', id), newLog);
        return newLog;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        throw error;
      }
    }
  },
  movements: {
    list: async (storeId: string): Promise<any[]> => {
      const path = 'movements';
      try {
        const q = query(collection(db, 'movements'), where('storeId', '==', storeId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data());
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        throw error;
      }
    },
    create: async (movement: any): Promise<any> => {
      const id = Math.random().toString(36).substr(2, 9);
      const newMovement = {
        ...movement,
        id,
        timestamp: new Date().toISOString()
      };
      const path = `movements/${id}`;
      try {
        await runTransaction(db, async (transaction) => {
          transaction.set(doc(db, 'movements', id), newMovement);
          const productRef = doc(db, 'products', movement.productId);
          const productDoc = await transaction.get(productRef);
          if (productDoc.exists()) {
            const product = productDoc.data() as Product;
            const newStock = movement.type === 'in' 
              ? product.stock + movement.quantity 
              : product.stock - movement.quantity;
            transaction.update(productRef, { stock: newStock });
          }
        });
        return newMovement;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        throw error;
      }
    }
  },
  users: {
    list: async (storeId: string): Promise<UserProfile[]> => {
      const path = 'users';
      try {
        const q = query(collection(db, 'users'), where('storeId', '==', storeId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as UserProfile);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        throw error;
      }
    },
    create: async (user: Partial<UserProfile>): Promise<void> => {
      // In Firebase, creating a user requires auth.createUserWithEmailAndPassword
      // This is usually done by the user themselves or via Admin SDK.
      // For this app, we'll assume the admin can create users.
      // Note: Firebase Client SDK doesn't allow creating other users easily without logging out.
      // A common workaround is a Cloud Function or using a separate Firebase App instance.
      throw new Error('Criação de usuários deve ser feita via convite ou Admin SDK');
    }
  }
};
