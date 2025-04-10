"use client";
import { createContext, useContext, useState, useEffect } from "react";
import {
  ref,
  onValue,
  push,
  set,
  remove,
  update,
  serverTimestamp,
  get,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { db } from "@/lib/firebase";

// Create context
const DataContext = createContext(null);

// Firebase References
const COLLECTION_REFS = {
  CUSTOMERS: "customers",
  TRANSACTIONS: "transactions",
  DAILY_CASH: "dailyCash",
  FABRIC_BATCHES: "fabricBatches",
  FABRICS: "fabrics",
  SUPPLIERS: "suppliers",
  SUPPLIER_TRANSACTIONS: "supplierTransactions",
};

// Export the provider component
export function DataProvider({ children }) {
  // State Management
  const [state, setState] = useState({
    customers: [],
    transactions: [],
    dailyCashTransactions: [],
    fabricBatches: [],
    fabrics: [],
    suppliers: [],
    supplierTransactions: [],
    loading: true,
    error: null,
  });

  // Firebase Subscriptions
  useEffect(() => {
    const unsubscribers = [];
    const collections = [
      {
        path: COLLECTION_REFS.CUSTOMERS,
        setter: (data) => setState((prev) => ({ ...prev, customers: data })),
      },
      {
        path: COLLECTION_REFS.TRANSACTIONS,
        setter: (data) => setState((prev) => ({ ...prev, transactions: data })),
      },
      {
        path: COLLECTION_REFS.DAILY_CASH,
        setter: (data) =>
          setState((prev) => ({ ...prev, dailyCashTransactions: data })),
      },
      {
        path: COLLECTION_REFS.FABRIC_BATCHES,
        setter: (data) =>
          setState((prev) => ({ ...prev, fabricBatches: data })),
      },
      {
        path: COLLECTION_REFS.FABRICS,
        setter: (data) => setState((prev) => ({ ...prev, fabrics: data })),
      },
      {
        path: COLLECTION_REFS.SUPPLIERS,
        setter: (data) => setState((prev) => ({ ...prev, suppliers: data })),
      },
    ];

    try {
      collections.forEach(({ path, setter }) => {
        const collectionRef = ref(db, path);
        const unsubscribe = onValue(collectionRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = Object.entries(snapshot.val()).map(([id, value]) => ({
              id,
              ...value,
            }));
            setter(data);
          } else {
            setter([]);
          }
        });
        unsubscribers.push(unsubscribe);
      });
    } catch (err) {
      console.error("Error setting up Firebase listeners:", err);
      setState((prev) => ({ ...prev, error: err.message, loading: false }));
    }

    const supplierTransactionsRef = ref(
      db,
      COLLECTION_REFS.SUPPLIER_TRANSACTIONS
    );
    const unsubscribe = onValue(supplierTransactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.entries(snapshot.val()).map(([id, value]) => ({
          id,
          ...value,
        }));
        setState((prev) => ({ ...prev, supplierTransactions: data }));
      } else {
        setState((prev) => ({ ...prev, supplierTransactions: [] }));
      }
    });
    unsubscribers.push(unsubscribe);

    return () => unsubscribers.forEach((unsub) => unsub());
  }, []);

  // Customer Operations
  const customerOperations = {
    addCustomer: async (customerData) => {
      const customersRef = ref(db, COLLECTION_REFS.CUSTOMERS);
      const newCustomerRef = push(customersRef);
      await set(newCustomerRef, {
        ...customerData,
        createdAt: new Date().toISOString(),
      });
      return newCustomerRef.key;
    },

    updateCustomer: async (customerId, updatedData) => {
      const customerRef = ref(db, `${COLLECTION_REFS.CUSTOMERS}/${customerId}`);
      await update(customerRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    },

    deleteCustomer: async (customerId) => {
      // First delete associated transactions
      const customerTransactions = state.transactions.filter(
        (t) => t.customerId === customerId
      );
      for (const transaction of customerTransactions) {
        await remove(
          ref(db, `${COLLECTION_REFS.TRANSACTIONS}/${transaction.id}`)
        );
      }
      // Then delete the customer
      await remove(ref(db, `${COLLECTION_REFS.CUSTOMERS}/${customerId}`));
    },

    getCustomerDue: (customerId) => {
      return state.transactions
        .filter((t) => t.customerId === customerId)
        .reduce((total, t) => total + (parseFloat(t.due) || 0), 0);
    },
  };

  // Transaction Operations
  const transactionOperations = {
    addTransaction: async (transactionData) => {
      const transactionsRef = ref(db, COLLECTION_REFS.TRANSACTIONS);
      const newTransactionRef = push(transactionsRef);
      await set(newTransactionRef, {
        ...transactionData,
        createdAt: new Date().toISOString(),
      });

      return newTransactionRef.key;
    },

    updateTransaction: async (transactionId, updatedData) => {
      const transactionRef = ref(
        db,
        `${COLLECTION_REFS.TRANSACTIONS}/${transactionId}`
      );
      await update(transactionRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    },

    deleteTransaction: async (transactionId) => {
      await remove(ref(db, `${COLLECTION_REFS.TRANSACTIONS}/${transactionId}`));
    },
  };

  // Fabric Operations
  const fabricOperations = {
    addFabric: async (fabricData) => {
      await push(ref(db, COLLECTION_REFS.FABRICS), fabricData);
    },

    updateFabric: async (fabricId, updatedData) => {
      await update(ref(db, `${COLLECTION_REFS.FABRICS}/${fabricId}`), {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    },

    deleteFabric: async (fabricId) => {
      await remove(ref(db, `${COLLECTION_REFS.FABRICS}/${fabricId}`));
    },

    addFabricBatch: async (batchData) => {
      await push(ref(db, COLLECTION_REFS.FABRIC_BATCHES), {
        ...batchData,
        createdAt: serverTimestamp(),
      });
    },

    deleteFabricBatch: async (batchId) => {
      try {
        // Get the batch data first to update fabric totals
        const batchRef = ref(
          db,
          `${COLLECTION_REFS.FABRIC_BATCHES}/${batchId}`
        );
        const batchSnapshot = await get(batchRef);

        if (!batchSnapshot.exists()) {
          throw new Error("Batch not found");
        }

        // Delete the batch
        await remove(batchRef);
      } catch (error) {
        console.error("Error deleting fabric batch:", error);
        throw error;
      }
    },
  };

  // Supplier Operations
  const supplierOperations = {
    addSupplier: async (supplierData) => {
      try {
        const suppliersRef = ref(db, COLLECTION_REFS.SUPPLIERS);
        const newSupplierRef = push(suppliersRef);
        await set(newSupplierRef, {
          ...supplierData,
          totalDue: 0,
          createdAt: serverTimestamp(),
        });
        return newSupplierRef.key;
      } catch (error) {
        console.error("Error adding supplier:", error);
        throw error;
      }
    },

    updateSupplier: async (supplierId, updatedData) => {
      try {
        const supplierRef = ref(
          db,
          `${COLLECTION_REFS.SUPPLIERS}/${supplierId}`
        );
        await update(supplierRef, {
          ...updatedData,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error updating supplier:", error);
        throw error;
      }
    },

    deleteSupplier: async (supplierId) => {
      try {
        // First delete associated transactions
        const supplierTransactions = state.transactions.filter(
          (t) => t.supplierId === supplierId
        );

        for (const transaction of supplierTransactions) {
          await remove(
            ref(
              db,
              `${COLLECTION_REFS.SUPPLIER_TRANSACTIONS}/${transaction.id}`
            )
          );
        }

        // Then delete the supplier
        await remove(ref(db, `${COLLECTION_REFS.SUPPLIERS}/${supplierId}`));
      } catch (error) {
        console.error("Error deleting supplier:", error);
        throw error;
      }
    },

    addSupplierTransaction: async (transaction) => {
      try {
        const transactionsRef = ref(db, COLLECTION_REFS.SUPPLIER_TRANSACTIONS);
        const newTransactionRef = push(transactionsRef);

        const newTransaction = {
          ...transaction,
          id: newTransactionRef.key,
          due: transaction.totalAmount - (transaction.paidAmount || 0),
          createdAt: serverTimestamp(),
        };

        await set(newTransactionRef, newTransaction);

        // Update supplier's total due
        const supplierRef = ref(
          db,
          `${COLLECTION_REFS.SUPPLIERS}/${transaction.supplierId}`
        );
        const supplierSnapshot = await get(supplierRef);

        if (supplierSnapshot.exists()) {
          const currentDue = supplierSnapshot.val().totalDue || 0;
          await update(supplierRef, {
            totalDue: currentDue + newTransaction.due,
            updatedAt: serverTimestamp(),
          });
        }

        return newTransactionRef.key;
      } catch (error) {
        console.error("Error adding supplier transaction:", error);
        throw error;
      }
    },

    deleteSupplierTransaction: async (
      transactionId,
      supplierId,
      amount,
      paidAmount
    ) => {
      try {
        // Delete transaction
        await remove(
          ref(db, `${COLLECTION_REFS.SUPPLIER_TRANSACTIONS}/${transactionId}`)
        );

        // Update supplier's total due
        const supplierRef = ref(
          db,
          `${COLLECTION_REFS.SUPPLIERS}/${supplierId}`
        );
        const supplierSnapshot = await get(supplierRef);

        if (supplierSnapshot.exists()) {
          const supplier = supplierSnapshot.val();
          const dueAmount = amount - (paidAmount || 0);
          const newTotalDue = Math.max(0, (supplier.totalDue || 0) - dueAmount);

          await update(supplierRef, {
            totalDue: newTotalDue,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error("Error deleting supplier transaction:", error);
        throw error;
      }
    },
  };

  const dailyCashOperations = {
    addDailyCashTransaction: async (transaction) => {
      try {
        const dailyCashRef = ref(db, COLLECTION_REFS.DAILY_CASH);
        const newTransactionRef = push(dailyCashRef);
        await set(newTransactionRef, {
          ...transaction,
          id: newTransactionRef.key,
          createdAt: serverTimestamp(),
        });

        // Update related customer transaction if it's a sale
        if (transaction.type === "sale" && transaction.reference) {
          const customerTransactionRef = query(
            ref(db, "transactions"),
            orderByChild("memoNumber"),
            equalTo(transaction.reference)
          );

          const snapshot = await get(customerTransactionRef);
          if (snapshot.exists()) {
            const [transactionId, transactionData] = Object.entries(
              snapshot.val()
            )[0];
            await update(ref(db, `transactions/${transactionId}`), {
              deposit:
                (transactionData.deposit || 0) + (transaction.cashIn || 0),
              due:
                transactionData.total -
                ((transactionData.deposit || 0) + (transaction.cashIn || 0)),
            });
          }
        }

        return newTransactionRef.key;
      } catch (error) {
        console.error("Error adding daily cash transaction:", error);
        throw error;
      }
    },

    deleteDailyCashTransaction: async (transactionId) => {
      try {
        const transactionRef = ref(
          db,
          `${COLLECTION_REFS.DAILY_CASH}/${transactionId}`
        );
        await remove(transactionRef);
      } catch (error) {
        console.error("Error deleting daily cash transaction:", error);
        throw error;
      }
    },

    updateDailyCashTransaction: async (transactionId, updatedData) => {
      try {
        const transactionRef = ref(
          db,
          `${COLLECTION_REFS.DAILY_CASH}/${transactionId}`
        );
        await update(transactionRef, {
          ...updatedData,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error updating daily cash transaction:", error);
        throw error;
      }
    },
  };

  const contextValue = {
    // State
    ...state,
    // Operations
    ...customerOperations,
    ...transactionOperations,
    ...fabricOperations,
    ...supplierOperations,
    ...dailyCashOperations, // Make sure this is included
  };

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
}

// Export the hook to use the context
export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
