import type { Quotation } from "../api/quotationsApi";

// ── Helpers ────────────────────────────────────────────────────────
function fmt(n: number): string {
    return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberToWords(num: number): string {
    if (num === 0) return "Zero";
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numToWords = (n: number): string => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
        if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
        if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
        return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
    };

    const rupees = Math.floor(num);
    const cents = Math.round((num - rupees) * 100);
    let result = numToWords(rupees) + ' Rupees';
    if (cents > 0) result += ' and ' + numToWords(cents) + ' Cents';
    return result;
}

export async function printA4Quotation(quotation: Quotation): Promise<void> {
    const createdDate = new Date(quotation.CreatedAt);

    // Valid until — 30 days from creation
    const validUntil = new Date(createdDate);
    validUntil.setDate(validUntil.getDate() + 30);

    const dateStr = createdDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const validUntilStr = validUntil.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    // ── Compute totals from items ──────────────────────────────────
    let subTotal = 0;              // unitPrice × qty (before any discount)
    let totalItemDiscount = 0;     // sum of all line discounts (Rs)

    const rows = quotation.Items.map((item, index) => {
        const qty = item.Quantity;
        const unitPrice = item.UnitPrice;
        const lineDiscountTotal = item.Discount;      // total Rs for this line
        const lineTotal = item.Total;                 // after item discount

        const perUnitDiscount = qty > 0 ? lineDiscountTotal / qty : 0;
        const discountPercent =
            unitPrice > 0 ? (perUnitDiscount / unitPrice) * 100 : 0;

        subTotal += unitPrice * qty;
        totalItemDiscount += lineDiscountTotal;

        // Show discount % only when meaningful
        const discountDisplay =
            discountPercent > 0
                ? `${discountPercent.toFixed(
                      discountPercent % 1 === 0 ? 0 : 1
                  )}%`
                : "0%";

        return `
            <tr>
                <td class="sn">${index + 1}</td>
                <td class="desc">${item.ProductName}</td>
                <td class="qty">${qty}</td>
                <td class="rate">${fmt(unitPrice)}</td>
                <td class="dis">${discountDisplay}</td>
                <td class="amount">${fmt(lineTotal)}</td>
            </tr>
        `;
    }).join("");

    const afterItemDiscount = subTotal - totalItemDiscount;
    const invoiceDiscount = quotation.InvoiceDiscount;

    // Invoice discount % (precise)
    const invoiceDiscountPercent =
        afterItemDiscount > 0
            ? (invoiceDiscount / afterItemDiscount) * 100
            : 0;

    const netTotal = quotation.TotalAmount;
    const words = numberToWords(netTotal);

    const hasItemDiscount = totalItemDiscount > 0;
    const hasInvoiceDiscount = invoiceDiscount > 0;
    const hasAnyDiscount = hasItemDiscount || hasInvoiceDiscount;

    // ── Build HTML ─────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Quotation ${quotation.QuotationNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 216mm 279mm; margin: 6mm 8mm 10mm 8mm; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    line-height: 1.25;
    color: #000;
    padding: 4px;
  }
  .quotation {
    max-width: 216mm;
    width: 100%;
    min-height: 268mm;
    background: #fff;
    padding: 6px 10px;
    display: flex;
    flex-direction: column;
  }

  /* ── HEADER ── */
  .header {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 4px;
    margin-bottom: 6px;
  }
  .company-name { font-size: 16pt; font-weight: bold; letter-spacing: 1px; }
  .company-address { font-size: 8.5pt; margin-top: 2px; }
  .company-contact { font-size: 8.5pt; }
  .company-vat { font-size: 8.5pt; font-weight: bold; }

  /* ── TITLE ROW ── */
  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin: 4px 0;
  }
  .title {
    font-size: 15pt;
    font-weight: bold;
    letter-spacing: 3px;
    text-decoration: underline;
  }
  .quote-no { font-size: 10pt; font-weight: bold; }

  /* ── DATE & VALIDITY ── */
  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 9.5pt;
    margin: 2px 0;
  }
  .meta-row .label { font-weight: bold; }

  /* ── CUSTOMER DETAILS ── */
  .customer-section {
    margin: 4px 0;
    padding: 4px 6px;
    background: #f8f8f8;
    border-left: 3px solid #000;
    font-size: 10pt;
  }
  .customer-section .label {
    font-weight: bold;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }
  .customer-section .field {
    display: flex;
    gap: 6px;
    padding: 0.5px 0;
  }
  .customer-section .field .lbl {
    font-weight: bold;
    min-width: 65px;
  }

  /* ── NOTICE BANNER ── */
  .notice {
    background: #fffbea;
    border: 1px solid #d4a72c;
    padding: 4px 8px;
    font-size: 8.5pt;
    margin: 6px 0;
    text-align: center;
    font-weight: bold;
    letter-spacing: 0.3px;
  }

  /* ── TABLE ── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    margin-top: 3px;
  }
  th {
    background: #e8e8e8;
    font-weight: bold;
    padding: 3px 2px;
    text-align: center;
    border-bottom: 2px solid #000;
    font-size: 9.5pt;
  }
  td {
    padding: 2px;
    text-align: center;
    border-bottom: 1px solid #e0e0e0;
    font-size: 9.5pt;
  }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) { background-color: #f9f9f9; }
  .sn { width: 22px; }
  .desc { text-align: left; padding-left: 4px; }
  .qty { width: 42px; }
  .rate { width: 65px; text-align: right; padding-right: 4px; }
  .dis { width: 55px; text-align: right; padding-right: 4px; }
  .amount { width: 80px; text-align: right; padding-right: 4px; font-weight: bold; }

  /* ── AMOUNT IN WORDS ── */
  .words-section {
    margin: 6px 0 4px 0;
    padding: 3px 0;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    font-size: 9pt;
  }
  .words-section .label { font-weight: bold; }

  /* ── TOTALS ── */
  .totals-section {
    margin: 6px 0;
    display: flex;
    justify-content: flex-end;
  }
  .totals-table {
    width: 320px;
    border: none;
    border-collapse: collapse;
  }
  .totals-table td {
    border: none;
    padding: 2px 6px;
    font-size: 9.5pt;
    vertical-align: top;
  }
  .totals-table .label {
    font-weight: bold;
    text-align: left;
    color: #333;
  }
  .totals-table .value {
    text-align: right;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    white-space: nowrap;
  }
  .totals-table .sub-discount td {
    color: #b45309;
    font-size: 9pt;
  }
  .totals-table .discount-row td {
    color: #b45309;
  }
  .totals-table .subtotal-row td {
    border-top: 1px dashed #999;
    padding-top: 3px;
  }
  .totals-table .total-row td {
    font-size: 12pt;
    border-top: 2px solid #000;
    padding-top: 5px;
    padding-bottom: 3px;
    color: #000;
  }

  /* ── NOTES ── */
  .notes-section {
    margin: 6px 0;
    padding: 5px 8px;
    background: #f8f8f8;
    border-left: 3px solid #666;
    font-size: 9pt;
  }
  .notes-section .label {
    font-weight: bold;
    display: block;
    margin-bottom: 2px;
  }

  /* ── TERMS ── */
  .terms-section {
    margin: 6px 0 2px 0;
    padding: 4px 0;
    border-top: 1px solid #000;
    font-size: 8pt;
  }
  .terms-title { font-weight: bold; font-size: 8.5pt; margin-bottom: 2px; }
  .terms-list {
    list-style: none;
    padding-left: 0;
    line-height: 1.5;
  }
  .terms-list li::before {
    content: "• ";
    font-weight: bold;
    margin-right: 2px;
  }

  /* ── SIGNATURE ── */
  .signature-section {
    margin-top: auto;
    padding-top: 20px;
    border-top: 2px solid #000;
    display: flex;
    justify-content: space-between;
    gap: 20px;
  }
  .sig-box {
    flex: 1;
    text-align: center;
    min-width: 120px;
  }
  .sig-box .line {
    border-bottom: 1px solid #000;
    min-height: 38px;
    margin-bottom: 4px;
  }
  .sig-box .label {
    font-size: 8.5pt;
    font-weight: bold;
  }

  /* ── FOOTER ── */
  .footer-note {
    text-align: center;
    font-size: 7.5pt;
    color: #666;
    margin-top: 8px;
    padding-top: 4px;
    border-top: 1px dotted #ccc;
  }

  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="quotation">

  <!-- HEADER -->
  <div class="header">
    <div class="company-name">KARRALI Manufacture &amp; Trader's</div>
    <div class="company-address">No 69, Palaly Road, Thirunelvely (Near Junction) Jaffna.</div>
    <div class="company-contact">Tel: 077 692 5633 &nbsp;|&nbsp; E-Mail: karralitraders@gmail.com</div>
    <div class="company-vat">VAT Reg: 102393570-7000</div>
  </div>

  <!-- TITLE -->
  <div class="title-row">
    <span class="title">QUOTATION</span>
    <span class="quote-no">No: ${quotation.QuotationNumber}</span>
  </div>

  <!-- DATE + VALIDITY -->
  <div class="meta-row">
    <span><span class="label">Date:</span> ${dateStr}</span>
    <span><span class="label">Valid Until:</span> ${validUntilStr}</span>
  </div>

  <!-- CUSTOMER -->
  <div class="customer-section">
    <div class="label">Quotation For</div>
    <div class="field">
      <span class="lbl">Name:</span>
      <span>${quotation.CustomerName || "Walk-in Customer"}</span>
    </div>
    ${quotation.CustomerPhone
        ? `<div class="field"><span class="lbl">Phone:</span><span>${quotation.CustomerPhone}</span></div>`
        : ""
    }
  </div>

  <!-- NOTICE -->
  <div class="notice">
    This is a QUOTATION and not a tax invoice. Prices valid until ${validUntilStr}.
  </div>

  <!-- ITEMS TABLE -->
  <table>
    <thead>
      <tr>
        <th>S.N</th>
        <th>Description of Goods</th>
        <th>Qty</th>
        <th>Rate (LKR)</th>
        <th>Dis %</th>
        <th>Amount (LKR)</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="6" style="padding:20px;text-align:center;">No items</td></tr>'}
    </tbody>
  </table>

  <!-- AMOUNT IN WORDS -->
  <div class="words-section">
    <span class="label">Amount in words:</span>
    <span>${words}</span>
  </div>

  <!-- TOTALS -->
  <div class="totals-section">
    <table class="totals-table">
      <tr>
        <td class="label">Sub Total</td>
        <td class="value">${fmt(subTotal)}</td>
      </tr>

      ${hasItemDiscount ? `
      <tr class="sub-discount">
        <td class="label">Item Discounts</td>
        <td class="value">(${fmt(totalItemDiscount)})</td>
      </tr>
      ` : ''}

      ${hasAnyDiscount ? `
      <tr class="subtotal-row">
        <td class="label">After Item Discounts</td>
        <td class="value">${fmt(afterItemDiscount)}</td>
      </tr>
      ` : ''}

      ${hasInvoiceDiscount ? `
      <tr class="discount-row">
        <td class="label">
          Invoice Discount
          ${invoiceDiscountPercent > 0
              ? `(${invoiceDiscountPercent.toFixed(
                    invoiceDiscountPercent % 1 === 0 ? 0 : 1
                )}%)`
              : ''}
        </td>
        <td class="value">(${fmt(invoiceDiscount)})</td>
      </tr>
      ` : ''}

      <tr class="total-row">
        <td class="label">NET TOTAL</td>
        <td class="value">${fmt(netTotal)}</td>
      </tr>
    </table>
  </div>

  <!-- NOTES -->
  ${quotation.Notes ? `
  <div class="notes-section">
    <span class="label">Notes:</span>
    <span>${quotation.Notes}</span>
  </div>
  ` : ''}

  <!-- TERMS -->
  <div class="terms-section">
    <div class="terms-title">Terms &amp; Conditions:</div>
    <ul class="terms-list">
      <li>This quotation is valid for 30 days from the date of issue.</li>
      <li>Prices are subject to change without prior notice after the validity period.</li>
      <li>Stock availability is not reserved until a confirmed order is placed.</li>
      <li>Payment terms to be agreed upon order confirmation.</li>
    </ul>
  </div>

  <!-- SIGNATURES -->
  <div class="signature-section">
    <div class="sig-box">
      <div class="line"></div>
      <div class="label">Customer Signature</div>
    </div>
    <div class="sig-box">
      <div class="line"></div>
      <div class="label">Prepared By</div>
    </div>
    <div class="sig-box">
      <div class="line"></div>
      <div class="label">Authorised By</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer-note">
    Thank you for considering our products. For enquiries, call 077 692 5633.
  </div>

</div>

<script>
  window.onload = function () {
    window.print();
    setTimeout(function () { window.close(); }, 1500);
  };
</script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) win.document.title = `Quotation ${quotation.QuotationNumber}`;
}