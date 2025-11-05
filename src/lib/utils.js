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
    if (amount === undefined || amount === null) return "৳0";
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      throw new Error("Invalid amount");
    }
    return `৳${formatLargeNumber(numAmount)}`;
  } catch (error) {
    console.error("Error formatting currency:", error);
    return "৳0";
  }
};

export const printElement = (elementId, title = "Print") => {
  const printContent = document.getElementById(elementId);
  if (!printContent) {
    console.error("Print Error: Element to print not found");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    console.error("Print Error: Could not open print window");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
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