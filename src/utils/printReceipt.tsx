// PrintReceipt.ts
// Works reliably on Chrome/Windows with Xprinter 72mm thermal printer

import logoSrc from "../assets/logo.jpeg";

export interface PrintItem {
  name: string;
  quantity: number;
  price: number;
  discount?: number;
  warrantyMonths?: number; // Add warranty field
}

export interface ReceiptData {
  invoiceNumber?: string;
  items: PrintItem[];
  customerName?: string;
  customerPhone?: string;
  total: number;
  paid: number;
  subtotal?: number;
  invoiceDiscount?: number;
  paymentReference?: string;
  change?: number;
  balance?: number;
  paymentMode: "cash" | "credit" | "card";
  warrantyMonths?: number; // Add warranty field
}

// ── Step 1: convert the bundled asset to a base64 data URL ──────────────────
function imageToBase64(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.92));
        } else {
          resolve("");
        }
      } catch {
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
}

// ── Step 2: build the full HTML string ──────────────────────────────────────
function buildHTML(data: ReceiptData, logoB64: string): string {
  const now = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Calculate totals
  let subtotal = 0;
  let totalItemDiscount = 0;

  const rows = data.items.map((i, index) => {
    const discount = i.discount || 0;
    const discountedPrice = Math.max(0, i.price - discount);
    const lineTotal = discountedPrice * i.quantity;

    subtotal += i.price * i.quantity;
    totalItemDiscount += discount * i.quantity;

    // No strikethrough - just show price
    const priceDisplay = discount > 0
      ? `<span style="font-size: 12px; font-weight: bold; color: #000;">Rs ${i.price.toFixed(2)}</span> 
         <span style="color: #000; font-size: 12px; font-weight: bold;">(-${discount.toFixed(2)})</span>`
      : `<span style="font-size: 12px; font-weight: bold; color: #000;">Rs ${i.price.toFixed(2)}</span>`;

    // Item separator line - single line only
    const separator = index > 0 ? `<tr><td colspan="2" class="item-separator">- - - - - - - - - - - - - - - -</td></tr>` : '';

    // Add warranty info if available
    const warrantyDisplay = i.warrantyMonths && i.warrantyMonths > 0
      ? `<div style="font-size: 10px; font-weight: 600; color: #000; margin-top: 1px;">Warranty: ${i.warrantyMonths} months</div>`
      : '';

    return `
      ${separator}
      <tr>
        <td colspan="2" class="item-name">${i.name}${warrantyDisplay}</td>
      </tr>
      <tr>
        <td class="qty">${i.quantity} x ${priceDisplay}</td>
        <td class="amount">${lineTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join("");

  const displaySubtotal = data.subtotal ?? subtotal;
  const displayInvoiceDiscount = data.invoiceDiscount ?? 0;
  const totalDiscount = totalItemDiscount + displayInvoiceDiscount;

  const paymentModeDisplay = {
    cash: "Cash",
    card: "Card",
    credit: "Credit"
  }[data.paymentMode] || data.paymentMode;

  const paymentRow = data.paymentMode === "cash" || data.paymentMode === "card"
    ? `<tr><td class="sum-label">Change</td><td class="sum-amount">${(data.change ?? 0).toFixed(2)}</td></tr>`
    : `<tr><td class="sum-label">Balance Due</td><td class="sum-amount">${(data.balance ?? 0).toFixed(2)}</td></tr>`;

  const paymentRefRow = data.paymentReference
    ? `<tr><td class="sum-label">Ref</td><td class="sum-amount" style="font-size:12px;font-weight:bold;color:#000;">${data.paymentReference}</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  /* ── Reset ── */
  * { margin: 0; padding: 0; box-sizing: border-box; }

  /* ── Page: exactly 72mm, unlimited height ── */
  @page { 
    size: 72mm auto; 
    margin: 2mm; 
  }

  html, body {
    width: 72mm;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #000 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .page { 
    padding: 2mm 2mm 8mm 2mm; 
    max-width: 72mm;
  }

  /* ── Logo ── */
  .logo {
    display: block;
    max-width: 60px;
    height: auto;
    margin: 0 auto 4px;
  }

  /* ── HEADER: LEFT ALIGNED ── */
  .header-left {
    text-align: left;
  }

  .shop-name {
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 1px;
    color: #000;
  }
  
  .shop-address {
    font-size: 12px;
    line-height: 1.5;
    color: #000;
    font-weight: 600;
  }

  .meta {
    font-size: 13px;
    line-height: 1.8;
    font-weight: 600;
    color: #000;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .meta-label {
    font-weight: 900;
    color: #000;
    flex-shrink: 0;
    min-width: 45px;
  }

  .meta-value {
    font-weight: 700;
    color: #000;
    text-align: right;
    flex: 1;
  }

  /* ── Divider ── */
  .div {
    width: 100%;
    border: none;
    border-top: 2px solid #000;
    margin: 5px 0;
  }

  /* ── Items table ── */
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  td { 
    padding: 2px 0; 
    font-size: 14px; 
    vertical-align: top;
  }

  .item-name { 
    font-size: 14px; 
    font-weight: 900;
    padding-top: 4px;
    padding-bottom: 1px;
    color: #000;
  }
  
  .item-separator {
    font-size: 12px;
    color: #000;
    text-align: center;
    padding: 3px 0;
    letter-spacing: 2px;
    font-weight: bold;
    line-height: 1;
  }

  .qty { 
    width: 58%; 
    font-size: 13px; 
    padding-left: 4px;
    padding-bottom: 4px;
    font-weight: 600;
    color: #000;
  }
  
  .amount { 
    width: 42%; 
    text-align: right; 
    font-size: 13px;
    font-weight: 900;
    padding-bottom: 4px;
    color: #000;
  }

  /* ── Summary rows ── */
  .sum-label { 
    width: 55%; 
    font-size: 14px;
    font-weight: 700;
    color: #000;
  }
  
  .sum-amount { 
    width: 45%; 
    text-align: right; 
    font-size: 14px;
    font-weight: 900;
    color: #000;
  }

  .total-row td {
    font-size: 18px;
    font-weight: 900;
    padding-top: 5px;
    padding-bottom: 3px;
    color: #000;
  }
  
  .discount-row td {
    font-size: 14px;
    color: #000;
    font-weight: 900;
    padding-top: 3px;
  }

  .subtotal-row td {
    font-size: 14px;
    color: #000;
    font-weight: 700;
    padding-top: 3px;
  }

  /* ── FOOTER: CENTER ALIGNED ── */
  .footer {
    text-align: center;
    font-size: 13px;
    margin-top: 4px;
    font-weight: 600;
    color: #000;
  }
  
  .footer-brand { 
    margin-top: 6px; 
    font-size: 11px; 
    color: #000;
    font-weight: 600;
  }
  
  .footer-thanks {
    font-size: 16px;
    font-weight: 900;
    margin-top: 5px;
    color: #000;
  }

  .footer-no-return {
    font-size: 12px;
    color: #000;
    margin-top: 3px;
    font-weight: 700;
  }

  /* ── Print-specific ── */
  @media print {
    body { margin: 0; padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="page">

  ${logoB64 ? `<img class="logo" src="${logoB64}" alt="Logo" />` : ""}

  <!-- HEADER: LEFT ALIGNED -->
  <div class="header-left">
    <div class="shop-name">Karrali Manufacture</div>
    <div class="shop-address">No 69, Palaly Road, Thirunelveli, Jaffna</div>
    <div class="shop-address">Tel: 0776925633</div>
  </div>

  <hr class="div">

  <!-- META INFO: LEFT ALIGNED WITH RIGHT ALIGNED VALUES -->
  <div class="meta">
    ${data.invoiceNumber ? `<div class="meta-row"><span class="meta-label">Invoice:</span><span class="meta-value">${data.invoiceNumber}</span></div>` : ""}
    <div class="meta-row"><span class="meta-label">Date:</span><span class="meta-value">${now}</span></div>
    <div class="meta-row"><span class="meta-label">Cashier:</span><span class="meta-value">M. Thivaharan</span></div>
    ${data.customerName ? `<div class="meta-row"><span class="meta-label">Customer:</span><span class="meta-value">${data.customerName}</span></div>` : ""}
    ${data.customerPhone ? `<div class="meta-row"><span class="meta-label">Phone:</span><span class="meta-value">${data.customerPhone}</span></div>` : ""}
    <div class="meta-row"><span class="meta-label">Payment:</span><span class="meta-value">${paymentModeDisplay}</span></div>
    ${data.paymentReference ? `<div class="meta-row"><span class="meta-label">Ref:</span><span class="meta-value">${data.paymentReference}</span></div>` : ""}
  </div>

  <hr class="div">

  <!-- ITEMS -->
  <table><tbody>${rows}</tbody></table>

  <hr class="div">

  <!-- SUMMARY -->
  <table>
    <tbody>
      <tr class="subtotal-row">
        <td class="sum-label">Subtotal</td>
        <td class="sum-amount">${displaySubtotal.toFixed(2)}</td>
      </tr>
      
      ${displayInvoiceDiscount > 0 ? `
      <tr class="discount-row">
        <td class="sum-label">Invoice Discount</td>
        <td class="sum-amount">-${displayInvoiceDiscount.toFixed(2)}</td>
      </tr>
      ` : ''}
      
      ${totalDiscount > 0 ? `
      <tr class="discount-row">
        <td class="sum-label">Total Discount</td>
        <td class="sum-amount">-${totalDiscount.toFixed(2)}</td>
      </tr>
      ` : ''}
      
      <tr class="total-row">
        <td class="sum-label">TOTAL</td>
        <td class="sum-amount">${data.total.toFixed(2)}</td>
      </tr>
      
      <tr>
        <td class="sum-label">Paid</td>
        <td class="sum-amount">${data.paid.toFixed(2)}</td>
      </tr>
      
      ${paymentRow}
      ${paymentRefRow}
    </tbody>
  </table>

  <hr class="div">

  <!-- FOOTER: CENTER ALIGNED -->
  <div class="footer">
    <div class="footer-no-return">No Return • No Cash Refund</div>
    <div class="footer-thanks">Thank You! Come Again</div>
    <div class="footer-brand">Powered by MYLInnovations</div>
  </div>

</div>

<script>
  // Auto-print when loaded
  (function() {
    if (document.readyState === 'complete') {
      printAndClose();
    } else {
      window.addEventListener('load', printAndClose);
    }
    
    function printAndClose() {
      setTimeout(function() {
        window.print();
        setTimeout(function() { 
          window.close(); 
        }, 2000);
      }, 500);
    }
  })();
</script>
</body>
</html>`;
}

// ── Step 3: turn the HTML into a Blob URL and open it ───────────────────────
export async function printReceipt(data: ReceiptData): Promise<void> {
  try {
    const logoB64 = await imageToBase64(logoSrc);
    const html = buildHTML(data, logoB64);

    const blob = new Blob([html], {
      type: "text/html;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);

    const win = window.open(url, "_blank", "width=300,height=600");

    if (!win) {
      console.warn("Popup blocked, opening in current window");
      const fallbackWin = window.open(url, "_blank");
      if (!fallbackWin) {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.top = "0";
        iframe.style.left = "0";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.style.zIndex = "9999";
        iframe.src = url;
        document.body.appendChild(iframe);

        setTimeout(() => {
          iframe.remove();
        }, 5000);
      }
    } else {
      win.addEventListener("load", () => {
        URL.revokeObjectURL(url);
      });
    }
  } catch (error) {
    console.error("Print error:", error);
    alert("Unable to print receipt. Please check your printer connection.");
  }
}

// ── Utility: Test print ──
export async function testPrint(): Promise<void> {
  const testData: ReceiptData = {
    invoiceNumber: "TEST-001",
    items: [
      { name: "Test Product 1", quantity: 2, price: 100, discount: 10, warrantyMonths: 12 },
      { name: "Test Product 2", quantity: 1, price: 50, discount: 0, warrantyMonths: 6 },
      { name: "Test Product 3", quantity: 3, price: 75, discount: 5, warrantyMonths: 24 },
    ],
    customerName: "Test Customer",
    customerPhone: "0771234567",
    total: 395,
    paid: 400,
    subtotal: 400,
    invoiceDiscount: 10,
    change: 5,
    paymentMode: "cash",
  };

  await printReceipt(testData);
}