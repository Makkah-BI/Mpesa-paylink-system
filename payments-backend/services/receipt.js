const PDFDocument = require("pdfkit");

function generateReceipt({ phone, amount, reference, date }) {
  const doc = new PDFDocument();
  const chunks = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Mctaba Labs Receipt", { align: "center" });
    doc.moveDown();
    doc.fontSize(14);
    doc.text(`Phone: ${phone}`);
    doc.text(`Amount: KES ${amount}`);
    doc.text(`Reference: ${reference}`);
    doc.text(`Date: ${date}`);
    doc.moveDown();
    doc.fontSize(12).text("Thank you for your payment.", { align: "center" });

    doc.end();
  });
}

module.exports = { generateReceipt };
