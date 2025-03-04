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
import { EditSupplierDialog } from "@/components/EditSupplierDialog";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SuppliersPage() {
  const router = useRouter();
  const {
    suppliers,
    supplierTransactions, // Change this from transactions
    addSupplier,
    updateSupplier,
    deleteSupplier,
  } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSupplier, setEditingSupplier] = useState(null);

  const filteredSuppliers =
    suppliers?.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone.includes(searchTerm)
    ) || [];

  // Update the totals calculation
  const totals = filteredSuppliers.reduce(
    (acc, supplier) => {
      // Get all transactions for this supplier
      const supplierTxns =
        supplierTransactions?.filter((t) => t.supplierId === supplier.id) || [];

      // Calculate totals for this supplier's transactions
      supplierTxns.forEach((transaction) => {
        acc.totalAmount += parseFloat(transaction.totalAmount) || 0;
        acc.paidAmount += parseFloat(transaction.paidAmount) || 0;
      });

      // Due amount is the difference between total and paid
      acc.dueAmount = acc.totalAmount - acc.paidAmount;

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

  const handleEditSupplier = async (supplierId, updatedData) => {
    try {
      await updateSupplier(supplierId, updatedData);
      setEditingSupplier(null);
    } catch (error) {
      console.error("Error updating supplier:", error);
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

      <EditSupplierDialog
        supplier={editingSupplier}
        isOpen={!!editingSupplier}
        onClose={() => setEditingSupplier(null)}
        onEditSupplier={handleEditSupplier}
      />

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
                <div className="flex justify-end">
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
                          setEditingSupplier(supplier);
                        }}
                      >
                        <span className="flex items-center">
                          <span className="md:hidden mr-2">✏️</span>
                          Edit
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/suppliers/${supplier.id}`);
                        }}
                      >
                        <span className="flex items-center">
                          <span className="md:hidden mr-2">👁️</span>
                          View Details
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={(e) => handleDeleteSupplier(e, supplier.id)}
                      >
                        <span className="flex items-center">
                          <span className="md:hidden mr-2">🗑️</span>
                          Delete
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
