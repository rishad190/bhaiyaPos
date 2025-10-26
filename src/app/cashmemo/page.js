"use client";
import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/app/data-context";
import { CashMemoPrint } from "@/components/CashMemoPrint";

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
import {
  Printer,
  FileDown,
  Save,
  CheckCircle,
  Check,
  ChevronsUpDown,
} from "lucide-react";

import { Toaster } from "@/components/ui/toaster";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateFifoSale } from "@/lib/inventory-utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CashMemoPage() {
  const router = useRouter();
  const { toast } = useToast(); // Get toast function
  const {
    customers,
    addTransaction,
    addDailyCashTransaction,
    fabrics,
    fabricBatches,
  } = useData();
  const [customerId, setCustomerId] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openPhonePopover, setOpenPhonePopover] = useState(false);
  const [phoneSearchValue, setPhoneSearchValue] = useState("");
  const [openProductPopover, setOpenProductPopover] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");
  const [memoData, setMemoData] = useState({
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    memoNumber: `MEMO-${Date.now()}`,
    deposit: 0, // Changed from empty string to 0
  });

  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    quality: "",
    price: "",
    total: 0,
    cost: 0,
    profit: 0,
    color: "",
  });

  const availableColors = useMemo(() => {
    if (!newProduct.name || !fabrics || !fabricBatches) return []; // Added checks for fabrics/fabricBatches
    const fabric = fabrics.find(
      (f) => f.name.toLowerCase() === newProduct.name.toLowerCase()
    );
    if (!fabric) return [];
    const batches = fabricBatches.filter((b) => b.fabricId === fabric.id);
    const colorQuantities = batches.reduce((acc, batch) => {
      // Ensure batch and quantities are valid numbers
      const batchQty = Number(batch?.quantity || 0);

      if (batch.colors && batch.colors.length > 0) {
        batch.colors.forEach((colorInfo) => {
          const colorQty = Number(colorInfo?.quantity || 0);
          if (colorInfo.color && colorQty > 0) {
            acc[colorInfo.color] = (acc[colorInfo.color] || 0) + colorQty;
          }
        });
      } else if (batch.color && batchQty > 0) {
        // Also consider batches with single color field
        acc[batch.color] = (acc[batch.color] || 0) + batchQty;
      }
      // Consider batches without specific color info if no color is selected yet for the product
      else if (!newProduct.color && batchQty > 0) {
        acc["Default"] = (acc["Default"] || 0) + batchQty;
      }
      return acc;
    }, {});

    return Object.entries(colorQuantities)
      .map(([color, quantity]) => ({ color, quantity: Number(quantity || 0) })) // Ensure quantity is a number
      .filter((item) => item.quantity > 0); // Only show colors with stock > 0
  }, [newProduct.name, fabrics, fabricBatches, newProduct.color]); // Added fabrics, fabricBatches to dependency array

  const originalContent = useRef(null);

  const handleAddProduct = () => {
    // --- Validation using toast ---
    if (!newProduct.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter product name",
        variant: "destructive",
      });
      return;
    }

    const qualityNum = parseFloat(newProduct.quality);
    if (isNaN(qualityNum) || qualityNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    const priceNum = parseFloat(newProduct.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }
    // --- End Validation ---

    const total = qualityNum * priceNum;

    const fabric = fabrics.find(
      (f) => f.name.toLowerCase() === newProduct.name.toLowerCase()
    );
    if (!fabric) {
      toast({
        title: "Error",
        description: "Fabric not found in inventory",
        variant: "destructive",
      });
      return;
    }

    const batches = fabricBatches.filter((b) => b.fabricId === fabric.id);

    // --- Try-catch for calculateFifoSale ---
    try {
      const { totalCost } = calculateFifoSale(
        batches,
        qualityNum,
        newProduct.color || null
      ); // Pass color, or null if not specified
      const profit = total - totalCost;

      setProducts([
        ...products,
        {
          name: newProduct.name.trim(),
          quality: qualityNum, // Use parsed number
          price: priceNum, // Use parsed number
          total,
          cost: totalCost,
          profit,
          color: newProduct.color,
        },
      ]);

      setNewProduct({
        name: "",
        quality: "",
        price: "",
        total: 0,
        cost: 0,
        profit: 0,
        color: "",
      });
      // Reset product search value as well if needed
      setProductSearchValue("");
    } catch (error) {
      console.error("Error calculating cost or adding product:", error);
      toast({
        title: "Error Adding Product",
        // Display specific error like insufficient stock if available
        description:
          error.message ||
          "Could not add product. Please check stock or details.",
        variant: "destructive",
      });
    }
    // --- End Try-catch ---
  };

  const grandTotal = products.reduce((sum, product) => sum + product.total, 0);
  const totalCost = products.reduce((sum, product) => sum + product.cost, 0);
  const totalProfit = products.reduce(
    (sum, product) => sum + product.profit,
    0
  );

  const handlePrint = () => {
    const printContent = document.getElementById("print-section");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Memo</title>
          <style>
            @page {
              size: A4;
              margin: 1cm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Arial', sans-serif;
            }
            body {
              padding: 1.5rem;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 3rem;
              padding-bottom: 1rem;
              border-bottom: 2px solid #eaeaea;
            }
            .logo {
              max-width: 120px;
              margin-bottom: 1rem;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #1a1a1a;
              margin-bottom: 0.5rem;
            }
            .memo-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2rem;
            }
            .customer-details, .memo-details {
              flex: 1;
              max-width: 300px;
            }
            .memo-details {
              text-align: right;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 2rem 0;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #eaeaea;
            }
            th {
              background-color: #f8f8f8;
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .grand-total {
              margin-top: 2rem;
              text-align: right;
              font-size: 18px;
              font-weight: bold;
            }
            .footer {
              margin-top: 4rem;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .footer-line {
              margin-top: 2rem;
              padding-top: 1rem;
              border-top: 1px solid #eaeaea;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer">
            <p>Thank you for your business!</p>
            <div class="footer-line">
              <p>Sky Fabric's - Quality Fabrics, Trusted Service</p>
              <p>Mobile: 01713-458086, 01738-732971</p>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleSelectCustomer = (customer) => {
    setMemoData({
      ...memoData,
      customerPhone: customer.phone,
      customerName: customer.name,
      customerAddress: customer.address || "",
    });
    setCustomerId(customer.id);
    setOpenPhonePopover(false);
  };

  const handleSelectProduct = (fabric) => {
    setNewProduct({ ...newProduct, name: fabric.name, color: "" }); // Reset color when product changes
    setOpenProductPopover(false);
  };

  const handlePhoneChange = (e) => {
    setMemoData({ ...memoData, customerPhone: e.target.value });
  };

  const handleSaveMemo = async () => {
    if (products.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product",
        variant: "destructive",
      });
      return;
    }

    if (!customerId) {
      toast({
        title: "Error",
        description: "Please select a valid customer",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const deposit = Number(memoData.deposit) || 0;

      // Create transaction for customer
      const transaction = {
        customerId,
        date: memoData.date,
        memoNumber: memoData.memoNumber,
        total: grandTotal,
        totalCost: totalCost, // Add totalCost
        deposit: deposit,
        due: grandTotal - deposit,
        details: products
          .map(
            (p) =>
              `${p.name} ${p.color ? `(${p.color})` : ""} (${p.quality} x ৳${
                p.price
              })`
          )
          .join(", "),
        type: "SALE",
        storeId: "STORE1", // Consider making this dynamic if needed
        createdAt: new Date().toISOString(),
        products: products, // Include product details for inventory update logic
      };

      // Wait for transaction to be added (and inventory updated within addTransaction)
      const transactionResult = await addTransaction(transaction);

      // Only proceed with cash transaction if deposit exists and transaction was successful
      if (deposit > 0 && transactionResult) {
        const cashTransaction = {
          date: memoData.date,
          description: `Cash Memo: ${memoData.memoNumber} - ${memoData.customerName}`,
          cashIn: deposit,
          cashOut: 0,
          category: "Sales",
          createdAt: new Date().toISOString(),
        };

        await addDailyCashTransaction(cashTransaction);
      }

      setSaveSuccess(true);
      toast({
        title: "Success",
        description: "Cash memo saved successfully",
      });

      // Reset form after delay
      setTimeout(() => {
        setMemoData({
          date: new Date().toISOString().split("T")[0],
          customerName: "",
          customerPhone: "",
          customerAddress: "",
          memoNumber: `MEMO-${Date.now()}`,
          deposit: 0,
        });
        setProducts([]);
        setCustomerId("");
        setSaveSuccess(false);
        router.push("/cashbook"); // Navigate to cashbook after save
      }, 2000);
    } catch (error) {
      console.error("Error saving memo:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save memo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4 md:space-y-6">
      <Toaster />
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
              <div className="relative">
                <Popover
                  open={openPhonePopover}
                  onOpenChange={setOpenPhonePopover}
                >
                  <PopoverTrigger asChild>
                    <div className="flex items-center">
                      <Input
                        value={memoData.customerPhone}
                        onChange={(e) => {
                          handlePhoneChange(e);
                          setPhoneSearchValue(e.target.value);
                        }}
                        placeholder="Enter or search phone number"
                        className="w-full"
                      />
                      <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={openPhonePopover}
                        className="absolute right-0 h-full px-3"
                        onClick={() => setOpenPhonePopover(!openPhonePopover)}
                      >
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command
                      shouldFilter={false} /* Filtering done via state */
                    >
                      <CommandInput
                        placeholder="Search customers..."
                        value={phoneSearchValue}
                        onValueChange={setPhoneSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          {customers
                            ?.filter(
                              (customer) =>
                                customer.phone.includes(phoneSearchValue) ||
                                customer.name
                                  .toLowerCase()
                                  .includes(phoneSearchValue.toLowerCase())
                            )
                            .map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={`${customer.name} ${customer.phone}`} // Unique value for selection
                                onSelect={() => handleSelectCustomer(customer)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    customerId === customer.id // Check against customerId
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{customer.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {customer.phone}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Deposit Amount</label>
              <Input
                type="number"
                min="0"
                step="any"
                value={memoData.deposit}
                onChange={(e) =>
                  setMemoData({
                    ...memoData,
                    deposit: e.target.value,
                  })
                }
                placeholder="Enter deposit amount"
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Memo Number</label>
              <Input
                value={memoData.memoNumber}
                onChange={(e) =>
                  setMemoData({ ...memoData, memoNumber: e.target.value })
                }
                placeholder="Enter memo number"
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

      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-end">
            {/* Product Name Search/Select */}
            <div className="relative">
              <label className="text-sm font-medium">Product Name *</label>
              <Popover
                open={openProductPopover}
                onOpenChange={setOpenProductPopover}
              >
                <PopoverTrigger asChild>
                  <div className="relative flex items-center mt-1">
                    <Input
                      placeholder="Search or select product..."
                      value={productSearchValue || newProduct.name} // Display search value or selected name
                      onChange={(e) => {
                        setProductSearchValue(e.target.value);
                        // Optionally clear selected product name if user starts typing
                        if (
                          newProduct.name &&
                          e.target.value !== newProduct.name
                        ) {
                          setNewProduct({ ...newProduct, name: "" });
                        }
                        setOpenProductPopover(true); // Open popover when typing
                      }}
                      required
                      className="w-full pr-10" // Add padding for the button
                    />
                    <Button
                      variant="ghost"
                      role="combobox"
                      aria-expanded={openProductPopover}
                      className="absolute right-0 h-full px-3"
                      onClick={() => setOpenProductPopover(!openProductPopover)}
                    >
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search products..."
                      value={productSearchValue}
                      onValueChange={setProductSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {fabrics
                          ?.filter((fabric) =>
                            fabric.name
                              .toLowerCase()
                              .includes(productSearchValue.toLowerCase())
                          )
                          .map((fabric) => {
                            const batches = fabricBatches
                              ? fabricBatches.filter(
                                  (b) => b.fabricId === fabric.id
                                )
                              : []; // Add check for fabricBatches
                            const totalQuantity = batches.reduce(
                              (sum, b) => sum + (Number(b?.quantity) || 0),
                              0
                            ); // Ensure quantity is number

                            return (
                              <CommandItem
                                key={fabric.id}
                                value={fabric.name} // Use name for selection value
                                onSelect={() => {
                                  handleSelectProduct(fabric);
                                  setProductSearchValue(fabric.name); // Update search input on select
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newProduct.name.toLowerCase() ===
                                      fabric.name.toLowerCase()
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex justify-between w-full">
                                  <span>{fabric.name}</span>
                                  <span className="text-muted-foreground text-sm">
                                    {typeof totalQuantity === "number"
                                      ? totalQuantity.toFixed(2)
                                      : "0.00"}{" "}
                                    {fabric.unit}{" "}
                                    {/* Ensure quantity is number before toFixed */}
                                  </span>
                                </div>
                              </CommandItem>
                            );
                          })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {/* Color Select */}
            <div>
              <label className="text-sm font-medium">Color</label>
              <Select
                value={newProduct.color}
                onValueChange={(value) =>
                  setNewProduct({
                    ...newProduct,
                    color: value === "Default" ? "" : value,
                  })
                } // Handle 'Default' selection
                disabled={!newProduct.name || availableColors.length === 0} // Disable if no product selected or no colors available
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {availableColors.length === 0 && newProduct.name && (
                    <SelectItem value="" disabled>
                      No colors available
                    </SelectItem>
                  )}
                  {availableColors.map(({ color, quantity }) => (
                    <SelectItem key={color} value={color}>
                      {/* Ensure quantity is a number before calling toFixed */}
                      {color} (
                      {typeof quantity === "number"
                        ? quantity.toFixed(2)
                        : "N/A"}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Quantity Input */}
            <div>
              <label className="text-sm font-medium">Quantity *</label>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Quantity"
                value={newProduct.quality}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, quality: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>
            {/* Price Input */}
            <div>
              <label className="text-sm font-medium">Price *</label>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>
            {/* Add Button */}
            <Button onClick={handleAddProduct} className="w-full md:w-auto">
              Add
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Product</TableHead>
                  <TableHead className="whitespace-nowrap">Color</TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Quality
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Price
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Total
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Profit
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="whitespace-nowrap">
                      {product.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {product.color || "-"} {/* Display dash if no color */}
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
                    <TableCell className="text-right whitespace-nowrap">
                      ৳
                      {product.profit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {/* Ensure profit shows decimals */}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={5} className="text-right font-bold">
                    Grand Total:
                  </TableCell>
                  <TableCell className="text-right font-bold whitespace-nowrap">
                    ৳{grandTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-right font-bold text-green-600"
                  >
                    Total Profit:
                  </TableCell>
                  <TableCell className="text-right font-bold whitespace-nowrap text-green-600">
                    ৳
                    {totalProfit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {/* Ensure profit shows decimals */}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-right font-medium text-green-600"
                  >
                    Deposit:
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap text-green-600">
                    ৳{Number(memoData.deposit || 0).toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-right font-medium text-red-600"
                  >
                    Due Amount:
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap text-red-600">
                    ৳
                    {(
                      grandTotal - Number(memoData.deposit || 0)
                    ).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <Button
          variant="outline"
          className="w-full sm:w-auto print:hidden"
          onClick={handlePrint}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Memo
        </Button>
        <Button
          variant="outline"
          className="w-full sm:w-auto print:hidden"
          // onClick={handleExportPDF} // PDF Export functionality might need review/implementation
          disabled // Disable if not implemented
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
        <Button
          className="w-full sm:w-auto print:hidden"
          onClick={handleSaveMemo}
          disabled={isSaving || saveSuccess || products.length === 0}
        >
          {saveSuccess ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : isSaving ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin">⏳</span>{" "}
              {/* Using emoji for spinner */}
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Memo
            </>
          )}
        </Button>
      </div>

      {/* Print Section (Hidden on screen) */}
      <div id="print-section" className="hidden print:block">
        <CashMemoPrint
          memoData={memoData}
          products={products}
          grandTotal={grandTotal}
        />
      </div>
    </div>
  );
}
