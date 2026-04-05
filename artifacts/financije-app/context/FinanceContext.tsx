import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  position: "before" | "after";
}

export const CURRENCIES: Currency[] = [
  { code: "BAM", symbol: "KM",   name: "Konvertibilna marka (BiH)", position: "after"  },
  { code: "EUR", symbol: "€",    name: "Euro",                       position: "after"  },
  { code: "USD", symbol: "$",    name: "Američki dolar",             position: "before" },
  { code: "GBP", symbol: "£",    name: "Britanska funta",            position: "before" },
  { code: "CHF", symbol: "Fr",   name: "Švicarski franak",           position: "after"  },
  { code: "RSD", symbol: "din.", name: "Srpski dinar",               position: "after"  },
  { code: "HRK", symbol: "kn",   name: "Hrvatska kuna",              position: "after"  },
  { code: "MKD", symbol: "ден",  name: "Makedonski denar",           position: "after"  },
  { code: "ALL", symbol: "L",    name: "Albanski lek",               position: "after"  },
  { code: "CZK", symbol: "Kč",   name: "Češka kruna",                position: "after"  },
  { code: "PLN", symbol: "zł",   name: "Poljski zlot",               position: "after"  },
  { code: "HUF", symbol: "Ft",   name: "Mađarska forinta",           position: "after"  },
  { code: "RON", symbol: "lei",  name: "Rumunski lej",               position: "after"  },
  { code: "BGN", symbol: "лв",   name: "Bugarski lev",               position: "after"  },
  { code: "DKK", symbol: "kr",   name: "Danska kruna",               position: "after"  },
  { code: "SEK", symbol: "kr",   name: "Švedska kruna",              position: "after"  },
  { code: "NOK", symbol: "kr",   name: "Norveška kruna",             position: "after"  },
  { code: "TRY", symbol: "₺",   name: "Turska lira",                position: "after"  },
  { code: "JPY", symbol: "¥",    name: "Japanski jen",               position: "before" },
  { code: "CNY", symbol: "¥",    name: "Kineski juan",               position: "before" },
  { code: "AUD", symbol: "A$",   name: "Australijski dolar",         position: "before" },
  { code: "CAD", symbol: "CA$",  name: "Kanadski dolar",             position: "before" },
];

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatAmount: (amount: number) => string;
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, "id">) => void;
  deleteCategory: (id: string) => void;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getBalance: () => number;
  getTransactionsByMonth: (year: number, month: number) => Transaction[];
  getTransactionsByDateRange: (from: string, to: string) => Transaction[];
  getCategoryTotals: (
    type: TransactionType,
    year: number,
    month: number
  ) => { category: string; amount: number; icon: string }[];
  getCategoryTotalsByRange: (
    type: TransactionType,
    from: string,
    to: string
  ) => { category: string; amount: number; icon: string }[];
  getMonthlyTrends: () => { month: string; income: number; expenses: number }[];
}

