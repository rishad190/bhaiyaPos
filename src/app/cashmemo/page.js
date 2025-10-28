
"use client";
import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCustomerData } from "@/contexts/CustomerContext";
import { useTransactionData } from "@/contexts/TransactionContext";
import { useDailyCashData } from "@/contexts/DailyCashContext";
import { useInventoryData } from "@/contexts/InventoryContext";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CashMemoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { customers } = useCustomerData();
  const { addTransaction } = useTransactionData();
  const { addDailyCashTransaction } = useDailyCashData();
  const { fabrics } = useInventoryData();
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
    deposit: 0,
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
    if (!newProduct.name || !fabrics) return [];
    const fabric = fabrics.find(
      (f) => f.name.toLowerCase() === newProduct.name.toLowerCase()
    );
    if (!fabric || !fabric.colors) return [];
    return fabric.colors.filter(c => c.quantity > 0);
  }, [newProduct.name, fabrics]);

  const handleAddProduct = () => {
    if (!newProduct.name.trim() || !newProduct.color) {
      toast({
        title: "Error",
        description: "Please select a product and color",
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

    const fabric = fabrics.find(
      (f) => f.name.toLowerCase() === newProduct.name.toLowerCase()
    );
    const colorData = fabric.colors.find(c => c.color === newProduct.color);

    if (qualityNum > colorData.quantity) {
      toast({
        title: "Error",
        description: "Insufficient stock for the selected color",
        variant: "destructive",
      });
      return;
    }

    const total = qualityNum * priceNum;

    setProducts([
      ...products,
      {
        fabricId: fabric.id,
        name: newProduct.name.trim(),
        quality: qualityNum,
        price: priceNum,
        total,
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
    setProductSearchValue("");
  };

  const grandTotal = products.reduce((sum, product) => sum + product.total, 0);

  const handlePrint = () => {
    const printContent = document.getElementById("print-section");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`...`); // Print logic removed for brevity

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
    setNewProduct({ ...newProduct, name: fabric.name, color: "" });
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

      const transaction = {
        customerId,
        date: memoData.date,
        memoNumber: memoData.memoNumber,
        total: grandTotal,
        deposit: deposit,
        due: grandTotal - deposit,
        details: products
          .map(
            (p) =>
              `${p.name} (${p.color}) (${p.quality} x ৳${p.price})`
          )
          .join(", "),
        type: "SALE",
        createdAt: new Date().toISOString(),
        products: products,
      };

      const transactionResult = await addTransaction(transaction);

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
        router.push("/cashbook");
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
            <div className="relative">
              <label className="text-sm font-medium">Product Name *</label>
              <Popover open={openProductPopover} onOpenChange={setOpenProductPopover}>
                <PopoverTrigger asChild>
                  <div className="relative flex items-center mt-1">
                    <Input
                      placeholder="Search or select product..."
                      value={productSearchValue || newProduct.name}
                      onChange={(e) => {
                        setProductSearchValue(e.target.value);
                        if (newProduct.name && e.target.value !== newProduct.name) {
                          setNewProduct({ ...newProduct, name: "" });
                        }
                        setOpenProductPopover(true);
                      }}
                      required
                      className="w-full pr-10"
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
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                          .map((fabric) => (
                            <CommandItem
                              key={fabric.id}
                              value={fabric.name}
                              onSelect={() => {
                                setNewProduct({ ...newProduct, name: fabric.name });
                                setProductSearchValue(fabric.name);
                                setOpenProductPopover(false);
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
                              {fabric.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <Select
                value={newProduct.color}
                onValueChange={(value) =>
                  setNewProduct({ ...newProduct, color: value })
                }
                disabled={!newProduct.name || availableColors.length === 0}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {availableColors.map((color) => (
                    <SelectItem key={color.color} value={color.color}>
                      {color.color} ({color.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Button onClick={handleAddProduct} className="w-full md:w-auto">
              Add
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Quality</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.color}</TableCell>
                    <TableCell className="text-right">{product.quality}</TableCell>
                    <TableCell className="text-right">
                      ৳{parseFloat(product.price).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ৳{product.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-bold">
                    Grand Total:
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ৳{grandTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium text-green-600">
                    Deposit:
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    ৳{Number(memoData.deposit || 0).toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium text-red-600">
                    Due Amount:
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    ৳{(grandTotal - Number(memoData.deposit || 0)).toLocaleString()}
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
