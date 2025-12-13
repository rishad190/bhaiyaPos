import {
  ref,
  get,
  push,
  set,
  remove,
  update,
  serverTimestamp,
} from "firebase/database";
import { db } from "@/lib/firebase";
import logger from "@/utils/logger";
import { COLLECTIONS, snapshotToArray } from "./utils";

export const transactionService = {
  // Fetch paginated transactions
  async getTransactions({ page = 1, limit = 20, customerId = null } = {}) {
    try {
      const transactionsRef = ref(db, COLLECTIONS.TRANSACTIONS);
      const snapshot = await get(transactionsRef);
      
      let transactions = snapshotToArray(snapshot);
      
      // Filter by customer if specified
      if (customerId) {
        transactions = transactions.filter((t) => t.customerId === customerId);
      }
      
      // Sort by date (newest first)
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTransactions = transactions.slice(startIndex, endIndex);
      
      return {
        data: paginatedTransactions,
        total: transactions.length,
        page,
        limit,
        totalPages: Math.ceil(transactions.length / limit),
      };
    } catch (error) {
      logger.error("[transactionService] Error fetching transactions:", error);
      throw error;
    }
  },

  // Get customer transactions (for calculating dues)
  async getCustomerTransactions(customerId) {
    try {
      const transactionsRef = ref(db, COLLECTIONS.TRANSACTIONS);
      const snapshot = await get(transactionsRef);
      const transactions = snapshotToArray(snapshot);
      return transactions.filter((t) => t.customerId === customerId);
    } catch (error) {
      logger.error("[transactionService] Error fetching customer transactions:", error);
      throw error;
    }
  },

  // Add transaction
  async addTransaction(transactionData) {
    try {
      const transactionsRef = ref(db, COLLECTIONS.TRANSACTIONS);
      const newTransactionRef = push(transactionsRef);
      await set(newTransactionRef, {
        ...transactionData,
        createdAt: new Date().toISOString(),
      });
      return newTransactionRef.key;
    } catch (error) {
      logger.error("[transactionService] Error adding transaction:", error);
      throw error;
    }
  },

  // Update transaction
  async updateTransaction(transactionId, updatedData) {
    try {
      const transactionRef = ref(db, `${COLLECTIONS.TRANSACTIONS}/${transactionId}`);
      await update(transactionRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error("[transactionService] Error updating transaction:", error);
      throw error;
    }
  },

  // Delete transaction
  async deleteTransaction(transactionId) {
    try {
      await remove(ref(db, `${COLLECTIONS.TRANSACTIONS}/${transactionId}`));
    } catch (error) {
      logger.error("[transactionService] Error deleting transaction:", error);
      throw error;
    }
  },
};
