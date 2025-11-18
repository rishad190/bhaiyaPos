import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, transactionService } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

// Query keys
export const customerKeys = {
  all: ['customers'],
  lists: () => [...customerKeys.all, 'list'],
  list: (filters) => [...customerKeys.lists(), filters],
  details: () => [...customerKeys.all, 'detail'],
  detail: (id) => [...customerKeys.details(), id],
  withDues: () => [...customerKeys.all, 'withDues'],
};

// Hook to fetch paginated customers
export function useCustomers({ page = 1, limit = 20, searchTerm = '', filter = 'all' } = {}) {
  return useQuery({
    queryKey: customerKeys.list({ page, limit, searchTerm, filter }),
    queryFn: () => customerService.getCustomers({ page, limit, searchTerm, filter }),
    keepPreviousData: true, // Keep previous data while fetching new page
  });
}

// Hook to fetch single customer
export function useCustomer(customerId) {
  return useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => customerService.getCustomer(customerId),
    enabled: !!customerId, // Only fetch if customerId is provided
  });
}

// Hook to add customer
export function useAddCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (customerData) => customerService.addCustomer(customerData),
    onSuccess: () => {
      // Invalidate and refetch customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast({
        title: 'Success',
        description: 'Customer added successfully',
      });
    },
    onError: (error) => {
      logger.error('[useAddCustomer] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add customer',
        variant: 'destructive',
      });
    },
  });
}

// Hook to update customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ customerId, updatedData }) =>
      customerService.updateCustomer(customerId, updatedData),
    onSuccess: (_, variables) => {
      // Invalidate specific customer and lists
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.customerId) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast({
        title: 'Success',
        description: 'Customer updated successfully',
      });
    },
    onError: (error) => {
      logger.error('[useUpdateCustomer] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive',
      });
    },
  });
}

// Hook to delete customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (customerId) => customerService.deleteCustomer(customerId),
    onSuccess: () => {
      // Invalidate customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
      });
    },
    onError: (error) => {
      logger.error('[useDeleteCustomer] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
    },
  });
}
