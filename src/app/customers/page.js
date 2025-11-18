"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import { EditCustomerDialog } from "@/components/EditCustomerDialog";
import { CustomerTable } from "@/components/CustomerTable";
import { CustomerSearch } from "@/components/CustomerSearch";
import { Pagination } from "@/components/Pagination";
import { TableSkeleton } from "@/components/LoadingState";
import { DataErrorBoundary } from "@/components/ErrorBoundary";
import { useCustomersWithDues } from "@/hooks/useCustomersWithDues";
import {
  useAddCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/useCustomers";
import {
  CUSTOMER_CONSTANTS,
  PAGE_TITLES,
} from "@/lib/constants";
import { Plus, DollarSign } from "lucide-react";
import { backupService } from "@/services/backupService";
import { formatDate } from "@/lib/utils";

export default function CustomerPage() {
  const router = useRouter();
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(
    CUSTOMER_CONSTANTS.FILTER_OPTIONS.ALL
  );
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  // Fetch customers with dues using React Query
  const {
    customers,
    financialSummary,
    isLoading,
    error,
    pagination,
  } = useCustomersWithDues({
    page: currentPage,
    limit: CUSTOMER_CONSTANTS.CUSTOMERS_PER_PAGE,
    searchTerm,
    filter: selectedFilter,
  });

  // Provide safe defaults
  const safeCustomers = customers || [];
  const safeFinancialSummary = financialSummary || {
    totalBill: 0,
    totalDeposit: 0,
    totalDue: 0,
  };
  const safePagination = pagination || {
    total: 0,
    page: 1,
    limit: CUSTOMER_CONSTANTS.CUSTOMERS_PER_PAGE,
  };

  // Mutations
  const addCustomerMutation = useAddCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  const handleAddCustomer = async (customerData) => {
    await addCustomerMutation.mutateAsync(customerData);
    setIsAddingCustomer(false);
  };

  const handleEditCustomer = async (customerId, updatedData) => {
    await updateCustomerMutation.mutateAsync({ customerId, updatedData });
    setEditingCustomer(null);
  };

  const handleRowClick = (customerId) => {
    router.push(`/customers/${customerId}`);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      await deleteCustomerMutation.mutateAsync(customerId);
    }
  };

  const handleExportCSV = () => {
    if (!safeCustomers || safeCustomers.length === 0) return;
    
    const dataToExport = safeCustomers.reduce((acc, customer) => {
      acc[customer.id] = customer;
      return acc;
    }, {});

    const csvContent = backupService.convertToCSV(dataToExport);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customers-${formatDate(new Date(), "YYYY-MM-DD")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper function to get customer due (already calculated in customers data)
  const getCustomerDue = (customerId) => {
    const customer = safeCustomers?.find(c => c.id === customerId);
    return customer?.due || 0;
  };

  // Sort customers
  const sortedCustomers = useMemo(() => {
    if (!safeCustomers) return [];
    
    const sortableCustomers = [...safeCustomers];

    if (sortConfig.key) {
      sortableCustomers.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handle due amount sorting
        if (sortConfig.key === "dueAmount") {
          aVal = a.due;
          bVal = b.due;
        }
        
        if (aVal < bVal) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableCustomers;
  }, [safeCustomers, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <DataErrorBoundary>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {PAGE_TITLES.CUSTOMER_MANAGEMENT}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your customers and their transactions.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button onClick={handleExportCSV} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
            <AddCustomerDialog
              isOpen={isAddingCustomer}
              onClose={() => setIsAddingCustomer(false)}
              onAddCustomer={handleAddCustomer}
            >
              <Button
                className="w-full md:w-auto"
                disabled={addCustomerMutation.isPending}
                onClick={() => setIsAddingCustomer(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </AddCustomerDialog>
          </div>
        </div>

        {/* Financial Summary */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Financial Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-100 border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-blue-800">
                    Total Bill Amount
                  </h3>
                  <DollarSign className="h-4 w-4 text-blue-800" />
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  ৳ {safeFinancialSummary.totalBill.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-100 border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-green-800">
                    Total Deposit
                  </h3>
                  <DollarSign className="h-4 w-4 text-green-800" />
                </div>
                <div className="text-2xl font-bold text-green-900">
                  ৳ {safeFinancialSummary.totalDeposit.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-100 border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-red-800">
                    Total Due Amount
                  </h3>
                  <DollarSign className="h-4 w-4 text-red-800" />
                </div>
                <div className="text-2xl font-bold text-red-900">
                  ৳ {safeFinancialSummary.totalDue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CustomerSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {isLoading ? (
                <TableSkeleton />
              ) : (
                <CustomerTable
                  customers={sortedCustomers}
                  getCustomerDue={getCustomerDue}
                  onRowClick={handleRowClick}
                  onEdit={setEditingCustomer}
                  onDelete={handleDeleteCustomer}
                  currentPage={currentPage}
                  customersPerPage={CUSTOMER_CONSTANTS.CUSTOMERS_PER_PAGE}
                  sortConfig={sortConfig}
                  requestSort={requestSort}
                />
              )}
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={safePagination.total}
              itemsPerPage={CUSTOMER_CONSTANTS.CUSTOMERS_PER_PAGE}
              onPageChange={setCurrentPage}
              className="mt-4"
            />
          </CardContent>
        </Card>

        {editingCustomer && (
          <EditCustomerDialog
            customer={editingCustomer}
            isOpen={!!editingCustomer}
            onClose={() => setEditingCustomer(null)}
            onEditCustomer={handleEditCustomer}
          />
        )}
      </div>
    </DataErrorBoundary>
  );
}
