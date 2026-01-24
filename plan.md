# Project Plan: MyUang (Smart Expense Tracker)

## 📌 Project Overview
Aplikasi pencatat PENGELUARAN pribadi berbasis Android. Fokus pada kecepatan catat (Quick Add), kontrol budget, dan otomatisasi.
Target: Android (Native Feel), Offline-first, Ringan.

## 🛠 Tech Stack
- **Framework:** React Native (Expo SDK 50+)
- **Language:** TypeScript
- **Styling:** NativeWind (Tailwind CSS)
- **Database:** Expo SQLite (Local DB)
- **State Management:** Zustand
- **AI Integration:** Google Gemini API (Smart Text Parsing)
- **Utils:** date-fns (Date Formatting), clsx (Style Logic)
- **Build Tool:** Expo Prebuild (Development Build)

---

## 📅 Phases & Tasks

### Phase 1: Setup & Environment (✅ DONE)
- [x] **Initialize Project:** Create generic Expo app (`create-expo-stack`).
- [x] **Install Dependencies:** `zustand`, `expo-sqlite`, `@google/generative-ai`, `date-fns`, `clsx`.
- [x] **Styling Setup:** NativeWind & Tailwind configured.
- [x] **Navigation Setup:** Expo Router (Tabs) configured.

### Phase 2: Database & Logic (✅ DONE)
- [x] **Database Initialization:** Setup `utils/database.ts` with `expo-sqlite`.
- [x] **App Entry:** Call `initDatabase()` in `_layout.tsx` to create tables on startup.
- [x] **Zustand Store:** Create `store/expenseStore.ts` for CRUD operations (Add/Delete Expense).
- [x] **Seeding Data:** Verify default categories (Makan, Transport, etc) appear in DB.

### Phase 3: Core UI (Expense Focus) (✅ DONE)
- [x] **Dashboard UI (`index.tsx`):**
    - Header (Month Selector).
    - **Hero Card:** "Total Pengeluaran Bulan Ini".
    - Recent Expenses List (FlatList).
- [x] **Add Expense Screen:**
    - Input Form (Amount, Category, Date, Note).
    - **No Toggle:** Interface is strictly for adding Expenses.
- [x] **Settings UI:** Manage Categories (Simple List).

### Phase 4: Smart Features (AI & Automation) (✅ DONE)
- [x] **Offline Detection:**
    - If Offline -> Disable Smart Text & OCR. Show warning.
- [x] **Gemini Integration (Smart Text):**
    - Service: `utils/gemini.ts`.
    - Input text: "Nasi goreng 15rb".
    - AI Output: `{Name: "Nasi Goreng", category: "Makan", amount: 15000 }`.
- [x] **OCR Integration (Gemini Vision):**
    - Uses Gemini Vision API to parse receipt images.
    - Camera and Gallery support via expo-image-picker.

### Phase 5: Visualization & Analysis (✅ DONE)
- [x] **Analysis Screen (`analysis.tsx`):**
    - Date Range Picker (Weekly/Monthly filter).
    - **Category Chips:** Filter by category.
    - **Visual Summary:** Total and Category Breakdown.
    - **Filtered List:** Transaction history (Dashboard-style cards).
- [x] **Daily Reminder:** Notification if no expense recorded by 8 PM (implemented with toggle in Settings).

### Phase 6: Finalization (✅ DONE)
- [x] **Dark Mode:** Forced Dark Theme (`app.json` & `useColorScheme`).
- [x] **Navigation:** Tab Bar with Custom Center FAB.
- [x] **Split bill:** Added split bill feature. Dimana bisa  membagi biaya yang diinputkan menjadi beberapa orang dan yang 'saya' akan menambanh expense saya.
- [x] **Splash Screen:** Added splash screen with loading animation (Custom ActivityIndicator view).
- [x] **Performance:** Verified list scrolling speed (Standard FlatList optimizations).
- [x] **App Icon & Splash Screen:** Update assets (PengeluaranGW rebranding).


---

## 📝 Database Schema (Expense Only)

```sql
-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT, 
  color TEXT,
  budget_limit REAL DEFAULT 0
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  amount REAL NOT NULL,
  date TEXT NOT NULL, 
  note TEXT,
  image_uri TEXT, 
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (category_id) REFERENCES categories (id)
);



## 💡 Notes for AI Assistant

* **Scope:** **EXPENSE ONLY**. No Income, No Balance calculation.
* **Styling:** NativeWind (use `className`).
* **Data Flow:** UI -> Zustand -> SQLite.
* **Offline Constraint:** Smart Text must handle offline state gracefully.
