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
    // Create new document with slightly larger margins
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Add fonts if needed
    // doc.addFont('path/to/font.ttf', 'CustomFont', 'normal');

    // Set initial position
    let yPos = 15;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Define colors
    const primaryColor = [41, 128, 185]; // Blue
    const secondaryColor = [52, 73, 94]; // Dark blue-gray
    const accentColor = [46, 204, 113]; // Green
    const warningColor = [231, 76, 60]; // Red
    const textColor = [44, 62, 80]; // Dark gray
    const lightGray = [189, 195, 199]; // Light gray

    // Add a colored header bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 25, "F");

    // Add company logo
    // Note: In a real implementation, you would need to load the logo from a URL or base64 string
    // For this example, we'll create a simple logo placeholder
    const logoSize = 15;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 5, logoSize, logoSize, 2, 2, "F");

    // Add a simple "SF" text as a logo placeholder
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("SF", margin + logoSize / 2 - 3, 13);

    // Add company name next to logo
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Sky Fabric's", margin + logoSize + 5, 15);

    // Add document title
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${type === "customer" ? "Customer" : "Supplier"} Statement`,
      pageWidth - margin,
      15,
      { align: "right" }
    );

    yPos = 35;

    // Add report generation info
    doc.setFontSize(9);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(
      `Generated on: ${formatDate(new Date())}`,
      pageWidth - margin,
      yPos,
      { align: "right" }
    );

    yPos += 10;

    // Entity Info Section with modern card-like design
    doc.setFillColor(249, 249, 249); // Very light gray background
    doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, "F");
    doc.setDrawColor(230, 230, 230); // Light gray border
    doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, "S");

    yPos += 5;

    // Entity title
    doc.setFontSize(14);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(
      `${type === "customer" ? "Customer" : "Supplier"} Information`,
      margin + 5,
      yPos + 7
    );

    // Entity details
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont("helvetica", "normal");

    // Left column
    doc.text(`Name: ${entity.name}`, margin + 5, yPos + 17);
    doc.text(`Phone: ${entity.phone}`, margin + 5, yPos + 25);

    // Right column
    doc.text(`ID: ${entity.id}`, margin + contentWidth / 2, yPos + 17);
    doc.text(
      `Store: ${entity.storeId || "Main Store"}`,
      margin + contentWidth / 2,
      yPos + 25
    );

    yPos += 45;

    // Financial Summary with modern card design
    // Create three cards for financial summary
    const cardWidth = contentWidth / 3 - 5;

    // Function to create a summary card
    const createSummaryCard = (title, value, color, x, y) => {
      // Card background
      doc.setFillColor(249, 249, 249);
      doc.roundedRect(x, y, cardWidth, 30, 3, 3, "F");
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(x, y, cardWidth, 30, 3, 3, "S");

      // Colored indicator
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(x, y, 5, 30, "F");

      // Title
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text(title, x + 10, y + 10);

      // Value
      doc.setFontSize(12);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont("helvetica", "bold");
      doc.text(value, x + 10, y + 22);
    };

    // Calculate summary values
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

    // Create the three summary cards
    createSummaryCard(
      type === "customer" ? "Total Bill" : "Total Amount",
      formatCurrencyWithSymbol(totalAmount),
      primaryColor,
      margin,
      yPos
    );

    createSummaryCard(
      type === "customer" ? "Total Deposit" : "Total Paid",
      formatCurrencyWithSymbol(totalPaid),
      accentColor,
      margin + cardWidth + 5,
      yPos
    );

    createSummaryCard(
      "Total Due",
      formatCurrencyWithSymbol(totalDue),
      totalDue > 0 ? warningColor : accentColor,
      margin + (cardWidth + 5) * 2,
      yPos
    );

    yPos += 40;

    // Section title for transactions
    doc.setFontSize(14);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Transaction History", margin, yPos);

    yPos += 10;

    // Transactions Table with modern styling
    const headers =
      type === "customer"
        ? [["Date", "Memo", "Details", "Total", "Deposit", "Due", "Balance"]]
        : [["Date", "Invoice", "Details", "Total", "Paid", "Due", "Balance"]];

    // Map transaction data based on type
    const data = transactions.map((t, index) => {
      // Alternate row background colors for better readability
      const rowColor = index % 2 === 0 ? [249, 249, 249] : [255, 255, 255];

      return {
        content:
          type === "customer"
            ? [
                formatDate(t.date),
                t.memoNumber || "",
                t.details || "",
                formatCurrencyWithSymbol(Number(t.total) || 0),
                formatCurrencyWithSymbol(Number(t.deposit) || 0),
                formatCurrencyWithSymbol(Number(t.due) || 0),
                formatCurrencyWithSymbol(Number(t.cumulativeBalance) || 0),
              ]
            : [
                formatDate(t.date),
                t.invoiceNumber || "",
                t.details || "",
                formatCurrencyWithSymbol(Number(t.totalAmount) || 0),
                formatCurrencyWithSymbol(Number(t.paidAmount) || 0),
                formatCurrencyWithSymbol(Number(t.due) || 0),
                formatCurrencyWithSymbol(Number(t.cumulativeBalance) || 0),
              ],
        styles: { fillColor: rowColor },
      };
    });

    // Add a total row at the end

    // Transactions table with modern styling
    let finalY;
    autoTable(doc, {
      startY: yPos,
      head: headers,
      body: data.map((row) => row.content),

      willDrawCell: (data) => {
        // Apply custom styling to rows
        if (data.row.index % 2 === 0 && data.section === "body") {
          data.cell.styles.fillColor = [249, 249, 249];
        }

        // Style the footer row
        if (data.section === "foot") {
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontStyle = "bold";

          // Style the "TOTAL" text
          if (data.column.index === 2) {
            data.cell.styles.halign = "right";
          }

          // Style the total due amount
          if (data.column.index === 5) {
            data.cell.styles.textColor =
              totalDue > 0 ? warningColor : accentColor;
          }
        }
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
        halign: "left",
        cellPadding: 5,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 5,
        textColor: [70, 70, 70],
      },
      footStyles: {
        fontSize: 10,
        cellPadding: 5,
        textColor: [50, 50, 50],
        fillColor: [240, 240, 240],
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Date
        1: { cellWidth: 20 }, // Memo/Invoice
        2: { cellWidth: 40 }, // Details
        3: { cellWidth: 25, halign: "right" }, // Total
        4: { cellWidth: 25, halign: "right" }, // Deposit/Paid
        5: { cellWidth: 25, halign: "right" }, // Due
        6: { cellWidth: 25, halign: "right" }, // Balance
      },
      margin: { left: margin, right: margin },
      tableWidth: "auto",
      styles: {
        overflow: "linebreak",
        cellWidth: "wrap",
      },
      didParseCell: (data) => {
        // Add special styling for monetary values
        const col = data.column.index;
        if (col >= 3 && col <= 6 && data.section === "body") {
          data.cell.styles.fontStyle = "bold";

          // Color coding for financial values
          if (
            col === 5 &&
            data.cell.raw &&
            Number.parseFloat(data.cell.raw.replace(/[^\d.-]/g, "")) > 0
          ) {
            data.cell.styles.textColor = warningColor;
          } else if (col === 4) {
            data.cell.styles.textColor = accentColor;
          }
        }
      },
      didDrawPage: (data) => {
        finalY = data.cursor.y;
      },
    });

    // Add a note about the total due
    if (totalDue > 0) {
      finalY += 10;
      doc.setFontSize(10);
      doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Note: Total outstanding balance of ${formatCurrencyWithSymbol(
          totalDue
        )} is due.`,
        pageWidth - margin,
        finalY,
        { align: "right" }
      );
    } else {
      finalY += 10;
      doc.setFontSize(10);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(
        "Note: All payments are settled. No outstanding balance.",
        pageWidth - margin,
        finalY,
        {
          align: "right",
        }
      );
    }

    // Add footer to each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Add colored footer bar
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.8);
      doc.rect(0, doc.internal.pageSize.height - 15, pageWidth, 15, "F");

      // Add logo in footer
      doc.setFillColor(255, 255, 255);
      const footerLogoSize = 8;
      doc.roundedRect(
        margin,
        doc.internal.pageSize.height - 11.5,
        footerLogoSize,
        footerLogoSize,
        1,
        1,
        "F"
      );

      // Add "SF" text in footer logo
      doc.setFontSize(6);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(
        "SF",
        margin + footerLogoSize / 2 - 1.5,
        doc.internal.pageSize.height - 7
      );

      // Add page numbers
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 7,
        { align: "center" }
      );

      // Add company info in footer
      doc.setFontSize(8);
      doc.text(
        "Sky Fabric's",
        margin + footerLogoSize + 5,
        doc.internal.pageSize.height - 7
      );

      // Add timestamp
      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        pageWidth - margin,
        doc.internal.pageSize.height - 7,
        {
          align: "right",
        }
      );
    }

    // Save the PDF
    const fileName = `${entity.name.replace(/\s+/g, "-")}-${type}-statement-${
      new Date().toISOString().split("T")[0]
    }.pdf`;
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
