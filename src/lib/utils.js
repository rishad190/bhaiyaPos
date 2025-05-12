import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const exportToCSV = (data, filename) => {
  // Convert data to CSV string
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values that might contain commas
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  // Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (customer, transactions, type) => {
  // Create a new window for printing
  const printWindow = window.open("", "_blank");

  // Create the HTML content
  const content = `
    <html>
      <head>
        <title>${customer.name} - ${
    type === "customer" ? "Customer Details" : "Transaction Report"
  }</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #333;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .info-card h3 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 16px;
          }
          .info-card p {
            margin: 0;
            color: #666;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            font-size: 14px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 12px 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .total { 
            text-align: right; 
            font-weight: bold;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-top: 20px;
          }
          .total p {
            margin: 0;
            font-size: 16px;
          }
          .total .amount {
            color: #2563eb;
            font-size: 20px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
            .info-grid {
              display: block;
            }
            .info-card {
              margin-bottom: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${customer.name}</h1>
          <p>Customer ID: ${customer.id}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-card">
            <h3>Contact Information</h3>
            <p>Phone: ${customer.phone}</p>
            <p>Email: ${customer.email}</p>
          </div>
          <div class="info-card">
            <h3>Store Information</h3>
            <p>Store ID: ${customer.storeId}</p>
          </div>
          <div class="info-card">
            <h3>Transaction Summary</h3>
            <p>Total Transactions: ${transactions.length}</p>
            <p>Last Transaction: ${
              transactions.length > 0 ? formatDate(transactions[0].date) : "N/A"
            }</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Memo</th>
              <th>Details</th>
              <th>Total</th>
              <th>Deposit</th>
              <th>Due</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${transactions
              .map(
                (t) => `
              <tr>
                <td>${formatDate(t.date)}</td>
                <td>${t.memoNumber}</td>
                <td>${t.details}</td>
                <td>৳${t.total.toLocaleString()}</td>
                <td>৳${t.deposit.toLocaleString()}</td>
                <td>৳${t.due.toLocaleString()}</td>
                <td>৳${t.cumulativeBalance.toLocaleString()}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="total">
          <p>Total Due: <span class="amount">৳${
            transactions.length > 0
              ? transactions[
                  transactions.length - 1
                ].cumulativeBalance.toLocaleString()
              : "0"
          }</span></p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="
            padding: 8px 16px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">Print Report</button>
        </div>
      </body>
    </html>
  `;

  // Write the content to the new window
  printWindow.document.write(content);
  printWindow.document.close();
};
