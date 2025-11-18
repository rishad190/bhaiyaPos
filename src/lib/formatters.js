/**
 * Formatting Utilities
 * Centralized display formatting functions
 */

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: ৳)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount, currency = "৳", decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency}0${decimals > 0 ? "." + "0".repeat(decimals) : ""}`;
  }

  const numAmount = Number(amount);
  const formatted = numAmount.toFixed(decimals);

  // Add thousand separators
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${currency}${parts.join(".")}`;
}

/**
 * Format memo number
 * @param {string|number} number - Memo number or timestamp
 * @returns {string} - Formatted memo number
 */
export function formatMemoNumber(number) {
  if (!number) {
    return `MEMO-${Date.now()}`;
  }

  // If it's already formatted, return as is
  if (String(number).startsWith("MEMO-")) {
    return String(number);
  }

  // Otherwise, format it
  return `MEMO-${number}`;
}

/**
 * Format date to DD-MM-YYYY
 * @param {string|Date} date - Date to format
 * @param {string} format - Format string (default: DD-MM-YYYY)
 * @returns {string} - Formatted date string
 */
export function formatDate(date, format = "DD-MM-YYYY") {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  switch (format) {
    case "DD-MM-YYYY":
      return `${day}-${month}-${year}`;
    case "MM-DD-YYYY":
      return `${month}-${day}-${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    default:
      return `${day}-${month}-${year}`;
  }
}

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export function formatPhone(phone) {
  if (!phone) return "";

  // Remove all non-digit characters
  const cleaned = String(phone).replace(/\D/g, "");

  // Format based on length
  if (cleaned.length === 10) {
    // Format: (123) 456-7890
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11) {
    // Format: 1 (234) 567-8900
    return `${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return as is if doesn't match expected format
  return phone;
}

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted percentage string
 */
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return "0%";
  }

  const numValue = Number(value);
  return `${numValue.toFixed(decimals)}%`;
}

/**
 * Format large numbers with K, M, B suffixes
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} - Formatted number string
 */
export function formatLargeNumber(num, decimals = 1) {
  if (num === null || num === undefined || isNaN(num)) {
    return "0";
  }

  const numValue = Number(num);

  if (numValue >= 1000000000) {
    return `${(numValue / 1000000000).toFixed(decimals)}B`;
  } else if (numValue >= 1000000) {
    return `${(numValue / 1000000).toFixed(decimals)}M`;
  } else if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(decimals)}K`;
  }

  return numValue.toFixed(decimals);
}

/**
 * Format quantity with unit
 * @param {number} quantity - Quantity value
 * @param {string} unit - Unit of measurement (default: pcs)
 * @returns {string} - Formatted quantity string
 */
export function formatQuantity(quantity, unit = "pcs") {
  if (quantity === null || quantity === undefined || isNaN(quantity)) {
    return `0 ${unit}`;
  }

  const numQuantity = Number(quantity);
  return `${numQuantity} ${unit}`;
}

/**
 * Format address for display
 * @param {string} address - Address string
 * @param {number} maxLength - Maximum length before truncation (default: 50)
 * @returns {string} - Formatted address string
 */
export function formatAddress(address, maxLength = 50) {
  if (!address) return "N/A";

  const trimmed = address.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}...`;
}

/**
 * Format customer name with title
 * @param {string} name - Customer name
 * @param {string} title - Title (Mr., Mrs., etc.)
 * @returns {string} - Formatted name with title
 */
export function formatCustomerName(name, title = "") {
  if (!name) return "";

  const trimmedName = name.trim();
  if (!title) return trimmedName;

  return `${title} ${trimmedName}`;
}

/**
 * Format profit margin percentage
 * @param {number} profit - Profit amount
 * @param {number} cost - Cost amount
 * @returns {string} - Formatted profit margin percentage
 */
export function formatProfitMargin(profit, cost) {
  if (!cost || cost === 0) return "0%";

  const margin = (profit / cost) * 100;
  return formatPercentage(margin);
}

/**
 * Format time ago (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted time ago string
 */
export function formatTimeAgo(date) {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

  return formatDate(date);
}
