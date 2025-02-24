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

import { useData } from "./data-context";

const AddSampleDataButton = () => {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const { addSampleData } = await import("@/utils/addSampleData");
        await addSampleData();
      }}
    >
      Add Sample Data (Dev Only)
    </Button>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { customers, loading, error, deleteCustomer, getCustomerDue } =
    useData();
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted) {
      console.log("Customers data:", customers);
    }
  }, [mounted, customers]);

  const handleAddCustomer = async (customerData) => {
    try {
      await addCustomer(customerData);
      setIsAddingCustomer(false);
    } catch (error) {
      console.error("Error adding customer:", error);
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

  if (loading || !mounted) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Error: {error}</p>
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

  if (!customers?.length) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">No customers found</p>
        <Button onClick={() => setIsAddingCustomer(true)}>
          Add Your First Customer
        </Button>
        <AddSampleDataButton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search customers..."
            className="w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="border rounded-md px-4 py-2 w-full md:w-auto"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            <option value="all">All Customers</option>
            <option value="due">With Due Amount</option>
            <option value="paid">No Due Amount</option>
          </select>
        </div>
        <AddCustomerDialog
          isOpen={isAddingCustomer}
          onClose={() => setIsAddingCustomer(false)}
          onAddCustomer={handleAddCustomer}
        />
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0">
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
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Edit customer", customer.id);
                        }}
                      >
                        <span className="hidden md:inline">Edit</span>
                        <span className="md:hidden">✏️</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomer(customer.id);
                        }}
                      >
                        <span className="hidden md:inline">Delete</span>
                        <span className="md:hidden">🗑️</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
