import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronsUpDown,
} from "lucide-react";
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
import { useState } from "react";

export function MemoHeader({ memoData, setMemoData, customers, onSelectCustomer }) {
  const [openPhonePopover, setOpenPhonePopover] = useState(false);
  const [phoneSearchValue, setPhoneSearchValue] = useState("");

  const handlePhoneChange = (e) => {
    setMemoData({ ...memoData, customerPhone: e.target.value });
    setPhoneSearchValue(e.target.value);
  };

  return (
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
                    onChange={handlePhoneChange}
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
                <Command shouldFilter={false}>
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
                            value={`${customer.name} ${customer.phone}`}
                            onSelect={() => {
                              onSelectCustomer(customer);
                              setOpenPhonePopover(false);
                            }}
                          >
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
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Address (Optional)</label>
          <Input
            value={memoData.customerAddress}
            onChange={(e) =>
              setMemoData({
                ...memoData,
                customerAddress: e.target.value,
              })
            }
            placeholder="Enter customer address"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Memo Number</label>
          <Input value={memoData.memoNumber} readOnly className="bg-muted" />
        </div>
      </div>
    </div>
  );
}
