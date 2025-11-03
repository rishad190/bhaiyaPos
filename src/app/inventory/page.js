"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/app/data-context";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddFabricDialog } from "@/components/AddFabricDialog";
import { PurchaseStockDialog } from "@/components/PurchaseStockDialog";
import { EditFabricDialog } from "@/components/EditFabricDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  calculateTotalQuantity,
  getQuantityByColor,
  isLowStock,
} from "@/lib/inventory-utils";
import { Plus, Package, Search } from "lucide-react";
import { ColorChipGroup } from "@/components/ui/color-chip";
import { ColorBatchCell } from "@/components/ui/color-batch-cell";

export default function InventoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    fabrics,
    addFabric,
    updateFabric,
    deleteFabric,
    addFabricBatch,
    suppliers,
  } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingState, setLoadingState] = useState({
    initial: true,
    actions: false,
  });

  useEffect(() => {
    if (fabrics !== undefined) {
      setLoadingState((prev) => ({ ...prev, initial: false }));
    }
  }, [fabrics]);

  const filteredFabrics = useMemo(() => {
    if (!Array.isArray(fabrics)) return [];

    return fabrics.filter((fabric) => {
      if (!fabric) return false;
      const searchString = searchTerm.toLowerCase();
      return (
        fabric.name?.toLowerCase().includes(searchString) ||
        fabric.code?.toLowerCase().includes(searchString) ||
        fabric.category?.toLowerCase().includes(searchString)
      );
    });
  }, [fabrics, searchTerm]);

  const handleAddFabric = async (fabricData) => {
    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await addFabric({
        ...fabricData,
        createdAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Fabric added successfully",
      });
    } catch (error) {
      console.error("Error adding fabric:", error);
      toast({
        title: "Error",
        description: "Failed to add fabric. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  const handleEditFabric = async (fabricId, updatedData) => {
    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await updateFabric(fabricId, {
        ...updatedData,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Fabric updated successfully",
      });
    } catch (error) {
      console.error("Error updating fabric:", error);
      toast({
        title: "Error",
        description: "Failed to update fabric. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  const handleDeleteFabric = async (fabricId) => {
    if (!window.confirm("Are you sure you want to delete this fabric?")) {
      return;
    }

    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await deleteFabric(fabricId);
      toast({
        title: "Success",
        description: "Fabric deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting fabric:", error);
      toast({
        title: "Error",
        description: "Failed to delete fabric. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  const handlePurchaseStock = async (purchaseData) => {
    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await addFabricBatch({
        ...purchaseData,
        createdAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Stock purchased successfully",
      });
    } catch (error) {
      console.error("Error purchasing stock:", error);
      toast({
        title: "Error",
        description: "Failed to purchase stock. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  // We'll use the imported getQuantityByColor function instead

  if (loadingState.initial) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Fabric Inventory
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all fabric inventory
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
          <AddFabricDialog onAddFabric={handleAddFabric}>
            <Button
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white"
              disabled={loadingState.actions}
            >
              {loadingState.actions ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {loadingState.actions ? "Adding..." : "Add Fabric"}
            </Button>
          </AddFabricDialog>
          <PurchaseStockDialog
            fabrics={fabrics}
            suppliers={suppliers}
            onPurchaseStock={handlePurchaseStock}
          >
            <Button
              className="w-full md:w-auto"
              variant="outline"
              disabled={loadingState.actions}
            >
              {loadingState.actions ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full"></div>
              ) : (
                <Package className="mr-2 h-4 w-4" />
              )}
              {loadingState.actions ? "Processing..." : "Purchase Stock"}
            </Button>
          </PurchaseStockDialog>
        </div>
      </div>

      <Card className="mb-8 border-none shadow-md">
        <CardContent className="p-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search fabrics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fabric Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total Stock</TableHead>
                <TableHead>Colors Available</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFabrics.map((fabric) => {
                // Add defensive checks and ensure fabric has required structure
                if (!fabric) return null;

                const totalQty = calculateTotalQuantity(fabric);
                const colorQuantities = getQuantityByColor(fabric);
                const lowStock = isLowStock(fabric);

                return (
                  <TableRow
                    key={fabric.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/inventory/${fabric.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium">{fabric.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {fabric.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{fabric.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={totalQty > 0 ? "default" : "destructive"}>
                        {totalQty.toFixed(2)} {fabric.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ColorChipGroup
                        colors={Object.entries(colorQuantities).map(
                          ([color, qty]) => ({
                            colorName: color,
                            quantity: qty,
                          })
                        )}
                        layout="inline"
                        unit={fabric.unit}
                      />
                    </TableCell>
                    <TableCell>
                      {Array.isArray(fabric.batches) &&
                      fabric.batches.length > 0 ? (
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-primary">
                            {fabric.batches.length} batch
                            {fabric.batches.length > 1 ? "s" : ""}
                          </summary>
                          <div className="mt-2 space-y-3 p-2 border rounded-md bg-white shadow-sm">
                            {fabric.batches.map((b) => (
                              <div key={b.id} className="space-y-1">
                                <div className="text-xs text-muted-foreground flex items-center justify-between">
                                  <span className="font-medium">
                                    {b.batchNumber || b.id}{" "}
                                    {b.containerNo ? `• ${b.containerNo}` : ""}
                                  </span>
                                  <span>
                                    ৳
                                    {(
                                      Number(b.costPerPiece) ||
                                      Number(b.unitCost) ||
                                      0
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <ColorBatchCell
                                    items={b.items}
                                    unit={fabric.unit}
                                  />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Purchased:{" "}
                                  {b.purchaseDate || b.createdAt || "N/A"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No batches
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={lowStock ? "destructive" : "success"}>
                        {lowStock ? "Low Stock" : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <EditFabricDialog
                          fabric={fabric}
                          onSave={handleEditFabric}
                          onDelete={handleDeleteFabric}
                        />
                        <PurchaseStockDialog
                          fabrics={fabrics ? [fabric] : []}
                          suppliers={suppliers}
                          onPurchaseStock={handlePurchaseStock}
                        >
                          <Button variant="ghost" size="sm">
                            Add Batch
                          </Button>
                        </PurchaseStockDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!filteredFabrics.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No fabrics found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
