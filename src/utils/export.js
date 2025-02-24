import { Button } from "@/components/ui/button";

// utils/export.js
export const exportToCSV = (data, filename) => {
  const formatValue = (value, header) => {
    // Format memo number to show only the last part
    if (header === "Memo" && typeof value === "string" && value.includes("/")) {
      return value.split("/").pop();
    }

    // Format date strings
    if (
      value instanceof Date ||
      (typeof value === "string" && !isNaN(Date.parse(value)))
    ) {
      return new Date(value).toLocaleDateString("en-IN");
    }

    // Format currency values
    if (typeof value === "number") {
      return value.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }

    // Escape special characters and wrap in quotes if contains comma
    return typeof value === "string" && value.includes(",")
      ? `"${value}"`
      : value;
  };

  try {
    const BOM = "\uFEFF";
    const headers = Object.keys(data[0]);
    const csvContent =
      BOM +
      [
        headers.join(","),
        ...data.map((row) =>
          headers.map((header) => formatValue(row[header], header)).join(",")
        ),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    alert("Failed to export data. Please try again.");
  }
};

// utils/export.js
export const exportToPDF = (customer, transactions) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN");
  };

  const doc = new jsPDF();

  // Customer Info
  doc.setFontSize(18);
  doc.text(`Customer: ${customer.name}`, 20, 20);
  doc.setFontSize(12);
  doc.text(`Phone: ${customer.phone}`, 20, 30);
  doc.text(`Store: ${customer.storeId}`, 20, 40);
  doc.text(`Report Date: ${formatDate(new Date())}`, 20, 50);

  // Transactions Table
  const headers = [
    ["Date", "Memo", "Details", "Total", "Deposit", "Due", "Balance"],
  ];
  const data = transactions.map((t) => [
    formatDate(t.date),
    t.memoNumber,
    t.details || "",
    `${t.total.toLocaleString()}`,
    `${t.deposit.toLocaleString()}`,
    `${t.due.toLocaleString()}`,
    `${t.cumulativeBalance.toLocaleString()}`,
  ]);

  doc.autoTable({
    startY: 60,
    head: headers,
    body: data,
    theme: "grid",
    styles: { fontSize: 10 },
    headerStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`${customer.name}-transactions-${formatDate(new Date())}.pdf`);
};

// Usage in CustomerDetail component
<Button
  variant="outline"
  onClick={() => exportToPDF(customer, customerTransactions)}
>
  Export PDF
</Button>;
