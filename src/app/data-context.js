"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ref, onValue, push, set, remove } from "firebase/database";
import { db } from "@/lib/firebase";

// Create context
const DataContext = createContext(null);

// Export the provider component
export function DataProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
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

  const updateTransaction = async (updatedTransaction) => {
    try {
      const transactionRef = ref(db, `transactions/${updatedTransaction.id}`);
      await set(transactionRef, {
        ...updatedTransaction,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  };

  const contextValue = {
    customers,
    transactions,
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
