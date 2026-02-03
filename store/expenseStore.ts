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

export type SplitBillMember = {
  id: number;
  split_bill_id: number;
  name: string;
  share_amount: number;
  is_me: boolean;
};

export type SplitBill = {
  id: number;
  date: string;
  name: string;
  total_amount: number;
  image_uri?: string;
  created_at?: number;
  members?: SplitBillMember[]; // For UI convenience
};

interface ExpenseState {
  transactions: Transaction[];
  categories: Category[];
  splitBills: SplitBill[]; // New
  totalMonth: number; 
  isLoading: boolean;
  
  fetchCategories: (db: SQLiteDatabase) => Promise<void>;
  addExpense: (db: SQLiteDatabase, transaction: Omit<Transaction, 'id' | 'created_at' | 'category_name' | 'category_icon' | 'category_color'>) => Promise<void>;
  addCategory: (db: SQLiteDatabase, category: Omit<Category, 'id'>) => Promise<void>;
  fetchRecentTransactions: (db: SQLiteDatabase) => Promise<void>;
  calculateTotalMonth: (db: SQLiteDatabase, selectedMonth?: Date) => Promise<void>;
  updateCategory: (db: SQLiteDatabase, id: number, category: Partial<Category>) => Promise<void>;
  deleteCategory: (db: SQLiteDatabase, id: number) => Promise<void>;
  deleteTransaction: (db: SQLiteDatabase, id: number) => Promise<void>;
  
  // Split Bill Actions
  fetchSplitBills: (db: SQLiteDatabase) => Promise<void>;
  addSplitBill: (db: SQLiteDatabase, bill: Omit<SplitBill, 'id' | 'created_at' | 'members'>, members: Omit<SplitBillMember, 'id' | 'split_bill_id'>[]) => Promise<void>;
  deleteSplitBill: (db: SQLiteDatabase, id: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  transactions: [],
  categories: [],
  splitBills: [],
  totalMonth: 0,
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

  calculateTotalMonth: async (db, selectedMonth) => {
    try {
        // Use selectedMonth or default to current date
        const targetDate = selectedMonth || new Date();
        const yearMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
        
        // 1. Total Month
        const totalResult = await db.getFirstAsync<{ total: number }>(`
            SELECT SUM(amount) as total 
            FROM transactions 
            WHERE strftime('%Y-%m', date) = ?
        `, [yearMonth]);
        
        // 2. Breakdown per Category for key 'percentage' and 'total'
        const breakdownResult = await db.getAllAsync<{ category_id: number; total: number }>(`
            SELECT category_id, SUM(amount) as total
            FROM transactions
            WHERE strftime('%Y-%m', date) = ?
            GROUP BY category_id
        `, [yearMonth]);

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
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  },

  fetchSplitBills: async (db) => {
    try {
      const bills = await db.getAllAsync<SplitBill>('SELECT * FROM split_bills ORDER BY date DESC, id DESC');
      // Fetch members for each bill? 
      // For list view, we might not need members immediately, or we can fetch them.
      // Let's simpler: fetch members when needed or now. 
      // For simplicity, let's just fetch bills.
      set({ splitBills: bills });
    } catch (error) {
      console.error('Error fetching split bills:', error);
    }
  },

  addSplitBill: async (db, bill, members) => {
    try {
      const result = await db.runAsync(
          'INSERT INTO split_bills (name, date, total_amount, image_uri) VALUES (?, ?, ?, ?)',
          [bill.name, bill.date, bill.total_amount, bill.image_uri ?? null]
      );
      const billId = result.lastInsertRowId;
      
      for (const member of members) {
          await db.runAsync(
              'INSERT INTO split_bill_members (split_bill_id, name, share_amount, is_me) VALUES (?, ?, ?, ?)',
              [billId, member.name, member.share_amount, member.is_me ? 1 : 0]
          );
      }
      
      await get().fetchSplitBills(db);
    } catch (error) {
      console.error('Error adding split bill:', error);
    }
  },

  deleteSplitBill: async (db, id) => {
    try {
      await db.runAsync('DELETE FROM split_bills WHERE id = ?', [id]);
      await get().fetchSplitBills(db);
    } catch (error) {
       console.error('Error deleting split bill:', error);
    }
  },
}));
