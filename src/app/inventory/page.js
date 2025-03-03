"use client";
import { useState } from "react";
import { useData } from "@/app/data-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateWeightedAverage } from "@/lib/inventory-utils";
import { SellFabricDialog } from "@/components/SellFabricDialog";
import { calculateFifoSale } from "@/lib/inventory-utils";
import { AddFabricDialog } from "@/components/AddFabricDialog";
import { PurchaseStockDialog } from "@/components/PurchaseStockDialog";
import { EditFabricDialog } from "@/components/EditFabricDialog";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
  const router = useRouter();
  const {
    fabrics,
    fabricBatches,
    addFabric,
    updateFabric,
    deleteFabric,
    addFabricBatch,
    updateFabricBatch,
    deleteFabricBatch,
    addTransaction,
    suppliers, // Make sure you're getting suppliers from your data context
  } = useData();
  const [viewMode, setViewMode] = useState("average");

  // Calculate stock values
  const stockValues = fabrics?.map((fabric) => {
    const fabricBatchList = fabricBatches.filter(
      (b) => b.fabricId === fabric.id
    );
    const avgCost = calculateWeightedAverage(fabricBatchList);
    const totalQty = fabricBatchList.reduce(
      (sum, batch) => sum + batch.quantity,
      0
    );

    return {
      ...fabric,
      totalQuantity: totalQty,
      averageCost: avgCost,
      currentValue: totalQty * avgCost,
      batches: fabricBatchList,
    };
  });

  const handleSellFabric = async (fabricId, quantity) => {
    try {
      const fabric = stockValues.find((f) => f.id === fabricId);
      if (!fabric) throw new Error("Fabric not found");

      // Calculate FIFO sale
      const result = calculateFifoSale(fabric.batches, quantity);

      // Update batches in database
      for (const batch of result.updatedBatches) {
        if (batch.quantity > 0) {
          await updateFabricBatch(batch.id, { quantity: batch.quantity });
        } else {
          await deleteFabricBatch(batch.id);
        }
      }

      // Record sale transaction
      const saleTransaction = {
        fabricId,
        quantity,
        totalCost: result.totalCost,
        date: new Date().toISOString(),
        type: "FABRIC_SALE",
        batches: result.costOfGoodsSold,
      };
      await addTransaction(saleTransaction);
    } catch (error) {
      console.error("Error selling fabric:", error);
      throw error;
    }
  };

  const handleAddFabric = async (fabricData) => {
    try {
      await addFabric({
        ...fabricData,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error adding fabric:", error);
      throw error;
    }
  };

  const handleEditFabric = async (fabricId, updatedData) => {
    try {
      await updateFabric(fabricId, {
        ...updatedData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating fabric:", error);
      throw error;
    }
  };

  const handleDeleteFabric = async (fabricId) => {
    try {
      if (window.confirm("Are you sure you want to delete this fabric?")) {
        console.log(fabricId);

        await deleteFabric(fabricId);
      }
    } catch (error) {
      console.error("Error deleting fabric:", error);
      throw error;
    }
  };

  const handlePurchaseStock = async (purchaseData) => {
    try {
      await addFabricBatch({
        ...purchaseData,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error purchasing stock:", error);
      throw error;
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Fabric Inventory</h1>
        <div className="flex flex-wrap gap-2 md:gap-4">
          <AddFabricDialog onAddFabric={handleAddFabric} />
          <PurchaseStockDialog
            fabrics={fabrics}
            suppliers={suppliers}
            onPurchaseStock={handlePurchaseStock}
          />
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="View Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="average">Weighted Average</SelectItem>
              <SelectItem value="fifo">FIFO</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Fabric Code</TableHead>
              <TableHead className="whitespace-nowrap">Name</TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Stock Qty
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Avg. Cost
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Current Value
              </TableHead>
              {viewMode === "fifo" && (
                <TableHead className="whitespace-nowrap">
                  Batch Details
                </TableHead>
              )}
              <TableHead className="whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockValues?.map((stock) => (
              <TableRow
                key={stock.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/inventory/${stock.id}`)}
              >
                <TableCell className="whitespace-nowrap">
                  {stock.code}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {stock.name}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {stock.totalQuantity.toFixed(2)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  ৳{stock.averageCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  ৳{stock.currentValue.toFixed(2)}
                </TableCell>
                {viewMode === "fifo" && (
                  <TableCell className="whitespace-nowrap">
                    {stock.batches?.map((batch) => (
                      <div key={batch.id} className="text-sm">
                        Qty: {batch.quantity} @ ৳{batch.unitCost}
                      </div>
                    ))}
                  </TableCell>
                )}
                <TableCell
                  onClick={(e) => e.stopPropagation()}
                  className="whitespace-nowrap"
                >
                  <div className="flex flex-col md:flex-row gap-2">
                    <EditFabricDialog
                      fabric={stock}
                      onSave={handleEditFabric}
                      onDelete={handleDeleteFabric}
                    />
                    <SellFabricDialog
                      fabric={stock}
                      onSellFabric={handleSellFabric}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
