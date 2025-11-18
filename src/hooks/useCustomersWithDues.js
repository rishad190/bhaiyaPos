import { useQuery } from '@tanstack/react-query';
import { customerService, transactionService } from '@/services/firebaseService';
import { useMemo } from 'react';

// Hook to fetch customers with their due amounts calculated
export function useCustomersWithDues({ page = 1, limit = 20, searchTerm = '', filter = 'all' } = {}) {
  // Fetch all transactions (we need this to calculate dues)
  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: async () => {
      const result = await transactionService.getTransactions({ page: 1, limit: 10000 });
      return result.data;
    },
  });

  // Fetch customers
  const { data: customersData, isLoading: customersLoading, error } = useQuery({
    queryKey: ['customers', 'list', { page, limit, searchTerm, filter }],
    queryFn: () => customerService.getCustomers({ page, limit, searchTerm, filter }),
    keepPreviousData: true,
  });

  // Calculate dues for each customer
  const customersWithDues = useMemo(() => {
    if (!customersData?.data || !allTransactions) return [];

    return customersData.data.map((customer) => {
      const customerTransactions = allTransactions.filter(
        (t) => t.customerId === customer.id
      );
      
      const totalBill = customerTransactions.reduce(
        (sum, t) => sum + (Number(t.total) || 0),
        0
      );
      
      const totalDeposit = customerTransactions.reduce(
        (sum, t) => sum + (Number(t.deposit) || 0),
        0
      );
      
      const due = totalBill - totalDeposit;

      return {
        ...customer,
        totalBill,
        totalDeposit,
        due,
      };
    });
  }, [customersData, allTransactions]);

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    if (!customersWithDues.length) {
      return {
        totalBill: 0,
        totalDeposit: 0,
        totalDue: 0,
      };
    }

    return customersWithDues.reduce(
      (acc, customer) => ({
        totalBill: acc.totalBill + customer.totalBill,
        totalDeposit: acc.totalDeposit + customer.totalDeposit,
        totalDue: acc.totalDue + customer.due,
      }),
      { totalBill: 0, totalDeposit: 0, totalDue: 0 }
    );
  }, [customersWithDues]);

  // Apply filter based on due amount
  const filteredCustomers = useMemo(() => {
    if (filter === 'all') return customersWithDues;
    if (filter === 'due') return customersWithDues.filter(c => c.due > 0);
    if (filter === 'paid') return customersWithDues.filter(c => c.due === 0);
    return customersWithDues;
  }, [customersWithDues, filter]);

  return {
    customers: filteredCustomers,
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