const defaultCategories: Category[] = [
  { id: "cat-1",  name: "Prodaja",        type: "income",  icon: "shopping-bag"  },
  { id: "cat-2",  name: "Usluge",         type: "income",  icon: "briefcase"     },
  { id: "cat-3",  name: "Investicije",    type: "income",  icon: "trending-up"   },
  { id: "cat-4",  name: "Ostalo prihodi", type: "income",  icon: "plus-circle"   },
  { id: "cat-5",  name: "Plate",          type: "expense", icon: "users"         },
  { id: "cat-6",  name: "Najam",          type: "expense", icon: "home"          },
  { id: "cat-7",  name: "Komunalije",     type: "expense", icon: "zap"           },
  { id: "cat-8",  name: "Marketing",      type: "expense", icon: "bar-chart-2"   },
  { id: "cat-9",  name: "Oprema",         type: "expense", icon: "tool"          },
  { id: "cat-10", name: "Transport",      type: "expense", icon: "truck"         },
  { id: "cat-11", name: "Hrana",          type: "expense", icon: "coffee"        },
  { id: "cat-12", name: "Ostalo rashodi", type: "expense", icon: "minus-circle"  },
];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const TRANSACTIONS_KEY = "@poslovne_financije_transactions";
const CATEGORIES_KEY   = "@poslovne_financije_categories";
const CURRENCY_KEY     = "@poslovne_financije_currency";

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories,   setCategories]   = useState<Category[]>(defaultCategories);
  const [currency,     setCurrencyState] = useState<Currency>(CURRENCIES[0]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [txData, catData, currData] = await Promise.all([
        AsyncStorage.getItem(TRANSACTIONS_KEY),
        AsyncStorage.getItem(CATEGORIES_KEY),
        AsyncStorage.getItem(CURRENCY_KEY),
      ]);
      if (txData)   setTransactions(JSON.parse(txData));
      if (catData)  setCategories(JSON.parse(catData));
      if (currData) {
        const saved = CURRENCIES.find(c => c.code === currData);
        if (saved) setCurrencyState(saved);
      }
    } catch {}
  }

  async function setCurrency(c: Currency) {
    setCurrencyState(c);
    await AsyncStorage.setItem(CURRENCY_KEY, c.code);
  }

  const formatAmount = useCallback((amount: number): string => {
    const formatted = new Intl.NumberFormat("bs-BA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return currency.position === "before"
      ? `${currency.symbol} ${formatted}`
      : `${formatted} ${currency.symbol}`;
  }, [currency]);

  async function saveTransactions(tx: Transaction[]) {
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(tx));
  }

  async function saveCategories(cats: Category[]) {
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
  }

  function addTransaction(t: Omit<Transaction, "id" | "createdAt">) {
    const newTx: Transaction = {
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
  }

  function deleteTransaction(id: string) {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveTransactions(updated);
  }

  function addCategory(c: Omit<Category, "id">) {
    const newCat: Category = {
      ...c,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveCategories(updated);
  }

  function deleteCategory(id: string) {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    saveCategories(updated);
  }

  function getTotalIncome() {
    return transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  }

  function getTotalExpenses() {
    return transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  }

  function getBalance() {
    return getTotalIncome() - getTotalExpenses();
  }

  function getTransactionsByMonth(year: number, month: number) {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  function getTransactionsByDateRange(from: string, to: string) {
    const fromMs = new Date(from).setHours(0, 0, 0, 0);
    const toMs   = new Date(to).setHours(23, 59, 59, 999);
    return transactions.filter(t => {
      const ms = new Date(t.date).getTime();
      return ms >= fromMs && ms <= toMs;
    });
  }

  function getCategoryTotalsByRange(type: TransactionType, from: string, to: string) {
    const txs = getTransactionsByDateRange(from, to).filter(t => t.type === type);
    const map = new Map<string, number>();
    txs.forEach(t => { map.set(t.category, (map.get(t.category) || 0) + t.amount); });
    return Array.from(map.entries())
      .map(([category, amount]) => {
        const cat = categories.find(c => c.name === category);
        return { category, amount, icon: cat?.icon || "circle" };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  function getCategoryTotals(type: TransactionType, year: number, month: number) {
    const txs = getTransactionsByMonth(year, month).filter(t => t.type === type);
    const map = new Map<string, number>();
    txs.forEach(t => { map.set(t.category, (map.get(t.category) || 0) + t.amount); });
    return Array.from(map.entries())
      .map(([category, amount]) => {
        const cat = categories.find(c => c.name === category);
        return { category, amount, icon: cat?.icon || "circle" };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  function getMonthlyTrends() {
    const now = new Date();
    const results: { month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const txs = getTransactionsByMonth(d.getFullYear(), d.getMonth());
      const income   = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expenses = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const monthName = d.toLocaleDateString("bs-BA", { month: "short" });
      results.push({ month: monthName, income, expenses });
    }
    return results;
  }

  return (
    <FinanceContext.Provider
      value={{
        transactions, categories, currency, setCurrency, formatAmount,
        addTransaction, deleteTransaction, addCategory, deleteCategory,
        getTotalIncome, getTotalExpenses, getBalance,
        getTransactionsByMonth, getTransactionsByDateRange,
        getCategoryTotals, getCategoryTotalsByRange, getMonthlyTrends,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
