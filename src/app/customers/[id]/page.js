"use client";
import { useState, useEffect, useMemo } from "react";
import logger from "@/utils/logger";
import { useParams, useRouter } from "next/navigation";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransactions, useAddTransaction, useUpdateTransaction, useDeleteTransaction } from "@/hooks/useTransactions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { LoadingState, TableSkeleton } from "@/components/LoadingState";
import { DataErrorBoundary } from "@/components/ErrorBoundary";
import {
  ArrowLeft,
  Phone,
  Mail,
  Store,
  DollarSign,
  CreditCard,
  FileText,
  MoreVertical,
  ArrowUpDown,
  Plus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { exportToCSV, exportToPDF } from "@/utils/export";
import { TRANSACTION_CONSTANTS, ERROR_MESSAGES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const { data: customers } = useCustomers();
  const { data: transactions } = useTransactions();
  const addTransactionMutation = useAddTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const [loadingState, setLoadingState] = useState({
    initial: true,
    transactions: true,
    action: false,
  });
  const [storeFilter, setStoreFilter] = useState(
    TRANSACTION_CONSTANTS.STORE_OPTIONS.ALL
  );
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "asc",
  });

  const customer = customers?.find((c) => c.id === params.id);

  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    let sortableItems = [
      ...transactions.filter((t) => t.customerId === params.id),
    ];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [transactions, params.id, sortConfig]);

  const customerTransactionsWithBalance = useMemo(() => {
    return sortedTransactions
      .filter(
        (t) =>
          storeFilter === TRANSACTION_CONSTANTS.STORE_OPTIONS.ALL ||
          t.storeId === storeFilter
      )
      .reduce((acc, transaction) => {
        const previousBalance =
          acc.length > 0 ? acc[acc.length - 1].cumulativeBalance : 0;
        return [
          ...acc,
          {
            ...transaction,
            cumulativeBalance: previousBalance + (transaction.due || 0),
          },
        ];
      }, []);
  }, [sortedTransactions, storeFilter]);

  useEffect(() => {
    if (customer && transactions) {
      setLoadingState((prev) => ({
        ...prev,
        initial: false,
        transactions: false,
      }));
    }
  }, [customer, transactions]);

  const handleAddTransaction = async (transactionData) => {
    try {
      setLoadingState((prev) => ({ ...prev, action: true }));
      await addTransaction({
        ...transactionData,
        customerId: params.id,
      });
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      setIsAddingTransaction(false);
    } catch (error) {
      logger.error(ERROR_MESSAGES.ADD_ERROR, error);
      toast({
        title: "Error",
        description: ERROR_MESSAGES.ADD_ERROR,
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, action: false }));
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm(ERROR_MESSAGES.DELETE_CONFIRMATION)) {
      try {
        setLoadingState((prev) => ({ ...prev, action: true }));
        await deleteTransaction(transactionId);
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
        });
      } catch (error) {
        logger.error(ERROR_MESSAGES.DELETE_ERROR, error);
        toast({
          title: "Error",
          description: ERROR_MESSAGES.DELETE_ERROR,
          variant: "destructive",
        });
      } finally {
        setLoadingState((prev) => ({ ...prev, action: false }));
      }
    }
  };

  const handleEditTransaction = async (transactionId, updatedData) => {
    try {
      setLoadingState((prev) => ({ ...prev, action: true }));
      await updateTransaction(transactionId, {
        ...updatedData,
        customerId: params.id,
      });
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    } catch (error) {
      logger.error(ERROR_MESSAGES.UPDATE_ERROR, error);
      toast({
        title: "Error",
        description: error.message || ERROR_MESSAGES.UPDATE_ERROR,
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, action: false }));
    }
  };

  const handleExportCSV = () => {
    const data = customerTransactionsWithBalance.map((t) => ({
      Date: formatDate(t.date),
      Memo: t.memoNumber,
      Details: t.details,
      Total: t.total.toLocaleString(),
      Deposit: t.deposit.toLocaleString(),
      Due: t.due.toLocaleString(),
      Balance: t.cumulativeBalance.toLocaleString(),
      Store: t.storeId,
    }));
    exportToCSV(data, `${customer?.name}-transactions-${params.id}.csv`);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  if (loadingState.initial) {
    return (
      <LoadingState
        title="Customer Details"
        description="Loading customer information..."
      />
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Customer not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }

  const totalDue =
    customerTransactionsWithBalance.length > 0
      ? customerTransactionsWithBalance[
          customerTransactionsWithBalance.length - 1
        ].cumulativeBalance
      : 0;

  return (
    <DataErrorBoundary>
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
                Overview of customer&apos;s financial status
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-600">
                      Total Bill
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-700">
                      ৳
                      {customerTransactionsWithBalance
                        .reduce((sum, t) => sum + (t.total || 0), 0)
                        .toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-600">
                      Total Deposit
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700">
                      ৳
                      {customerTransactionsWithBalance
                        .reduce((sum, t) => sum + (t.deposit || 0), 0)
                        .toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`border-none shadow-sm ${
                    totalDue > 0 ? "bg-red-50" : "bg-green-50"
                  }`}
                >
                  <CardHeader
                    className={`flex flex-row items-center justify-between space-y-0 pb-2`}
                  >
                    <CardTitle
                      className={`text-sm font-medium ${
                        totalDue > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      Total Due
                    </CardTitle>
                    <FileText
                      className={`h-4 w-4 ${
                        totalDue > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    />
                  </CardHeader>
                  <CardContent>
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
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by store..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TRANSACTION_CONSTANTS.STORE_OPTIONS.ALL}>
                      All Stores
                    </SelectItem>
                    <SelectItem
                      value={TRANSACTION_CONSTANTS.STORE_OPTIONS.STORE1}
                    >
                      Store 1
                    </SelectItem>
                    <SelectItem
                      value={TRANSACTION_CONSTANTS.STORE_OPTIONS.STORE2}
                    >
                      Store 2
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    disabled={loadingState.action}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      exportToPDF(
                        customer,
                        customerTransactionsWithBalance,
                        "customer"
                      )
                    }
                    disabled={loadingState.action}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <AddTransactionDialog
                    open={isAddingTransaction}
                    onOpenChange={setIsAddingTransaction}
                    customerId={params.id}
                    onAddTransaction={handleAddTransaction}
                    isLoading={loadingState.action}
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
                <TableHead
                  className="whitespace-nowrap cursor-pointer"
                  onClick={() => requestSort("date")}
                >
                  Date <ArrowUpDown className="inline-block ml-2 h-4 w-4" />
                </TableHead>
                <TableHead
                  className="whitespace-nowrap cursor-pointer"
                  onClick={() => requestSort("memoNumber")}
                >
                  Memo Number{" "}
                  <ArrowUpDown className="inline-block ml-2 h-4 w-4" />
                </TableHead>
                <TableHead className="whitespace-nowrap">Details</TableHead>
                <TableHead
                  className="text-right whitespace-nowrap cursor-pointer"
                  onClick={() => requestSort("total")}
                >
                  Total Bill{" "}
                  <ArrowUpDown className="inline-block ml-2 h-4 w-4" />
                </TableHead>
                <TableHead
                  className="text-right whitespace-nowrap cursor-pointer"
                  onClick={() => requestSort("deposit")}
                >
                  Deposit <ArrowUpDown className="inline-block ml-2 h-4 w-4" />
                </TableHead>
                <TableHead
                  className="text-right whitespace-nowrap cursor-pointer"
                  onClick={() => requestSort("due")}
                >
                  Due Amount{" "}
                  <ArrowUpDown className="inline-block ml-2 h-4 w-4" />
                </TableHead>
                <TableHead
                  className="text-right whitespace-nowrap cursor-pointer"
                  onClick={() => requestSort("cumulativeBalance")}
                >
                  Balance <ArrowUpDown className="inline-block ml-2 h-4 w-4" />
                </TableHead>
                <TableHead className="whitespace-nowrap">Store</TableHead>
                <TableHead className="whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingState.transactions ? (
                <TableSkeleton />
              ) : (
                customerTransactionsWithBalance.map((transaction) => (
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
                          <DropdownMenuContent
                            align="end"
                            className="w-[160px]"
                          >
                            <DropdownMenuItem asChild>
                              <EditTransactionDialog
                                transaction={transaction}
                                onEditTransaction={(updatedData) =>
                                  handleEditTransaction(
                                    transaction.id,
                                    updatedData
                                  )
                                }
                                isLoading={loadingState.action}
                              />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-500 focus:bg-red-50"
                              onClick={() =>
                                handleDeleteTransaction(transaction.id)
                              }
                              disabled={loadingState.action}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Section */}
        <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-sm text-gray-500">
            Total Transactions: {customerTransactionsWithBalance.length}
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
    </DataErrorBoundary>
  );
}
