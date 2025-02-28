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

export default function InventoryPage() {
  const { fabrics, fabricBatches, addFabric, addFabricBatch } = useData();
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

      const result = calculateFifoSale(fabric.batches, quantity);
      // Update your database here with result.updatedBatches

      // Add transaction record
      const saleTransaction = {
        fabricId,
        quantity,
        totalCost: result.totalCost,
        date: new Date().toISOString(),
        type: "SALE",
        batches: result.costOfGoodsSold,
      };
      // Save sale transaction to database
    } catch (error) {
      console.error("Error selling fabric:", error);
      throw error;
    }
  };

  const handleAddFabric = async (fabricData) => {
    try {
      // Add to your database
      const newFabric = {
        ...fabricData,
        id: `FAB${Date.now()}`, // Generate a unique ID
      };

      await addFabric(newFabric); // Implement this in your data context
    } catch (error) {
      console.error("Error adding fabric:", error);
      throw error;
    }
  };

  const handlePurchaseStock = async (purchaseData) => {
    try {
      const newBatch = {
        id: `BAT${Date.now()}`,
        ...purchaseData,
      };

      await addFabricBatch(newBatch); // Implement this in your data context
    } catch (error) {
      console.error("Error purchasing stock:", error);
      throw error;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Fabric Inventory</h1>
        <div className="flex gap-4">
          <AddFabricDialog onAddFabric={handleAddFabric} />
          <PurchaseStockDialog
            fabrics={fabrics}
            onPurchaseStock={handlePurchaseStock}
          />
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="View Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="average">Weighted Average</SelectItem>
              <SelectItem value="fifo">FIFO</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fabric Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Stock Qty</TableHead>
            <TableHead className="text-right">Avg. Cost</TableHead>
            <TableHead className="text-right">Current Value</TableHead>
            {viewMode === "fifo" && <TableHead>Batch Details</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stockValues?.map((stock) => (
            <TableRow key={stock.id}>
              <TableCell>{stock.code}</TableCell>
              <TableCell>{stock.name}</TableCell>
              <TableCell className="text-right">
                {stock.totalQuantity.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ৳{stock.averageCost.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ৳{stock.currentValue.toFixed(2)}
              </TableCell>
              {viewMode === "fifo" && (
                <TableCell>
                  {stock.batches?.map((batch) => (
                    <div key={batch.id} className="text-sm">
                      Qty: {batch.quantity} @ ৳{batch.unitCost}
                    </div>
                  ))}
                </TableCell>
              )}
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
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
  );
}
