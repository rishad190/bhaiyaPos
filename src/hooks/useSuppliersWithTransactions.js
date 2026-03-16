import { useQuery } from '@tanstack/react-query';
import { supplierService } from '@/services/supplierService';
import { useMemo } from 'react';

// Hook to fetch suppliers with their transaction totals
export function useSuppliersWithTransactions({ page = 1, limit = 20, searchTerm = '' } = {}) {
  // Fetch all supplier transactions
  const { data: allSupplierTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['supplierTransactions', 'all'],
    queryFn: () => supplierService.getSupplierTransactions(),
  });

  // Fetch suppliers
  const { data: suppliersData, isLoading: suppliersLoading, error } = useQuery({
    queryKey: ['suppliers', 'list', { page, limit, searchTerm }],
    queryFn: () => supplierService.getSuppliers({ page, limit, searchTerm }),
    keepPreviousData: true,
  });

  // Calculate totals for each supplier
  const suppliersWithTotals = useMemo(() => {
    if (!suppliersData?.data) return [];
    if (!Array.isArray(allSupplierTransactions)) return suppliersData.data.map(s => ({ ...s, totalDue: 0 }));

    return suppliersData.data.map((supplier) => {
      const supplierTxns = allSupplierTransactions.filter(
        (t) => t.supplierId === supplier.id
      );

      const totals = supplierTxns.reduce(
        (acc, transaction) => ({
          totalAmount: acc.totalAmount + (Number(transaction.totalAmount) || 0),
          paidAmount: acc.paidAmount + (Number(transaction.paidAmount) || 0),
        }),
        { totalAmount: 0, paidAmount: 0 }
      );

      const totalDue = totals.totalAmount - totals.paidAmount;

      return {
        ...supplier,
        totalDue: totalDue >= 0 ? totalDue : 0, // Ensure non-negative
      };
    });
  }, [suppliersData, allSupplierTransactions]);

  // Calculate financial summary from visible suppliers to match the table
  const financialSummary = useMemo(() => {
    if (!Array.isArray(suppliersWithTotals) || suppliersWithTotals.length === 0) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
      };
    }

    return suppliersWithTotals.reduce(
      (acc, supplier) => {
        // Find all transactions for this supplier again to get raw totals or we can recalculate 
        // using the supplier's raw transactions, but it's simpler to just sum the totals
        const supplierTxns = allSupplierTransactions.filter(
          (t) => t.supplierId === supplier.id
        );
        const supplierTotalAmount = supplierTxns.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
        const supplierPaidAmount = supplierTxns.reduce((sum, t) => sum + (Number(t.paidAmount) || 0), 0);

        return {
          totalAmount: acc.totalAmount + supplierTotalAmount,
          paidAmount: acc.paidAmount + supplierPaidAmount,
          dueAmount: acc.dueAmount + (Number(supplier.totalDue) || 0),
        };
      },
      { totalAmount: 0, paidAmount: 0, dueAmount: 0 }
    );
  }, [suppliersWithTotals, allSupplierTransactions]);

  return {
    suppliers: suppliersWithTotals,
    financialSummary,
    isLoading: suppliersLoading || transactionsLoading,
    error,
    pagination: {
      total: suppliersData?.total || 0,
      page: suppliersData?.page || 1,
      limit: suppliersData?.limit || limit,
      totalPages: suppliersData?.totalPages || 0,
    },
  };
}
