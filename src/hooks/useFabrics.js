import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fabricService } from '@/services/inventoryService';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

// Query keys
export const fabricKeys = {
  all: ['fabrics'],
  lists: () => [...fabricKeys.all, 'list'],
  list: (filters) => [...fabricKeys.lists(), filters],
};

// Hook to fetch paginated fabrics
export function useFabrics({ page = 1, limit = 20, searchTerm = '' } = {}) {
  return useQuery({
    queryKey: fabricKeys.list({ page, limit, searchTerm }),
    queryFn: () => fabricService.getFabrics({ page, limit, searchTerm }),
    keepPreviousData: true,
  });
}

// Hook to add fabric
export function useAddFabric() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (fabricData) => fabricService.addFabric(fabricData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fabricKeys.lists() });
      toast({
        title: 'Success',
        description: 'Fabric added successfully',
      });
    },
    onError: (error) => {
      logger.error('[useAddFabric] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add fabric',
        variant: 'destructive',
      });
    },
  });
}

// Hook to update fabric
export function useUpdateFabric() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ fabricId, updatedData }) =>
      fabricService.updateFabric(fabricId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fabricKeys.lists() });
      toast({
        title: 'Success',
        description: 'Fabric updated successfully',
      });
    },
    onError: (error) => {
      logger.error('[useUpdateFabric] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update fabric',
        variant: 'destructive',
      });
    },
  });
}

// Hook to delete fabric with optimistic updates
export function useDeleteFabric() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (fabricId) => fabricService.deleteFabric(fabricId),
    
    onMutate: async (fabricId) => {
      await queryClient.cancelQueries({ queryKey: fabricKeys.lists() });
      const previousFabrics = queryClient.getQueryData(fabricKeys.lists());

      if (previousFabrics) {
        queryClient.setQueriesData({ queryKey: fabricKeys.lists() }, (old) => {
          if (!old) return old;

          return {
            ...old,
            data: (old.data || []).filter((fabric) => fabric.id !== fabricId),
            total: (old.total || 0) - 1,
          };
        });
      }

      return { previousFabrics };
    },

    onError: (error, fabricId, context) => {
      if (context?.previousFabrics) {
        queryClient.setQueriesData({ queryKey: fabricKeys.lists() }, context.previousFabrics);
      }
      
      logger.error('[useDeleteFabric] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete fabric',
        variant: 'destructive',
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: fabricKeys.lists() });
    },

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Fabric deleted successfully',
      });
    },
  });
}
