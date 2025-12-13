import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '@/services/supplierService';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

// Query keys
export const supplierKeys = {
  all: ['suppliers'],
  lists: () => [...supplierKeys.all, 'list'],
  list: (filters) => [...supplierKeys.lists(), filters],
};

// Hook to fetch paginated suppliers
export function useSuppliers({ page = 1, limit = 20, searchTerm = '' } = {}) {
  return useQuery({
    queryKey: supplierKeys.list({ page, limit, searchTerm }),
    queryFn: () => supplierService.getSuppliers({ page, limit, searchTerm }),
    keepPreviousData: true,
  });
}

// Hook to add supplier with optimistic updates
export function useAddSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (supplierData) => supplierService.addSupplier(supplierData),
    
    onMutate: async (newSupplier) => {
      await queryClient.cancelQueries({ queryKey: supplierKeys.lists() });
      const previousSuppliers = queryClient.getQueryData(supplierKeys.lists());

      if (previousSuppliers) {
        queryClient.setQueriesData({ queryKey: supplierKeys.lists() }, (old) => {
          if (!old) return old;
          
          const optimisticSupplier = {
            id: `temp-${Date.now()}`,
            ...newSupplier,
            totalDue: 0,
            createdAt: new Date().toISOString(),
          };

          return {
            ...old,
            data: [optimisticSupplier, ...(old.data || [])],
            total: (old.total || 0) + 1,
          };
        });
      }

      return { previousSuppliers };
    },

    onError: (error, newSupplier, context) => {
      if (context?.previousSuppliers) {
        queryClient.setQueriesData({ queryKey: supplierKeys.lists() }, context.previousSuppliers);
      }
      
      logger.error('[useAddSupplier] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add supplier',
        variant: 'destructive',
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Supplier added successfully',
      });
    },
  });
}

// Hook to update supplier
export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ supplierId, updatedData }) =>
      supplierService.updateSupplier(supplierId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      toast({
        title: 'Success',
        description: 'Supplier updated successfully',
      });
    },
    onError: (error) => {
      logger.error('[useUpdateSupplier] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update supplier',
        variant: 'destructive',
      });
    },
  });
}

// Hook to delete supplier with optimistic updates
export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (supplierId) => supplierService.deleteSupplier(supplierId),
    
    onMutate: async (supplierId) => {
      await queryClient.cancelQueries({ queryKey: supplierKeys.lists() });
      const previousSuppliers = queryClient.getQueryData(supplierKeys.lists());

      if (previousSuppliers) {
        queryClient.setQueriesData({ queryKey: supplierKeys.lists() }, (old) => {
          if (!old) return old;

          return {
            ...old,
            data: (old.data || []).filter((supplier) => supplier.id !== supplierId),
            total: (old.total || 0) - 1,
          };
        });
      }

      return { previousSuppliers };
    },

    onError: (error, supplierId, context) => {
      if (context?.previousSuppliers) {
        queryClient.setQueriesData({ queryKey: supplierKeys.lists() }, context.previousSuppliers);
      }
      
      logger.error('[useDeleteSupplier] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete supplier',
        variant: 'destructive',
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Supplier deleted successfully',
      });
    },
  });
}
