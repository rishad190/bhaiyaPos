import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

// Query keys
export const transactionKeys = {
  all: ['transactions'],
  lists: () => [...transactionKeys.all, 'list'],
  list: (filters) => [...transactionKeys.lists(), filters],
  customerTransactions: (customerId) => [...transactionKeys.all, 'customer', customerId],
};

// Hook to fetch paginated transactions
export function useTransactions({ page = 1, limit = 20, customerId = null } = {}) {
  return useQuery({
    queryKey: transactionKeys.list({ page, limit, customerId }),
    queryFn: () => transactionService.getTransactions({ page, limit, customerId }),
    keepPreviousData: true,
  });
}

// Hook to fetch customer transactions (for calculating dues)
export function useCustomerTransactions(customerId) {
  return useQuery({
    queryKey: transactionKeys.customerTransactions(customerId),
    queryFn: () => transactionService.getCustomerTransactions(customerId),
    enabled: !!customerId,
  });
}

// Hook to calculate customer due
export function useCustomerDue(customerId) {
  const { data: transactions = [], isLoading } = useCustomerTransactions(customerId);
  
  const due = transactions.reduce(
    (total, t) => total + ((t.total || 0) - (t.deposit || 0)),
    0
  );
  
  return { due, isLoading };
}

// Hook to add transaction
export function useAddTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (transactionData) => transactionService.addTransaction(transactionData),
    onSuccess: (_, variables) => {
      // Invalidate transactions list and customer transactions
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      if (variables.customerId) {
        queryClient.invalidateQueries({
          queryKey: transactionKeys.customerTransactions(variables.customerId),
        });
      }
      toast({
        title: 'Success',
        description: 'Transaction added successfully',
      });
    },
    onError: (error) => {
      logger.error('[useAddTransaction] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive',
      });
    },
  });
}

// Hook to update transaction
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ transactionId, updatedData }) =>
      transactionService.updateTransaction(transactionId, updatedData),
    onSuccess: (_, variables) => {
      // Invalidate transactions list
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      if (variables.updatedData.customerId) {
        queryClient.invalidateQueries({
          queryKey: transactionKeys.customerTransactions(variables.updatedData.customerId),
        });
      }
      toast({
        title: 'Success',
        description: 'Transaction updated successfully',
      });
    },
    onError: (error) => {
      logger.error('[useUpdateTransaction] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update transaction',
        variant: 'destructive',
      });
    },
  });
}

// Hook to delete transaction
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (transactionId) => transactionService.deleteTransaction(transactionId),
    onSuccess: () => {
      // Invalidate transactions list
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully',
      });
    },
    onError: (error) => {
      logger.error('[useDeleteTransaction] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      });
    },
  });
}
