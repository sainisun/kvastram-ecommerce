import PDFDocument from "pdfkit";

export const generateInvoice = async (
  order: any,
  items: any[],
): Promise<Buffer> => {
  const doc = new PDFDocument({ margin: 50 });

  const buffers: any[] = [];
  doc.on("data", buffers.push.bind(buffers));

  // -- Header --
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text("INVOICE", 50, 57)
    .fontSize(10)
    .text("Kvastram", 200, 65, { align: "right" })
    .text("support@kvastram.com", 200, 80, { align: "right" })
    .moveDown();

  // -- Order Info --
  doc
    .fillColor("#000000")
    .fontSize(12)
    .text(`Invoice Number: ${order.order_number}`, 50, 130)
    .text(
      `Invoice Date: ${new Date(order.created_at).toLocaleDateString()}`,
      50,
      145,
    )
    .text(`Balance Due: $${(order.total / 100).toFixed(2)}`, 50, 160)
    .moveDown();

  // -- Customer Info --
  doc
    .text(`Bill To:`, 300, 130)
    .text(
      `${order.customer_first_name || ""} ${order.customer_last_name || ""}`,
      300,
      145,
    )
    .text(order.email, 300, 160);

  // Try to parse billing address if available
  try {
    if (order.billing_address) {
      const addr =
        typeof order.billing_address === "string"
          ? JSON.parse(order.billing_address)
          : order.billing_address;

      if (addr.street) doc.text(addr.street, 300, 175);
      if (addr.city && addr.country)
        doc.text(`${addr.city}, ${addr.country}`, 300, 190);
    }
  } catch (e) {
    // Log error but don't fail invoice generation
    console.warn(
      `[PDF Service] Failed to parse billing address for order ${order.id}:`,
      e,
    );
    // Continue without billing address - invoice is still valid
  }

  doc.moveDown();

  // -- Table Header --
  let y = 230;
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Item", 50, y, { width: 250 })
    .text("Unit Cost", 300, y, { width: 90, align: "right" })
    .text("Qty", 400, y, { width: 50, align: "right" })
    .text("Total", 450, y, { width: 90, align: "right" });

  doc
    .moveTo(50, y + 15)
    .lineTo(550, y + 15)
    .stroke();
  y += 30;

  // -- Items --
  doc.font("Helvetica");
  for (const item of items) {
    const title = item.product_title || "Unknown Product";
    const variant = item.variant_title ? ` (${item.variant_title})` : "";
    const name = title + variant;
    const price = (item.unit_price / 100).toFixed(2);
    const total = (item.total / 100).toFixed(2);

    // Handle potentially long names
    const nameHeight = doc.heightOfString(name, { width: 250 });

    doc
      .text(name, 50, y, { width: 250 })
      .text(`$${price}`, 300, y, { width: 90, align: "right" })
      .text(item.quantity.toString(), 400, y, { width: 50, align: "right" })
      .text(`$${total}`, 450, y, { width: 90, align: "right" });

    y += Math.max(20, nameHeight + 5);

    // Page break check (simplified)
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
  }

  doc
    .moveTo(50, y + 10)
    .lineTo(550, y + 10)
    .stroke();
  y += 25;

  // -- Totals --
  const rightAlign = 450;

  doc.text("Subtotal:", 350, y, { width: 90, align: "right" });
  doc.text(`$${(order.subtotal / 100).toFixed(2)}`, rightAlign, y, {
    width: 90,
    align: "right",
  });
  y += 20;

  if (order.shipping_total > 0) {
    doc.text("Shipping:", 350, y, { width: 90, align: "right" });
    doc.text(`$${(order.shipping_total / 100).toFixed(2)}`, rightAlign, y, {
      width: 90,
      align: "right",
    });
    y += 20;
  }

  if (order.tax_total > 0) {
    doc.text("Tax:", 350, y, { width: 90, align: "right" });
    doc.text(`$${(order.tax_total / 100).toFixed(2)}`, rightAlign, y, {
      width: 90,
      align: "right",
    });
    y += 20;
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("Total:", 350, y, { width: 90, align: "right" });
  doc.text(`$${(order.total / 100).toFixed(2)}`, rightAlign, y, {
    width: 90,
    align: "right",
  });

  doc.end();

  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
  });
};
