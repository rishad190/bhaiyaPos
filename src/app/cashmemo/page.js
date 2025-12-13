"use client";

import { useCashMemo } from "@/hooks/useCashMemo";
import { CashMemoPrint } from "@/components/transactions/CashMemoPrint";
import { TransactionErrorBoundary } from "@/components/shared/ErrorBoundary";
import { MemoHeader } from "@/components/transactions/MemoHeader";
import { ProductForm } from "@/components/transactions/ProductForm";
import { ProductList } from "@/components/transactions/ProductList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, Save } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

export default function CashMemoPage() {
  const {
    customers,
    fabrics,
    products,
    availableColors,
    memoData,
    setMemoData,
    newProduct,
    setNewProduct,
    saveSuccess,
    isSaving,
    grandTotal,
    handleSelectCustomer,
    handleSelectProduct,
    handleAddProduct,
    handleDeleteProduct,
    handleSaveMemo,
    handlePrint,
  } = useCashMemo();

  return (
    <TransactionErrorBoundary>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4 md:space-y-6">
        <Toaster />
        
        {/* Loading Overlay */}
        {isSaving && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg border flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-sm font-medium">Saving memo...</span>
            </div>
          </div>
        )}

        <Card className="p-4 md:p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h1 className="text-2xl font-bold">New Cash Memo</h1>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button onClick={handleSaveMemo} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Memo"}
                </Button>
              </div>
            </div>

            {/* Header / Customer Info */}
            <MemoHeader
              memoData={memoData}
              setMemoData={setMemoData}
              customers={customers}
              onSelectCustomer={handleSelectCustomer}
            />

            {/* Product Entry Form */}
            <ProductForm
              fabrics={fabrics}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              availableColors={availableColors}
              onAddProduct={handleAddProduct}
              onSelectProduct={handleSelectProduct}
            />

            {/* Product List Table */}
            <ProductList
              products={products}
              onDelete={handleDeleteProduct}
              memoData={memoData}
              setMemoData={setMemoData}
              grandTotal={grandTotal}
            />
          </div>
        </Card>

        {/* Hidden Print Component */}
        <div className="hidden">
          <div id="print-section">
            <CashMemoPrint
              memoData={memoData}
              products={products}
              grandTotal={grandTotal}
              isOriginal={true}
            />
          </div>
        </div>
      </div>
    </TransactionErrorBoundary>
  );
}
