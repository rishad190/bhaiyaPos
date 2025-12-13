import { useMemo } from "react";
import { formatLargeNumber } from "@/lib/utils";

/**
 * Hook to calculate dashboard statistics and derived state
 * @param {Object} data - Data objects from React Query
 * @param {Array} data.customers - Array of customer objects
 * @param {Array} data.transactions - Array of transaction objects
 * @param {Array} data.fabrics - Array of fabric objects
 * @param {Array} data.suppliers - Array of supplier objects
 */
export function useDashboardStats({ customers = [], transactions = [], fabrics = [], suppliers = [] }) {
  const stats = useMemo(() => {
    if (!customers.length || !transactions.length) {
      return {
        totalBill: 0,
        totalDeposit: 0,
        totalDue: 0,
        totalStock: 0,
        totalStockValue: 0,
        totalCustomers: 0,
        activeCustomers: 0,
        topCustomer: null,
      };
    }

    // Financials
    const totalBill = transactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const totalDeposit = transactions.reduce((sum, t) => sum + (Number(t.deposit) || 0), 0);
    const totalDue = totalBill - totalDeposit;

    // Inventory
    const totalStock = fabrics.reduce((sum, f) => {
      const batchSum = f.batches ? Object.values(f.batches).reduce((bSum, b) => bSum + (Number(b.quantity) || 0), 0) : 0;
      return sum + batchSum;
    }, 0);

    const totalStockValue = fabrics.reduce((sum, f) => {
      const batchValue = f.batches 
        ? Object.values(f.batches).reduce((bSum, b) => {
            // Estimate value roughly as we don't strictly track cost price in all batches
            // This logic mimics the original dashboard calculation
            return bSum + (Number(b.quantity) || 0) * (Number(f.price) || 0); 
          }, 0) 
        : 0;
      return sum + batchValue;
    }, 0);

    // Customer Insights
    const customerStats = customers.map(c => {
      const cTransactions = transactions.filter(t => t.customerId === c.id);
      const cTotal = cTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
      return { ...c, totalSpent: cTotal };
    });

    const activeCustomers = customerStats.filter(c => c.totalSpent > 0).length;
    const topCustomer = customerStats.sort((a, b) => b.totalSpent - a.totalSpent)[0];

    return {
      totalBill,
      totalDeposit,
      totalDue,
      totalStock,
      totalStockValue,
      totalCustomers: customers.length,
      activeCustomers,
      topCustomer,
    };
  }, [customers, transactions, fabrics]);

  // Derived display values
  const displayStats = {
    bill: `৳${formatLargeNumber(stats.totalBill)}`,
    deposit: `৳${formatLargeNumber(stats.totalDeposit)}`,
    due: `৳${formatLargeNumber(stats.totalDue)}`,
    stock: stats.totalStock.toLocaleString(),
    customers: stats.totalCustomers,
  };

  return {
    rawStats: stats,
    displayStats,
  };
}
