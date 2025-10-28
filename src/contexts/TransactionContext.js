
"use client";
import { createContext, useContext } from 'react';

const TransactionContext = createContext(null);

export function useTransactionData() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactionData must be used within a TransactionProvider');
  }
  return context;
}

export function TransactionProvider({ children, transactionOperations, transactions }) {
  const value = {
    ...transactionOperations,
    transactions,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}
