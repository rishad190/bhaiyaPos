"use client";
import { useParams } from "next/navigation";
import { useState } from "react";

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
import { useData } from "@/app/data-context";
import { formatDate } from "@/lib/utils";

export default function CustomerDetail() {
  const params = useParams();
  const {
    customers,
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
  } = useData();
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
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

  const handleEditTransaction = async (updatedTransaction) => {
    try {
      await updateTransaction(updatedTransaction);
      // Optional: Add success message
    } catch (error) {
      console.error("Error updating transaction:", error);
      // Optional: Show error message
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
    <div className="p-8">
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            <p className="text-gray-600">{customer.phone}</p>
            <p className="text-gray-600">{customer.email}</p>
          </div>
          <div className="text-right">
            <p className="text-lg">Store ID: {customer.storeId}</p>
            <p
              className={`text-2xl font-bold ${
                totalDue > 0 ? "text-red-500" : "text-green-500"
              }`}
            >
              Total Due: ₹{totalDue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <select
            className="border rounded-md px-4 py-2"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
          >
            <option value="all">All Stores</option>
            <option value="STORE1">Store 1</option>
            <option value="STORE2">Store 2</option>
          </select>
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              Print
            </Button>
            <AddTransactionDialog
              customerId={params.id}
              onAddTransaction={handleAddTransaction}
            />
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Memo Number</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Total Bill</TableHead>
            <TableHead className="text-right">Deposit</TableHead>
            <TableHead className="text-right">Due Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customerTransactionsWithBalance.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{formatDate(transaction.date)}</TableCell>
              <TableCell>{transaction.memoNumber}</TableCell>
              <TableCell>{transaction.details}</TableCell>
              <TableCell className="text-right">
                ₹{transaction.total.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                ₹{transaction.deposit.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                ₹{transaction.due.toLocaleString()}
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
                  transaction.cumulativeBalance > 0
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                ₹{transaction.cumulativeBalance.toLocaleString()}
              </TableCell>
              <TableCell>{transaction.storeId}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <EditTransactionDialog
                    transaction={transaction}
                    onEditTransaction={handleEditTransaction}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => handleDeleteTransaction(transaction.id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {customerTransactionsWithBalance.length} transactions
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <span className="font-semibold">Current Balance: </span>
          <span
            className={`font-bold ${
              totalDue > 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            ₹{totalDue.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
