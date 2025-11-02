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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, Search } from "lucide-react";

export default function InventoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    fabrics,
    fabricBatches,
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
    return (
      fabrics?.filter(
        (fabric) =>
          fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fabric.code.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    );
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

  const getStockByColor = (fabricId) => {
    const batches = fabricBatches.filter((b) => b.fabricId === fabricId);
    const colorStock = batches.reduce((acc, batch) => {
      if (batch.color) {
        acc[batch.color] = (acc[batch.color] || 0) + batch.quantity;
      } else {
        acc["N/A"] = (acc["N/A"] || 0) + batch.quantity;
      }
      return acc;
    }, {});
    return colorStock;
  };

  if (loadingState.initial) {
    return <div>Loading...</div>;
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
              <Plus className="mr-2 h-4 w-4" />
              Add Fabric
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
              <Package className="mr-2 h-4 w-4" />
              Purchase Stock
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
                <TableHead className="text-right">Total Quantity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFabrics.map((fabric) => {
                const totalQty = (fabricBatches || [])
                  .filter((b) => b.fabricId === fabric.id)
                  .reduce((sum, b) => sum + (b.quantity || 0), 0);
                return (
                  <TableRow
                    key={fabric.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/inventory/${fabric.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium">{fabric.name}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={totalQty > 0 ? "default" : "destructive"}>
                        {totalQty.toFixed(2)} {fabric.unit}
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
                  <TableCell colSpan={3} className="text-center py-4">
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
