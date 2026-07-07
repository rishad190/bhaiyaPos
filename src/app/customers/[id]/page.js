"use client";
import { useState, useEffect, useMemo } from "react";
import logger from "@/utils/logger";
import { useParams, useRouter } from "next/navigation";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransactions, useAddTransaction, useUpdateTransaction, useDeleteTransaction } from "@/hooks/useTransactions";
import { useReminders, useAddReminder, useUpdateReminder, useDeleteReminder } from "@/hooks/useReminders";
import { ReminderDialog } from "@/components/customers/ReminderDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import { EditTransactionDialog } from "@/components/transactions/EditTransactionDialog";
import { LoadingState, TableSkeleton } from "@/components/shared/LoadingState";
import { DataErrorBoundary } from "@/components/shared/ErrorBoundary";
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
  Calendar,
  Clock,
  Edit,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
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
  
  const { data: customersData, isLoading: customersLoading } = useCustomers({ page: 1, limit: 10000 });
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({ page: 1, limit: 10000 });
  
  // Extract the actual arrays from the paginated response
  const customers = customersData?.data || [];
  const transactions = transactionsData?.data || [];
  const addTransactionMutation = useAddTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const [loadingState, setLoadingState] = useState({
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

  // Reminders state & mutations
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  
  const { data: reminders = [] } = useReminders();
  const addReminderMutation = useAddReminder();
  const updateReminderMutation = useUpdateReminder();
  const deleteReminderMutation = useDeleteReminder();

  const customerReminders = useMemo(() => {
    return reminders.filter((r) => r.customerId === params.id);
  }, [reminders, params.id]);

  const handleAddOrEditReminder = async (formData) => {
    if (selectedReminder) {
      await updateReminderMutation.mutateAsync({
        reminderId: selectedReminder.id,
        updatedData: formData,
      });
    } else {
      await addReminderMutation.mutateAsync(formData);
    }
  };

  const handleReminderStatusChange = async (reminder, isCompleted) => {
    await updateReminderMutation.mutateAsync({
      reminderId: reminder.id,
      updatedData: {
        status: isCompleted ? "completed" : "pending",
      },
    });
  };

  const handleDeleteReminder = async (reminderId) => {
    if (window.confirm("আপনি কি এই রিমাইন্ডারটি মুছে ফেলতে চান?")) {
      await deleteReminderMutation.mutateAsync(reminderId);
    }
  };

  const customer = Array.isArray(customers) ? customers.find((c) => c.id === params.id) : null;

  const sortedTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
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

  // Calculate financial summary for THIS customer only
  const customerFinancialSummary = useMemo(() => {
    if (!Array.isArray(transactions)) {
      return { totalBill: 0, totalDeposit: 0, totalDue: 0 };
    }

    // Filter transactions for this customer only
    const customerTransactions = transactions.filter(t => t.customerId === params.id);

    const totalBill = customerTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const totalDeposit = customerTransactions.reduce((sum, t) => sum + (Number(t.deposit) || 0), 0);
    const totalDue = totalBill - totalDeposit;

    return { totalBill, totalDeposit, totalDue };
  }, [transactions, params.id]);

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
      await addTransactionMutation.mutateAsync({
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
        await deleteTransactionMutation.mutateAsync(transactionId);
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
      await updateTransactionMutation.mutateAsync({
        transactionId,
        updatedData: {
          ...updatedData,
          customerId: params.id,
        },
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

  if (customersLoading || transactionsLoading) {
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
                      ৳{customerFinancialSummary.totalBill.toLocaleString()}
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
                      ৳{customerFinancialSummary.totalDeposit.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`border-none shadow-sm ${
                    customerFinancialSummary.totalDue > 0 ? "bg-red-50" : "bg-green-50"
                  }`}
                >
                  <CardHeader
                    className={`flex flex-row items-center justify-between space-y-0 pb-2`}
                  >
                    <CardTitle
                      className={`text-sm font-medium ${
                        customerFinancialSummary.totalDue > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      Total Due
                    </CardTitle>
                    <FileText
                      className={`h-4 w-4 ${
                        customerFinancialSummary.totalDue > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        customerFinancialSummary.totalDue > 0 ? "text-red-700" : "text-green-700"
                      }`}
                    >
                      ৳{customerFinancialSummary.totalDue.toLocaleString()}
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

        <Tabs defaultValue="transactions" className="w-full mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-1.5">
              Reminders
              {customerReminders.filter(r => r.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 min-w-5 flex items-center justify-center text-[10px] rounded-full">
                  {customerReminders.filter(r => r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="reminders" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-lg font-bold">Payment Reminders</h3>
                <p className="text-xs text-muted-foreground">Customer's check or cash payment schedules.</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedReminder(null);
                  setIsAddingReminder(true);
                }}
                className="flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Set Reminder
              </Button>
            </div>

            {customerReminders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customerReminders.map((reminder) => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isOverdue = reminder.dueDate < todayStr && reminder.status === "pending";
                  const isToday = reminder.dueDate === todayStr && reminder.status === "pending";
                  
                  return (
                    <Card
                      key={reminder.id}
                      className={`overflow-hidden border transition-all duration-300 ${
                        reminder.status === "completed"
                          ? "bg-gray-50/80 border-gray-200 opacity-80"
                          : isOverdue
                          ? "border-red-200 bg-red-50/10"
                          : isToday
                          ? "border-amber-200 bg-amber-50/10"
                          : "border-gray-200"
                      }`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge
                              variant={reminder.type === "check" ? "default" : "secondary"}
                              className={`uppercase text-[10px] px-2 py-0.5 ${
                                reminder.type === "check"
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                              }`}
                            >
                              {reminder.type === "check" ? "Check" : "Cash"}
                            </Badge>
                            {reminder.amount > 0 && (
                              <span className="font-bold text-base ml-2 text-foreground">
                                {formatCurrency(reminder.amount)}
                              </span>
                            )}
                          </div>
                          
                          {reminder.status === "completed" ? (
                            <Badge className="bg-green-100 text-green-700 border-none text-[10px]">
                              Completed
                            </Badge>
                          ) : isOverdue ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Overdue
                            </Badge>
                          ) : isToday ? (
                            <Badge className="bg-amber-100 text-amber-700 border-none text-[10px]">
                              Today
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700 border-none text-[10px]">
                              Pending
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded border border-dashed">
                          {reminder.title}
                        </div>

                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(reminder.dueDate)} ({reminder.dueTime})
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 cursor-pointer select-none text-foreground font-semibold">
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={reminder.status === "completed"}
                                onChange={(e) => handleReminderStatusChange(reminder, e.target.checked)}
                              />
                              Completed
                            </label>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedReminder(reminder);
                                setIsAddingReminder(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteReminder(reminder.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed p-6 text-center bg-gray-50/50">
                <CardContent className="flex flex-col items-center justify-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">No Reminders Scheduled</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      There are no scheduled payment reminders for this customer.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedReminder(null);
                      setIsAddingReminder(true);
                    }}
                    className="mt-2 text-xs"
                  >
                    Create Reminder
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Reminder Dialog */}
        <ReminderDialog
          open={isAddingReminder}
          onOpenChange={setIsAddingReminder}
          customerId={params.id}
          customerName={customer.name}
          customerPhone={customer.phone}
          reminder={selectedReminder}
          onSubmitReminder={handleAddOrEditReminder}
        />
      </div>
    </DataErrorBoundary>
  );
}
