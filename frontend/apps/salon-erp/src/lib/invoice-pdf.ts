import type { AppointmentTableItem } from "@/src/components/appointments/AppointmentTable";
import type { Customer, Invoice, SalonSettings, Service } from "@/src/lib/erp-store";

// jsPDF's built-in fonts have no ₹ glyph, so amounts are written as "Rs." to stay legible.
const rs = (value: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export type InvoiceContext = {
  invoice: Invoice;
  customer?: Customer;
  appointment?: AppointmentTableItem;
  settings: SalonSettings;
  catalog: Service[];
};

const statusColor: Record<Invoice["status"], [number, number, number]> = {
  Paid: [5, 150, 105],
  Pending: [217, 119, 6],
  "Partially Paid": [217, 119, 6],
  Refunded: [124, 58, 237],
};

export async function buildInvoicePdf({ invoice, customer, appointment, settings, catalog }: InvoiceContext) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const margin = 40;
  const ink: [number, number, number] = [24, 24, 27];
  const muted: [number, number, number] = [113, 113, 122];

  // Header band
  doc.setFillColor(...ink);
  doc.rect(0, 0, width, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(settings.salonName || "Salon", margin, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const headerLines = [
    [settings.address, settings.city, settings.state, settings.postalCode].filter(Boolean).join(", "),
    [settings.phone && `Phone: ${settings.phone}`, settings.email].filter(Boolean).join("   "),
    settings.gstin ? `GSTIN: ${settings.gstin}` : "",
  ].filter(Boolean);
  headerLines.forEach((line, index) => doc.text(line, margin, 62 + index * 12, { maxWidth: width / 2 }));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("INVOICE", width - margin, 46, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(invoice.invoiceNumber ?? "INV-DRAFT", width - margin, 64, { align: "right" });

  // Bill-to + meta
  doc.setTextColor(...muted);
  doc.setFontSize(8);
  doc.text("BILLED TO", margin, 128);
  doc.text("INVOICE DETAILS", width - margin - 170, 128);
  doc.setTextColor(...ink);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(customer?.name ?? "Walk-in Guest", margin, 145);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (customer?.phone) doc.text(customer.phone, margin, 159);
  if (customer?.email) doc.text(customer.email, margin, 172);
  const meta: [string, string][] = [
    ["Date", invoice.createdAt],
    ...(appointment ? ([["Appointment", appointment.appointment.appointmentNumber]] as [string, string][]) : []),
    ...(appointment?.stylist.name && appointment.stylist.id !== "unassigned" ? ([["Stylist", appointment.stylist.name]] as [string, string][]) : []),
  ];
  meta.forEach(([label, value], index) => {
    doc.setTextColor(...muted);
    doc.text(label, width - margin - 170, 145 + index * 14);
    doc.setTextColor(...ink);
    doc.text(String(value), width - margin, 145 + index * 14, { align: "right" });
  });

  // Line items
  const rows: [string, string][] = [];
  let itemsTotal = 0;
  if (appointment && appointment.services.length > 0) {
    for (const service of appointment.services) {
      const known = catalog.find((item) => item.id === service.id || item.name === service.name);
      const price = known?.price ?? 0;
      itemsTotal += price;
      rows.push([service.name, known ? rs(price) : "—"]);
    }
  } else {
    itemsTotal = invoice.amount;
    rows.push(["Salon services", rs(invoice.amount)]);
  }
  const adjustment = Math.round((invoice.amount - itemsTotal) * 100) / 100;
  if (appointment && adjustment !== 0 && itemsTotal > 0) {
    rows.push([adjustment < 0 ? "Discount / loyalty adjustment" : "Additional charges", `${adjustment < 0 ? "-" : ""}${rs(Math.abs(adjustment))}`]);
  }

  autoTable(doc, {
    startY: 200,
    head: [["Description", "Amount"]],
    body: rows,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: { top: 8, bottom: 8, left: 8, right: 8 }, textColor: ink },
    headStyles: { fillColor: [244, 244, 245], textColor: muted, fontStyle: "bold", fontSize: 8 },
    columnStyles: { 1: { halign: "right", cellWidth: 130 } },
    bodyStyles: { lineColor: [228, 228, 231], lineWidth: { bottom: 0.5 } },
    margin: { left: margin, right: margin },
  });

  // Totals
  const tableEnd = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 260;
  let y = tableEnd + 24;
  const labelX = width - margin - 200;
  const line = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 9.5);
    doc.setTextColor(...(bold ? ink : muted));
    doc.text(label, labelX, y);
    doc.setTextColor(...ink);
    doc.text(value, width - margin, y, { align: "right" });
    y += bold ? 20 : 15;
  };
  const rate = Number(settings.taxRate) || 0;
  if (rate > 0) {
    const taxable = invoice.amount / (1 + rate / 100);
    const tax = invoice.amount - taxable;
    line("Taxable value", rs(taxable));
    line(`CGST @ ${(rate / 2).toFixed(1)}%`, rs(tax / 2));
    line(`SGST @ ${(rate / 2).toFixed(1)}%`, rs(tax / 2));
    doc.setDrawColor(228, 228, 231);
    doc.line(labelX, y - 8, width - margin, y - 8);
  }
  y += 4;
  line("Total", rs(invoice.amount), true);

  // Status stamp
  const [r, g, b] = statusColor[invoice.status] ?? muted;
  doc.setDrawColor(r, g, b);
  doc.setTextColor(r, g, b);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin, tableEnd + 18, 110, 34, 6, 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(invoice.status.toUpperCase(), margin + 55, tableEnd + 40, { align: "center" });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.text("Thank you for visiting us. This is a computer-generated invoice.", width / 2, pageHeight - 36, { align: "center" });
  return doc;
}

export async function downloadInvoicePdf(context: InvoiceContext) {
  const doc = await buildInvoicePdf(context);
  doc.save(`${context.invoice.invoiceNumber ?? "invoice"}.pdf`);
}

export async function printInvoicePdf(context: InvoiceContext) {
  const doc = await buildInvoicePdf(context);
  doc.autoPrint();
  const url = doc.output("bloburl") as unknown as string;
  window.open(url, "_blank", "noopener");
}
