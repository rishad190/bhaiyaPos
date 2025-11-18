import {
  ref,
  get,
  push,
  set,
  remove,
  update,
  query,
  orderByChild,
  limitToFirst,
  limitToLast,
  startAt,
  endAt,
  equalTo,
  serverTimestamp,
  onValue,
  off,
} from "firebase/database";
import { db } from "@/lib/firebase";
import logger from "@/utils/logger";

// Collection references
export const COLLECTIONS = {
  CUSTOMERS: "customers",
  TRANSACTIONS: "transactions",
  DAILY_CASH: "dailyCash",
  SUPPLIERS: "suppliers",
  SUPPLIER_TRANSACTIONS: "supplierTransactions",
  FABRICS: "fabrics",
  SETTINGS: "settings",
};

// Helper to convert Firebase snapshot to array
const snapshotToArray = (snapshot) => {
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data).map(([id, value]) => ({
    id,
    ...value,
  }));
};

// Helper to convert Firebase snapshot to object
const snapshotToObject = (snapshot) => {
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.key,
    ...snapshot.val(),
  };
};

// ============ CUSTOMERS ============
export const customerService = {
  // Fetch paginated customers
  async getCustomers({ page = 1, limit = 20, searchTerm = "", filter = "all" } = {}) {
    try {
      const customersRef = ref(db, COLLECTIONS.CUSTOMERS);
      const snapshot = await get(customersRef);
      
      let customers = snapshotToArray(snapshot);
      
      // Apply search filter
      if (searchTerm) {
        customers = customers.filter(
          (c) =>
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm)
        );
      }
      
      // Calculate pagination
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

// ============ TRANSACTIONS ============
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

// ============ SUPPLIERS ============
export const supplierService = {
  // Fetch paginated suppliers
  async getSuppliers({ page = 1, limit = 20, searchTerm = "" } = {}) {
    try {
      const suppliersRef = ref(db, COLLECTIONS.SUPPLIERS);
      const snapshot = await get(suppliersRef);
      
      let suppliers = snapshotToArray(snapshot);
      
      // Apply search filter
      if (searchTerm) {
        suppliers = suppliers.filter(
          (s) =>
            s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.phone?.includes(searchTerm)
        );
      }
      
      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSuppliers = suppliers.slice(startIndex, endIndex);
      
      return {
        data: paginatedSuppliers,
        total: suppliers.length,
        page,
        limit,
        totalPages: Math.ceil(suppliers.length / limit),
      };
    } catch (error) {
      logger.error("[supplierService] Error fetching suppliers:", error);
      throw error;
    }
  },

  // Add supplier
  async addSupplier(supplierData) {
    try {
      const suppliersRef = ref(db, COLLECTIONS.SUPPLIERS);
      const newSupplierRef = push(suppliersRef);
      await set(newSupplierRef, {
        ...supplierData,
        totalDue: 0,
        createdAt: serverTimestamp(),
      });
      return newSupplierRef.key;
    } catch (error) {
      logger.error("[supplierService] Error adding supplier:", error);
      throw error;
    }
  },

  // Update supplier
  async updateSupplier(supplierId, updatedData) {
    try {
      const supplierRef = ref(db, `${COLLECTIONS.SUPPLIERS}/${supplierId}`);
      await update(supplierRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error("[supplierService] Error updating supplier:", error);
      throw error;
    }
  },

  // Delete supplier
  async deleteSupplier(supplierId) {
    try {
      await remove(ref(db, `${COLLECTIONS.SUPPLIERS}/${supplierId}`));
    } catch (error) {
      logger.error("[supplierService] Error deleting supplier:", error);
      throw error;
    }
  },
};

// ============ FABRICS ============
export const fabricService = {
  // Fetch paginated fabrics
  async getFabrics({ page = 1, limit = 20, searchTerm = "" } = {}) {
    try {
      const fabricsRef = ref(db, COLLECTIONS.FABRICS);
      const snapshot = await get(fabricsRef);
      
      let fabrics = snapshotToArray(snapshot).map((fabric) => {
        // Remove the 'id' field from the fabric data if it exists (it shouldn't be stored in the data)
        const { id: storedId, ...fabricData } = fabric;
        
        return {
          ...fabricData,
          id: fabric.id, // Use the Firebase key as the ID
          batches: fabricData.batches
            ? Object.entries(fabricData.batches).map(([batchId, batch]) => ({
                id: batchId,
                ...batch,
              }))
            : [],
        };
      });
      
      logger.info('[fabricService] Total fabrics fetched:', fabrics.length);
      if (fabrics.length > 0) {
        logger.info('[fabricService] Sample fabric:', fabrics[0]);
      }
      
      // Apply search filter
      if (searchTerm) {
        fabrics = fabrics.filter((f) =>
          f.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedFabrics = fabrics.slice(startIndex, endIndex);
      
      return {
        data: paginatedFabrics,
        total: fabrics.length,
        page,
        limit,
        totalPages: Math.ceil(fabrics.length / limit),
      };
    } catch (error) {
      logger.error("[fabricService] Error fetching fabrics:", error);
      throw error;
    }
  },

  // Add fabric
  async addFabric(fabricData) {
    try {
      const fabricsRef = ref(db, COLLECTIONS.FABRICS);
      const newFabricRef = push(fabricsRef);
      
      // Remove 'id' field if it exists - Firebase key is the ID
      const { id, ...dataWithoutId } = fabricData;
      
      const fabricToSave = {
        ...dataWithoutId,
        batches: dataWithoutId.batches || {},
        createdAt: new Date().toISOString(),
      };
      
      logger.info('[fabricService] Adding fabric:', fabricToSave);
      await set(newFabricRef, fabricToSave);
      
      logger.info('[fabricService] Fabric added with ID:', newFabricRef.key);
      return newFabricRef.key;
    } catch (error) {
      logger.error("[fabricService] Error adding fabric:", error);
      throw error;
    }
  },

  // Update fabric
  async updateFabric(fabricId, updatedData) {
    try {
      // Remove 'id' field if it exists - Firebase key is the ID
      const { id, ...dataWithoutId } = updatedData;
      
      const fabricRef = ref(db, `${COLLECTIONS.FABRICS}/${fabricId}`);
      await update(fabricRef, {
        ...dataWithoutId,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("[fabricService] Error updating fabric:", error);
      throw error;
    }
  },

  // Delete fabric
  async deleteFabric(fabricId) {
    try {
      await remove(ref(db, `${COLLECTIONS.FABRICS}/${fabricId}`));
    } catch (error) {
      logger.error("[fabricService] Error deleting fabric:", error);
      throw error;
    }
  },
};

// ============ DAILY CASH ============
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

// ============ SETTINGS ============
export const settingsService = {
  // Get settings
  async getSettings() {
    try {
      const settingsRef = ref(db, COLLECTIONS.SETTINGS);
      const snapshot = await get(settingsRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      logger.error("[settingsService] Error fetching settings:", error);
      throw error;
    }
  },

  // Update settings
  async updateSettings(newSettings) {
    try {
      await update(ref(db, COLLECTIONS.SETTINGS), newSettings);
    } catch (error) {
      logger.error("[settingsService] Error updating settings:", error);
      throw error;
    }
  },
};
