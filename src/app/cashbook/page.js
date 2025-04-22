"use client";
import { useState, useEffect } from "react";
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
import { formatDate } from "@/lib/utils";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CashBookPage() {
  const {
    dailyCashTransactions,
    addDailyCashTransaction,
    updateDailyCashTransaction,
    deleteDailyCashTransaction, // Make sure this is included
  } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    // Keep YYYY-MM-DD format for the input field
    return today.toISOString().split("T")[0];
  });
  const [editingTransaction, setEditingTransaction] = useState(null);

  const handleAddTransaction = async (transaction) => {
    try {
      await addDailyCashTransaction(transaction);
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Failed to add transaction. Please try again.");
    }
  };

  const handleEditTransaction = async (transactionId, updatedData) => {
    try {
      await updateDailyCashTransaction(transactionId, updatedData);
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Failed to update transaction. Please try again.");
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    console.log(transactionId);

    try {
      await deleteDailyCashTransaction(transactionId);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  // Calculate daily totals for cash transactions only
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

  // Update financial summary calculation
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

  // Add this after your existing financials calculation
  const getMonthlyTotals = () => {
    const monthly = dailyCashTransactions.reduce((acc, transaction) => {
      const month = transaction.date.substring(0, 7); // Gets YYYY-MM format
      if (!acc[month]) {
        acc[month] = { cashIn: 0, cashOut: 0 };
      }
      acc[month].cashIn += transaction.cashIn || 0;
      acc[month].cashOut += transaction.cashOut || 0;
      return acc;
    }, {});

    // Convert to array and sort by month
    return Object.entries(monthly)
      .map(([month, totals]) => ({
        month,
        ...totals,
        balance: totals.cashIn - totals.cashOut,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  };

  // Filter transactions
  const filteredCash = dailyCash.filter((day) => {
    const matchesSearch = searchTerm
      ? day.dailyCash.some((t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : true;

    const matchesDate = dateFilter ? day.date === dateFilter : true;

    return matchesSearch && matchesDate;
  });

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
            <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </AddCashTransactionDialog>
          <Button
            onClick={() => window.print()}
            className="w-full md:w-auto"
            variant="outline"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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
                ৳{financials.totalCashIn.toLocaleString()}
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
                ৳{financials.totalCashOut.toLocaleString()}
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
                ৳{financials.availableCash.toLocaleString()}
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
                {getMonthlyTotals().map(
                  ({ month, cashIn, cashOut, balance }) => (
                    <TableRow key={month}>
                      <TableCell className="font-medium">
                        {new Date(month).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ৳{cashIn.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ৳{cashOut.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          balance >= 0 ? "text-blue-600" : "text-amber-600"
                        }`}
                      >
                        ৳{balance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )
                )}
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
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-9 w-full md:w-[200px]"
                />
              </div>
              {dateFilter && (
                <Button
                  variant="outline"
                  onClick={() => setDateFilter("")}
                  className="w-full md:w-auto"
                  size="icon"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear Date</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Tabs */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          <TabsTrigger value="in">Cash In</TabsTrigger>
          <TabsTrigger value="out">Cash Out</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Transactions Table */}
      <Card className="border-none shadow-md overflow-hidden">
        <div className="space-y-4">
          {/* Mobile View */}
          <div className="block md:hidden">
            {filteredCash.map((day) => (
              <div key={day.date} className="bg-white rounded-lg shadow mb-4">
                {/* Summary Card */}
                <div className="grid grid-cols-2 gap-2 p-4 border-b">
                  <div>
                    <div className="text-sm text-gray-500">Date</div>
                    <div className="font-medium">{formatDate(day.date)}</div>
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
                <div className="p-4 space-y-3">
                  {/* Cash In Transactions */}
                  {day.dailyCash
                    .filter((t) => t.cashIn > 0)
                    .map((t) => (
                      <div
                        key={`in-${t.id}`}
                        className="flex flex-col gap-2 py-2 border-b border-gray-100"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{t.description}</span>
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

                  {/* Cash Out Transactions */}
                  {day.dailyCash
                    .filter((t) => t.cashOut > 0)
                    .map((t) => (
                      <div
                        key={`out-${t.id}`}
                        className="flex flex-col gap-2 py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{t.description}</span>
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
          <div className="hidden md:block overflow-x-auto">
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
                    <TableCell className="space-y-3">
                      {/* Show all Cash In transactions first */}
                      {day.dailyCash
                        .filter((t) => t.cashIn > 0)
                        .map((t) => (
                          <div
                            key={`in-${t.id}`}
                            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
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

                      {/* Show all Cash Out transactions next */}
                      {day.dailyCash
                        .filter((t) => t.cashOut > 0)
                        .map((t) => (
                          <div
                            key={`out-${t.id}`}
                            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Keep your existing EditCashTransactionDialog */}
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
