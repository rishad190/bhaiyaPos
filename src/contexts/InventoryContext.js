
"use client";
import { createContext, useContext } from 'react';

const InventoryContext = createContext(null);

export function useInventoryData() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventoryData must be used within an InventoryProvider');
  }
  return context;
}

export function InventoryProvider({ children, fabricOperations, fabrics }) {
  const value = {
    ...fabricOperations,
    fabrics,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}
