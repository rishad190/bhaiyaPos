import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useCustomers } from "@/hooks/useCustomers";
import { useAddTransaction } from "@/hooks/useTransactions";
import { useAddDailyCashTransaction } from "@/hooks/useDailyCash";
import { useFabrics } from "@/hooks/useFabrics";
import { useReduceInventory } from "@/hooks/useInventoryTransaction";
import { calculateFifoSale } from "@/lib/inventory-utils";
import { formatProductWithColor } from "@/lib/color-utils";
import logger from "@/utils/logger";
import * as utils from "@/lib/utils";

export function useCashMemo() {
  const router = useRouter();
  const { toast } = useToast();

  // Fetch data
  const { data: customersData } = useCustomers({ page: 1, limit: 10000 });
  const { data: fabricsData } = useFabrics({ page: 1, limit: 10000 });

  // Mutations
  const addTransactionMutation = useAddTransaction();
  const addDailyCashMutation = useAddDailyCashTransaction();
  const reduceInventoryMutation = useReduceInventory();

  // State
  const [customerId, setCustomerId] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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
    quantity: "",
    price: "",
    total: 0,
    cost: 0,
    profit: 0,
    color: "",
    fabricId: "",
  });

  const customers = customersData?.data || [];
  const fabrics = fabricsData?.data || [];

  // Derived State
  const availableColors = useMemo(() => {
    if (!newProduct.name || !fabrics) return [];

    const selectedFabric = fabrics.find(
      (f) => f && f.id === newProduct.fabricId
    );

    if (!selectedFabric?.batches) return [];

    return selectedFabric.batches
      .flatMap((batch) => batch.items || [])
      .reduce((colors, item) => {
        if (!item?.colorName || !item?.quantity) return colors;
        const existing = colors.find((c) => c.color === item.colorName);
        if (existing) {
          existing.quantity += Number(item.quantity);
        } else {
          colors.push({
            color: item.colorName,
            quantity: Number(item.quantity),
          });
        }
        return colors;
      }, [])
      .filter((c) => c.quantity > 0);
  }, [newProduct.name, newProduct.fabricId, fabrics]);

  const grandTotal = products.reduce((sum, product) => sum + product.total, 0);
  const totalCost = products.reduce((sum, product) => sum + product.cost, 0);
  const totalProfit = products.reduce((sum, product) => sum + product.profit, 0);

  // Handlers
  const handleSelectCustomer = (customer) => {
    setMemoData({
      ...memoData,
      customerPhone: customer.phone,
      customerName: customer.name,
      customerAddress: customer.address || "",
    });
    setCustomerId(customer.id);
  };

  const handleSelectProduct = (fabric) => {
    if (!fabric.id || fabric.id === "0" || fabric.id === "") {
      logger.error("[CashMemo] Invalid fabric ID selected:", fabric);
      toast({
        title: "Invalid Product",
        description: "Selected product has an invalid ID.",
        variant: "destructive",
      });
      return;
    }

    setNewProduct({
      ...newProduct,
      name: fabric.name,
      color: "",
      fabricId: fabric.id,
      unit: fabric.unit || "piece",
    });
  };

  const handleAddProduct = () => {
    // Validation
    if (!newProduct.name.trim()) {
      toast({ title: "Product Required", description: "Select a product", variant: "destructive" });
      return;
    }

    const quantityNum = parseFloat(newProduct.quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({ title: "Invalid Quantity", description: "Enter valid quantity", variant: "destructive" });
      return;
    }

    const priceNum = parseFloat(newProduct.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({ title: "Invalid Price", description: "Enter valid price", variant: "destructive" });
      return;
    }

    const total = quantityNum * priceNum;
    const fabric = fabrics.find(f => f && f.id === newProduct.fabricId);

    if (!fabric) {
      toast({ title: "Error", description: "Fabric not found", variant: "destructive" });
      return;
    }

    try {
      const batches = fabric.batches || [];
      const fifoBatches = batches
        .map((batch) => {
          const items = batch.items || [];
          const qty = newProduct.color
            ? items.reduce((s, it) => s + (it?.colorName === newProduct.color ? Number(it.quantity || 0) : 0), 0)
            : items.reduce((s, it) => s + (Number(it?.quantity) || 0), 0);

          return {
            id: batch.id || batch.batchNumber,
            quantity: qty,
            unitCost: Number(batch.unitCost || batch.costPerPiece || batch.unit_cost) || 0,
            color: newProduct.color || null,
          };
        })
        .filter((b) => Number(b.quantity) > 0);

      const availableStock = fifoBatches.reduce((sum, b) => sum + Number(b.quantity || 0), 0);

      if (availableStock < quantityNum) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${availableStock} units available`,
          variant: "destructive",
        });
        return;
      }

      const { totalCost: cost } = calculateFifoSale(fifoBatches, quantityNum, newProduct.color || null);
      const profit = total - cost;

      setProducts([
        ...products,
        {
          name: newProduct.name.trim(),
          quantity: quantityNum,
          fabricId: fabric.id,
          price: priceNum,
          total,
          cost,
          profit,
          color: newProduct.color,
          unit: fabric.unit || "piece",
        },
      ]);

      setNewProduct({
        name: "",
        quantity: "",
        price: "",
        total: 0,
        cost: 0,
        profit: 0,
        color: "",
        fabricId: "",
      });
    } catch (error) {
      logger.error("Error adding product:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteProduct = (index) => {
    const updatedProducts = [...products];
    updatedProducts.splice(index, 1);
    setProducts(updatedProducts);
  };

  const handleSaveMemo = async () => {
    if (products.length === 0) {
      toast({ title: "No Products", description: "Add at least one product", variant: "destructive" });
      return;
    }

    if (!customerId || !memoData.customerName.trim()) {
      toast({ title: "Customer Required", description: "Select a customer", variant: "destructive" });
      return;
    }

    const deposit = Number(memoData.deposit) || 0;
    if (deposit < 0 || deposit > grandTotal) {
      toast({ title: "Invalid Deposit", description: "Check deposit amount", variant: "destructive" });
      return;
    }

    try {
      setIsSaving(true);
      
      const transaction = {
        customerId,
        date: memoData.date,
        memoNumber: memoData.memoNumber,
        total: grandTotal,
        totalCost,
        deposit,
        due: grandTotal - deposit,
        details: products.map(p => `${formatProductWithColor(p)} (${p.quantity} x ৳${p.price})`).join(", "),
        type: "SALE",
        storeId: "STORE1",
        createdAt: new Date().toISOString(),
        products,
      };

      const transactionId = await addTransactionMutation.mutateAsync(transaction);
      
      await reduceInventoryMutation.mutateAsync(products);

      if (deposit > 0 && transactionId) {
        await addDailyCashMutation.mutateAsync({
          date: memoData.date,
          description: `Cash Memo: ${memoData.memoNumber} - ${memoData.customerName}`,
          cashIn: deposit,
          cashOut: 0,
          category: "Sales",
          createdAt: new Date().toISOString(),
        });
      }

      setSaveSuccess(true);
      toast({ title: "Success", description: "Cash memo saved" });

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
      logger.error("Error saving memo:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    utils.printElement("print-section", "Print Memo");
  };

  return {
    // Data
    customers,
    fabrics,
    products,
    availableColors,
    
    // State
    memoData,
    setMemoData,
    newProduct,
    setNewProduct,
    saveSuccess,
    isSaving,
    
    // Computed
    grandTotal,
    totalCost,
    
    // Handlers
    handleSelectCustomer,
    handleSelectProduct,
    handleAddProduct,
    handleDeleteProduct,
    handleSaveMemo,
    handlePrint,
  };
}
