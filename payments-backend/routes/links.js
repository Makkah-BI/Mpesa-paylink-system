const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");

const router = express.Router();

// Helper function for phone formatting
function formatPhone(phone) {
  let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+254")) cleaned = cleaned.slice(1);
  else if (cleaned.startsWith("0")) cleaned = "254" + cleaned.slice(1);
  return cleaned;
}

// POST /api/links – create a new payment link
router.post("/", (req, res) => {
  const { clientName, clientPhone, amount, description } = req.body;
  if (!clientName || !clientPhone || !amount) {
    return res
      .status(400)
      .json({ error: "clientName, clientPhone, and amount are required" });
  }
  if (amount <= 0) return res.status(400).json({ error: "Amount must be > 0" });
  const phone = formatPhone(clientPhone);
  const id = uuidv4();
  const stmt = db.prepare(
    `INSERT INTO links (id, client_name, client_phone, amount, description) VALUES (?, ?, ?, ?, ?)`,
  );
  stmt.run(id, clientName, phone, amount, description || null);
  const link = db.prepare("SELECT * FROM links WHERE id = ?").get(id);
  res
    .status(201)
    .json({ ...link, paymentUrl: `http://localhost:3000/pay/${id}` });
});

// GET /api/links – list all links
router.get("/", (req, res) => {
  const links = db
    .prepare("SELECT * FROM links ORDER BY created_at DESC")
    .all();
  res.json(links);
});

// GET /api/links/:id – get a single link
router.get("/:id", (req, res) => {
  const link = db
    .prepare("SELECT * FROM links WHERE id = ?")
    .get(req.params.id);
  if (!link) return res.status(404).json({ error: "Link not found" });
  res.json(link);
});

module.exports = router;
