"use client";
import { useState, useEffect, useMemo } from "react";
import { useData } from "@/app/data-context";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AddCashTransactionDialog } from "@/components/AddCashTransactionDialog";
import { EditCashTransactionDialog } from "@/components/EditCashTransactionDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Search,
  Calendar,
  Printer,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Filter,
  RefreshCw,
  Download,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, exportToPDF, exportCashbookToPDF } from "@/utils/export";
import { Skeleton } from "@/components/ui/skeleton";

export default function CashBookPage() {
  const {
    dailyCashTransactions,
    addDailyCashTransaction,
    updateDailyCashTransaction,
    deleteDailyCashTransaction,
  } = useData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDayOfMonth.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loadingState, setLoadingState] = useState({
    initial: true,
    transactions: false,
    actions: false,
  });
  const [activeTab, setActiveTab] = useState("all");

  // Add useEffect to handle initial loading state
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Wait for dailyCashTransactions to be available
        if (dailyCashTransactions !== undefined) {
          setLoadingState((prev) => ({ ...prev, initial: false }));
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please refresh the page.",
          variant: "destructive",
        });
        setLoadingState((prev) => ({ ...prev, initial: false }));
      }
    };

    initializeData();
  }, [dailyCashTransactions, toast]);

  // Add debug logging
  useEffect(() => {
    console.log("Loading state:", loadingState);
    console.log("Daily cash transactions:", dailyCashTransactions);
  }, [loadingState, dailyCashTransactions]);

  // Memoize calculations for better performance
  const { dailyCash, financials, monthlyTotals } = useMemo(() => {
    const dailySummary = dailyCashTransactions.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          cashIn: 0,
          cashOut: 0,
          balance: 0,
          dailyCash: [],
        };
      }

      acc[date].cashIn += item.cashIn || 0;
      acc[date].cashOut += item.cashOut || 0;
      acc[date].balance = acc[date].cashIn - acc[date].cashOut;
      acc[date].dailyCash.push(item);

      return acc;
    }, {});

    const dailyCash = Object.values(dailySummary).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const financials = {
      totalCashIn: dailyCashTransactions.reduce(
        (sum, t) => sum + (t.cashIn || 0),
        0
      ),
      totalCashOut: dailyCashTransactions.reduce(
        (sum, t) => sum + (t.cashOut || 0),
        0
      ),
      availableCash: dailyCashTransactions.reduce(
        (sum, t) => sum + ((t.cashIn || 0) - (t.cashOut || 0)),
        0
      ),
    };

    const monthly = dailyCashTransactions.reduce((acc, transaction) => {
      const month = transaction.date.substring(0, 7);
      if (!acc[month]) {
        acc[month] = { cashIn: 0, cashOut: 0 };
      }
      acc[month].cashIn += transaction.cashIn || 0;
      acc[month].cashOut += transaction.cashOut || 0;
      return acc;
    }, {});

    const monthlyTotals = Object.entries(monthly)
      .map(([month, totals]) => ({
        month,
        ...totals,
        balance: totals.cashIn - totals.cashOut,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return { dailyCash, financials, monthlyTotals };
  }, [dailyCashTransactions]);

  // Filter transactions based on search term, date, and active tab
  const filteredCash = useMemo(() => {
    return dailyCash.filter((day) => {
      const matchesSearch = searchTerm
        ? day.dailyCash.some((t) =>
            t.description.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : true;

      const dayDate = new Date(day.date);
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Adjust for timezones by setting time to midnight
      dayDate.setUTCHours(0, 0, 0, 0);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(0, 0, 0, 0);

      const matchesDate = dayDate >= start && dayDate <= end;

      const matchesTab = (() => {
        switch (activeTab) {
          case "in":
            return day.cashIn > 0;
          case "out":
            return day.cashOut > 0;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesDate && matchesTab;
    });
  }, [dailyCash, searchTerm, startDate, endDate, activeTab]);

  const handleAddTransaction = async (transaction) => {
    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await addDailyCashTransaction(transaction);
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  const handleEditTransaction = async (transactionId, updatedData) => {
    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await updateDailyCashTransaction(transactionId, updatedData);
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setLoadingState((prev) => ({ ...prev, actions: true }));
    try {
      await deleteDailyCashTransaction(transactionId);
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, actions: false }));
    }
  };

  const handleExportCSV = () => {
    const data = dailyCashTransactions.map((t) => ({
      Date: formatDate(t.date),
      Description: t.description,
      "Cash In": t.cashIn || 0,
      "Cash Out": t.cashOut || 0,
      Balance: (t.cashIn || 0) - (t.cashOut || 0),
    }));
    exportToCSV(data, "cashbook-report.csv");
  };

  const handleExportPDF = () => {
    const data = {
      title: "Cash Book Report",
      date: new Date().toLocaleDateString(),
      transactions: dailyCashTransactions,
      summary: financials,
      dailyCash: dailyCash, // Include daily cash calculations
      startDate: startDate,
      endDate: endDate,
    };
    exportCashbookToPDF(data);
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

  const MonthlySummarySkeleton = () => (
    <Card className="mb-8 border-none shadow-md overflow-hidden">
      <CardContent className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const SearchFilterSkeleton = () => (
    <Card className="mb-8 border-none shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TableSkeleton = () => (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Mobile View Skeleton */}
          <div className="block md:hidden space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow">
                <div className="grid grid-cols-2 gap-2 p-4 border-b">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="divide-y divide-gray-100">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View Skeleton */}
          <div className="hidden md:block">
            <Skeleton className="h-10 w-full mb-4" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loadingState.initial) {
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

        {/* Monthly Summary */}
        <MonthlySummarySkeleton />

        {/* Search and Filter */}
        <SearchFilterSkeleton />

        {/* Transactions Table */}
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cash Book</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all cash transactions
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
          <AddCashTransactionDialog onAddTransaction={handleAddTransaction}>
            <Button
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white"
              disabled={loadingState.actions}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </AddCashTransactionDialog>
          <Button
            onClick={handleExportPDF}
            className="w-full md:w-auto"
            variant="outline"
            disabled={loadingState.actions}
          >
            <FileText className="mr-2 h-4 w-4" />
            {startDate && endDate
              ? `Export PDF (${formatDate(startDate)} - ${formatDate(endDate)})`
              : "Export PDF"}
          </Button>
          <Button
            onClick={handleExportCSV}
            className="w-full md:w-auto"
            variant="outline"
            disabled={loadingState.actions}
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
            <div className="bg-green-50 dark:bg-green-900/20 p-4 border-b border-green-100 dark:border-green-800">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                  Total Cash In
                </h3>
                <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="p-4">
              <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(financials.totalCashIn)}
              </p>
              <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                All time income
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-0">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-red-100 dark:border-red-800">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                  Total Cash Out
                </h3>
                <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="p-4">
              <p className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(financials.totalCashOut)}
              </p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                All time expenses
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-0">
            <div
              className={`${
                financials.availableCash >= 0
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800"
                  : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800"
              } p-4 border-b`}
            >
              <div className="flex justify-between items-center">
                <h3
                  className={`text-sm font-medium ${
                    financials.availableCash >= 0
                      ? "text-blue-800 dark:text-blue-300"
                      : "text-amber-800 dark:text-amber-300"
                  }`}
                >
                  Available Balance
                </h3>
                <RefreshCw
                  className={`h-4 w-4 ${
                    financials.availableCash >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                />
              </div>
            </div>
            <div className="p-4">
              <p
                className={`text-2xl md:text-3xl font-bold ${
                  financials.availableCash >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {financials.availableCash} Taka
              </p>
              <p
                className={`text-xs ${
                  financials.availableCash >= 0
                    ? "text-blue-600/70 dark:text-blue-400/70"
                    : "text-amber-600/70 dark:text-amber-400/70"
                } mt-1`}
              >
                Current balance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      <Card className="mb-8 border-none shadow-md overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Summary</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Cash In</TableHead>
                  <TableHead className="text-right">Cash Out</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyTotals.map(({ month, cashIn, cashOut, balance }) => (
                  <TableRow key={month}>
                    <TableCell className="font-medium">
                      {new Date(month).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(cashIn)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(cashOut)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        balance >= 0 ? "text-blue-600" : "text-amber-600"
                      }`}
                    >
                      ৳{balance.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Section */}
      <Card className="mb-8 border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 w-full md:w-[200px]"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 w-full md:w-[200px]"
                />
              </div>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="in">Cash In</TabsTrigger>
          <TabsTrigger value="out">Cash Out</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Transactions Table */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          {loadingState.transactions ? (
            <TableSkeleton />
          ) : (
            <div className="space-y-4">
              {/* Mobile View */}
              <div className="block md:hidden">
                {filteredCash.map((day) => (
                  <div
                    key={day.date}
                    className="bg-white rounded-lg shadow mb-4"
                  >
                    {/* Summary Card */}
                    <div className="grid grid-cols-2 gap-2 p-4 border-b">
                      <div>
                        <div className="text-sm text-gray-500">Date</div>
                        <div className="font-medium">
                          {formatDate(day.date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Balance</div>
                        <div className="font-medium">
                          ৳{day.balance.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Cash In</div>
                        <div className="text-green-600">
                          ৳{day.cashIn.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Cash Out</div>
                        <div className="text-red-600">
                          ৳{day.cashOut.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Mobile View - Transactions List */}
                    <div className="divide-y divide-gray-100">
                      {day.dailyCash
                        .filter((t) => t.cashIn > 0)
                        .map((t) => (
                          <div
                            key={`in-${t.id}`}
                            className="flex flex-col gap-2 py-2 px-4"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-medium">
                                {t.description}
                              </span>
                              <div className="flex gap-2 text-sm">
                                <span className="text-green-600">
                                  ৳+{t.cashIn.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
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
                                      setEditingTransaction(t);
                                    }}
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTransaction(t.id);
                                    }}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}

                      {day.dailyCash
                        .filter((t) => t.cashOut > 0)
                        .map((t) => (
                          <div
                            key={`out-${t.id}`}
                            className="flex flex-col gap-2 py-2 px-4"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-medium">
                                {t.description}
                              </span>
                              <div className="flex gap-2 text-sm">
                                <span className="text-red-600">
                                  ৳-{t.cashOut.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
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
                                      setEditingTransaction(t);
                                    }}
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTransaction(t.id);
                                    }}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap min-w-[100px]">
                        Date
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap min-w-[100px]">
                        Cash In
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap min-w-[100px]">
                        Cash Out
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap min-w-[100px]">
                        Balance
                      </TableHead>
                      <TableHead className="whitespace-nowrap min-w-[200px]">
                        Details
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCash.map((day) => (
                      <TableRow key={day.date} className="border-b">
                        <TableCell className="whitespace-nowrap font-medium">
                          {formatDate(day.date)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-green-600">
                          ৳{day.cashIn.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-red-600">
                          ৳{day.cashOut.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap font-medium">
                          ৳{day.balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {day.dailyCash
                              .filter((t) => t.cashIn > 0)
                              .map((t) => (
                                <div
                                  key={`in-${t.id}`}
                                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                    >
                                      In
                                    </Badge>
                                    <span className="font-medium">
                                      {t.description}
                                    </span>
                                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                                      ৳{t.cashIn.toLocaleString()}
                                    </span>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingTransaction(t);
                                        }}
                                      >
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-500"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteTransaction(t.id);
                                        }}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              ))}

                            {day.dailyCash
                              .filter((t) => t.cashOut > 0)
                              .map((t) => (
                                <div
                                  key={`out-${t.id}`}
                                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                                    >
                                      Out
                                    </Badge>
                                    <span className="font-medium">
                                      {t.description}
                                    </span>
                                    <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                                      ৳{t.cashOut.toLocaleString()}
                                    </span>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingTransaction(t);
                                        }}
                                      >
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-500"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteTransaction(t.id);
                                        }}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <EditCashTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => {
            if (!open) setEditingTransaction(null);
          }}
          onEditTransaction={(updated) => {
            handleEditTransaction(editingTransaction.id, updated);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
}
