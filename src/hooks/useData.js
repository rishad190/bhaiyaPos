"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ref, onValue, push, remove, update, get } from "firebase/database";
import { db } from "@/lib/firebase";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to customers data
    const customersRef = ref(db, "customers");
    const unsubCustomers = onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      const customersArray = data
        ? Object.entries(data).map(([id, value]) => ({
            id,
            ...value,
          }))
        : [];
      setCustomers(customersArray);
    });

    // Subscribe to transactions data
    const transactionsRef = ref(db, "transactions");
    const unsubTransactions = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      const transactionsArray = data
        ? Object.entries(data).map(([id, value]) => ({
            id,
            ...value,
          }))
        : [];
      setTransactions(transactionsArray);
      setLoading(false);
    });

    return () => {
      unsubCustomers();
      unsubTransactions();
    };
  }, []);

  const addCustomer = async (customerData) => {
    const customersRef = ref(db, "customers");
    return push(customersRef, {
      ...customerData,
      createdAt: new Date().toISOString(),
    });
  };

  const updateCustomer = async (id, customerData) => {
    const customerRef = ref(db, `customers/${id}`);
    return update(customerRef, {
      ...customerData,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteCustomer = async (id) => {
    const customerRef = ref(db, `customers/${id}`);
    return remove(customerRef);
  };

  const addTransaction = async (transactionData) => {
    const transactionsRef = ref(db, "transactions");
    return push(transactionsRef, {
      ...transactionData,
      createdAt: new Date().toISOString(),
    });
  };

  const getCustomerDue = (customerId) => {
    return transactions
      .filter((t) => t.customerId === customerId)
      .reduce((total, t) => total + (parseFloat(t.due) || 0), 0);
  };

  const value = {
    customers,
    transactions,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addTransaction,
    getCustomerDue,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
