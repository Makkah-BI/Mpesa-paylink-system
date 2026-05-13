require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initiateStkPush } = require("./services/mpesa");
const { generateReceipt } = require("./services/receipt");
const { savePayment, getPayment } = require("./services/store");

// Existing database routes (from Day 1-3)
const linkRoutes = require("./routes/links");
const paymentRoutes = require("./routes/payments");
const receiptRoutes = require("./routes/receipts");

const app = express();
app.use(cors());
app.use(express.json());

// ==================== Existing routes ====================
app.use("/api/links", linkRoutes);
app.use("/api", paymentRoutes); // includes /api/pay, /api/mpesa/callback, /api/payment-status
app.use("/api/receipts", receiptRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==================== New endpoints for Day 4 ====================
// These use the JSON store and are separate from the old /api/pay flow.

// 1. Initiate STK push and persist intent
app.post("/mpesa/stk", async (req, res) => {
  const { phone, amount } = req.body;

  // Validation (same as Day 2)
  if (!phone || !/^2547\d{8}$/.test(phone)) {
    return res.status(400).json({ error: "Invalid phone" });
  }
  if (!amount || amount < 1 || amount > 150000) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const result = await initiateStkPush({
      phone,
      amount,
      accountRef: "TEST",
      description: "Payment",
    });

    // Persist the intent BEFORE returning
    if (result.CheckoutRequestID) {
      savePayment(result.CheckoutRequestID, {
        phone,
        amount,
        status: "pending",
        requestedAt: new Date().toISOString(),
      });
      console.log(
        "✅ STK success, CheckoutRequestID:",
        result.CheckoutRequestID,
      ); // <-- ADDED
    }

    res.json({
      success: true,
      checkoutId: result.CheckoutRequestID,
      message: "STK push sent. Check your phone.",
    });
  } catch (err) {
    console.error("STK error:", err.response?.data || err.message);
    res.status(500).json({ error: "STK failed" });
  }
});

// 2. Callback handler with store reconciliation and amount validation
app.post("/mpesa/callback", (req, res) => {
  const callback = req.body.Body?.stkCallback;
  if (!callback) {
    console.error("Invalid callback payload");
    return res.status(400).end();
  }

  const checkoutId = callback.CheckoutRequestID;
  const existing = getPayment(checkoutId);

  if (!existing) {
    console.warn("Callback for unknown checkoutId:", checkoutId);
    return res.json({ status: "unknown" });
  }

  if (existing.status !== "pending") {
    console.log("Duplicate callback for:", checkoutId);
    return res.json({ status: "already_processed" });
  }

  const resultCode = callback.ResultCode;
  if (resultCode === 0) {
    const metadata = callback.CallbackMetadata?.Item || [];
    const amountReceived = metadata.find((i) => i.Name === "Amount")?.Value;
    const receipt = metadata.find(
      (i) => i.Name === "MpesaReceiptNumber",
    )?.Value;

    // Amount validation – critical
    if (Number(amountReceived) !== Number(existing.amount)) {
      console.error(
        `AMOUNT MISMATCH: expected ${existing.amount}, got ${amountReceived}`,
      );
      savePayment(checkoutId, {
        ...existing,
        status: "mismatch",
        amountReceived,
        receipt,
      });
    } else {
      savePayment(checkoutId, {
        ...existing,
        status: "paid",
        amountReceived,
        receipt,
        paidAt: new Date().toISOString(),
      });
    }
  } else {
    savePayment(checkoutId, {
      ...existing,
      status: "failed",
      resultCode,
    });
  }

  // Always respond with 200 to stop Daraja retries
  res.json({ status: "ok" });
});

// 3. Status endpoint for frontend polling
app.get("/mpesa/status/:checkoutId", (req, res) => {
  const payment = getPayment(req.params.checkoutId);
  if (!payment) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(payment);
});

// 4. Receipt endpoint – reads from store and generates PDF with real data
app.get("/mpesa/receipt/:checkoutId", async (req, res) => {
  const payment = getPayment(req.params.checkoutId);
  if (!payment || payment.status !== "paid") {
    return res.status(404).send("Not found or not yet paid");
  }

  const pdf = await generateReceipt({
    phone: payment.phone,
    amount: payment.amount,
    reference: payment.receipt || req.params.checkoutId,
    date: payment.paidAt || new Date().toISOString(),
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="receipt-${req.params.checkoutId}.pdf"`,
  );
  res.send(pdf);
});

// ==================== Start server ====================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server on :${PORT}`);
});
