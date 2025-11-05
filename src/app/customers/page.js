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

import { Plus, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

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
      setLoadingState((prev) => ({
        ...prev,
        initial: false,
        customers: false,
      }));
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

  const stats = useMemo(() => {
    if (!Array.isArray(customers) || !transactions) {
      return {
        totalBill: 0,
        totalDeposit: 0,
        totalDue: 0,
      };
    }

    const totals = customers.reduce(
      (acc, customer) => {
        const customerTransactions =
          transactions?.filter((t) => t.customerId === customer.id) || [];
        const customerTotal = customerTransactions.reduce(
          (sum, t) => sum + (Number(t.total) || 0),
          0
        );
        const customerDeposit = customerTransactions.reduce(
          (sum, t) => sum + (Number(t.deposit) || 0),
          0
        );
        const customerDue = getCustomerDue(customer.id);

        return {
          totalBill: acc.totalBill + customerTotal,
          totalDeposit: acc.totalDeposit + customerDeposit,
          totalDue: acc.totalDue + customerDue,
        };
      },
      { totalBill: 0, totalDeposit: 0, totalDue: 0 }
    );

    return totals;
  }, [customers, transactions, getCustomerDue]);

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
                  ৳ {stats.totalBill}
                </div>
                <div className="flex items-center mt-2 text-sm text-blue-800">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>12% from last month</span>
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
                  ৳ {stats.totalDeposit}
                </div>
                <div className="flex items-center mt-2 text-sm text-green-800">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>8% from last month</span>
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
                  ৳ {stats.totalDue}
                </div>
                <div className="flex items-center mt-2 text-sm text-red-800">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  <span>3% from last month</span>
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
