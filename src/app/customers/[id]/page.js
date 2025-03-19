"use client";
import { useParams, useRouter } from "next/navigation";

import { useState } from "react";
import {
  MoreVertical,
  ArrowLeft,
  ArrowDownToLine,
  Phone,
  Mail,
  Store,
  DollarSign,
  CreditCard,
  FileText,
  Printer,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { exportToCSV } from "@/utils/export";
import { exportToPDF } from "@/utils/export";
import { useData } from "@/app/data-context";
import { formatDate } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const {
    customers,
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    getCustomerDue,
  } = useData();

  const [storeFilter, setStoreFilter] = useState("all");

  const customer = customers.find((c) => c.id === params.id);

  // Calculate cumulative balances for transactions
  const customerTransactionsWithBalance = transactions
    .filter((t) => t.customerId === params.id)
    .filter((t) => storeFilter === "all" || t.storeId === storeFilter)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .reduce((acc, transaction) => {
      const previousBalance =
        acc.length > 0 ? acc[acc.length - 1].cumulativeBalance : 0;
      const currentBalance = previousBalance + transaction.due;

      return [
        ...acc,
        {
          ...transaction,
          cumulativeBalance: currentBalance,
        },
      ];
    }, []);

  const totalDue =
    customerTransactionsWithBalance.length > 0
      ? customerTransactionsWithBalance[
          customerTransactionsWithBalance.length - 1
        ].cumulativeBalance
      : 0;

  const handleAddTransaction = async (transactionData) => {
    try {
      await addTransaction(transactionData);
      // Optional: Add success message or refresh data
    } catch (error) {
      console.error("Error adding transaction:", error);
      // Optional: Show error message to user
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(transactionId);
        // Optional: Show success message
      } catch (error) {
        console.error("Error deleting transaction:", error);
        // Optional: Show error message
      }
    }
  };

  const handleEditTransaction = async (transactionId, updatedData) => {
    try {
      // Add basic validation checks
      if (!transactionId) {
        throw new Error("Transaction ID is required");
      }

      // Trim and validate memo number first
      console.log(transactionId, updatedData);

      const trimmedMemo = updatedData.memoNumber?.trim();

      // Parse numeric values with validation
      const totalAmount = parseFloat(updatedData.total);
      const depositAmount = parseFloat(updatedData.deposit);

      // Prepare processed data with validated values
      const processedData = {
        ...updatedData,
        memoNumber: trimmedMemo,
        total: totalAmount,
        deposit: depositAmount,
        due: totalAmount - depositAmount,
        customerId: params.id,
        id: transactionId,
        updatedAt: new Date().toISOString(),
      };

      // Update transaction with validated data

      await updateTransaction(transactionId, processedData);
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert(error.message || "Failed to update transaction. Please try again.");
    }
  };

  const handleExportCSV = () => {
    const data = customerTransactionsWithBalance.map((t) => ({
      Date: formatDate(t.date),
      Memo: t.memoNumber,
      Details: t.details,
      Total: `${t.total.toLocaleString()}`,
      Deposit: `${t.deposit.toLocaleString()}`,
      Due: `${t.due.toLocaleString()}`,
      Balance: `${t.cumulativeBalance.toLocaleString()}`,
      Store: t.storeId,
    }));
    exportToCSV(data, `${customer?.name}-transactions-${params.id}.csv`);
  };

  if (!customer) {
    return <div className="p-8">Customer not found</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              Customer Details
            </h1>
          </div>
          <p className="text-muted-foreground">
            View and manage customer information and transactions
          </p>
        </div>
      </div>

      {/* Customer Info and Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Customer Info Card */}
        <Card className="lg:col-span-1 overflow-hidden border-none shadow-md">
          <CardHeader className="bg-primary text-primary-foreground pb-4">
            <div className="flex justify-between items-start">
              <CardTitle>Customer Profile</CardTitle>
              <Badge
                variant="secondary"
                className="bg-primary-foreground text-primary"
              >
                ID: {params.id}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-xl">
                  {customer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-center">
                {customer.name}
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span>Store ID: {customer.storeId}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary Card */}
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader className="bg-muted pb-4">
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>
              Overview of customers financial status
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      Total Bill
                    </span>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    ৳
                    {customerTransactionsWithBalance
                      .reduce((sum, t) => sum + (t.total || 0), 0)
                      .toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-green-600">
                      Total Deposit
                    </span>
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    ৳
                    {customerTransactionsWithBalance
                      .reduce((sum, t) => sum + (t.deposit || 0), 0)
                      .toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${
                  totalDue > 0 ? "bg-red-50" : "bg-green-50"
                } border-none shadow-sm`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`text-sm font-medium ${
                        totalDue > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      Total Due
                    </span>
                    <FileText
                      className={`h-4 w-4 ${
                        totalDue > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    />
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      totalDue > 0 ? "text-red-700" : "text-green-700"
                    }`}
                  >
                    ৳{totalDue.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t">
              <select
                className="w-full sm:w-[180px] border rounded-md px-4 py-2"
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
              >
                <option value="all">All Stores</option>
                <option value="STORE1">Store 1</option>
                <option value="STORE2">Store 2</option>
              </select>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() =>
                    exportToPDF(
                      customer,
                      customerTransactionsWithBalance,
                      "customer"
                    )
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>

                <AddTransactionDialog
                  customerId={params.id}
                  onAddTransaction={handleAddTransaction}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead className="whitespace-nowrap">Memo Number</TableHead>
              <TableHead className="whitespace-nowrap">Details</TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Total Bill
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Deposit
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Due Amount
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Balance
              </TableHead>
              <TableHead className="whitespace-nowrap">Store</TableHead>
              <TableHead className="whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customerTransactionsWithBalance.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {transaction.memoNumber}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {transaction.details}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  ৳{transaction.total.toLocaleString()}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  ৳{transaction.deposit.toLocaleString()}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  ৳{transaction.due.toLocaleString()}
                </TableCell>
                <TableCell
                  className={`text-right font-medium whitespace-nowrap ${
                    transaction.cumulativeBalance > 0
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                >
                  ৳{transaction.cumulativeBalance.toLocaleString()}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {transaction.storeId}
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
                        <DropdownMenuItem asChild>
                          <EditTransactionDialog
                            transaction={transaction}
                            onEditTransaction={(updatedData) =>
                              handleEditTransaction(transaction.id, updatedData)
                            }
                          />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete this transaction?"
                              )
                            ) {
                              handleDeleteTransaction(transaction.id);
                            }
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer Section */}
      <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-sm text-gray-500">
          Showing {customerTransactionsWithBalance.length} transactions
        </div>
        <div className="bg-gray-100 p-4 rounded-lg w-full md:w-auto">
          <span className="font-semibold">Current Balance: </span>
          <span
            className={`font-bold ${
              totalDue > 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            ৳{totalDue.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
