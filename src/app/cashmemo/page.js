"use client";
import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CashMemoPage() {
  const [memoData, setMemoData] = useState({
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    memoNumber: `MEMO-${Date.now()}`,
  });

  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    quality: "",
    price: "",
    total: 0,
  });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.quality || !newProduct.price) return;

    const total = parseFloat(newProduct.quality) * parseFloat(newProduct.price);
    setProducts([...products, { ...newProduct, total }]);
    setNewProduct({ name: "", quality: "", price: "", total: 0 });
  };

  const grandTotal = products.reduce((sum, product) => sum + product.total, 0);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={memoData.date}
                onChange={(e) =>
                  setMemoData({ ...memoData, date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <Input
                value={memoData.customerName}
                onChange={(e) =>
                  setMemoData({ ...memoData, customerName: e.target.value })
                }
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={memoData.customerPhone}
                onChange={(e) =>
                  setMemoData({ ...memoData, customerPhone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Memo Number</label>
              <Input
                value={memoData.memoNumber}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input
                value={memoData.customerAddress}
                onChange={(e) =>
                  setMemoData({ ...memoData, customerAddress: e.target.value })
                }
                placeholder="Enter address"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Input
              placeholder="Product name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Quality"
              value={newProduct.quality}
              onChange={(e) =>
                setNewProduct({ ...newProduct, quality: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: e.target.value })
              }
            />
            <Button onClick={handleAddProduct}>Add Product</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quality</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-right">
                    {product.quality}
                  </TableCell>
                  <TableCell className="text-right">
                    ৳{parseFloat(product.price).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ৳{product.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">
                  Grand Total:
                </TableCell>
                <TableCell className="text-right font-bold">
                  ৳{grandTotal.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Print Memo</Button>
        <Button>Save Memo</Button>
      </div>
    </div>
  );
}
