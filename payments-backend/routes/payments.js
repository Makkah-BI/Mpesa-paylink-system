const express = require("express");
const db = require("../db");
const { initiateStkPush } = require("../services/mpesa");

const router = express.Router();

// Helper: format phone to 2547XXXXXXXX
function formatPhone(phone) {
  let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+254")) cleaned = cleaned.slice(1);
  else if (cleaned.startsWith("0")) cleaned = "254" + cleaned.slice(1);
  return cleaned;
}

// POST /api/pay – old flow (uses linkId from SQLite)
router.post("/pay", async (req, res) => {
  const { linkId, phone } = req.body;
  const link = db.prepare("SELECT * FROM links WHERE id = ?").get(linkId);
  if (!link) return res.status(404).json({ error: "Payment link not found" });
  if (link.status === "paid")
    return res.status(400).json({ error: "Already paid" });

  const payPhone = phone ? formatPhone(phone) : link.client_phone;

  try {
    // Create pending payment record
    const stmt = db.prepare(`
      INSERT INTO payments (link_id, phone_number, amount, status)
      VALUES (?, ?, ?, 'pending')
    `);
    stmt.run(linkId, payPhone, link.amount);

    const result = await initiateStkPush(payPhone, link.amount, linkId);
    if (result.ResponseCode === "0") {
      res.json({
        message: "STK push sent. Check your phone.",
        checkoutRequestId: result.CheckoutRequestID,
      });
    } else {
      res.status(400).json({
        error: "Failed to initiate payment",
        details: result.ResponseDescription,
      });
    }
  } catch (error) {
    console.error("STK error:", error.response?.data || error.message);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// GET /api/payment-status/:linkId – poll old flow
router.get("/payment-status/:linkId", (req, res) => {
  const link = db
    .prepare("SELECT * FROM links WHERE id = ?")
    .get(req.params.linkId);
  if (!link) return res.status(404).json({ error: "Link not found" });
  const payment = db
    .prepare(
      "SELECT * FROM payments WHERE link_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .get(req.params.linkId);
  res.json({
    linkStatus: link.status,
    payment: payment
      ? { status: payment.status, mpesaReceipt: payment.mpesa_receipt }
      : null,
  });
});

module.exports = router;
