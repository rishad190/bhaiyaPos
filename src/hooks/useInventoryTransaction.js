import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryTransactionService } from '@/services/inventoryTransactionService';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

/**
 * Hook to safely reduce inventory using Firebase transactions
 * Prevents race conditions and overselling
 */
export function useReduceInventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (saleProducts) => 
      inventoryTransactionService.reduceInventoryAtomic(saleProducts),
    onSuccess: (results) => {
      // Invalidate fabric queries to refresh inventory
      queryClient.invalidateQueries({ queryKey: ['fabrics'] });
      
      logger.info('[useReduceInventory] Inventory reduced successfully', {
        productsProcessed: results.length,
      });
      
      toast({
        title: 'Success',
        description: `Inventory updated for ${results.length} product(s)`,
      });
    },
    onError: (error) => {
      logger.error('[useReduceInventory] Error reducing inventory:', error);
      
      toast({
        title: 'Inventory Error',
        description: error.message || 'Failed to reduce inventory',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to check stock availability before sale
 */
export function useCheckStockAvailability() {
  return useMutation({
    mutationFn: (products) => 
      inventoryTransactionService.checkStockAvailability(products),
    onError: (error) => {
      logger.error('[useCheckStockAvailability] Error checking stock:', error);
    },
  });
}
