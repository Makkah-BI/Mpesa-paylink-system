const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "data", "payments.json");

function read() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function write(data) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function savePayment(checkoutId, payment) {
  const store = read();
  store[checkoutId] = payment;
  write(store);
}

function getPayment(checkoutId) {
  const store = read();
  return store[checkoutId];
}

module.exports = { savePayment, getPayment };
