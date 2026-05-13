const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const RECEIPTS_DIR = path.join(__dirname, "..", "receipts");

// GET /api/receipts/:linkId – download PDF receipt generated on Day 2
router.get("/:linkId", (req, res) => {
  const filePath = path.join(RECEIPTS_DIR, `${req.params.linkId}.pdf`);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Receipt not found" });
  res.download(filePath, `receipt-${req.params.linkId.slice(0, 8)}.pdf`);
});

module.exports = router;
