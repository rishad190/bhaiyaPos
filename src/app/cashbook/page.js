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
import { EditTransactionDialog } from "@/components/EditTransactionDialog";

export default function CashBookPage() {
  const {
    dailyCashTransactions,
    transactions,
    customers,
    addDailyCashTransaction,
    updateDailyCashTransaction,
    deleteDailyCashTransaction,
    updateTransaction,
    deleteTransaction,
  } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const handleAddTransaction = (transaction) => {
    addDailyCashTransaction(transaction);
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

    try {
      await deleteDailyCashTransaction(transactionId);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  const handleEditCustomerTransaction = async (transactionId, updatedData) => {
    try {
      await updateTransaction(transactionId, updatedData);
    } catch (error) {
      console.error("Error updating customer transaction:", error);
      alert("Failed to update transaction. Please try again.");
    }
  };

  const handleDeleteCustomerTransaction = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      await deleteTransaction(transactionId);
    } catch (error) {
      console.error("Error deleting customer transaction:", error);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  // Calculate combined daily totals
  const dailySummary = [...dailyCashTransactions, ...transactions].reduce(
    (acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          cashIn: 0,
          cashOut: 0,
          balance: 0,
          transactions: [],
          dailyCash: [],
        };
      }

      // Handle different types of transactions
      if ("deposit" in item) {
        // This is a customer transaction
        acc[date].cashIn += item.deposit || 0;
        acc[date].cashOut += 0;
        acc[date].transactions.push({
          ...item,
          type: "transaction",
          description: `${item.memoNumber} - ${item.details}`,
        });
      } else {
        // This is a daily cash transaction
        acc[date].cashIn += item.cashIn || 0;
        acc[date].cashOut += item.cashOut || 0;
        acc[date].dailyCash.push({
          ...item,
          type: "dailyCash",
        });
      }

      acc[date].balance = acc[date].cashIn - acc[date].cashOut;
      return acc;
    },
    {}
  );

  const dailyCash = Object.values(dailySummary).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Update financial summary calculation
  const financials = {
    totalCashIn: Object.values(dailySummary).reduce(
      (sum, day) => sum + day.cashIn,
      0
    ),
    totalCashOut: Object.values(dailySummary).reduce(
      (sum, day) => sum + day.cashOut,
      0
    ),
    availableCash: Object.values(dailySummary).reduce(
      (sum, day) => sum + (day.cashIn - day.cashOut),
      0
    ),
    totalReceivables: transactions.reduce(
      (sum, t) => sum + ((t.total || 0) - (t.deposit || 0)),
      0
    ),
  };

  // Filter transactions
  const filteredCash = dailyCash.filter((day) => {
    const matchesSearch = searchTerm
      ? day.transactions.some((t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : true;

    const matchesDate = dateFilter ? day.date === dateFilter : true;

    return matchesSearch && matchesDate;
  });

  const getCustomerName = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "";
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Cash Book</h1>
        <div className="flex gap-4">
          <AddCashTransactionDialog onAddTransaction={handleAddTransaction} />
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      {/* Search and Filter Inputs */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border rounded-md"
        />
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
            className="text-sm"
          >
            Clear Date
          </Button>
        )}
      </div>

      {/* Add Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Cash In</h3>
          <p className="text-2xl font-bold text-green-600">
            ৳{financials.totalCashIn.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Cash Out</h3>
          <p className="text-2xl font-bold text-red-600">
            ৳{financials.totalCashOut.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Available Cash</h3>
          <p
            className={`text-2xl font-bold ${
              financials.availableCash >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ৳{financials.availableCash.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Receivables</h3>
          <p className="text-2xl font-bold text-blue-600">
            ৳{financials.totalReceivables.toLocaleString()}
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Cash In</TableHead>
            <TableHead className="text-right">Cash Out</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCash.map((day) => (
            <TableRow key={day.date}>
              <TableCell>{formatDate(day.date)}</TableCell>
              <TableCell className="text-right text-green-600">
                ৳{day.cashIn.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-red-600">
                ৳{day.cashOut.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-medium">
                ৳{day.balance.toLocaleString()}
              </TableCell>
              <TableCell>
                {/* Daily Cash Transactions */}
                {day.dailyCash.map((t) => (
                  <div
                    key={t.id}
                    className="text-sm flex items-center justify-between border-b border-gray-100 py-1"
                  >
                    <div>
                      <span className="font-medium">{t.description}</span>
                      {t.cashIn > 0 && ` ৳+${t.cashIn.toLocaleString()}`}
                      {t.cashOut > 0 && ` ৳-${t.cashOut.toLocaleString()}`}
                    </div>

                    <div className="flex gap-2">
                      <EditCashTransactionDialog
                        transaction={t}
                        onEditTransaction={(updated) =>
                          handleEditTransaction(t.id, updated)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
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

                {/* Customer Transactions */}
                {day.transactions.map((t) => (
                  <div
                    key={t.id}
                    className="text-sm flex items-center justify-between border-b border-gray-100 py-1 bg-gray-50"
                  >
                    <div>
                      <span className="font-medium text-blue-600">
                        {getCustomerName(t.customerId)}
                      </span>
                      <span className="ml-2">{t.description}</span>
                      <span className="ml-2 text-green-600">
                        ৳+{t.deposit?.toLocaleString() || 0}
                      </span>
                      {t.due > 0 && (
                        <span className="ml-2 text-red-600">
                          ৳-{t.due.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <EditTransactionDialog
                        transaction={t}
                        onEditTransaction={(updated) =>
                          handleEditCustomerTransaction(t.id, updated)
                        }
                        customerName={getCustomerName(t.customerId)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomerTransaction(t.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
