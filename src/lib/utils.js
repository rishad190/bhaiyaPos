import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatLargeNumber(num) {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(2) + ' Crore';
  } else if (num >= 100000) {
    return (num / 100000).toFixed(2) + ' Lakh';
  } else {
    return num.toLocaleString('en-IN');
  }
}

// Format date to DD-MM-YYYY
export const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

// Format currency with proper error handling
export const formatCurrency = (amount) => {
  try {
    if (amount === undefined || amount === null) return "0";
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      throw new Error("Invalid amount");
    }
    return `${numAmount.toLocaleString("en-IN")}`;
  } catch (error) {
    console.error("Error formatting currency:", error);
    return "0";
  }
};
