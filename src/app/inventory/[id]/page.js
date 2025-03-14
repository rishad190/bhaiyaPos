// app/inventory/[id]/page.tsx
"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
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
import { SellFabricDialog } from "@/components/SellFabricDialog";
import { PurchaseStockDialog } from "@/components/PurchaseStockDialog";
import { EditFabricDialog } from "@/components/EditFabricDialog";
import { calculateWeightedAverage } from "@/lib/inventory-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditBatchDialog } from "@/components/EditBatchDialog";

export default function FabricViewPage() {
  const router = useRouter();
  const { id } = useParams();
  const {
    fabrics,
    fabricBatches,
    transactions,
    addFabricBatch,
    updateFabricBatch,
    deleteFabricBatch,
    addTransaction,
  } = useData();

  const fabric = fabrics.find((f) => f.id === id);
  const batches = fabricBatches.filter((b) => b.fabricId === id);
  const fabricTransactions = transactions.filter((t) => t.fabricId === id);

  // Corrected state initialization
  const [viewMode, setViewMode] = useState("");

  if (!fabric) {
    return <div className="p-8">Fabric not found</div>;
  }

  // Calculate stock metrics
  const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);
  const averageCost = calculateWeightedAverage(batches);
  const currentValue = totalQuantity * averageCost;

  // Prepare price history data
  const priceHistory = batches
    .map((b) => ({
      date: new Date(b.createdAt).toLocaleDateString(),
      price: b.unitCost,
      quantity: b.quantity,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare transactions data
  const recentTransactions = fabricTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const handleSellFabric = async (quantity) => {
    try {
      const fabric = stockValues.find((f) => f.id === id);
      if (!fabric) throw new Error("Fabric not found");

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
        fabricId: id,
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

  const handleEditBatch = async (batchId, updates) => {
    try {
      await updateFabricBatch(batchId, updates);
    } catch (error) {
      console.error("Error updating batch:", error);
      throw error;
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      try {
        await deleteFabricBatch(batchId);
      } catch (error) {
        console.error("Error deleting batch:", error);
        alert("Failed to delete batch. Please try again.");
      }
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <Button variant="outline" onClick={() => router.back()}>
            Back to Inventory
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold mt-4">{fabric.name}</h1>
          <p className="text-gray-600">{fabric.code}</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
          <EditFabricDialog
            fabric={fabric}
            onSave={(id, updates) => console.log("Save implementation")}
            onDelete={(id) => router.push("/inventory")}
          />
          <PurchaseStockDialog
            fabrics={[fabric]}
            onPurchaseStock={addFabricBatch}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 md:p-6 rounded-lg shadow">
          <h3 className="text-sm text-muted-foreground">Total Quantity</h3>
          <p className="text-xl md:text-2xl font-bold">
            {totalQuantity.toFixed(2)} {fabric.unit}
          </p>
        </div>
        <div className="bg-card p-4 md:p-6 rounded-lg shadow">
          <h3 className="text-sm text-muted-foreground">Average Cost</h3>
          <p className="text-xl md:text-2xl font-bold">
            ৳{averageCost.toFixed(2)}
          </p>
        </div>
        <div className="bg-card p-4 md:p-6 rounded-lg shadow">
          <h3 className="text-sm text-muted-foreground">Current Value</h3>
          <p className="text-xl md:text-2xl font-bold">
            ৳{currentValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Price History Section */}
      <div className="bg-card p-4 md:p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h2 className="text-lg md:text-xl font-semibold">Price History</h2>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="View Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chart">Chart View</SelectItem>
              <SelectItem value="table">Table View</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          {viewMode === "chart" ? (
            <div className="h-64"></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Purchase Price
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Quantity</TableHead>
                  <TableHead className="whitespace-nowrap">Supplier</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>৳{batch.unitCost.toFixed(2)}</TableCell>
                    <TableCell>
                      {batch.quantity} {fabric.unit}
                    </TableCell>
                    <TableCell>{batch.supplierName}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <EditBatchDialog
                          batch={batch}
                          fabric={fabric}
                          onSave={handleEditBatch}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => handleDeleteBatch(batch.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-card p-4 md:p-6 rounded-lg shadow">
        <h2 className="text-lg md:text-xl font-semibold mb-4">
          Recent Stock Movements
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead className="whitespace-nowrap">Quantity</TableHead>
                <TableHead className="whitespace-nowrap">Unit Price</TableHead>
                <TableHead className="whitespace-nowrap">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions?.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>
                    {transaction.quantity} {fabric.unit}
                  </TableCell>
                  <TableCell>৳{transaction.unitPrice?.toFixed(2)}</TableCell>
                  <TableCell>৳{transaction.totalValue?.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Sell Fabric Section */}
      <div className="bg-card p-4 md:p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-lg md:text-xl font-semibold">Sell Stock</h2>
          <SellFabricDialog
            fabric={{ ...fabric, batches, totalQuantity }}
            onSellFabric={handleSellFabric}
          />
        </div>
      </div>
    </div>
  );
}
