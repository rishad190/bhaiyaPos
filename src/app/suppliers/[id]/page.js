"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ref, onValue, push, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
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
import { AddSupplierTransactionDialog } from "@/components/AddSupplierTransactionDialog";
import { formatDate } from "@/lib/utils";
import { EditSupplierTransactionDialog } from "@/components/EditSupplierTransactionDialog";

export default function SupplierDetail() {
  const params = useParams();
  const router = useRouter();
  const { suppliers, updateSupplier, deleteSupplierTransaction } = useData();

  const [supplier, setSupplier] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Fetch supplier and transactions data
  useEffect(() => {
    const supplierRef = ref(db, `suppliers/${params.id}`);
    const transactionsRef = ref(db, "supplierTransactions");

    const unsubSupplier = onValue(supplierRef, (snapshot) => {
      if (snapshot.exists()) {
        setSupplier({ id: params.id, ...snapshot.val() });
      } else {
        router.push("/suppliers");
      }
    });

    const unsubTransactions = onValue(transactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const transactionsData = snapshot.val();
        const supplierTransactions = Object.entries(transactionsData)
          .map(([id, data]) => ({ id, ...data }))
          .filter((t) => t.supplierId === params.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(supplierTransactions);
      } else {
        setTransactions([]);
      }
    });

    return () => {
      unsubSupplier();
      unsubTransactions();
    };
  }, [params.id, router]);

  const handleAddTransaction = async (transaction) => {
    try {
      const transactionsRef = ref(db, "supplierTransactions");
      const newTransactionRef = push(transactionsRef);
      const newTransaction = {
        ...transaction,
        id: newTransactionRef.key,
        supplierId: params.id,
        createdAt: new Date().toISOString(),
      };
      console.log(newTransaction);

      await update(newTransactionRef, newTransaction);

      // Update supplier's total due
      const newTotalDue =
        (supplier.totalDue || 0) +
        (transaction.totalAmount - (transaction.paidAmount || 0));

      await updateSupplier(params.id, {
        totalDue: newTotalDue,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  };

  const handleDeleteTransaction = async (transactionId, amount, paidAmount) => {
    try {
      const dueAmount = amount - (paidAmount || 0);
      if (
        window.confirm(
          `Are you sure you want to delete this transaction?\nThis will reduce the total due by ৳${dueAmount.toLocaleString()}`
        )
      ) {
        await deleteSupplierTransaction(
          transactionId,
          params.id,
          amount,
          paidAmount
        );
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  const handleEditTransaction = async (transactionId, updatedData) => {
    try {
      const oldTransaction = transactions.find((t) => t.id === transactionId);
      const oldDue =
        oldTransaction.totalAmount - (oldTransaction.paidAmount || 0);
      const newDue = updatedData.totalAmount - (updatedData.paidAmount || 0);
      const dueDifference = newDue - oldDue;

      // Update transaction
      const transactionRef = ref(db, `supplierTransactions/${transactionId}`);
      await update(transactionRef, updatedData);

      // Update supplier's total due
      await updateSupplier(params.id, {
        totalDue: Math.max(0, (supplier.totalDue || 0) + dueDifference),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  };

  if (!supplier) {
    return <div>Loading...</div>;
  }

  // Replace the existing sortedTransactions with this:
  const transactionsWithBalance = transactions
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .reduce((acc, transaction) => {
      const previousBalance =
        acc.length > 0 ? acc[acc.length - 1].cumulativeBalance : 0;
      const currentDue =
        transaction.totalAmount - (transaction.paidAmount || 0);
      const currentBalance = previousBalance + currentDue;

      return [
        ...acc,
        {
          ...transaction,
          due: currentDue,
          cumulativeBalance: currentBalance,
        },
      ];
    }, []);

  return (
    <div className="p-4 md:p-8">
      {/* Header Card */}
      <div className="bg-gray-50 p-4 md:p-6 rounded-lg mb-4 md:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">{supplier.name}</h2>
            <p className="text-gray-600">{supplier.phone}</p>
            <p className="text-gray-600">{supplier.email}</p>
            <p className="text-gray-600">{supplier.address}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-base md:text-lg">Store ID: {supplier.storeId}</p>
            <p
              className={`text-xl md:text-2xl font-bold ${
                supplier.totalDue > 0 ? "text-red-500" : "text-green-500"
              }`}
            >
              Total Due: ৳{supplier.totalDue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full md:w-auto"
          >
            Back to Suppliers
          </Button>
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
            <Button variant="outline" className="w-full md:w-auto">
              Export CSV
            </Button>
            <Button variant="outline" className="w-full md:w-auto">
              Print
            </Button>
            <AddSupplierTransactionDialog
              supplierId={params.id}
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
              <TableHead className="whitespace-nowrap">
                Invoice Number
              </TableHead>
              <TableHead className="whitespace-nowrap">Details</TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Total Amount
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Paid Amount
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Due Amount
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Balance
              </TableHead>
              <TableHead className="whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsWithBalance.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {transaction.invoiceNumber}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {transaction.details}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  ৳{(transaction.totalAmount || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  ৳{(transaction.paidAmount || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap text-red-500">
                  ৳{(transaction.due || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap text-red-500">
                  ৳{transaction.cumulativeBalance.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col md:flex-row gap-2">
                    <EditSupplierTransactionDialog
                      transaction={transaction}
                      onSave={handleEditTransaction}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            "Are you sure you want to delete this transaction?"
                          )
                        ) {
                          handleDeleteTransaction(
                            transaction.id,
                            transaction.totalAmount,
                            transaction.paidAmount
                          );
                        }
                      }}
                    >
                      Delete
                    </Button>
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
