"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from "react";
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
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calculateFifoSale } from "@/lib/inventory-utils";

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

// Add settings to the initial state
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
    store: {
      storeName: "",
      address: "",
      phone: "",
      email: "",
      currency: "৳",
    },
    notifications: {
      lowStockAlert: true,
      duePaymentAlert: true,
      newOrderAlert: true,
      emailNotifications: false,
    },
    appearance: {
      theme: "light",
      compactMode: false,
      showImages: true,
    },
    security: {
      requirePassword: false,
      sessionTimeout: 30,
      backupEnabled: true,
    },
  },
};

// Add settings reducer cases
function reducer(state, action) {
  switch (action.type) {
    case "SET_CUSTOMERS":
      return {
        ...state,
        customers: action.payload,
        loading: false,
      };
    case "SET_TRANSACTIONS":
      return {
        ...state,
        transactions: action.payload,
        loading: false,
      };
    case "SET_DAILY_CASH_TRANSACTIONS":
      return {
        ...state,
        dailyCashTransactions: action.payload,
        loading: false,
      };
    case "SET_FABRIC_BATCHES":
      return {
        ...state,
        fabricBatches: action.payload,
        loading: false,
      };
    case "SET_FABRICS":
      return {
        ...state,
        fabrics: action.payload,
        loading: false,
      };
    case "SET_SUPPLIERS":
      return {
        ...state,
        suppliers: action.payload,
        loading: false,
      };
    case "SET_SUPPLIER_TRANSACTIONS":
      return {
        ...state,
        supplierTransactions: action.payload,
        loading: false,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}

// Export the provider component
export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Memoized fabrics with batches
  const fabricsWithBatches = useMemo(() => {
    const fabrics = state.fabrics;
    const fabricBatches = state.fabricBatches;

    if (!fabrics || !fabricBatches) return [];

    return Object.entries(fabrics).map(([id, fabric]) => {
      // Find all batches for this fabric
      const batches = Object.values(fabricBatches).filter(
        (batch) => batch.fabricId === id
      );

      return {
        ...fabric,
        id,
        batches,
      };
    });
  }, [state.fabrics, state.fabricBatches]);

  // Firebase Subscriptions
  useEffect(() => {
    const unsubscribers = [];
    const collections = [
      {
        path: COLLECTION_REFS.CUSTOMERS,
        setter: (data) => dispatch({ type: "SET_CUSTOMERS", payload: data }),
      },
      {
        path: COLLECTION_REFS.TRANSACTIONS,
        setter: (data) => dispatch({ type: "SET_TRANSACTIONS", payload: data }),
      },
      {
        path: COLLECTION_REFS.DAILY_CASH,
        setter: (data) =>
          dispatch({ type: "SET_DAILY_CASH_TRANSACTIONS", payload: data }),
      },
      {
        path: COLLECTION_REFS.FABRIC_BATCHES,
        setter: (data) =>
          dispatch({ type: "SET_FABRIC_BATCHES", payload: data }),
      },
      {
        path: COLLECTION_REFS.FABRICS,
        setter: (data) => dispatch({ type: "SET_FABRICS", payload: data }),
      },
      {
        path: COLLECTION_REFS.SUPPLIERS,
        setter: (data) => dispatch({ type: "SET_SUPPLIERS", payload: data }),
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
      dispatch({ type: "SET_ERROR", payload: err.message });
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
        dispatch({ type: "SET_SUPPLIER_TRANSACTIONS", payload: data });
      } else {
        dispatch({ type: "SET_SUPPLIER_TRANSACTIONS", payload: [] });
      }
    });
    unsubscribers.push(unsubscribe);

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [dispatch]);

  // Add memoization for customer dues
  const customerDues = useMemo(() => {
    const dues = {};
    state.customers?.forEach((customer) => {
      dues[customer.id] = state.transactions
        ?.filter((t) => t.customerId === customer.id)
        .reduce((total, t) => total + ((t.total || 0) - (t.deposit || 0)), 0);
    });
    return dues;
  }, [state.customers, state.transactions]);

  const getCustomerDue = useCallback(
    (customerId) => {
      return customerDues[customerId] || 0;
    },
    [customerDues]
  );

  // Customer Operations
  const customerOperations = useMemo(
    () => ({
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
        const customerRef = ref(
          db,
          `${COLLECTION_REFS.CUSTOMERS}/${customerId}`
        );
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

      getCustomerDue,
    }),
    [state.transactions, getCustomerDue]
  );

  // Transaction Operations
  const transactionOperations = useMemo(
    () => ({
      addTransaction: async (transactionData) => {
        const { products, ...restTransactionData } = transactionData;
        const transactionsRef = ref(db, COLLECTION_REFS.TRANSACTIONS);
        const newTransactionRef = push(transactionsRef);

        const newTransaction = {
          ...restTransactionData,
          createdAt: new Date().toISOString(),
        };

        const updates = {};
        updates[`${COLLECTION_REFS.TRANSACTIONS}/${newTransactionRef.key}`] =
          newTransaction;

        if (products && products.length > 0) {
          for (const product of products) {
            // Prefer explicit fabricId when provided (more robust). Fallback to name match.
            let fabric = null;
            if (product.fabricId) {
              fabric = state.fabrics.find(
                (f) => f && f.id === product.fabricId
              );
            }
            if (!fabric && product.name) {
              fabric = state.fabrics.find(
                (f) =>
                  f &&
                  f.name &&
                  f.name.toLowerCase() === product.name.toLowerCase()
              );
            }
            if (fabric) {
              // Convert DB batches (which contain items per color) into color-level batches
              const rawBatches = state.fabricBatches.filter(
                (b) => b.fabricId === fabric.id
              );

              // Build per-color batch entries: { id, quantity, unitCost, color, createdAt }
              const colorLevelBatches = [];
              rawBatches.forEach((b) => {
                (b.items || []).forEach((item) => {
                  colorLevelBatches.push({
                    id: b.id, // preserve parent batch id so we can map back
                    quantity: Number(item.quantity) || 0,
                    unitCost: Number(b.unitCost) || Number(b.costPerPiece) || 0,
                    color: item.colorName || "",
                    createdAt: b.createdAt || b.purchaseDate || null,
                  });
                });
              });

              // Run FIFO on color-level batches with debug logging
              console.debug("[data-context] FIFO Input:", {
                fabricId: fabric.id,
                fabricName: fabric.name,
                productQuantity: product.quantity,
                productColor: product.color,
                colorLevelBatches: colorLevelBatches,
                totalAvailable: colorLevelBatches.reduce(
                  (sum, b) => sum + Number(b.quantity || 0),
                  0
                ),
              });

              const { updatedBatches } = calculateFifoSale(
                colorLevelBatches,
                product.quantity,
                product.color || null
              );

              console.debug(
                "[data-context] FIFO Output - Updated batches:",
                updatedBatches
              );

              // Map updated color-level batches back to original batch objects
              // Group updated quantities by parent batch id and color
              const updatesByBatch = {};
              updatedBatches.forEach((ub) => {
                const batchId = ub.id;
                if (!updatesByBatch[batchId]) updatesByBatch[batchId] = {};
                // Keep the remaining quantity for this color in this batch
                updatesByBatch[batchId][String(ub.color || "")] =
                  Number(ub.quantity) || 0;
              });

              // For each raw batch, construct updated batch object or deletion
              rawBatches.forEach((b) => {
                const batchPath = `${COLLECTION_REFS.FABRIC_BATCHES}/${b.id}`;
                const remainingByColor = updatesByBatch[b.id] || {};

                // Build new items array preserving colors but updating quantities
                // IMPORTANT: Only update quantities for colors that were in the FIFO calculation
                // For colors not in remainingByColor, keep the original quantity
                const newItems = (b.items || []).map((item) => ({
                  colorName: item.colorName,
                  quantity:
                    remainingByColor[item.colorName] !== undefined
                      ? remainingByColor[item.colorName]
                      : Number(item.quantity) || 0,
                }));

                // If all item quantities are zero, delete the batch
                const totalRemaining = newItems.reduce(
                  (s, it) => s + (Number(it.quantity) || 0),
                  0
                );

                if (totalRemaining > 0) {
                  updates[batchPath] = {
                    ...b,
                    items: newItems,
                    updatedAt: new Date().toISOString(),
                  };
                } else {
                  updates[batchPath] = null;
                }
              });
            }
          }
        }

        if (process.env.NODE_ENV !== "production") {
          try {
            console.debug("[data-context] addTransaction products:", products);
            console.debug(
              "[data-context] constructed updates keys:",
              Object.keys(updates)
            );

            // Debug inventory updates
            const inventoryUpdates = Object.entries(updates).filter(([key]) =>
              key.includes(COLLECTION_REFS.FABRIC_BATCHES)
            );
            if (inventoryUpdates.length > 0) {
              console.debug(
                "[data-context] Inventory batch updates:",
                inventoryUpdates
              );
            } else {
              console.warn("[data-context] No inventory batch updates found!");
            }
          } catch (e) {
            /* ignore logging errors */
          }
        }

        await update(ref(db), updates);

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
        await remove(
          ref(db, `${COLLECTION_REFS.TRANSACTIONS}/${transactionId}`)
        );
      },
    }),
    [state.fabrics, state.fabricBatches]
  );

  // Fabric Operations
  const fabricOperations = useMemo(
    () => ({
      addFabric: async (fabricData) => {
        try {
          const timestamp = serverTimestamp();
          const fabric = {
            code: (fabricData.code || "").toUpperCase(),
            name: fabricData.name?.trim() || "",
            description: fabricData.description?.trim() || "",
            category: fabricData.category?.trim() || "",
            unit: fabricData.unit || "piece",
            lowStockThreshold: Number(fabricData.lowStockThreshold) || 20,
            batches: [],
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          // Validate required fields
          if (!fabric.code) throw new Error("Fabric code is required");
          if (!fabric.name) throw new Error("Fabric name is required");
          if (!fabric.category) throw new Error("Category is required");

          await push(ref(db, COLLECTION_REFS.FABRICS), fabric);
        } catch (error) {
          console.error("Error adding fabric:", error);
          throw error;
        }
      },

      updateFabric: async (fabricId, updatedData) => {
        try {
          const timestamp = serverTimestamp();
          const fabric = {
            ...updatedData,
            code: (updatedData.code || "").toUpperCase(),
            name: updatedData.name?.trim() || "",
            description: updatedData.description?.trim() || "",
            category: updatedData.category?.trim() || "",
            unit: updatedData.unit || "piece",
            lowStockThreshold: Number(updatedData.lowStockThreshold) || 20,
            updatedAt: timestamp,
          };

          // Validate required fields
          if (!fabric.code) throw new Error("Fabric code is required");
          if (!fabric.name) throw new Error("Fabric name is required");
          if (!fabric.category) throw new Error("Category is required");

          await update(
            ref(db, `${COLLECTION_REFS.FABRICS}/${fabricId}`),
            fabric
          );
        } catch (error) {
          console.error("Error updating fabric:", error);
          throw error;
        }
      },

      deleteFabric: async (fabricId) => {
        try {
          console.log(`[data-context] Deleting fabric: ${fabricId}`);

          // First delete all batches associated with this fabric
          const fabricBatches = state.fabricBatches.filter(
            (batch) => batch && batch.fabricId === fabricId
          );

          console.log(
            `[data-context] Found ${fabricBatches.length} batches to delete`
          );

          for (const batch of fabricBatches) {
            if (batch && batch.id) {
              console.log(`[data-context] Deleting batch: ${batch.id}`);
              await remove(
                ref(db, `${COLLECTION_REFS.FABRIC_BATCHES}/${batch.id}`)
              );
            }
          }

          // Then delete the fabric
          console.log(
            `[data-context] Deleting fabric from: ${COLLECTION_REFS.FABRICS}/${fabricId}`
          );
          await remove(ref(db, `${COLLECTION_REFS.FABRICS}/${fabricId}`));

          console.log(`[data-context] Fabric ${fabricId} deleted successfully`);
        } catch (error) {
          console.error("Error deleting fabric:", error);
          throw error;
        }
      },

      addFabricBatch: async (batchData) => {
        try {
          const timestamp = serverTimestamp();
          const batch = {
            id: batchData.batchNumber,
            fabricId: batchData.fabricId,
            batchNumber: batchData.batchNumber,
            unitCost: Number(batchData.unitCost) || 0,
            totalCost: Number(batchData.totalCost) || 0,
            supplierName: batchData.supplierName || "",
            purchaseDate: batchData.purchaseDate,
            unit: batchData.unit || "piece",
            items: batchData.colorQuantities.map((item) => ({
              colorName: item.color.trim(),
              quantity: Number(item.quantity) || 0,
            })),
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          // Validate required fields
          if (!batch.fabricId) throw new Error("Fabric ID is required");
          if (!batch.batchNumber) throw new Error("Batch number is required");
          if (!batch.items?.length)
            throw new Error("At least one color quantity is required");
          if (!batch.unitCost) throw new Error("Unit cost is required");

          await push(ref(db, COLLECTION_REFS.FABRIC_BATCHES), batch);
        } catch (error) {
          console.error("Error adding fabric batch:", error);
          throw error;
        }
      },

      updateFabricBatch: async (batchId, updatedData) => {
        const batchRef = ref(
          db,
          `${COLLECTION_REFS.FABRIC_BATCHES}/${batchId}`
        );
        await update(batchRef, {
          ...updatedData,
          updatedAt: serverTimestamp(),
        });
      },

      deleteFabricBatch: async (batchId) => {
        try {
          if (!batchId) {
            throw new Error("Batch ID is required");
          }

          // Get the batch data first to update fabric totals
          const batchRef = ref(
            db,
            `${COLLECTION_REFS.FABRIC_BATCHES}/${batchId}`
          );
          const batchSnapshot = await get(batchRef);

          if (!batchSnapshot.exists()) {
            console.warn(
              `Batch with ID ${batchId} not found, it may have been already deleted`
            );
            return; // Return gracefully if batch doesn't exist
          }

          // Delete the batch
          await remove(batchRef);
        } catch (error) {
          console.error("Error deleting fabric batch:", error);
          throw error;
        }
      },
    }),
    [state.fabricBatches, state.fabrics]
  );

  // Supplier Operations
  const supplierOperations = useMemo(
    () => ({
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
          const transactionsRef = ref(
            db,
            COLLECTION_REFS.SUPPLIER_TRANSACTIONS
          );
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
            const newTotalDue = Math.max(
              0,
              (supplier.totalDue || 0) - dueAmount
            );

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
    }),
    [state.transactions]
  );

  const dailyCashOperations = useMemo(
    () => ({
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
    }),
    []
  );

  const updateSettings = useCallback(async (newSettings) => {
    try {
      // Update settings in Firebase
      await updateDoc(doc(db, "settings", "app"), newSettings);

      // Update local state
      dispatch({
        type: "UPDATE_SETTINGS",
        payload: newSettings,
      });

      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      // State
      ...state,
      // Enhanced fabric data with batches
      fabrics: fabricsWithBatches,
      // Operations
      ...customerOperations,
      ...transactionOperations,
      ...fabricOperations,
      ...supplierOperations,
      ...dailyCashOperations,
      settings: state.settings,
      updateSettings,
    }),
    [
      state,
      fabricsWithBatches,
      customerOperations,
      transactionOperations,
      fabricOperations,
      supplierOperations,
      dailyCashOperations,
      updateSettings,
    ]
  );

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
