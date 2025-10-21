"use client";
import { useState, useEffect, useMemo } from "react";
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
import { CustomerSearch } from "@/components/CustomerSearch";
import { Pagination } from "@/components/Pagination";
import { TableSkeleton } from "@/components/LoadingState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useData } from "@/app/data-context";
import { useToast } from "@/hooks/use-toast";
import {
  CUSTOMER_CONSTANTS,
  ERROR_MESSAGES,
  PAGE_TITLES,
} from "@/lib/constants";
import { Plus } from "lucide-react";

export default function CustomerPage() {
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
  const { toast } = useToast();

  const [loadingState, setLoadingState] = useState({
    initial: true,
    customers: true,
    actions: false,
  });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(
    CUSTOMER_CONSTANTS.FILTER_OPTIONS.ALL
  );
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (customers) {
      setLoadingState((prev) => ({ ...prev, initial: false, customers: false }));
    }
  }, [customers]);

  const handleAddCustomer = async (customerData) => {
    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await addCustomer(customerData);
      setIsAddingCustomer(false);
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
    } catch (error) {
      console.error(ERROR_MESSAGES.ADD_ERROR, error);
      toast({
        title: "Error",
        description: ERROR_MESSAGES.ADD_ERROR,
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  const handleEditCustomer = async (customerId, updatedData) => {
    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await updateCustomer(customerId, updatedData);
      setEditingCustomer(null);
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    } catch (error) {
      console.error(ERROR_MESSAGES.UPDATE_ERROR, error);
      toast({
        title: "Error",
        description: ERROR_MESSAGES.UPDATE_ERROR,
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  const handleRowClick = (customerId) => {
    router.push(`/customers/${customerId}`);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm(ERROR_MESSAGES.DELETE_CONFIRMATION)) {
      setLoadingState((prev) => ({ ...prev, actions: true }));
      try {
        await deleteCustomer(customerId);
        toast({
          title: "Success",
          description: "Customer deleted successfully",
        });
      } catch (error) {
        console.error(ERROR_MESSAGES.DELETE_ERROR, error);
        toast({
          title: "Error",
          description: ERROR_MESSAGES.DELETE_ERROR,
          variant: "destructive",
        });
      } finally {
        setLoadingState((prev) => ({ ...prev, actions: false }));
      }
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter((customer) => {
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
  }, [customers, searchTerm, selectedFilter, getCustomerDue]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
          <AddCustomerDialog
            isOpen={isAddingCustomer}
            onClose={() => setIsAddingCustomer(false)}
            onAddCustomer={handleAddCustomer}
          >
            <Button
              className="w-full md:w-auto"
              disabled={loadingState.actions}
              onClick={() => setIsAddingCustomer(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </AddCustomerDialog>
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
