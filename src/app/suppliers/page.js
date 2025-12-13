"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSuppliersWithTransactions } from "@/hooks/useSuppliersWithTransactions";
import { useAddSupplier, useUpdateSupplier, useDeleteSupplier } from "@/hooks/useSuppliers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Kept for Skeleton usage if needed, or remove if skeleton moves

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddSupplierDialog } from "@/components/suppliers/AddSupplierDialog";
import { EditSupplierDialog } from "@/components/suppliers/EditSupplierDialog";
import { SupplierTable } from "@/components/suppliers/SupplierTable";
import { SupplierFilters } from "@/components/suppliers/SupplierFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, exportToPDF } from "@/utils/export";
import {
  MoreVertical,
  Search,
  Plus,
  Download,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { DataErrorBoundary } from "@/components/shared/ErrorBoundary";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logger from "@/utils/logger";

export default function SuppliersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Fetch suppliers with React Query
  const {
    suppliers,
    financialSummary: totals,
    isLoading,
    error,
  } = useSuppliersWithTransactions({
    page: 1,
    limit: 1000, // Get all suppliers for now
    searchTerm,
  });

  // Mutations
  const addSupplierMutation = useAddSupplier();
  const updateSupplierMutation = useUpdateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();

  // Filter suppliers locally
  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone.includes(searchTerm)
    );
  }, [suppliers, searchTerm]);

  const handleAddSupplier = async (supplierData) => {
    try {
      await addSupplierMutation.mutateAsync(supplierData);
    } catch (error) {
      logger.error("Error adding supplier:", error);
    }
  };

  const handleDeleteSupplier = async (e, supplierId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this supplier?")) {
      return;
    }

    try {
      await deleteSupplierMutation.mutateAsync(supplierId);
    } catch (error) {
      logger.error("Error deleting supplier:", error);
    }
  };

  const handleEditSupplier = async (supplierId, updatedData) => {
    try {
      await updateSupplierMutation.mutateAsync({ supplierId, updatedData });
      setEditingSupplier(null);
    } catch (error) {
      logger.error("Error updating supplier:", error);
    }
  };

  const handleExportCSV = () => {
    const data = filteredSuppliers.map((s) => ({
      Name: s.name,
      Phone: s.phone,
      Email: s.email,
      Address: s.address,
      Store: s.storeId,
      "Total Due": s.totalDue || 0,
    }));
    exportToCSV(data, "suppliers-report.csv");
  };

  const handleExportPDF = () => {
    const data = {
      title: "Suppliers Report",
      date: new Date().toLocaleDateString(),
      suppliers: filteredSuppliers,
      summary: totals,
    };
    exportToPDF(data, "suppliers-report.pdf");
  };

  // Loading skeleton components
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

  const TableSkeleton = () => (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>

        {/* Table */}
        <TableSkeleton />
      </div>
    );
  }

  return (
    <DataErrorBoundary>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all supplier information
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
          <AddSupplierDialog onAddSupplier={handleAddSupplier}>
            <Button
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white"
              disabled={addSupplierMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </AddSupplierDialog>
          <Button
            onClick={handleExportPDF}
            className="w-full md:w-auto"
            variant="outline"
            disabled={isLoading}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button
            onClick={handleExportCSV}
            className="w-full md:w-auto"
            variant="outline"
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-0">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-100 dark:border-blue-800">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Total Amount
                </h3>
                <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="p-4">
              <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                ৳{totals.totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                All time transactions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-0">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 border-b border-green-100 dark:border-green-800">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                  Total Paid
                </h3>
                <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="p-4">
              <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                ৳{totals.paidAmount.toLocaleString()}
              </p>
              <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                All time payments
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-0">
            <div
              className={`${
                totals.dueAmount > 0
                  ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
                  : "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800"
              } p-4 border-b`}
            >
              <div className="flex justify-between items-center">
                <h3
                  className={`text-sm font-medium ${
                    totals.dueAmount > 0
                      ? "text-red-800 dark:text-red-300"
                      : "text-green-800 dark:text-green-300"
                  }`}
                >
                  Total Due
                </h3>
                <RefreshCw
                  className={`h-4 w-4 ${
                    totals.dueAmount > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                />
              </div>
            </div>
            <div className="p-4">
              <p
                className={`text-2xl md:text-3xl font-bold ${
                  totals.dueAmount > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                ৳{totals.dueAmount.toLocaleString()}
              </p>
              <p
                className={`text-xs ${
                  totals.dueAmount > 0
                    ? "text-red-600/70 dark:text-red-400/70"
                    : "text-green-600/70 dark:text-green-400/70"
                } mt-1`}
              >
                Current balance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Section */}
      <SupplierFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Suppliers Table */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <SupplierTable
            suppliers={filteredSuppliers}
            onEdit={(supplier) => {
              setEditingSupplier(supplier);
            }}
            onDelete={handleDeleteSupplier}
          />
        </CardContent>
      </Card>

      {/* Edit Supplier Dialog */}
      {editingSupplier && (
        <EditSupplierDialog
          supplier={editingSupplier}
          isOpen={!!editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onEditSupplier={handleEditSupplier}
        />
      )}
    </div>
    </DataErrorBoundary>
  );
}
