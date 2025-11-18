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

// Hook to add customer with optimistic updates
export function useAddCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (customerData) => customerService.addCustomer(customerData),
    
    // Optimistic update
    onMutate: async (newCustomer) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: customerKeys.lists() });

      // Snapshot the previous value
      const previousCustomers = queryClient.getQueryData(customerKeys.lists());

      // Optimistically update to the new value
      if (previousCustomers) {
        queryClient.setQueriesData({ queryKey: customerKeys.lists() }, (old) => {
          if (!old) return old;
          
          // Create optimistic customer with temporary ID
          const optimisticCustomer = {
            id: `temp-${Date.now()}`,
            ...newCustomer,
            createdAt: new Date().toISOString(),
          };

          return {
            ...old,
            data: [optimisticCustomer, ...(old.data || [])],
            total: (old.total || 0) + 1,
          };
        });
      }

      // Return context with previous value
      return { previousCustomers };
    },

    // If mutation fails, rollback
    onError: (error, newCustomer, context) => {
      // Restore previous value
      if (context?.previousCustomers) {
        queryClient.setQueriesData({ queryKey: customerKeys.lists() }, context.previousCustomers);
      }

      logger.error('[useAddCustomer] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add customer',
        variant: 'destructive',
      });
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },

    // On success, show toast
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Customer added successfully',
      });
    },
  });
}

// Hook to update customer with optimistic updates
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ customerId, updatedData }) =>
      customerService.updateCustomer(customerId, updatedData),
    
    onMutate: async ({ customerId, updatedData }) => {
      await queryClient.cancelQueries({ queryKey: customerKeys.lists() });
      await queryClient.cancelQueries({ queryKey: customerKeys.detail(customerId) });

      const previousCustomers = queryClient.getQueryData(customerKeys.lists());
      const previousCustomer = queryClient.getQueryData(customerKeys.detail(customerId));

      // Optimistically update list
      if (previousCustomers) {
        queryClient.setQueriesData({ queryKey: customerKeys.lists() }, (old) => {
          if (!old) return old;

          return {
            ...old,
            data: (old.data || []).map((customer) =>
              customer.id === customerId
                ? { ...customer, ...updatedData, updatedAt: new Date().toISOString() }
                : customer
            ),
          };
        });
      }

      // Optimistically update single customer
      if (previousCustomer) {
        queryClient.setQueryData(customerKeys.detail(customerId), (old) => {
          if (!old) return old;
          return { ...old, ...updatedData, updatedAt: new Date().toISOString() };
        });
      }

      return { previousCustomers, previousCustomer };
    },

    onError: (error, variables, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueriesData({ queryKey: customerKeys.lists() }, context.previousCustomers);
      }
      if (context?.previousCustomer) {
        queryClient.setQueryData(customerKeys.detail(variables.customerId), context.previousCustomer);
      }
      
      logger.error('[useUpdateCustomer] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive',
      });
    },

    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.customerId) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Customer updated successfully',
      });
    },
  });
}

// Hook to delete customer with optimistic updates
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (customerId) => customerService.deleteCustomer(customerId),
    
    onMutate: async (customerId) => {
      await queryClient.cancelQueries({ queryKey: customerKeys.lists() });

      const previousCustomers = queryClient.getQueryData(customerKeys.lists());

      // Optimistically remove customer
      if (previousCustomers) {
        queryClient.setQueriesData({ queryKey: customerKeys.lists() }, (old) => {
          if (!old) return old;

          return {
            ...old,
            data: (old.data || []).filter((customer) => customer.id !== customerId),
            total: (old.total || 0) - 1,
          };
        });
      }

      return { previousCustomers };
    },

    onError: (error, customerId, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueriesData({ queryKey: customerKeys.lists() }, context.previousCustomers);
      }
      
      logger.error('[useDeleteCustomer] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
      });
    },
  });
}
