
"use client";
import { createContext, useContext } from 'react';

const CustomerContext = createContext(null);

export function useCustomerData() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomerData must be used within a CustomerProvider');
  }
  return context;
}

export function CustomerProvider({ children, customerOperations, customers, customerDues }) {
  const value = {
    ...customerOperations,
    customers,
    customerDues,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}
