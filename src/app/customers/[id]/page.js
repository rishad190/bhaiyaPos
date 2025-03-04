"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
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
    getCustomerDue,
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
    <div className="p-4 md:p-8">
      {/* Customer Info Card */}
      <div className="bg-gray-50 p-4 md:p-6 rounded-lg mb-4 md:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">{customer.name}</h2>
            <p className="text-gray-600">{customer.phone}</p>
            <p className="text-gray-600">{customer.email}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-base md:text-lg">Store ID: {customer.storeId}</p>
            <p
              className={`text-xl md:text-2xl font-bold ${
                totalDue > 0 ? "text-red-500" : "text-green-500"
              }`}
            >
              Total Due: ৳{totalDue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <select
            className="w-full md:w-auto border rounded-md px-4 py-2"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
          >
            <option value="all">All Stores</option>
            <option value="STORE1">Store 1</option>
            <option value="STORE2">Store 2</option>
          </select>
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="w-full md:w-auto"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="w-full md:w-auto"
            >
              Print
            </Button>
            <AddTransactionDialog
              customerId={params.id}
              onAddTransaction={handleAddTransaction}
            />
          </div>
        </div>
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
