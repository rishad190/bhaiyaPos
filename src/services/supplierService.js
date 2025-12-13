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

  // Get all supplier transactions
  async getSupplierTransactions() {
    try {
      const transactionsRef = ref(db, COLLECTIONS.SUPPLIER_TRANSACTIONS);
      const snapshot = await get(transactionsRef);
      return snapshotToArray(snapshot);
    } catch (error) {
      logger.error("[supplierService] Error fetching supplier transactions:", error);
      throw error;
    }
  },
};
