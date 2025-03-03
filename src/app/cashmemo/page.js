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
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* Header Card */}
      <Card className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
            <Button onClick={handleAddProduct} className="w-full md:w-auto">
              Add Product
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Product</TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Quality
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Price
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="whitespace-nowrap">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {product.quality}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      ৳{parseFloat(product.price).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      ৳{product.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">
                    Grand Total:
                  </TableCell>
                  <TableCell className="text-right font-bold whitespace-nowrap">
                    ৳{grandTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <Button variant="outline" className="w-full sm:w-auto">
          Print Memo
        </Button>
        <Button className="w-full sm:w-auto">Save Memo</Button>
      </div>
    </div>
  );
}
