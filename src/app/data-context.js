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
} from "firebase/database";
import { db } from "@/lib/firebase";

// Create context
const DataContext = createContext(null);

// Export the provider component
export function DataProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dailyCashTransactions, setDailyCashTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribers = [];

    try {
      // Subscribe to customers data
      const customersRef = ref(db, "customers");
      const unsubCustomers = onValue(
        customersRef,
        (snapshot) => {
          try {
            const data = snapshot.val();
            const customersArray = data
              ? Object.entries(data).map(([id, value]) => ({
                  id,
                  ...value,
                }))
              : [];
            setCustomers(customersArray);
          } catch (err) {
            console.error("Error processing customers data:", err);
            setError(err.message);
          }
        },
        (error) => {
          console.error("Customers subscription error:", error);
          setError(error.message);
        }
      );
      unsubscribers.push(unsubCustomers);

      // Subscribe to transactions data
      const transactionsRef = ref(db, "transactions");
      const unsubTransactions = onValue(
        transactionsRef,
        (snapshot) => {
          try {
            const data = snapshot.val();
            const transactionsArray = data
              ? Object.entries(data).map(([id, value]) => ({
                  id,
                  ...value,
                }))
              : [];
            setTransactions(transactionsArray);
          } catch (err) {
            console.error("Error processing transactions data:", err);
            setError(err.message);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Transactions subscription error:", error);
          setError(error.message);
          setLoading(false);
        }
      );
      unsubscribers.push(unsubTransactions);

      // Subscribe to dailyCash data
      const dailyCashRef = ref(db, "dailyCash");
      const unsubDailyCash = onValue(dailyCashRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const transactions = Object.entries(data).map(
            ([id, transaction]) => ({
              id,
              ...transaction,
            })
          );
          setDailyCashTransactions(transactions);
        } else {
          setDailyCashTransactions([]);
        }
      });
      unsubscribers.push(unsubDailyCash);
    } catch (err) {
      console.error("Error setting up Firebase listeners:", err);
      setError(err.message);
      setLoading(false);
    }

    return () => unsubscribers.forEach((unsub) => unsub());
  }, []);

  const addTransaction = async (transactionData) => {
    try {
      const transactionsRef = ref(db, "transactions");
      const newTransactionRef = push(transactionsRef);
      await set(newTransactionRef, {
        ...transactionData,
        createdAt: new Date().toISOString(),
      });
      return newTransactionRef.key;
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  };

  const deleteTransaction = async (transactionId) => {
    try {
      const transactionRef = ref(db, `transactions/${transactionId}`);
      await remove(transactionRef);
      // Update local state immediately for better UX
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  };

  const deleteCustomer = async (customerId) => {
    try {
      // First, delete all transactions associated with this customer
      const customerTransactions = transactions.filter(
        (t) => t.customerId === customerId
      );

      for (const transaction of customerTransactions) {
        const transactionRef = ref(db, `transactions/${transaction.id}`);
        await remove(transactionRef);
      }

      // Then delete the customer
      const customerRef = ref(db, `customers/${customerId}`);
      await remove(customerRef);
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  };

  const updateTransaction = async (transactionId, updatedData) => {
    console.log("Updating transaction:", transactionId, updatedData);

    try {
      if (!transactionId) throw new Error("Transaction ID is required");

      const transactionRef = ref(db, `transactions/${transactionId}`);
      await update(transactionRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  };

  const addDailyCashTransaction = async (transaction) => {
    try {
      // Generate a new push ID
      const newTransactionRef = push(ref(db, "dailyCash"));
      const newId = newTransactionRef.key;

      // Add the transaction with the generated ID
      await set(newTransactionRef, {
        ...transaction,
        id: newId, // Include the push ID in the data
        createdAt: serverTimestamp(),
      });

      return newId; // Return the new ID for potential use
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  };

  const updateDailyCashTransaction = async (transactionId, updates) => {
    try {
      const transactionRef = ref(db, `dailyCash/${transactionId}`);
      await update(transactionRef, updates);
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  };

  const deleteDailyCashTransaction = async (transactionId) => {
    console.log(transactionId);

    try {
      const transactionRef = ref(db, `dailyCash/${transactionId}`);
      await remove(transactionRef);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  };

  const updateCustomer = async (customerId, updatedData) => {
    try {
      const customerRef = ref(db, `customers/${customerId}`);
      await update(customerRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  };

  const contextValue = {
    customers,
    transactions,
    dailyCashTransactions,
    loading,
    error,
    getCustomerDue: (customerId) => {
      return transactions
        .filter((t) => t.customerId === customerId)
        .reduce((total, t) => total + (parseFloat(t.due) || 0), 0);
    },
    addCustomer: async (customerData) => {
      try {
        const customersRef = ref(db, "customers");
        const newCustomerRef = push(customersRef);
        await set(newCustomerRef, {
          ...customerData,
          createdAt: new Date().toISOString(),
        });
        return newCustomerRef.key;
      } catch (error) {
        console.error("Error adding customer:", error);
        throw error;
      }
    },
    addTransaction,
    deleteTransaction,
    deleteCustomer,
    updateTransaction,
    addDailyCashTransaction,
    updateDailyCashTransaction,
    deleteDailyCashTransaction,
    updateCustomer,
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
