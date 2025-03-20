"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";

import { useData } from "@/app/data-context";
import { EditCustomerDialog } from "@/components/EditCustomerDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Search } from "lucide-react";

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
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleAddCustomer = async (customerData) => {
    try {
      await addCustomer(customerData);
      setIsAddingCustomer(false);
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  };

  const handleEditCustomer = async (customerId, updatedData) => {
    try {
      await updateCustomer(customerId, updatedData);
      setEditingCustomer(null);
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  const handleRowClick = (customerId) => {
    router.push(`/customers/${customerId}`);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer(customerId);
      } catch (error) {
        console.error("Error deleting customer:", error);
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
      setIsLoading(false);
    }
  }, [mounted, customers]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (isLoading || !customers) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Customer Management
            </h1>
            <p className="text-muted-foreground">Loading customer data...</p>
          </div>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  const filteredCustomers = (customers || []).filter((customer) => {
    if (!customer) return false;

    const matchesSearch =
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);
    const currentDue = getCustomerDue(customer.id);
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "due" && currentDue > 0) ||
      (selectedFilter === "paid" && currentDue === 0);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Customer Management
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

      {/* Summary Cards */}
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <h3 className="text-sm text-muted-foreground">
                Total Bill Amount
              </h3>
              <div className="mt-2 flex items-center">
                <p className="text-2xl font-bold text-blue-600">
                  ৳{totals.totalBill.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <h3 className="text-sm text-muted-foreground">Total Deposit</h3>
              <div className="mt-2 flex items-center">
                <p className="text-2xl font-bold text-green-600">
                  ৳{totals.totalDeposit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <h3 className="text-sm text-muted-foreground">
                Total Due Amount
              </h3>
              <div className="mt-2 flex items-center">
                <p
                  className={`text-2xl font-bold ${
                    totals.totalDue > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  ৳{totals.totalDue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Search and Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Customers</CardTitle>
          <CardDescription>
            Find customers by name or phone number
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border rounded-md px-4 py-2 bg-background"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            <option value="all">All Customers</option>
            <option value="due">With Due Amount</option>
            <option value="paid">No Due Amount</option>
          </select>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            Showing all customers with their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">
                    Phone
                  </TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">
                    Address
                  </TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">
                    Store ID
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Due Amount
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const dueAmount = getCustomerDue(customer.id);
                  return (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(customer.id)}
                    >
                      <TableCell>
                        <div>
                          {customer.name}
                          <div className="md:hidden text-sm text-gray-500">
                            <div>{customer.phone}</div>
                            <div className="truncate max-w-[200px]">
                              {customer.address}
                            </div>
                            <div>{customer.storeId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {customer.phone}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div
                          className="truncate max-w-[200px]"
                          title={customer.address}
                        >
                          {customer.address}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {customer.storeId}
                      </TableCell>
                      <TableCell
                        className={`text-right whitespace-nowrap ${
                          dueAmount > 1000 ? "text-red-500" : ""
                        }`}
                      >
                        ৳{dueAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCustomer(customer);
                                }}
                              >
                                <span className="flex items-center">
                                  <span className="md:hidden mr-2">✏️</span>
                                  Edit
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustomer(customer.id);
                                }}
                              >
                                <span className="flex items-center">
                                  <span className="md:hidden mr-2">🗑️</span>
                                  Delete
                                </span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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
  );
}
