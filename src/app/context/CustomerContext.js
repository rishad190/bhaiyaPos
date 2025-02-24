// context/CustomerContext.js
import React, { createContext, useState } from "react";

export const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: "John Doe",
      phone: "555-1234",
      email: "john@example.com",
      storeId: "Store-001",
      transactions: [
        {
          date: "2025-01-01",
          memo: "M001",
          details: "Purchase A",
          totalBill: 200,
          deposit: 50,
        },
        {
          date: "2025-01-05",
          memo: "M002",
          details: "Purchase B",
          totalBill: 150,
          deposit: 50,
        },
      ],
    },
    {
      id: 2,
      name: "Jane Smith",
      phone: "555-5678",
      email: "jane@example.com",
      storeId: "Store-002",
      transactions: [
        {
          date: "2025-02-10",
          memo: "M003",
          details: "Purchase C",
          totalBill: 500,
          deposit: 100,
        },
      ],
    },
  ]);

  const addCustomer = (newCustomer) => {
    setCustomers([
      ...customers,
      { ...newCustomer, id: Date.now(), transactions: [] },
    ]);
  };

  const updateCustomer = (updatedCustomer) => {
    setCustomers(
      customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
  };

  const deleteCustomer = (customerId) => {
    setCustomers(customers.filter((c) => c.id !== customerId));
  };

  const updateCustomerTransactions = (customerId, newTransactions) => {
    setCustomers(
      customers.map((c) =>
        c.id === customerId ? { ...c, transactions: newTransactions } : c
      )
    );
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        updateCustomerTransactions,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};
