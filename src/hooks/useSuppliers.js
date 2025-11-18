import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '@/services/firebaseService';
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

// Hook to add supplier
export function useAddSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (supplierData) => supplierService.addSupplier(supplierData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      toast({
        title: 'Success',
        description: 'Supplier added successfully',
      });
    },
    onError: (error) => {
      logger.error('[useAddSupplier] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add supplier',
        variant: 'destructive',
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

// Hook to delete supplier
export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (supplierId) => supplierService.deleteSupplier(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      toast({
        title: 'Success',
        description: 'Supplier deleted successfully',
      });
    },
    onError: (error) => {
      logger.error('[useDeleteSupplier] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete supplier',
        variant: 'destructive',
      });
    },
  });
}
