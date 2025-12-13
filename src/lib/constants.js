export const CUSTOMER_CONSTANTS = {
  CUSTOMERS_PER_PAGE: 10,
  DUE_AMOUNT_THRESHOLD: 1000,
  FILTER_OPTIONS: {
    ALL: "all",
    DUE: "due",
    PAID: "paid",
  },
  CURRENCY_SYMBOL: "৳",
  STORE_OPTIONS: {
    ALL: "all",
    STORE1: "STORE1",
    STORE2: "STORE2",
  },
};

export const ERROR_MESSAGES = {
  CUSTOMER_NOT_FOUND: "Customer not found",
  DELETE_CONFIRMATION: "Are you sure you want to delete this customer?",
  ADD_ERROR: "Error adding customer:",
  UPDATE_ERROR: "Error updating customer:",
  DELETE_ERROR: "Error deleting customer:",
};

export const PAGE_TITLES = {
  CUSTOMER_MANAGEMENT: "Customer Management",
  CUSTOMER_DETAILS: "Customer Details",
  SEARCH_CUSTOMERS: "Search Customers",
};

export const TRANSACTION_CONSTANTS = {
  TRANSACTIONS_PER_PAGE: 10,
  STORE_OPTIONS: {
    ALL: "all",
    STORE1: "STORE1",
    STORE2: "STORE2",
  },
};

// Centralized store configuration for dropdown menus
export const STORES = [
  { value: "STORE1", label: "Store 1" },
  { value: "STORE2", label: "Store 2" },
];

export const DEFAULT_STORE = "STORE1";
