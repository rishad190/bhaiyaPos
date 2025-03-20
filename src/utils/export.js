import { formatDate } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
export const formatCurrencyWithSymbol = (amount) => {
  if (amount === undefined || amount === null) return "৳0";
  return amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
};
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
    // Create new document
    const doc = new jsPDF();
    let yPos = 15;

    // Header with company name
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, doc.internal.pageSize.width, 30, "F");

    // Company name
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Sky Fabric's", 15, 20);

    // Document type
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${type === "customer" ? "Customer" : "Supplier"} Statement`,
      doc.internal.pageSize.width - 15,
      20,
      { align: "right" }
    );

    // Update starting position for rest of content
    yPos = 40;

    // Rest of the content
    doc.setTextColor(0, 0, 0);

    // Format currency consistently
    const formatCurrency = (amount) => {
      if (amount === undefined || amount === null) return "৳0";
      return amount.toLocaleString("en-IN");
    };

    // Entity Info Section
    const entityInfo = [
      [
        `${type === "customer" ? "Customer" : "Supplier"}: ${entity.name}`,
        `ID: ${entity.id}`,
      ],
      [`Phone: ${entity.phone}`, `Store: ${entity.storeId || "Main Store"}`],
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

    // Calculate totals
    const totalAmount =
      type === "customer"
        ? transactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0)
        : transactions.reduce(
            (sum, t) => sum + (Number(t.totalAmount) || 0),
            0
          );

    const totalPaid =
      type === "customer"
        ? transactions.reduce((sum, t) => sum + (Number(t.deposit) || 0), 0)
        : transactions.reduce((sum, t) => sum + (Number(t.paidAmount) || 0), 0);

    const totalDue = transactions.reduce(
      (sum, t) => sum + (Number(t.due) || 0),
      0
    );

    // Financial Summary
    const summaryData =
      type === "customer"
        ? [
            ["Total Bill", "Total Deposit", "Total Due"],
            [
              formatCurrency(totalAmount),
              formatCurrency(totalPaid),
              formatCurrency(totalDue),
            ],
          ]
        : [
            ["Total Amount", "Total Paid", "Total Due"],
            [
              formatCurrency(totalAmount),
              formatCurrency(totalPaid),
              formatCurrency(totalDue),
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
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        halign: "right",
      },
      didDrawPage: (data) => {
        yPos = data.cursor.y + 10;
      },
    });

    // Transactions Table Headers
    const headers =
      type === "customer"
        ? [["Date", "Memo", "Details", "Total", "Deposit", "Due", "Balance"]]
        : [["Date", "Invoice", "Details", "Total", "Paid", "Due", "Balance"]];

    // Map transaction data
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

    // Transactions Table
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
        fontStyle: "bold",
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
      didDrawPage: (data) => {
        // Add page numbers on each page
        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Page ${pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      },
    });

    // After the transactions table, add a final summary
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(
      doc.internal.pageSize.width - 80,
      doc.internal.pageSize.height - 40,
      doc.internal.pageSize.width - 10,
      doc.internal.pageSize.height - 40
    );

    // Add total due summary
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.setFont("helvetica", "bold");
    doc.text(
      "Total Outstanding:",
      doc.internal.pageSize.width - 80,
      doc.internal.pageSize.height - 30
    );

    doc.setTextColor(totalDue > 0 ? "#e74c3c" : "#27ae60");
    doc.setFont("helvetica", "bold");
    doc.text(
      formatCurrency(totalDue),
      doc.internal.pageSize.width - 10,
      doc.internal.pageSize.height - 30,
      { align: "right" }
    );

    // Add a note if there's due amount
    if (totalDue > 0) {
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.setFont("helvetica", "normal");
      doc.text(
        "* Please clear outstanding dues at your earliest convenience",
        doc.internal.pageSize.width - 80,
        doc.internal.pageSize.height - 25
      );
    }

    // Save PDF
    const fileName = `${entity.name.replace(
      /\s+/g,
      "-"
    )}-${type}-statement-${formatDate(new Date())}.pdf`;
    doc.save(fileName);
    return fileName;
  } catch (error) {
    console.error("Error exporting PDF:", error);
    alert("Failed to export PDF. Please try again.");
    return null;
  }
};
export const addImageToPDF = (doc, imgData, x, y, width, height) => {
  try {
    // Add image to PDF
    doc.addImage(imgData, "PNG", x, y, width, height);
    return true;
  } catch (error) {
    console.error("Error adding image to PDF:", error);
    return false;
  }
};
