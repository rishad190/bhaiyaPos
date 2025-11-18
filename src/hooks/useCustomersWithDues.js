import { useQuery } from '@tanstack/react-query';
import { customerService, transactionService } from '@/services/firebaseService';
import { useMemo } from 'react';

// Hook to fetch customers with their due amounts calculated
export function useCustomersWithDues({ page = 1, limit = 20, searchTerm = '', filter = 'all' } = {}) {
  // Fetch all transactions (we need this for financial summary)
  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: async () => {
      const result = await transactionService.getTransactions({ page: 1, limit: 10000 });
      return result.data;
    },
  });

  // Fetch customers with dues already calculated by backend
  const { data: customersData, isLoading: customersLoading, error } = useQuery({
    queryKey: ['customers', 'list', { page, limit, searchTerm, filter }],
    queryFn: () => customerService.getCustomers({ page, limit, searchTerm, filter }),
    keepPreviousData: true,
  });

  // Calculate financial summary from ALL transactions (not just current page)
  const financialSummary = useMemo(() => {
    if (!allTransactions || allTransactions.length === 0) {
      return {
        totalBill: 0,
        totalDeposit: 0,
        totalDue: 0,
      };
    }

    const totalBill = allTransactions.reduce(
      (sum, t) => sum + (Number(t.total) || 0),
      0
    );
    
    const totalDeposit = allTransactions.reduce(
      (sum, t) => sum + (Number(t.deposit) || 0),
      0
    );
    
    const totalDue = totalBill - totalDeposit;

    return { totalBill, totalDeposit, totalDue };
  }, [allTransactions]);

  return {
    customers: customersData?.data || [],
    financialSummary,
    isLoading: customersLoading || transactionsLoading,
    error,
    pagination: {
      total: customersData?.total || 0,
      page: customersData?.page || 1,
      limit: customersData?.limit || limit,
      totalPages: customersData?.totalPages || 0,
    },
  };
}

// Helper hook to get due for a specific customer
export function useCustomerDue(customerId) {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', 'customer', customerId],
    queryFn: async () => {
      const result = await transactionService.getCustomerTransactions(customerId);
      return result;
    },
    enabled: !!customerId,
  });

  const due = useMemo(() => {
    return transactions.reduce(
      (total, t) => total + ((t.total || 0) - (t.deposit || 0)),
      0
    );
  }, [transactions]);

  return { due, isLoading };
}
