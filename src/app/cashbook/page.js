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
import { MoreVertical } from "lucide-react";

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
    <div className="p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Daily Cash Book</h1>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
          <AddCashTransactionDialog onAddTransaction={handleAddTransaction} />
          <Button onClick={() => window.print()} className="w-full md:w-auto">
            Print
          </Button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border rounded-md"
        />
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border rounded-md"
          />
          {dateFilter && (
            <Button
              variant="ghost"
              onClick={() => setDateFilter("")}
              className="w-full md:w-auto text-sm"
            >
              Clear Date
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Cash In</h3>
          <p className="text-xl md:text-2xl font-bold text-green-600">
            ৳{financials.totalCashIn.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Cash Out</h3>
          <p className="text-xl md:text-2xl font-bold text-red-600">
            ৳{financials.totalCashOut.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Available Cash</h3>
          <p
            className={`text-xl md:text-2xl font-bold ${
              financials.availableCash >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ৳{financials.availableCash.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
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
                          className="flex items-center justify-between py-2 border-b border-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{t.description}</span>
                            <span className="text-green-600 text-sm">
                              ৳+{t.cashIn.toLocaleString()}
                            </span>
                          </div>
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
                      ))}

                    {/* Show all Cash Out transactions next */}
                    {day.dailyCash
                      .filter((t) => t.cashOut > 0)
                      .map((t) => (
                        <div
                          key={`out-${t.id}`}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{t.description}</span>
                            <span className="text-red-600 text-sm">
                              ৳-{t.cashOut.toLocaleString()}
                            </span>
                          </div>
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
                      ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
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
