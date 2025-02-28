"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/app/data-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddSupplierDialog } from "@/components/AddSupplierDialog";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function SuppliersPage() {
  const router = useRouter();
  const { suppliers, addSupplier, deleteSupplier } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const transactionsRef = ref(db, "supplierTransactions");
    const unsubTransactions = onValue(transactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const transactionsData = snapshot.val();
        const transactionsList = Object.entries(transactionsData).map(
          ([id, data]) => ({
            id,
            ...data,
          })
        );
        setTransactions(transactionsList);
      } else {
        setTransactions([]);
      }
    });

    return () => unsubTransactions();
  }, []);

  const filteredSuppliers =
    suppliers?.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone.includes(searchTerm)
    ) || [];

  const totals = filteredSuppliers.reduce(
    (acc, supplier) => {
      const supplierTransactions = transactions.filter(
        (t) => t.supplierId === supplier.id
      );

      const supplierTotals = supplierTransactions.reduce(
        (total, transaction) => {
          total.totalAmount += transaction.totalAmount || 0;
          total.paidAmount += transaction.paidAmount || 0;
          return total;
        },
        { totalAmount: 0, paidAmount: 0 }
      );

      acc.totalAmount += supplierTotals.totalAmount;
      acc.paidAmount += supplierTotals.paidAmount;
      acc.dueAmount += supplier.totalDue || 0;

      return acc;
    },
    { totalAmount: 0, paidAmount: 0, dueAmount: 0 }
  );

  const handleAddSupplier = async (supplierData) => {
    try {
      const newSupplier = {
        ...supplierData,
        totalDue: 0,
        createdAt: new Date().toISOString(),
      };
      await addSupplier(newSupplier);
    } catch (error) {
      console.error("Error adding supplier:", error);
      throw error;
    }
  };

  const handleDeleteSupplier = async (e, supplierId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await deleteSupplier(supplierId);
      } catch (error) {
        console.error("Error deleting supplier:", error);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Amount</h3>
          <p className="text-2xl font-bold text-blue-600">
            ৳{totals.totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Paid</h3>
          <p className="text-2xl font-bold text-green-600">
            ৳{totals.paidAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Due</h3>
          <p
            className={`text-2xl font-bold ${
              totals.dueAmount > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            ৳{totals.dueAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex justify-between mb-6">
        <Input
          placeholder="Search suppliers..."
          className="w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <AddSupplierDialog onAddSupplier={handleAddSupplier} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Store</TableHead>
            <TableHead className="text-right">Total Due</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSuppliers.map((supplier) => (
            <TableRow
              key={supplier.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => router.push(`/suppliers/${supplier.id}`)}
            >
              <TableCell>{supplier.name}</TableCell>
              <TableCell>
                <div>{supplier.phone}</div>
                <div className="text-sm text-gray-500">{supplier.email}</div>
              </TableCell>
              <TableCell>
                <div
                  className="truncate max-w-[200px]"
                  title={supplier.address}
                >
                  {supplier.address}
                </div>
              </TableCell>
              <TableCell>{supplier.storeId}</TableCell>
              <TableCell
                className={`text-right ${
                  supplier.totalDue > 0 ? "text-red-500" : ""
                }`}
              >
                ৳{(supplier.totalDue || 0).toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={(e) => handleDeleteSupplier(e, supplier.id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {!filteredSuppliers.length && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No suppliers found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
