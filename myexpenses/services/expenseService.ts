import { Expense } from '../types';

const EXPENSES_DB_KEY = 'expensesDB_v2'; // New key for user-specific data
const OLD_EXPENSES_KEY = 'expenses'; // Old key for anonymous data

type ExpensesDB = Record<string, Expense[]>;

const getExpensesDB = (): ExpensesDB => {
    try {
        const db = localStorage.getItem(EXPENSES_DB_KEY);
        return db ? JSON.parse(db) : {};
    } catch {
        return {};
    }
};

const saveExpensesDB = (db: ExpensesDB) => {
    localStorage.setItem(EXPENSES_DB_KEY, JSON.stringify(db));
};

export const getExpenses = (userId: string): Expense[] => {
    const db = getExpensesDB();
    return db[userId] || [];
};

export const saveExpenses = (userId: string, expenses: Expense[]): void => {
    const db = getExpensesDB();
    db[userId] = expenses;
    saveExpensesDB(db);
};

/**
 * Checks for expenses stored under the old, non-user-specific key.
 * If found, moves them to the current user's account and removes the old data.
 * This ensures a smooth transition for existing users.
 */
export const migrateLocalExpenses = (userId: string): void => {
    try {
        const oldExpensesRaw = localStorage.getItem(OLD_EXPENSES_KEY);
        if (oldExpensesRaw) {
            const oldExpenses: Expense[] = JSON.parse(oldExpensesRaw);
            if (Array.isArray(oldExpenses) && oldExpenses.length > 0) {
                const db = getExpensesDB();
                // Merge with any existing data, giving preference to already migrated data
                const existingExpenses = db[userId] || [];
                const mergedExpenses = [...existingExpenses, ...oldExpenses];
                
                // Simple de-duplication based on ID
                const uniqueExpenses = Array.from(new Map(mergedExpenses.map(exp => [exp.id, exp])).values());

                db[userId] = uniqueExpenses;
                saveExpensesDB(db);
                
                // Clean up old data after successful migration
                localStorage.removeItem(OLD_EXPENSES_KEY);
                console.log(`Migrated ${oldExpenses.length} local expenses to user ${userId}.`);
            } else {
                // If the old data is empty or invalid, just remove it.
                localStorage.removeItem(OLD_EXPENSES_KEY);
            }
        }
    } catch (error) {
        console.error('Failed to migrate local expenses:', error);
    }
};
