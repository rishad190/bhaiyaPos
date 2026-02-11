import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Plus, ChevronsUpDown, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductForm({
  fabrics,
  newProduct,
  setNewProduct,
  availableColors,
  onAddProduct,
  onSelectProduct,
}) {
  const [openProductPopover, setOpenProductPopover] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");

  return (
    <div className="bg-muted/30 p-4 rounded-lg space-y-4">
      <h3 className="font-semibold text-lg">Add Products</h3>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        {/* Product Selection */}
        <div className="md:col-span-2">
          <label className="text-xs font-medium mb-1.5 block">Product</label>
          <Popover open={openProductPopover} onOpenChange={setOpenProductPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openProductPopover}
                className="w-full justify-between"
              >
                {newProduct.name || "Select product..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
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
                      ?.filter(
                        (fabric) =>
                          fabric.name
                            .toLowerCase()
                            .includes(productSearchValue.toLowerCase()) ||
                          fabric.code
                            ?.toLowerCase()
                            .includes(productSearchValue.toLowerCase())
                      )
                      .slice(0, 20)
                      .map((fabric) => (
                        <CommandItem
                          key={fabric.id}
                          value={fabric.name}
                          onSelect={() => {
                            onSelectProduct(fabric);
                            setOpenProductPopover(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              newProduct.fabricId === fabric.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{fabric.name}</span>
                            <span className="text-xs text-muted-foreground">
                              Code: {fabric.code} | Stock:{" "}
                              {fabric.batches
                                ? fabric.batches
                                    .flatMap((batch) => batch.items || [])
                                    .reduce(
                                      (sum, item) =>
                                        sum + (Number(item.quantity) || 0),
                                      0
                                    )
                                    .toFixed(2)
                                : "0"}
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

        {/* Color Selection */}
        <div className="md:col-span-1">
          <label className="text-xs font-medium mb-1.5 block">Color</label>
          <Select
            value={newProduct.color}
            disabled={!newProduct.name || availableColors.length === 0}
            onValueChange={(value) =>
              setNewProduct({ ...newProduct, color: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={availableColors.length ? "Color" : "None"} />
            </SelectTrigger>
            <SelectContent>
              {availableColors.map((c, i) => (
                <SelectItem key={i} value={c.color}>
                  {c.color} ({c.quantity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity */}
        <div className="md:col-span-1">
          <label className="text-xs font-medium mb-1.5 block">Quantity</label>
          <Input
            type="number"
            value={newProduct.quantity}
            onChange={(e) =>
              setNewProduct({ ...newProduct, quantity: e.target.value })
            }
            placeholder="Qty"
            min="0.01"
            step="0.01"
          />
        </div>

        {/* Price */}
        <div className="md:col-span-1">
          <label className="text-xs font-medium mb-1.5 block">Unit Price</label>
          <Input
            type="number"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: e.target.value })
            }
            placeholder="Price"
            min="1"
          />
        </div>

        {/* Add Button */}
        <div className="md:col-span-1">
          <Button onClick={onAddProduct} className="w-full">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
