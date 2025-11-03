"use client";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ColorChip, ColorChipGroup } from "@/components/ui/color-chip";

/**
 * A table cell component for displaying batch color information
 * @param {Object} props
 * @param {Array<{colorName: string, quantity: number}>} props.items - Color items in the batch
 * @param {string} props.unit - The unit of measurement
 */
export function ColorBatchCell({ items, unit }) {
  if (!items?.length) return <span>N/A</span>;

  if (items.length === 1) {
    const item = items[0];
    return (
      <ColorChip
        colorName={item.colorName}
        quantity={Number(item.quantity)}
        unit={unit}
      />
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="link">{items.length} colors</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Color Details</h4>
            <p className="text-sm text-muted-foreground">
              Quantities per color in this batch.
            </p>
          </div>
          <ColorChipGroup
            colors={items.map((item) => ({
              colorName: item.colorName,
              quantity: Number(item.quantity),
            }))}
            unit={unit}
            layout="list"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
