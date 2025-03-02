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

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

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
      await deleteSupplierTransaction(
        transactionId,
        params.id,
        amount,
        paidAmount
      );
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  };

  if (!supplier) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">{supplier.name}</h2>
            <p className="text-gray-600">{supplier.phone}</p>
            <p className="text-gray-600">{supplier.email}</p>
            <p className="text-gray-600">{supplier.address}</p>
          </div>
          <div className="text-right">
            <p className="text-lg">Store ID: {supplier.storeId}</p>
            <p
              className={`text-2xl font-bold ${
                supplier.totalDue > 0 ? "text-red-500" : "text-green-500"
              }`}
            >
              Total Due: ৳{supplier.totalDue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => router.back()}>
            Back to Suppliers
          </Button>
          <div className="flex gap-4">
            <Button variant="outline">Export CSV</Button>
            <Button variant="outline">Print</Button>
            <AddSupplierTransactionDialog
              supplierId={params.id}
              onAddTransaction={handleAddTransaction}
            />
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
            <TableHead className="text-right">Paid Amount</TableHead>
            <TableHead className="text-right">Due Amount</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Add transaction rows here */}
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{formatDate(transaction.date)}</TableCell>
              <TableCell>{transaction.invoiceNumber}</TableCell>
              <TableCell>{transaction.details}</TableCell>
              <TableCell className="text-right">
                ৳{(transaction.totalAmount || 0).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                ৳{(transaction.paidAmount || 0).toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-red-500">
                ৳{(transaction.due || 0).toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
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
  );
}
