// app/inventory/[id]/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInventoryData } from "@/contexts/InventoryContext";
import { useTransactionData } from "@/contexts/TransactionContext";
import { useSupplierData } from "@/contexts/SupplierContext";
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
import {
  calculateWeightedAverage,
  calculateFifoSale,
} from "@/lib/inventory-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditBatchDialog } from "@/components/EditBatchDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Package,
  DollarSign,
  Scale,
  RefreshCw,
  TrendingUp,
  History,
  Trash2,
  Edit,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export default function FabricViewPage() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();
  const {
    fabrics,
    fabricBatches,
    addFabricBatch,
    updateFabricBatch,
    deleteFabricBatch,
    updateFabric,
    deleteFabric,
  } = useInventoryData();
  const { transactions, addTransaction } = useTransactionData();
  const { suppliers } = useSupplierData();

  const [viewMode, setViewMode] = useState("table");
  const [loadingState, setLoadingState] = useState({
    initial: true,
    actions: false,
  });

  // Initialize loading state
  useEffect(() => {
    if (fabrics !== undefined && fabricBatches !== undefined) {
      setLoadingState((prev) => ({ ...prev, initial: false }));
    }
  }, [fabrics, fabricBatches]);

  const fabric = useMemo(
    () => fabrics?.find((f) => f && f.id === id),
    [fabrics, id]
  );
  const batches = useMemo(
    () => fabricBatches?.filter((b) => b && b.fabricId === id) || [],
    [fabricBatches, id]
  );
  const fabricTransactions = useMemo(
    () => transactions?.filter((t) => t && t.fabricId === id) || [],
    [transactions, id]
  );

  // Memoize calculations for performance and data consistency
  const {
    totalQuantity,
    averageCost,
    currentValue,
    priceHistory,
    stockMovements,
  } = useMemo(() => {
    if (!fabric || !batches || !fabricTransactions) {
      return {
        totalQuantity: 0,
        averageCost: 0,
        currentValue: 0,
        priceHistory: [],
        stockMovements: [],
      };
    }

    const totalQty = batches.reduce((sum, b) => sum + (b?.quantity || 0), 0);
    const avgCost = calculateWeightedAverage(batches);
    const currentVal = totalQty * avgCost;

    const history = batches
      .map((b) => {
        if (!b || !b.id) return null;
        return {
          id: b.id,
          date: b.createdAt
            ? new Date(b.createdAt).toLocaleDateString()
            : "N/A",
          price: b.unitCost || 0,
          quantity: b.quantity || 0,
          supplierName: b.supplierName || "N/A",
          colors: b.colors || [],
        };
      })
      .filter((item) => item !== null)
      .filter(
        (item) => item.date !== "N/A" && !isNaN(new Date(item.date).getTime())
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const movements = [
      ...batches.map((b) => ({
        id: b.id,
        date: b.createdAt,
        type: "Purchase",
        quantity: b.quantity,
        totalCost: b.unitCost * b.quantity,
        source: b.supplierName,
      })),
      ...fabricTransactions.map((t) => ({
        id: t.id,
        date: t.date,
        type: "Sale",
        quantity: t.quantity,
        totalCost: t.totalCost,
        source: t.customerName || "N/A", // Assuming customerName is available
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      totalQuantity: totalQty,
      averageCost: avgCost,
      currentValue: currentVal,
      priceHistory: history,
      stockMovements: movements,
    };
  }, [fabric, batches, fabricTransactions]);

  const handleSellFabric = async (quantity, color) => {
    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      if (!fabric) throw new Error("Fabric not found");
      const result = calculateFifoSale(batches, quantity, color);
      for (const batch of result.updatedBatches) {
        if (batch.quantity > 0) {
          await updateFabricBatch(batch.id, { quantity: batch.quantity, colors: batch.colors });
        } else {
          await deleteFabricBatch(batch.id);
        }
      }
      const saleTransaction = {
        fabricId: id,
        quantity,
        totalCost: result.totalCost,
        date: new Date().toISOString(),
        type: "FABRIC_SALE",
        batches: result.costOfGoodsSold,
        color: color,
      };
      await addTransaction(saleTransaction);
      toast({
        title: "Success",
        description: "Fabric sold successfully",
      });
    } catch (error) {
      console.error("Error selling fabric:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to sell fabric. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  const handleEditBatch = async (batchId, updates) => {
    if (!batchId || !updates) return;
    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      const validatedUpdates = {
        ...updates,
        quantity: parseFloat(updates.quantity) || 0,
        unitCost: parseFloat(updates.unitCost) || 0,
      };
      await updateFabricBatch(batchId, validatedUpdates);
      toast({
        title: "Success",
        description: "Batch updated successfully",
      });
    } catch (error) {
      console.error("Error updating batch:", error);
      toast({
        title: "Error",
        description: "Failed to update batch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this batch? This action adjusts inventory levels."
      )
    ) {
      return;
    }

    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await deleteFabricBatch(batchId);
      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast({
        title: "Error",
        description: "Failed to delete batch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  const handlePurchaseStock = async (purchaseData) => {
    if (!purchaseData || !purchaseData.fabricId) return;
    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await addFabricBatch({
        ...purchaseData,
        fabricId: id,
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

  const handleEditFabric = async (fabricIdToUpdate, updates) => {
    if (!fabricIdToUpdate || !updates) return;
    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await updateFabric(fabricIdToUpdate, updates);
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

  const handleDeleteFabric = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this fabric and all its associated batches? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await deleteFabric(id);
      toast({
        title: "Success",
        description: "Fabric deleted successfully",
      });
      router.push("/inventory");
    } catch (error) {
      console.error("Error deleting fabric:", error);
      toast({
        title: "Error",
        description: "Failed to delete fabric. Please try again.",
        variant: "destructive",
      });
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  // --- SKELETON COMPONENTS ---
  const SummaryCardSkeleton = () => (
    <Card className="overflow-hidden border-none shadow-md">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
        <div className="p-4">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );

  const TableSkeleton = ({ columns = 5 }) => (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 py-4 border-b last:border-b-0`}
            >
              {[...Array(columns)].map((_, j) => (
                <Skeleton
                  key={j}
                  className={`h-4 ${j < columns - 1 ? "w-24" : "w-10 ml-auto"}`}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  // --- END SKELETON COMPONENTS ---

  if (loadingState.initial) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>
        <TableSkeleton columns={5} />
        <TableSkeleton columns={5} />
      </div>
    );
  }

  if (!loadingState.initial && !fabric) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Fabric Not Found</h2>
          <p className="mt-2 text-gray-600">
            The fabric (ID: {id}) you&apos;re looking for doesn&apos;t exist or
            has been removed.
          </p>
          <Button
            onClick={() => router.push("/inventory")}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Button
            variant="outline"
            onClick={() => router.push("/inventory")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{fabric.name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline">{fabric.code}</Badge>
            <Badge variant="secondary">{fabric.category}</Badge>
            <Badge variant="secondary">{fabric.unit}</Badge>
          </div>
          {fabric.description && (
            <p className="text-muted-foreground mt-2 max-w-prose">
              {fabric.description}
            </p>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
          <EditFabricDialog
            fabric={fabric}
            onSave={handleEditFabric}
            onDelete={handleDeleteFabric}
          />
          <PurchaseStockDialog
            fabrics={fabrics ? [fabric] : []}
            suppliers={suppliers || []}
            onPurchaseStock={handlePurchaseStock}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-0">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-100 dark:border-blue-800">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Total Quantity
                </h3>
                <Scale className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="p-4">
              <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                {totalQuantity.toFixed(2)} {fabric.unit}
              </p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                Current stock quantity
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-0">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 border-b border-green-100 dark:border-green-800">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                  Average Cost
                </h3>
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="p-4">
              <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                ৳{averageCost.toFixed(2)}
              </p>
              <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                Average cost per unit
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-0">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 border-b border-purple-100 dark:border-purple-800">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                  Current Value
                </h3>
                <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="p-4">
              <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
                ৳{currentValue.toFixed(2)}
              </p>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                Total inventory value
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price History Section */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">
                Purchase History (Batches)
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier/Container</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Purchase Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(priceHistory) && priceHistory.length > 0 ? (
                  priceHistory.map((batchItem) => {
                    const fullBatch = batches.find(
                      (b) => b && b.id === batchItem.id
                    );
                    if (!fullBatch) return null;

                    return (
                      <TableRow key={batchItem.id}>
                        <TableCell>{batchItem.date}</TableCell>
                        <TableCell>{batchItem.supplierName}</TableCell>
                        <TableCell>
                          {Array.isArray(batchItem.colors) && batchItem.colors.length > 0 ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="link">{batchItem.colors.length} colors</Button>
                              </PopoverTrigger>
                              <PopoverContent>
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Color Details</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Quantities per color in this batch.
                                    </p>
                                  </div>
                                  <div className="grid gap-2">
                                    {batchItem.colors.map((color, index) => (
                                      <div key={index} className="grid grid-cols-2 items-center gap-4">
                                        <span>{color.color}</span>
                                        <span>{color.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            batchItem.color
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          ৳{(batchItem.price || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {batchItem.quantity || 0} {fabric?.unit || ""}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <EditBatchDialog
                              batch={fullBatch}
                              fabric={fabric}
                              onSave={handleEditBatch}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBatch(batchItem.id);
                              }}
                              disabled={loadingState.actions}
                              aria-label="Delete batch"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No purchase history available for this fabric.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions Section */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Recent Stock Movements</h2>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Cost/Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(stockMovements) &&
                stockMovements.length > 0 ? (
                  stockMovements.map((transaction) => (
                    <TableRow key={transaction?.id}>
                      <TableCell>
                        {transaction?.date
                          ? formatDate(transaction.date)
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction?.type === "Sale"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {transaction?.type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          transaction?.type === "Sale"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {transaction?.type === "Sale" ? "-" : "+"}
                        {transaction?.quantity || 0} {fabric?.unit || ""}
                      </TableCell>
                      <TableCell className="text-right">
                        ৳{(transaction?.totalCost || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No recent stock movements recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sell Fabric Section */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Sell Stock</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sell fabric from your current stock (uses FIFO method)
              </p>
            </div>
            <SellFabricDialog
              fabric={{
                ...fabric,
                batches: batches,
                totalQuantity: totalQuantity,
              }}
              onSellFabric={handleSellFabric}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}