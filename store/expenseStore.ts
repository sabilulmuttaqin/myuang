import { create } from 'zustand';
import { type SQLiteDatabase } from 'expo-sqlite';

export type Category = {
  id: number;
  name: string;
  icon: string;
  color: string;
  budget_limit: number;
  totalSpent?: number;
  percentage?: number;
};

export type Transaction = {
  id: number;
  category_id: number;
  amount: number;
  date: string;
  note: string;
  image_uri?: string;
  created_at?: number;
  category_name?: string; // Joined field
  category_icon?: string; // Joined field
  category_color?: string; // Joined field
};

interface ExpenseState {
  transactions: Transaction[];
  categories: Category[];
  totalMonth: number;
  totalWeek: number;
  isLoading: boolean;
  
  fetchCategories: (db: SQLiteDatabase) => Promise<void>;
  addExpense: (db: SQLiteDatabase, transaction: Omit<Transaction, 'id' | 'created_at' | 'category_name' | 'category_icon' | 'category_color'>) => Promise<void>;
  addCategory: (db: SQLiteDatabase, category: Omit<Category, 'id'>) => Promise<void>;
  fetchRecentTransactions: (db: SQLiteDatabase) => Promise<void>;
  calculateTotalMonth: (db: SQLiteDatabase) => Promise<void>;
  calculateWeeklyTotal: (db: SQLiteDatabase) => Promise<void>;
  updateCategory: (db: SQLiteDatabase, id: number, category: Partial<Category>) => Promise<void>;
  deleteCategory: (db: SQLiteDatabase, id: number) => Promise<void>;
  deleteTransaction: (db: SQLiteDatabase, id: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  transactions: [],
  categories: [],
  totalMonth: 0,
  totalWeek: 0,
  isLoading: false,

  fetchCategories: async (db) => {
    try {
      const result = await db.getAllAsync<Category>('SELECT * FROM categories');
      set({ categories: result });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  addCategory: async (db, category) => {
    try {
      await db.runAsync(
        'INSERT INTO categories (name, icon, color, budget_limit) VALUES (?, ?, ?, ?)',
        [category.name, category.icon, category.color, category.budget_limit]
      );
      await get().fetchCategories(db);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  },

  addExpense: async (db, transaction) => {
    set({ isLoading: true });
    try {
      await db.runAsync(
        'INSERT INTO transactions (category_id, amount, date, note, image_uri) VALUES (?, ?, ?, ?, ?)',
        [transaction.category_id, transaction.amount, transaction.date, transaction.note, transaction.image_uri ?? null]
      );
      // Refresh list
      await get().fetchRecentTransactions(db);
      await get().calculateTotalMonth(db);
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRecentTransactions: async (db) => {
    try {
      const result = await db.getAllAsync<Transaction>(`
        SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC, t.id DESC
        LIMIT 20
      `);
      set({ transactions: result });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  },

  calculateTotalMonth: async (db) => {
    try {
        // 1. Total Month
        const totalResult = await db.getFirstAsync<{ total: number }>(`
            SELECT SUM(amount) as total 
            FROM transactions 
            WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
        `);
        
        // 2. Breakdown per Category for key 'percentage' and 'total'
        const breakdownResult = await db.getAllAsync<{ category_id: number; total: number }>(`
            SELECT category_id, SUM(amount) as total
            FROM transactions
            WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
            GROUP BY category_id
        `);

        // Map breakdown to categories
        const categories = get().categories;
        const breakdown = categories.map(cat => {
            const catTotal = breakdownResult.find(b => b.category_id === cat.id)?.total || 0;
             // Calculate percentage relative to total month (avoid division by zero)
            const total = totalResult?.total || 1; 
            const percentage = Math.round((catTotal / total) * 100);
            return { ...cat, totalSpent: catTotal, percentage };
        });

        set({ 
            totalMonth: totalResult?.total || 0,
            categories: breakdown // Update categories with stats
        });

    } catch (error) {
        console.error('Error calculating total:', error);
    }
  },

  calculateWeeklyTotal: async (db) => {
    try {
        // Calculate start of the week (Monday)
        const now = new Date();
        const day = now.getDay(); // 0 (Sun) - 6 (Sat)
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        
        const result = await db.getFirstAsync<{ total: number }>(`
            SELECT SUM(amount) as total 
            FROM transactions 
            WHERE date >= ?
        `, [monday.toISOString()]);
        
        set({ totalWeek: result?.total || 0 });
    } catch (error) {
         console.error('Error calculating weekly total:', error);
    }
  },

  updateCategory: async (db, id, category) => {
      try {
          await db.runAsync(
              'UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?',
              [category.name || '', category.icon || '', category.color || '', id]
          );
          // Refresh
          await get().fetchCategories(db);
      } catch (error) {
          console.error('Error updating category:', error);
      }
  },

  deleteCategory: async (db, id) => {
      try {
          // Delete associated transactions first
          await db.runAsync('DELETE FROM transactions WHERE category_id = ?', [id]);
          // Then delete the category
          await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
          // Refresh
          await get().fetchCategories(db);
      } catch (error) {
          console.error('Error deleting category:', error);
      }
  },

  deleteTransaction: async (db, id) => {
    try {
      await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
      // Refresh all related data
      await get().fetchRecentTransactions(db);
      await get().calculateTotalMonth(db);
      await get().calculateWeeklyTotal(db);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  },
}));
