import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyCashService } from '@/services/dailyCashService';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

// Query keys
export const dailyCashKeys = {
  all: ['dailyCash'],
  lists: () => [...dailyCashKeys.all, 'list'],
  list: (filters) => [...dailyCashKeys.lists(), filters],
};

// Hook to fetch paginated daily cash transactions
export function useDailyCashTransactions({ page = 1, limit = 20, dateRange = null } = {}) {
  return useQuery({
    queryKey: dailyCashKeys.list({ page, limit, dateRange }),
    queryFn: () => dailyCashService.getDailyCashTransactions({ page, limit, dateRange }),
    keepPreviousData: true,
  });
}

// Hook to fetch all daily cash transactions (for calculations)
export function useAllDailyCashTransactions() {
  return useQuery({
    queryKey: ['dailyCash', 'all'],
    queryFn: async () => {
      const result = await dailyCashService.getDailyCashTransactions({ page: 1, limit: 10000 });
      return result.data;
    },
  });
}

// Hook to add daily cash transaction
export function useAddDailyCashTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (transaction) => dailyCashService.addDailyCashTransaction(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyCashKeys.all });
      toast({
        title: 'Success',
        description: 'Transaction added successfully',
      });
    },
    onError: (error) => {
      logger.error('[useAddDailyCashTransaction] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive',
      });
    },
  });
}

// Hook to update daily cash transaction
export function useUpdateDailyCashTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ transactionId, updatedData }) =>
      dailyCashService.updateDailyCashTransaction(transactionId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyCashKeys.all });
      toast({
        title: 'Success',
        description: 'Transaction updated successfully',
      });
    },
    onError: (error) => {
      logger.error('[useUpdateDailyCashTransaction] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update transaction',
        variant: 'destructive',
      });
    },
  });
}

// Hook to delete daily cash transaction
export function useDeleteDailyCashTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (transactionId) => dailyCashService.deleteDailyCashTransaction(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyCashKeys.all });
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully',
      });
    },
    onError: (error) => {
      logger.error('[useDeleteDailyCashTransaction] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      });
    },
  });
}
