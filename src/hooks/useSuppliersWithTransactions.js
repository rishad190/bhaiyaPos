import { useQuery } from '@tanstack/react-query';
import { supplierService } from '@/services/firebaseService';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useMemo } from 'react';

// Hook to fetch suppliers with their transaction totals
export function useSuppliersWithTransactions({ page = 1, limit = 20, searchTerm = '' } = {}) {
  // Fetch all supplier transactions
  const { data: allSupplierTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['supplierTransactions', 'all'],
    queryFn: async () => {
      const transactionsRef = ref(db, 'supplierTransactions');
      const snapshot = await get(transactionsRef);
      if (!snapshot.exists()) return [];
      return Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...value,
      }));
    },
  });

  // Fetch suppliers
  const { data: suppliersData, isLoading: suppliersLoading, error } = useQuery({
    queryKey: ['suppliers', 'list', { page, limit, searchTerm }],
    queryFn: () => supplierService.getSuppliers({ page, limit, searchTerm }),
    keepPreviousData: true,
  });

  // Calculate totals for each supplier
  const suppliersWithTotals = useMemo(() => {
    if (!suppliersData?.data || !allSupplierTransactions) return [];

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

      return {
        ...supplier,
        totalDue: totals.totalAmount - totals.paidAmount,
      };
    });
  }, [suppliersData, allSupplierTransactions]);

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    if (!suppliersWithTotals.length) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
      };
    }

    return suppliersWithTotals.reduce(
      (acc, supplier) => {
        const supplierTxns = allSupplierTransactions.filter(
          (t) => t.supplierId === supplier.id
        );

        const supplierTotal = supplierTxns.reduce(
          (txnAcc, transaction) => ({
            totalAmount: txnAcc.totalAmount + (Number(transaction.totalAmount) || 0),
            paidAmount: txnAcc.paidAmount + (Number(transaction.paidAmount) || 0),
          }),
          { totalAmount: 0, paidAmount: 0 }
        );

        acc.totalAmount += supplierTotal.totalAmount;
        acc.paidAmount += supplierTotal.paidAmount;
        acc.dueAmount = acc.totalAmount - acc.paidAmount;

        return acc;
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
