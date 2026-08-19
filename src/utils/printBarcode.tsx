// printBarcode.tsx
// Prints a barcode label sized for 38mm × 25mm (3.8×2.5cm) stickers.
// Uses an online barcode API to generate the barcode image directly.

export interface BarcodeLabelData {
  productName: string;
  barcode: string;
  price?: number;
  copies?: number;
}

function buildBarcodeHTML(data: BarcodeLabelData): string {
  const copies = data.copies && data.copies > 0 ? data.copies : 1;

  // Generate barcode image URL
  const barcodeImageUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
    data.barcode
  )}&code=Code128&dpi=96&height=30`;

  const labels = Array.from({ length: copies }).map(() => `
    <div class="label">
      <p class="shop">Karrali</p>
      <img class="barcode" src="${barcodeImageUrl}" alt="barcode" />
      <p class="name">${data.productName}</p>
      ${data.price !== undefined ? `<p class="price">Rs ${data.price.toFixed(2)}</p>` : ""}
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  /* CRITICAL FIX 1: REMOVE 'landscape'. Set exact dimensions. */
  @page { 
    size: 38mm 25mm; 
    margin: 0;
  }

  /* CRITICAL FIX 2: Do not limit width/height on html/body. 
     Let the browser use the full paper size defined in @page */
  html, body {
    width: 100%;
    height: 100%;
    font-family: 'Courier New', Courier, monospace;
    color: #000 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    margin: 0;
    padding: 0;
  }

  .label {
    /* CRITICAL FIX 3: Force exact size on the container */
    width: 38mm;
    height: 25mm;
    
    padding: 1.5mm 1mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center; /* Changed to center to fix spacing */
    text-align: center;
    page-break-after: always;
    page-break-inside: avoid;
    box-sizing: border-box;
    /* Ensure it takes up the exact slot */
    margin: 0;
    overflow: hidden; 
  }

  .label:last-child { 
    page-break-after: auto; 
  }

  .shop {
    font-size: 8px;
    font-weight: bold;
    line-height: 1.2;
    margin-bottom: 1px;
  }

  .barcode {
    /* CRITICAL FIX 4: Use specific height to ensure it fits */
    width: auto;
    height: 11mm; 
    max-width: 34mm;
    display: block;
    margin: 1px 0;
  }

  .name {
    font-size: 9px;
    font-weight: bold;
    line-height: 1.1;
    max-width: 36mm;
    word-break: break-word;
    margin: 1px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1; /* Changed to 1 line to prevent overlapping */
    -webkit-box-orient: vertical;
  }

  .price {
    font-size: 9px;
    font-weight: bold;
    margin-top: 1px;
  }

  /* MEDIA PRINT FIXES */
  @media print {
    @page {
      size: 38mm 25mm;
      margin: 0;
    }
    
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
    
    .label {
      -webkit-print-color-adjust: exact;
    }
  }
</style>
</head>
<body>

${labels}

<script>
  function waitForImagesAndPrint() {
    const images = document.querySelectorAll('.barcode');
    let loadedCount = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
      doPrint();
      return;
    }

    function checkImageLoaded() {
      loadedCount++;
      if (loadedCount === totalImages) {
        doPrint();
      }
    }

    images.forEach(img => {
      if (img.complete) {
        checkImageLoaded();
      } else {
        img.onload = checkImageLoaded;
        img.onerror = checkImageLoaded;
      }
    });

    setTimeout(() => {
      if (loadedCount < totalImages) {
        console.warn('Some barcode images failed to load, printing anyway');
        doPrint();
      }
    }, 3000);
  }

  function doPrint() {
    window.focus();
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          window.print();
          setTimeout(function() { 
            window.close(); 
          }, 3000);
        });
      });
    });
  }

  if (document.readyState === 'complete') {
    waitForImagesAndPrint();
  } else {
    window.onload = waitForImagesAndPrint;
  }
</script>
</body>
</html>`;
}

export async function printBarcode(data: BarcodeLabelData): Promise<void> {
  const html = buildBarcodeHTML(data);

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const win = window.open(url, "_blank");

  if (win) {
    // Add a load event listener to ensure the window is ready
    win.addEventListener("load", () => {
      URL.revokeObjectURL(url);
    });

    // Keep the window focused
    win.focus();
  } else {
    alert('Please allow popups to print barcode labels');
  }
}