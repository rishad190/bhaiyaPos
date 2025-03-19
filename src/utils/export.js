import { formatDate } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToCSV = (data, filename) => {
  const formatValue = (value, header) => {
    // Format memo to show only numeric part
    if (header === "Memo" && typeof value === "string") {
      return value.replace(/\D/g, ""); // Remove all non-numeric characters
    }

    // Format all date strings as DD-MM-YYYY
    if (
      value instanceof Date ||
      (typeof value === "string" && !isNaN(Date.parse(value)))
    ) {
      const date = new Date(value);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`; // Converts to DD-MM-YYYY
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

export const exportToPDF = (entity, transactions, type = "customer") => {
  try {
    const doc = new jsPDF();
    let yPos = 15;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text(
      `${type === "customer" ? "Customer" : "Supplier"} Statement`,
      105,
      yPos,
      { align: "center" }
    );
    yPos += 20;

    // Format currency consistently
    const formatCurrency = (amount) => {
      if (amount === undefined || amount === null) return "0";
      return amount.toLocaleString("en");
    };

    // Entity Info Section
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const entityInfo = [
      [
        `${type === "customer" ? "Customer" : "Supplier"}: ${entity.name}`,
        `ID: ${entity.id}`,
      ],
      [`Phone: ${entity.phone}`, `Store: ${entity.storeId}`],
      [`Report Date: ${formatDate(new Date())}`, ""],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: entityInfo,
      theme: "plain",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 90 },
      },
      didDrawPage: (data) => {
        yPos = data.cursor.y + 10;
      },
    });

    // Financial Summary
    const summaryData =
      type === "customer"
        ? [
            ["Total Bill", "Total Deposit", "Total Due"],
            [
              formatCurrency(
                transactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0)
              ),
              formatCurrency(
                transactions.reduce(
                  (sum, t) => sum + (Number(t.deposit) || 0),
                  0
                )
              ),
              formatCurrency(
                transactions.reduce((sum, t) => sum + (Number(t.due) || 0), 0)
              ),
            ],
          ]
        : [
            ["Total Amount", "Total Paid", "Total Due"],
            [
              formatCurrency(
                transactions.reduce(
                  (sum, t) => sum + (Number(t.totalAmount) || 0),
                  0
                )
              ),
              formatCurrency(
                transactions.reduce(
                  (sum, t) => sum + (Number(t.paidAmount) || 0),
                  0
                )
              ),
              formatCurrency(
                transactions.reduce((sum, t) => sum + (Number(t.due) || 0), 0)
              ),
            ],
          ];

    autoTable(doc, {
      startY: yPos,
      head: [summaryData[0]],
      body: [summaryData[1]],
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 10,
      },
      styles: { fontSize: 10, halign: "right" },
      didDrawPage: (data) => {
        yPos = data.cursor.y + 10;
      },
    });

    // Transactions Table
    const headers =
      type === "customer"
        ? [["Date", "Memo", "Details", "Total", "Deposit", "Due", "Balance"]]
        : [["Date", "Invoice", "Details", "Total", "Paid", "Due", "Balance"]];

    // Map transaction data based on type
    const data = transactions.map((t) =>
      type === "customer"
        ? [
            formatDate(t.date),
            t.memoNumber || "",
            t.details || "",
            formatCurrency(Number(t.total) || 0),
            formatCurrency(Number(t.deposit) || 0),
            formatCurrency(Number(t.due) || 0),
            formatCurrency(Number(t.cumulativeBalance) || 0),
          ]
        : [
            formatDate(t.date),
            t.invoiceNumber || "",
            t.details || "",
            formatCurrency(Number(t.totalAmount) || 0),
            formatCurrency(Number(t.paidAmount) || 0),
            formatCurrency(Number(t.due) || 0),
            formatCurrency(Number(t.cumulativeBalance) || 0),
          ]
    );

    // Transactions table
    autoTable(doc, {
      startY: yPos,
      head: headers,
      body: data,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 40 },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 25, halign: "right" },
        6: { cellWidth: 25, halign: "right" },
      },
      margin: { left: 10 },
    });

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    doc.save(`${entity.name}-transactions-${formatDate(new Date())}.pdf`);
  } catch (error) {
    console.error("Error exporting PDF:", error);
    alert("Failed to export PDF. Please try again.");
  }
};
