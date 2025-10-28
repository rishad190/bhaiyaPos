
"use client";
import { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from "react";
import { ref, onValue, push, set, remove, update, serverTimestamp, get, query, orderByChild, equalTo } from "firebase/database";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calculateFifoSale } from "@/lib/inventory-utils";
import { CustomerProvider } from "@/contexts/CustomerContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { TransactionProvider } from "@/contexts/TransactionContext";
import { SupplierProvider } from "@/contexts/SupplierContext";
import { DailyCashProvider } from "@/contexts/DailyCashContext";

const DataContext = createContext(null);

const COLLECTION_REFS = {
  CUSTOMERS: "customers",
  TRANSACTIONS: "transactions",
  DAILY_CASH: "dailyCash",
  FABRIC_BATCHES: "fabricBatches",
  FABRICS: "fabrics",
  SUPPLIERS: "suppliers",
  SUPPLIER_TRANSACTIONS: "supplierTransactions",
};

const initialState = {
  customers: [],
  transactions: [],
  dailyCashTransactions: [],
  fabricBatches: [],
  fabrics: [],
  suppliers: [],
  supplierTransactions: [],
  loading: true,
  error: null,
  settings: {
    store: { storeName: "", address: "", phone: "", email: "", currency: "৳" },
    notifications: { lowStockAlert: true, duePaymentAlert: true, newOrderAlert: true, emailNotifications: false },
    appearance: { theme: "light", compactMode: false, showImages: true },
    security: { requirePassword: false, sessionTimeout: 30, backupEnabled: true },
  },
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_CUSTOMERS": return { ...state, customers: action.payload, loading: false };
    case "SET_TRANSACTIONS": return { ...state, transactions: action.payload, loading: false };
    case "SET_DAILY_CASH_TRANSACTIONS": return { ...state, dailyCashTransactions: action.payload, loading: false };
    case "SET_FABRIC_BATCHES": return { ...state, fabricBatches: action.payload, loading: false };
    case "SET_FABRICS": return { ...state, fabrics: action.payload, loading: false };
    case "SET_SUPPLIERS": return { ...state, suppliers: action.payload, loading: false };
    case "SET_SUPPLIER_TRANSACTIONS": return { ...state, supplierTransactions: action.payload, loading: false };
    case "SET_ERROR": return { ...state, error: action.payload, loading: false };
    case "UPDATE_SETTINGS": return { ...state, settings: { ...state.settings, ...action.payload } };
    default: return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const unsubscribers = [];
    const collections = [
      { path: COLLECTION_REFS.CUSTOMERS, setter: (data) => dispatch({ type: "SET_CUSTOMERS", payload: data }) },
      { path: COLLECTION_REFS.TRANSACTIONS, setter: (data) => dispatch({ type: "SET_TRANSACTIONS", payload: data }) },
      { path: COLLECTION_REFS.DAILY_CASH, setter: (data) => dispatch({ type: "SET_DAILY_CASH_TRANSACTIONS", payload: data }) },
      { path: COLLECTION_REFS.FABRIC_BATCHES, setter: (data) => dispatch({ type: "SET_FABRIC_BATCHES", payload: data }) },
      { path: COLLECTION_REFS.FABRICS, setter: (data) => dispatch({ type: "SET_FABRICS", payload: data }) },
      { path: COLLECTION_REFS.SUPPLIERS, setter: (data) => dispatch({ type: "SET_SUPPLIERS", payload: data }) },
    ];

    try {
      collections.forEach(({ path, setter }) => {
        const collectionRef = ref(db, path);
        const unsubscribe = onValue(collectionRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = Object.entries(snapshot.val()).map(([id, value]) => ({ id, ...value }));
            setter(data);
          } else {
            setter([]);
          }
        });
        unsubscribers.push(unsubscribe);
      });
    } catch (err) {
      console.error("Error setting up Firebase listeners:", err);
      dispatch({ type: "SET_ERROR", payload: err.message });
    }

    const supplierTransactionsRef = ref(db, COLLECTION_REFS.SUPPLIER_TRANSACTIONS);
    const unsubscribe = onValue(supplierTransactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.entries(snapshot.val()).map(([id, value]) => ({ id, ...value }));
        dispatch({ type: "SET_SUPPLIER_TRANSACTIONS", payload: data });
      } else {
        dispatch({ type: "SET_SUPPLIER_TRANSACTIONS", payload: [] });
      }
    });
    unsubscribers.push(unsubscribe);

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [dispatch]);

  const customerDues = useMemo(() => {
    const dues = {};
    state.customers?.forEach((customer) => {
      dues[customer.id] = state.transactions
        ?.filter((t) => t.customerId === customer.id)
        .reduce((total, t) => total + ((t.total || 0) - (t.deposit || 0)), 0);
    });
    return dues;
  }, [state.customers, state.transactions]);

  const getCustomerDue = useCallback((customerId) => customerDues[customerId] || 0, [customerDues]);

  const customerOperations = useMemo(() => ({
    addCustomer: async (customerData) => {
      const customersRef = ref(db, COLLECTION_REFS.CUSTOMERS);
      const newCustomerRef = push(customersRef);
      await set(newCustomerRef, { ...customerData, createdAt: new Date().toISOString() });
      return newCustomerRef.key;
    },
    updateCustomer: async (customerId, updatedData) => {
      const customerRef = ref(db, `${COLLECTION_REFS.CUSTOMERS}/${customerId}`);
      await update(customerRef, { ...updatedData, updatedAt: serverTimestamp() });
    },
    deleteCustomer: async (customerId) => {
      const customerTransactions = state.transactions.filter((t) => t.customerId === customerId);
      for (const transaction of customerTransactions) {
        await remove(ref(db, `${COLLECTION_REFS.TRANSACTIONS}/${transaction.id}`));
      }
      await remove(ref(db, `${COLLECTION_REFS.CUSTOMERS}/${customerId}`));
    },
    getCustomerDue,
  }), [state.transactions, getCustomerDue]);

  const transactionOperations = useMemo(() => ({
    addTransaction: async (transactionData) => {
        const { products, ...restTransactionData } = transactionData;
        const transactionsRef = ref(db, COLLECTION_REFS.TRANSACTIONS);
        const newTransactionRef = push(transactionsRef);

        const newTransaction = {
          ...restTransactionData,
          createdAt: new Date().toISOString(),
        };

        const updates = {};
        updates[`${COLLECTION_REFS.TRANSACTIONS}/${newTransactionRef.key}`] = newTransaction;

        if (products && products.length > 0) {
          const currentBatches = JSON.parse(JSON.stringify(state.fabricBatches));
          for (const product of products) {
            const fabric = state.fabrics.find(
              (f) => f.name.toLowerCase() === product.name.toLowerCase()
            );
            if (!fabric) {
              console.warn(`Fabric not found for product: ${product.name}`);
              continue;
            }
            try {
              const { updatedBatches } = calculateFifoSale(
                currentBatches.filter((b) => b.fabricId === fabric.id),
                product.quantity,
                product.color || null
              );
              for (const batch of updatedBatches) {
                const batchPath = `${COLLECTION_REFS.FABRIC_BATCHES}/${batch.id}`;
                const batchIndex = currentBatches.findIndex(
                  (b) => b.id === batch.id
                );
                if (batch.quantity > 0) {
                  updates[batchPath] = {
                    ...currentBatches[batchIndex],
                    quantity: batch.quantity,
                    colors: batch.colors,
                    updatedAt: new Date().toISOString(),
                  };
                  if (batchIndex !== -1) {
                    currentBatches[batchIndex].quantity = batch.quantity;
                    currentBatches[batchIndex].colors = batch.colors;
                  }
                } else {
                  updates[batchPath] = null;
                  if (batchIndex !== -1) {
                    currentBatches.splice(batchIndex, 1);
                  }
                }
              }
            } catch (error) {
              console.error(
                `FIFO calculation error for product ${product.name}:`,
                error
              );
              throw new Error(
                `Inventory update failed for ${product.name}: ${error.message}`
              );
            }
          }
        }
        await update(ref(db), updates);
        return newTransactionRef.key;
      },
    updateTransaction: async (transactionId, updatedData) => {
      const transactionRef = ref(db, `${COLLECTION_REFS.TRANSACTIONS}/${transactionId}`);
      await update(transactionRef, { ...updatedData, updatedAt: serverTimestamp() });
    },
    deleteTransaction: async (transactionId) => {
      await remove(ref(db, `${COLLECTION_REFS.TRANSACTIONS}/${transactionId}`));
    },
  }), [state.fabrics, state.fabricBatches]);

  const fabricOperations = useMemo(() => ({
    addFabric: async (fabricData) => {
      await push(ref(db, COLLECTION_REFS.FABRICS), fabricData);
    },
    updateFabric: async (fabricId, updatedData) => {
      await update(ref(db, `${COLLECTION_REFS.FABRICS}/${fabricId}`), { ...updatedData, updatedAt: serverTimestamp() });
    },
    deleteFabric: async (fabricId) => {
      await remove(ref(db, `${COLLECTION_REFS.FABRICS}/${fabricId}`));
    },
    addFabricBatch: async (batchData) => {
      await push(ref(db, COLLECTION_REFS.FABRIC_BATCHES), { ...batchData, createdAt: serverTimestamp() });
    },
    updateFabricBatch: async (batchId, updatedData) => {
      const batchRef = ref(db, `${COLLECTION_REFS.FABRIC_BATCHES}/${batchId}`);
      await update(batchRef, { ...updatedData, updatedAt: serverTimestamp() });
    },
    deleteFabricBatch: async (batchId) => {
      try {
        const batchRef = ref(db, `${COLLECTION_REFS.FABRIC_BATCHES}/${batchId}`);
        const batchSnapshot = await get(batchRef);
        if (!batchSnapshot.exists()) throw new Error("Batch not found");
        await remove(batchRef);
      } catch (error) {
        console.error("Error deleting fabric batch:", error);
        throw error;
      }
    },
  }), []);

  const supplierOperations = useMemo(() => ({
    addSupplier: async (supplierData) => {
      try {
        const suppliersRef = ref(db, COLLECTION_REFS.SUPPLIERS);
        const newSupplierRef = push(suppliersRef);
        await set(newSupplierRef, { ...supplierData, totalDue: 0, createdAt: serverTimestamp() });
        return newSupplierRef.key;
      } catch (error) {
        console.error("Error adding supplier:", error);
        throw error;
      }
    },
    updateSupplier: async (supplierId, updatedData) => {
      try {
        const supplierRef = ref(db, `${COLLECTION_REFS.SUPPLIERS}/${supplierId}`);
        await update(supplierRef, { ...updatedData, updatedAt: serverTimestamp() });
      } catch (error) {
        console.error("Error updating supplier:", error);
        throw error;
      }
    },
    deleteSupplier: async (supplierId) => {
      try {
        const supplierTransactions = state.transactions.filter((t) => t.supplierId === supplierId);
        for (const transaction of supplierTransactions) {
          await remove(ref(db, `${COLLECTION_REFS.SUPPLIER_TRANSACTIONS}/${transaction.id}`));
        }
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
        const newTransaction = { ...transaction, id: newTransactionRef.key, due: transaction.totalAmount - (transaction.paidAmount || 0), createdAt: serverTimestamp() };
        await set(newTransactionRef, newTransaction);
        const supplierRef = ref(db, `${COLLECTION_REFS.SUPPLIERS}/${transaction.supplierId}`);
        const supplierSnapshot = await get(supplierRef);
        if (supplierSnapshot.exists()) {
          const currentDue = supplierSnapshot.val().totalDue || 0;
          await update(supplierRef, { totalDue: currentDue + newTransaction.due, updatedAt: serverTimestamp() });
        }
        return newTransactionRef.key;
      } catch (error) {
        console.error("Error adding supplier transaction:", error);
        throw error;
      }
    },
    deleteSupplierTransaction: async (transactionId, supplierId, amount, paidAmount) => {
      try {
        await remove(ref(db, `${COLLECTION_REFS.SUPPLIER_TRANSACTIONS}/${transactionId}`));
        const supplierRef = ref(db, `${COLLECTION_REFS.SUPPLIERS}/${supplierId}`);
        const supplierSnapshot = await get(supplierRef);
        if (supplierSnapshot.exists()) {
          const supplier = supplierSnapshot.val();
          const dueAmount = amount - (paidAmount || 0);
          const newTotalDue = Math.max(0, (supplier.totalDue || 0) - dueAmount);
          await update(supplierRef, { totalDue: newTotalDue, updatedAt: serverTimestamp() });
        }
      } catch (error) {
        console.error("Error deleting supplier transaction:", error);
        throw error;
      }
    },
  }), [state.transactions]);

  const dailyCashOperations = useMemo(() => ({
    addDailyCashTransaction: async (transaction) => {
      try {
        const dailyCashRef = ref(db, COLLECTION_REFS.DAILY_CASH);
        const newTransactionRef = push(dailyCashRef);
        await set(newTransactionRef, { ...transaction, id: newTransactionRef.key, createdAt: serverTimestamp() });

        if (transaction.type === "sale" && transaction.reference) {
          const customerTransactionRef = query(ref(db, "transactions"), orderByChild("memoNumber"), equalTo(transaction.reference));
          const snapshot = await get(customerTransactionRef);
          if (snapshot.exists()) {
            const [transactionId, transactionData] = Object.entries(snapshot.val())[0];
            await update(ref(db, `transactions/${transactionId}`), {
              deposit: (transactionData.deposit || 0) + (transaction.cashIn || 0),
              due: transactionData.total - ((transactionData.deposit || 0) + (transaction.cashIn || 0)),
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
        await remove(ref(db, `${COLLECTION_REFS.DAILY_CASH}/${transactionId}`));
      } catch (error) {
        console.error("Error deleting daily cash transaction:", error);
        throw error;
      }
    },
    updateDailyCashTransaction: async (transactionId, updatedData) => {
      try {
        const transactionRef = ref(db, `${COLLECTION_REFS.DAILY_CASH}/${transactionId}`);
        await update(transactionRef, { ...updatedData, updatedAt: serverTimestamp() });
      } catch (error) {
        console.error("Error updating daily cash transaction:", error);
        throw error;
      }
    },
  }), []);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      await updateDoc(doc(db, "settings", "app"), newSettings);
      dispatch({ type: "UPDATE_SETTINGS", payload: newSettings });
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  }, []);

  return (
    <DataContext.Provider value={{...state, settings: state.settings, updateSettings }}>
      <CustomerProvider customerOperations={customerOperations} customers={state.customers} customerDues={customerDues}>
        <InventoryProvider fabricOperations={fabricOperations} fabrics={state.fabrics} fabricBatches={state.fabricBatches}>
          <TransactionProvider transactionOperations={transactionOperations} transactions={state.transactions}>
            <SupplierProvider supplierOperations={supplierOperations} suppliers={state.suppliers} supplierTransactions={state.supplierTransactions}>
              <DailyCashProvider dailyCashOperations={dailyCashOperations} dailyCashTransactions={state.dailyCashTransactions}>
                {children}
              </DailyCashProvider>
            </SupplierProvider>
          </TransactionProvider>
        </InventoryProvider>
      </CustomerProvider>
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
}
