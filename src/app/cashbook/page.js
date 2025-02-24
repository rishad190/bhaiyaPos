"use client";
import { useState } from "react";
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
import { calculateDailyCashBook } from "@/lib/calculations";
import { generateFinancialSummary } from "@/lib/reports";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { formatDate } from "@/lib/utils";
import { AddCashTransactionDialog } from "@/components/AddCashTransactionDialog";

export default function CashBookPage() {
  const { transactions } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [cashEntries, setCashEntries] = useState([]);

  const handleAddExpense = (expense) => {
    setCashEntries([...cashEntries, expense]);
  };

  const dailyCash = calculateDailyCashBook(transactions, cashEntries);
  const financials = generateFinancialSummary(transactions, cashEntries);

  const filteredCash = dailyCash.filter((day) => {
    const matchesSearch = searchTerm
      ? day.transactions.some((t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : true;

    const matchesDate = dateFilter ? day.date === dateFilter : true;

    return matchesSearch && matchesDate;
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Cash Book</h1>
        <div className="flex gap-4">
          <AddCashTransactionDialog onAddTransaction={handleAddExpense} />
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
            ₹{financials.totalCashIn.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Cash Out</h3>
          <p className="text-2xl font-bold text-red-600">
            ₹{financials.totalCashOut.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Available Cash</h3>
          <p
            className={`text-2xl font-bold ${
              financials.availableCash >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ₹{financials.availableCash.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Receivables</h3>
          <p className="text-2xl font-bold text-blue-600">
            ₹{financials.totalReceivables.toLocaleString()}
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCash.map((day) => (
            <TableRow key={day.date}>
              <TableCell>{formatDate(day.date)}</TableCell>
              <TableCell className="text-right text-green-600">
                ₹{day.cashIn.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-red-600">
                ₹{day.cashOut.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-medium">
                ₹{day.balance.toLocaleString()}
              </TableCell>
              <TableCell>
                {day.transactions.map((t) => (
                  <div key={t.id || t.description} className="text-sm">
                    {t.description}
                    {t.cashIn > 0 && ` ₹+${t.cashIn.toLocaleString()}`}
                    {t.cashOut > 0 && ` ₹-${t.cashOut.toLocaleString()}`}
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
