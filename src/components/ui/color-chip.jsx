"use client";

/**
 * A component for displaying a color with its name and optional quantity
 * @param {Object} props
 * @param {string} props.colorName - The name of the color
 * @param {number} [props.quantity] - Optional quantity to display
 * @param {string} [props.unit] - Optional unit for the quantity
 * @param {string} [props.className] - Additional CSS classes
 */
export function ColorChip({ colorName, name, quantity, unit, className = "" }) {
  // Map common color names to hex values
  const getColorHex = (name) => {
    const colorMap = {
      red: "#ef4444",
      green: "#22c55e",
      blue: "#3b82f6",
      yellow: "#eab308",
      orange: "#f97316",
      purple: "#a855f7",
      pink: "#ec4899",
      brown: "#92400e",
      gray: "#6b7280",
      black: "#1f2937",
      white: "#ffffff",
    };

    if (!name) return "#e5e7eb";

    // If a hex code was provided, use it directly
    if (typeof name === "string" && name.trim().startsWith("#")) {
      return name;
    }

    // Try to match color name (case insensitive)
    const colorKey = Object.keys(colorMap).find(
      (key) => key.toLowerCase() === name?.toLowerCase()
    );

    return colorMap[colorKey] || "#e5e7eb";
  };

  const displayName = colorName || name || "N/A";

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="group"
      aria-label={`${displayName} color`}
      title={
        displayName +
        (typeof quantity === "number"
          ? ` (${quantity}${unit ? ` ${unit}` : ""})`
          : "")
      }
    >
      <div
        className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
        style={{
          backgroundColor: getColorHex(displayName),
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
        }}
      />
      <span className="font-medium text-sm">
        {displayName}
        {typeof quantity === "number" && (
          <span className="ml-1.5 font-normal text-muted-foreground text-xs">
            ({quantity}
            {unit ? ` ${unit}` : ""})
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * A component for displaying multiple colors in a grid or list
 * @param {Object} props
 * @param {Array<{colorName: string, quantity?: number}>} props.colors - Array of colors with optional quantities
 * @param {string} [props.unit] - Optional unit for quantities
 * @param {"grid"|"list"} [props.layout="grid"] - Layout style
 * @param {string} [props.className] - Additional CSS classes
 */
export function ColorChipGroup({
  colors,
  unit,
  layout = "inline",
  className = "",
  maxVisible = 4,
}) {
  if (!colors?.length) return null;

  // Normalize entries: accept { name } or { colorName }
  const normalized = colors.map((c) => ({
    colorName: c.colorName || c.name || c.color || "N/A",
    quantity:
      typeof c.quantity === "number" ? c.quantity : Number(c.quantity) || 0,
  }));

  // Sort by quantity desc so most available colors show first
  normalized.sort((a, b) => b.quantity - a.quantity);

  // If inline layout, show up to maxVisible chips and a +N popover
  if (layout === "inline") {
    const visible = normalized.slice(0, maxVisible);
    const hidden = normalized.slice(maxVisible);

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {visible.map((c, i) => (
          <ColorChip
            key={`${c.colorName}-${i}`}
            colorName={c.colorName}
            quantity={c.quantity}
            unit={unit}
            className="text-xs"
          />
        ))}

        {hidden.length > 0 && (
          // Lazy load popover to show remaining colors
          <div className="inline-block">
            <details className="relative">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                +{hidden.length}
              </summary>
              <div className="absolute z-10 mt-2 w-56 rounded-md bg-white p-3 shadow-lg border">
                <div className="space-y-2">
                  {hidden.map((c, i) => (
                    <ColorChip
                      key={`hidden-${c.colorName}-${i}`}
                      colorName={c.colorName}
                      quantity={c.quantity}
                      unit={unit}
                      className="text-sm"
                    />
                  ))}
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    );
  }

  // fallback: grid or list
  const containerClass =
    layout === "grid" ? "grid grid-cols-2 gap-2" : "flex flex-col gap-1.5";
  return (
    <div className={`${containerClass} ${className}`}>
      {normalized.map((color, index) => (
        <ColorChip
          key={`${color.colorName}-${index}`}
          colorName={color.colorName}
          quantity={color.quantity}
          unit={unit}
        />
      ))}
    </div>
  );
}
