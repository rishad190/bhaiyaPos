
"use client";
import { createContext, useContext } from 'react';

const DailyCashContext = createContext(null);

export function useDailyCashData() {
  const context = useContext(DailyCashContext);
  if (!context) {
    throw new Error('useDailyCashData must be used within a DailyCashProvider');
  }
  return context;
}

export function DailyCashProvider({ children, dailyCashOperations, dailyCashTransactions }) {
  const value = {
    ...dailyCashOperations,
    dailyCashTransactions,
  };

  return (
    <DailyCashContext.Provider value={value}>
      {children}
    </DailyCashContext.Provider>
  );
}
