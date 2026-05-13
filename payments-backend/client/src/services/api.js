const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

// ==================== Link Management (old SQLite endpoints) ====================
export async function createLink(data) {
  const res = await fetch(`${BASE_URL}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getLinks() {
  const res = await fetch(`${BASE_URL}/api/links`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getLink(id) {
  const res = await fetch(`${BASE_URL}/api/links/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ==================== Payment Flow (reconciled endpoints) ====================
export async function initiatePayment(
  phone,
  amount,
  accountRef = "Payment",
  description = "M-Pesa Payment",
) {
  const res = await fetch(`${BASE_URL}/mpesa/stk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone,
      amount: Number(amount),
      accountRef,
      description,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to initiate payment.");
  }
  return { checkoutId: data.checkoutId, message: data.message };
}

export async function getPaymentStatus(checkoutId) {
  const res = await fetch(`${BASE_URL}/mpesa/status/${checkoutId}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    // The backend returns raw payment object, so adapt:
    if (res.ok) return data; // for compatibility
    throw new Error(data.error || "Failed to fetch payment status.");
  }
  return data.payment;
}

export function getReceiptUrl(checkoutId) {
  return `${BASE_URL}/mpesa/receipt/${checkoutId}`;
}
