// Collection references
export const COLLECTIONS = {
  CUSTOMERS: "customers",
  TRANSACTIONS: "transactions",
  DAILY_CASH: "dailyCash",
  SUPPLIERS: "suppliers",
  SUPPLIER_TRANSACTIONS: "supplierTransactions",
  FABRICS: "fabrics",
  SETTINGS: "settings",
};

// Helper to convert Firebase snapshot to array
export const snapshotToArray = (snapshot) => {
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data).map(([id, value]) => ({
    id,
    ...value,
  }));
};

// Helper to convert Firebase snapshot to object
export const snapshotToObject = (snapshot) => {
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.key,
    ...snapshot.val(),
  };
};
