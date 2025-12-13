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

export const dailyCashService = {
  // Fetch paginated daily cash transactions
  async getDailyCashTransactions({ page = 1, limit = 20, dateRange = null } = {}) {
    try {
      const dailyCashRef = ref(db, COLLECTIONS.DAILY_CASH);
      const snapshot = await get(dailyCashRef);
      
      let transactions = snapshotToArray(snapshot);
      
      // Filter by date range if specified
      if (dateRange) {
        transactions = transactions.filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            transactionDate >= dateRange.start && transactionDate <= dateRange.end
          );
        });
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
      logger.error("[dailyCashService] Error fetching daily cash:", error);
      throw error;
    }
  },

  // Add daily cash transaction
  async addDailyCashTransaction(transaction) {
    try {
      const dailyCashRef = ref(db, COLLECTIONS.DAILY_CASH);
      const newTransactionRef = push(dailyCashRef);
      await set(newTransactionRef, {
        ...transaction,
        id: newTransactionRef.key,
        createdAt: serverTimestamp(),
      });
      return newTransactionRef.key;
    } catch (error) {
      logger.error("[dailyCashService] Error adding daily cash transaction:", error);
      throw error;
    }
  },

  // Update daily cash transaction
  async updateDailyCashTransaction(transactionId, updatedData) {
    try {
      const transactionRef = ref(db, `${COLLECTIONS.DAILY_CASH}/${transactionId}`);
      await update(transactionRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error("[dailyCashService] Error updating daily cash transaction:", error);
      throw error;
    }
  },

  // Delete daily cash transaction
  async deleteDailyCashTransaction(transactionId) {
    try {
      await remove(ref(db, `${COLLECTIONS.DAILY_CASH}/${transactionId}`));
    } catch (error) {
      logger.error("[dailyCashService] Error deleting daily cash transaction:", error);
      throw error;
    }
  },
};
