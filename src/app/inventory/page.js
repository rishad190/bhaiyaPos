"use client";
import React, { useState, useMemo, Suspense } from "react";

import { useRouter } from "next/navigation";
import { useFabrics, useAddFabric, useUpdateFabric, useDeleteFabric } from "@/hooks/useFabrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryErrorBoundary } from "@/components/shared/ErrorBoundary";
import logger from "@/utils/logger";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryActions } from "@/components/inventory/InventoryActions";
import { calculateTotalQuantity } from "@/lib/inventory-utils";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import heavy components
const FabricForm = dynamic(() => import("@/components/inventory/FabricForm"), {
  loading: () => (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="mt-2 text-sm text-muted-foreground">Loading form...</p>
    </div>
  ),
  ssr: false,
});

export default function InventoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFabric, setEditingFabric] = useState(null);

  // Fetch fabrics with React Query
  const { data: fabricsData, isLoading } = useFabrics({
    page: 1,
    limit: 1000,
    searchTerm,
  });

  // Mutations
  const addFabricMutation = useAddFabric();
  const updateFabricMutation = useUpdateFabric();
  const deleteFabricMutation = useDeleteFabric();

  const filteredFabrics = useMemo(() => {
    if (!fabricsData?.data) {
      logger.info('[Inventory] No fabricsData or data is empty');
      return [];
    }
    
    logger.info('[Inventory] Raw fabrics data:', fabricsData.data);
    logger.info('[Inventory] Total raw fabrics:', fabricsData.data.length);
    
    // Filter out fabrics with invalid IDs
    const validFabrics = fabricsData.data.filter((fabric) => {
      if (!fabric) {
        logger.warn('[Inventory] Skipping null/undefined fabric');
        return false;
      }
      if (!fabric.id) {
        logger.warn('[Inventory] Skipping fabric with no ID:', fabric);
        return false;
      }
      return true;
    });
    
    logger.info('[Inventory] Valid fabrics after filtering:', validFabrics.length);
    
    // Remove duplicates by ID
    const uniqueFabrics = validFabrics.reduce((acc, fabric) => {
      if (!acc.find(f => f.id === fabric.id)) {
        acc.push(fabric);
      } else {
        logger.warn('[Inventory] Duplicate fabric ID found:', fabric.id);
      }
      return acc;
    }, []);
    
    logger.info('[Inventory] Unique fabrics:', uniqueFabrics.length);
    
    if (uniqueFabrics.length > 0) {
      logger.info('[Inventory] Sample fabric:', uniqueFabrics[0]);
    }
    
    return uniqueFabrics;
  }, [fabricsData]);

  const handleAddClick = () => {
    setEditingFabric(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (fabric) => {
    setEditingFabric(fabric);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (fabricId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteFabricMutation.mutateAsync(fabricId);
      } catch (error) {
        logger.error("Error deleting fabric:", error);
      }
    }
  };

  const handleSaveFabric = async (fabric) => {
    try {
      logger.info('[Inventory] Saving fabric:', fabric);

      if (fabric.id) {
        // Update existing fabric
        await updateFabricMutation.mutateAsync({
          fabricId: fabric.id,
          updatedData: {
            ...fabric,
            updatedAt: new Date().toISOString(),
          },
        });
      } else {
        // Add new fabric - include batches if they exist
        const fabricToAdd = {
          ...fabric,
          batches: fabric.batches || {},
          createdAt: new Date().toISOString(),
        };
        
        logger.info('[Inventory] Adding new fabric:', fabricToAdd);
        await addFabricMutation.mutateAsync(fabricToAdd);
      }
      
      setIsDialogOpen(false);
      setEditingFabric(null);
    } catch (error) {
      logger.error("[Inventory] Error saving fabric:", error);
    }
  };

  return (
    <InventoryErrorBoundary>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Card className="border-none shadow-md">
          <InventoryActions
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddClick={handleAddClick}
          />

          <CardContent>
            <InventoryTable
              fabrics={filteredFabrics}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          </CardContent>
        </Card>

        {/* Fabric Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFabric ? "Edit Fabric" : "Add New Fabric"}
              </DialogTitle>
            </DialogHeader>
            <FabricForm
              fabric={editingFabric}
              onSave={handleSaveFabric}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingFabric(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </InventoryErrorBoundary>
  );
}
