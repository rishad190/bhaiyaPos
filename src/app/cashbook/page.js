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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Cash In
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Cash Out
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Balance
              </TableHead>
              <TableHead className="whitespace-nowrap">Details</TableHead>
              <TableHead className="whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCash.map((day) => (
              <TableRow key={day.date}>
                <TableCell className="whitespace-nowrap">
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
                    {day.dailyCash.map((t) => (
                      <div
                        key={t.id}
                        className="text-sm flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-100 py-2"
                      >
                        <div className="mb-2 md:mb-0">
                          <span className="font-medium">{t.description}</span>
                          <div className="text-sm">
                            {t.cashIn > 0 && (
                              <span className="text-green-600">
                                ৳+{t.cashIn.toLocaleString()}
                              </span>
                            )}
                            {t.cashOut > 0 && (
                              <span className="text-red-600">
                                ৳-{t.cashOut.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2">
                          <EditCashTransactionDialog
                            transaction={t}
                            onEditTransaction={(updated) =>
                              handleEditTransaction(t.id, updated)
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 w-full md:w-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTransaction(t.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
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
  );
}
