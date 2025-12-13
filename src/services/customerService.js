import {
  ref,
  get,
  push,
  set,
  remove,
  update,
  serverTimestamp,
  onValue,
} from "firebase/database";
import { db } from "@/lib/firebase";
import logger from "@/utils/logger";
import { COLLECTIONS, snapshotToArray, snapshotToObject } from "./utils";

// ============ CUSTOMERS ============
export const customerService = {
  // Fetch paginated customers
  async getCustomers({ page = 1, limit = 20, searchTerm = "", filter = "all" } = {}) {
    try {
      const customersRef = ref(db, COLLECTIONS.CUSTOMERS);
      const snapshot = await get(customersRef);
      
      let customers = snapshotToArray(snapshot);
      
      // Removed manual caching logic here.
      // Fetch transactions for dues calculation
      const transactionsRef = ref(db, COLLECTIONS.TRANSACTIONS);
      const transactionsSnapshot = await get(transactionsRef);
      const allTransactions = snapshotToArray(transactionsSnapshot);
      
      // Calculate dues for each customer
      customers = customers.map((customer) => {
        const customerTransactions = allTransactions.filter(
          (t) => t.customerId === customer.id
        );
        
        const totalBill = customerTransactions.reduce(
          (sum, t) => sum + (Number(t.total) || 0),
          0
        );
        
        const totalDeposit = customerTransactions.reduce(
          (sum, t) => sum + (Number(t.deposit) || 0),
          0
        );
        
        const due = totalBill - totalDeposit;

        return {
          ...customer,
          totalBill,
          totalDeposit,
          due,
        };
      });
      
      // Apply search filter
      if (searchTerm) {
        customers = customers.filter(
          (c) =>
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm)
        );
      }
      
      // Apply due filter BEFORE pagination
      if (filter === 'due') {
        customers = customers.filter(c => c.due > 0);
      } else if (filter === 'paid') {
        customers = customers.filter(c => c.due === 0);
      }
      
      // Calculate pagination AFTER filtering
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCustomers = customers.slice(startIndex, endIndex);
      
      return {
        data: paginatedCustomers,
        total: customers.length,
        page,
        limit,
        totalPages: Math.ceil(customers.length / limit),
      };
    } catch (error) {
      logger.error("[customerService] Error fetching customers:", error);
      throw error;
    }
  },

  // Get single customer
  async getCustomer(customerId) {
    try {
      const customerRef = ref(db, `${COLLECTIONS.CUSTOMERS}/${customerId}`);
      const snapshot = await get(customerRef);
      return snapshotToObject(snapshot);
    } catch (error) {
      logger.error("[customerService] Error fetching customer:", error);
      throw error;
    }
  },

  // Add customer
  async addCustomer(customerData) {
    try {
      const customersRef = ref(db, COLLECTIONS.CUSTOMERS);
      const newCustomerRef = push(customersRef);
      await set(newCustomerRef, {
        ...customerData,
        createdAt: new Date().toISOString(),
      });
      return newCustomerRef.key;
    } catch (error) {
      logger.error("[customerService] Error adding customer:", error);
      throw error;
    }
  },

  // Update customer
  async updateCustomer(customerId, updatedData) {
    try {
      const customerRef = ref(db, `${COLLECTIONS.CUSTOMERS}/${customerId}`);
      await update(customerRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error("[customerService] Error updating customer:", error);
      throw error;
    }
  },

  // Delete customer
  async deleteCustomer(customerId) {
    try {
      // Delete customer transactions first
      const transactionsRef = ref(db, COLLECTIONS.TRANSACTIONS);
      const snapshot = await get(transactionsRef);
      const transactions = snapshotToArray(snapshot);
      
      const customerTransactions = transactions.filter(
        (t) => t.customerId === customerId
      );
      
      for (const transaction of customerTransactions) {
        await remove(ref(db, `${COLLECTIONS.TRANSACTIONS}/${transaction.id}`));
      }
      
      // Delete customer
      await remove(ref(db, `${COLLECTIONS.CUSTOMERS}/${customerId}`));
    } catch (error) {
      logger.error("[customerService] Error deleting customer:", error);
      throw error;
    }
  },

  // Subscribe to real-time updates
  subscribeToCustomers(callback) {
    const customersRef = ref(db, COLLECTIONS.CUSTOMERS);
    const unsubscribe = onValue(customersRef, (snapshot) => {
      const customers = snapshotToArray(snapshot);
      callback(customers);
    });
    return unsubscribe;
  },
};
