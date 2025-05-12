"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import { EditCustomerDialog } from "@/components/EditCustomerDialog";
import { CustomerTable } from "@/components/CustomerTable";
import { SummaryCards } from "@/components/SummaryCards";
import { CustomerSearch } from "@/components/CustomerSearch";
import { Pagination } from "@/components/Pagination";
import { LoadingState, TableSkeleton } from "@/components/LoadingState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useData } from "@/app/data-context";
import {
  CUSTOMER_CONSTANTS,
  ERROR_MESSAGES,
  PAGE_TITLES,
} from "@/lib/constants";

export default function Dashboard() {
  const router = useRouter();
  const {
    customers,
    transactions,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerDue,
  } = useData();

  const [loadingState, setLoadingState] = useState({
    initial: true,
    customers: true,
    transactions: true,
  });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(
    CUSTOMER_CONSTANTS.FILTER_OPTIONS.ALL
  );
  const [mounted, setMounted] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleAddCustomer = async (customerData) => {
    try {
      await addCustomer(customerData);
      setIsAddingCustomer(false);
    } catch (error) {
      console.error(ERROR_MESSAGES.ADD_ERROR, error);
    }
  };

  const handleEditCustomer = async (customerId, updatedData) => {
    try {
      await updateCustomer(customerId, updatedData);
      setEditingCustomer(null);
    } catch (error) {
      console.error(ERROR_MESSAGES.UPDATE_ERROR, error);
    }
  };

  const handleRowClick = (customerId) => {
    router.push(`/customers/${customerId}`);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm(ERROR_MESSAGES.DELETE_CONFIRMATION)) {
      try {
        await deleteCustomer(customerId);
      } catch (error) {
        console.error(ERROR_MESSAGES.DELETE_ERROR, error);
      }
    }
  };

  // Calculate totals
  const totals = (customers || []).reduce(
    (acc, customer) => {
      const customerTransactions =
        transactions?.filter((t) => t.customerId === customer.id) || [];
      return {
        totalBill:
          acc.totalBill +
          customerTransactions.reduce((sum, t) => sum + (t.total || 0), 0),
        totalDeposit:
          acc.totalDeposit +
          customerTransactions.reduce((sum, t) => sum + (t.deposit || 0), 0),
        totalDue: acc.totalDue + getCustomerDue(customer.id),
      };
    },
    { totalBill: 0, totalDeposit: 0, totalDue: 0 }
  );

  useEffect(() => {
    setMounted(true);
    if (mounted && customers) {
      setLoadingState((prev) => ({ ...prev, initial: false }));
    }
  }, [mounted, customers]);

  useEffect(() => {
    if (customers && transactions) {
      setLoadingState((prev) => ({
        ...prev,
        customers: false,
        transactions: false,
      }));
    }
  }, [customers, transactions]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (loadingState.initial || !customers) {
    return (
      <LoadingState
        title={PAGE_TITLES.CUSTOMER_MANAGEMENT}
        description="Loading customer data..."
      />
    );
  }

  const filteredCustomers = (customers || []).filter((customer) => {
    if (!customer) return false;

    const matchesSearch =
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);
    const currentDue = getCustomerDue(customer.id);
    const matchesFilter =
      selectedFilter === CUSTOMER_CONSTANTS.FILTER_OPTIONS.ALL ||
      (selectedFilter === CUSTOMER_CONSTANTS.FILTER_OPTIONS.DUE &&
        currentDue > 0) ||
      (selectedFilter === CUSTOMER_CONSTANTS.FILTER_OPTIONS.PAID &&
        currentDue === 0);
    return matchesSearch && matchesFilter;
  });

  return (
    <ErrorBoundary>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {PAGE_TITLES.CUSTOMER_MANAGEMENT}
            </h1>
            <p className="text-muted-foreground">
              Manage your customer profiles and track their transactions
            </p>
          </div>
          <AddCustomerDialog
            isOpen={isAddingCustomer}
            onClose={() => setIsAddingCustomer(false)}
            onAddCustomer={handleAddCustomer}
          />
        </div>

        <SummaryCards totals={totals} />

        <CustomerSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />

        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <CardDescription>
              Showing all customers with their details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {loadingState.customers ? (
                <TableSkeleton />
              ) : (
                <CustomerTable
                  customers={filteredCustomers}
                  getCustomerDue={getCustomerDue}
                  onRowClick={handleRowClick}
                  onEdit={setEditingCustomer}
                  onDelete={handleDeleteCustomer}
                  currentPage={currentPage}
                  customersPerPage={CUSTOMER_CONSTANTS.CUSTOMERS_PER_PAGE}
                />
              )}
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredCustomers.length}
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
    </ErrorBoundary>
  );
}
