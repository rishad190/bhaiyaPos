
"use client";
import { createContext, useContext } from 'react';

const SupplierContext = createContext(null);

export function useSupplierData() {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSupplierData must be used within a SupplierProvider');
  }
  return context;
}

export function SupplierProvider({ children, supplierOperations, suppliers, supplierTransactions }) {
  const value = {
    ...supplierOperations,
    suppliers,
    supplierTransactions,
  };

  return (
    <SupplierContext.Provider value={value}>
      {children}
    </SupplierContext.Provider>
  );
}
