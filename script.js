const { PDFDocument, rgb } = PDFLib;

async function generateDocument(templatePath, entries, filename) {
  const existingPdfBytes = await fetch(templatePath).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  entries.forEach(entry => {
    const maxWidth = 100; // Adjust the max width as needed
    const lines = splitTextIntoLines(entry.text, boldFont, entry.size, maxWidth);
    lines.forEach((line, index) => {
      firstPage.drawText(line, { x: entry.x, y: entry.y - (index * (entry.size + 2)), size: entry.size, font: boldFont, color: entry.color || rgb(0, 0, 0) });
    });
  });

  const pdfBytes = await pdfDoc.save();
  download(pdfBytes, filename, "application/pdf");
}

function splitTextIntoLines(text, font, fontSize, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + word + ' ';
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  });

  lines.push(currentLine.trim());
  return lines;
}

function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  let counter = parseInt(localStorage.getItem('invoiceCounter') || '0') + 1;
  localStorage.setItem('invoiceCounter', counter);

  const counterStr = counter.toString().padStart(2, '0');
  return `${year}${month}${counterStr}`;
}

async function generateInvoice() {
  const invoiceNumber = generateInvoiceNumber();
  const clientName = document.getElementById("clientName").value;
  const clientAddress = document.getElementById("clientAddress").value;
  const date = new Date().toLocaleDateString();

  const items = [];

  for (let i = 1; i <= 5; i++) {
    const item = document.getElementById(`item${i}`).value;
    const quantity = parseInt(document.getElementById(`quantity${i}`).value);
    const price = parseFloat(document.getElementById(`price${i}`).value);
    if (item && !isNaN(quantity) && !isNaN(price)) {
      const itemTotal = quantity * price;
      items.push({ item, itemTotal });
    }
  }

  const totalPrice = items.reduce((sum, { itemTotal }) => sum + itemTotal, 0);
  const sgst = (totalPrice * 0.09).toFixed(2);
  const cgst = (totalPrice * 0.09).toFixed(2);
  const finalTotal = (parseFloat(totalPrice) + parseFloat(sgst) + parseFloat(cgst)).toFixed(2);

  const entries = [
    { text: invoiceNumber, x: 136, y: 613, size: 12 },
    { text: clientName, x: 58, y: 573, size: 14 },
    { text: clientAddress, x: 58, y: 558, size: 10 },
    { text: date, x: 408, y: 586, size: 12 }
  ];

  items.forEach((item, index) => {
    entries.push(
      { text: item.item, x: 90, y: 444 - index * 32, size: 12 },
      { text: `Rs. ${item.itemTotal}`, x: 445, y: 444 - index * 32, size: 12 }
    );
  });

  entries.push(
    { text: `Rs. ${totalPrice}`, x: 445, y: 268, size: 12 },
    { text: `Rs. ${sgst}`, x: 445, y: 244, size: 12 },
    { text: `Rs. ${cgst}`, x: 445, y: 223, size: 12 },
    { text: `Rs. ${finalTotal}`, x: 445, y: 203, size: 12 }
  );

  await generateDocument('invoice.pdf', entries, 'Invoice.pdf');
}

async function generateQuotation() {
  const clientName = document.getElementById("clientName").value;
  const clientAddress = document.getElementById("clientAddress").value;
  const date = new Date().toLocaleDateString();

  const items = [];

  for (let i = 1; i <= 5; i++) {
    const item = document.getElementById(`item${i}`).value;
    const quantity = parseInt(document.getElementById(`quantity${i}`).value);
    const price = parseFloat(document.getElementById(`price${i}`).value);
    if (item && !isNaN(quantity) && !isNaN(price)) {
      const itemTotal = quantity * price;
      items.push({ item, itemTotal });
    }
  }

  const totalPrice = items.reduce((sum, { itemTotal }) => sum + itemTotal, 0);
  const sgst = (totalPrice * 0.09).toFixed(2);
  const cgst = (totalPrice * 0.09).toFixed(2);
  const finalTotal = (parseFloat(totalPrice) + parseFloat(sgst) + parseFloat(cgst)).toFixed(2);

  const entries = [
    { text: clientName, x: 60, y: 573, size: 14 },
    { text: clientAddress, x: 60, y: 558, size: 10 },
    { text: date, x: 408, y: 586, size: 12 }
  ];

  items.forEach((item, index) => {
    entries.push(
      { text: item.item, x: 90, y: 444 - index * 32, size: 12 },
      { text: `Rs. ${item.itemTotal}`, x: 445, y: 444 - index * 32, size: 12 }
    );
  });

  entries.push(
    { text: `Rs. ${totalPrice}`, x: 445, y: 268, size: 12 },
    { text: `Rs. ${sgst}`, x: 445, y: 244, size: 12 },
    { text: `Rs. ${cgst}`, x: 445, y: 223, size: 12 },
    { text: `Rs. ${finalTotal}`, x: 445, y: 203, size: 12 }
  );

  await generateDocument('quotation.pdf', entries, 'Quotation.pdf');
}

function download(data, filename, type) {
  const blob = new Blob([data], { type: type });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
