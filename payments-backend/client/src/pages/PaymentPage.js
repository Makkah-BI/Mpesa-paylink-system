import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  initiatePayment,
  getPaymentStatus,
  getReceiptUrl,
} from "../services/api";
import "./PaymentPage.css";

// Polling interval in ms
const POLL_INTERVAL = 3000;
// Max polling attempts before giving up (~2 min)
const MAX_POLLS = 40;

/**
 * Format phone input to 2547XXXXXXXX.
 * Handles 07..., +2547..., 2547...
 */
function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("07") && digits.length === 10)
    return "254" + digits.slice(1);
  if (digits.startsWith("2547") && digits.length === 12) return digits;
  if (digits.startsWith("7") && digits.length === 9) return "254" + digits;
  return digits;
}

function PhoneDisplay({ phone }) {
  if (!phone) return null;
  const formatted = phone.replace(
    /^(254)(\d{3})(\d{3})(\d{3})$/,
    "+$1 $2 $3 $4",
  );
  return <span className="phone-formatted">{formatted}</span>;
}

export default function PaymentPage() {
  const { linkId } = useParams();

  // ── Form state ──
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [accountRef, setAccountRef] = useState("Order-001");

  // ── Flow state ──
  const [status, setStatus] = useState("idle"); // idle | processing | polling | paid | failed | mismatch | timeout
  const [checkoutId, setCheckoutId] = useState(null);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [pollCount, setPollCount] = useState(0);

  const intervalRef = useRef(null);

  // ── Cleanup polling on unmount ──
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ── Stop polling helper ──
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Start polling after STK push ──
  const startPolling = useCallback(
    (cid) => {
      let count = 0;
      setStatus("polling");
      setPollCount(0);

      intervalRef.current = setInterval(async () => {
        count += 1;
        setPollCount(count);

        if (count >= MAX_POLLS) {
          stopPolling();
          setStatus("timeout");
          return;
        }

        try {
          const p = await getPaymentStatus(cid);
          setPayment(p);

          if (p.status === "paid") {
            stopPolling();
            setStatus("paid");
          } else if (p.status === "failed") {
            stopPolling();
            setStatus("failed");
            setError(p.resultDesc || "Payment was cancelled or failed.");
          } else if (p.status === "mismatch") {
            stopPolling();
            setStatus("mismatch");
          }
          // "pending" → keep polling
        } catch (err) {
          console.warn("[Poll] Error:", err.message);
        }
      }, POLL_INTERVAL);
    },
    [stopPolling],
  );

  // ── Handle Pay button ──
  const handlePay = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedPhone = normalizePhone(phone);
    const parsedAmount = parseFloat(amount);

    // Client-side validation
    if (!/^2547\d{8}$/.test(normalizedPhone)) {
      setError("Enter a valid Safaricom number (07XXXXXXXX or 2547XXXXXXXX).");
      return;
    }
    if (!parsedAmount || parsedAmount < 1 || parsedAmount > 150000) {
      setError("Amount must be between KES 1 and KES 150,000.");
      return;
    }

    setStatus("processing");

    try {
      const { checkoutId: cid } = await initiatePayment(
        normalizedPhone,
        parsedAmount,
        accountRef || "Payment",
      );
      setCheckoutId(cid);
      console.log("[Pay] CheckoutRequestID:", cid);
      startPolling(cid);
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  // ── Handle reset ──
  const handleReset = () => {
    stopPolling();
    setStatus("idle");
    setCheckoutId(null);
    setPayment(null);
    setError("");
    setPollCount(0);
  };

  // ── Derived ──
  const isLoading = status === "processing";
  const isPolling = status === "polling";
  const isPaid = status === "paid";
  const isFailed =
    status === "failed" || status === "mismatch" || status === "timeout";

  return (
    <div className="pp-root">
      <div className="pp-card">
        {/* ── Header ── */}
        <header className="pp-header">
          <div className="pp-logo">
            <span className="pp-logo-m">M</span>
            <span className="pp-logo-pesa">-PESA</span>
          </div>
          <p className="pp-tagline">Secure Mobile Payment</p>
        </header>

        {/* ── IDLE: Payment form ── */}
        {(status === "idle" || status === "processing") && (
          <form className="pp-form" onSubmit={handlePay} noValidate>
            <div className="pp-field">
              <label htmlFor="amount">Amount (KES)</label>
              <div className="pp-input-wrap">
                <span className="pp-prefix">KES</span>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  max="150000"
                  step="1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <div className="pp-field">
              <label htmlFor="phone">M-Pesa Phone Number</label>
              <div className="pp-input-wrap">
                <span className="pp-prefix">📱</span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  maxLength={13}
                />
              </div>
              <span className="pp-hint">Safaricom number (07XX or 2547XX)</span>
            </div>

            <div className="pp-field">
              <label htmlFor="ref">Account Reference</label>
              <div className="pp-input-wrap">
                <span className="pp-prefix">#</span>
                <input
                  id="ref"
                  type="text"
                  placeholder="Order-001"
                  value={accountRef}
                  onChange={(e) => setAccountRef(e.target.value)}
                  disabled={isLoading}
                  maxLength={20}
                />
              </div>
            </div>

            {error && (
              <div className="pp-error" role="alert">
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              className={`pp-btn-pay ${isLoading ? "pp-btn-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="pp-spinner" />
                  Sending to phone…
                </>
              ) : (
                <>
                  <span>🔒</span> Pay with M-Pesa
                </>
              )}
            </button>

            <p className="pp-security-note">
              🔐 Your payment is secured by Safaricom M-Pesa
            </p>
          </form>
        )}

        {/* ── POLLING: Waiting for user to enter PIN ── */}
        {isPolling && (
          <div className="pp-polling">
            <div className="pp-pulse-ring">
              <div className="pp-phone-icon">📲</div>
            </div>
            <h2>Check Your Phone</h2>
            <p className="pp-polling-msg">
              An STK push has been sent to{" "}
              <PhoneDisplay phone={normalizePhone(phone)} />
              <br />
              Enter your M-Pesa PIN to complete the payment.
            </p>
            <div className="pp-amount-badge">
              KES {parseFloat(amount).toLocaleString("en-KE")}
            </div>
            <div className="pp-polling-dots">
              <span />
              <span />
              <span />
            </div>
            <p className="pp-poll-counter">
              Checking payment status… ({pollCount}/{MAX_POLLS})
            </p>
            <button className="pp-btn-cancel" onClick={handleReset}>
              Cancel
            </button>
          </div>
        )}

        {/* ── PAID: Success ── */}
        {isPaid && payment && (
          <div className="pp-success">
            <div className="pp-success-icon">✓</div>
            <h2>Payment Successful!</h2>
            <p className="pp-success-sub">
              Thank you. Your payment has been confirmed.
            </p>

            <div className="pp-receipt-table">
              <div className="pp-receipt-row">
                <span>Amount Paid</span>
                <strong>
                  KES {Number(payment.amountReceived).toLocaleString("en-KE")}
                </strong>
              </div>
              <div className="pp-receipt-row">
                <span>Receipt No.</span>
                <strong>{payment.receipt || "—"}</strong>
              </div>
              <div className="pp-receipt-row">
                <span>Phone</span>
                <strong>{payment.phone}</strong>
              </div>
              <div className="pp-receipt-row">
                <span>Date</span>
                <strong>
                  {new Date(payment.paidAt).toLocaleString("en-KE", {
                    timeZone: "Africa/Nairobi",
                  })}
                </strong>
              </div>
              <div className="pp-receipt-row">
                <span>Reference</span>
                <strong>{payment.accountRef || "—"}</strong>
              </div>
            </div>

            <a
              href={getReceiptUrl(checkoutId)}
              target="_blank"
              rel="noopener noreferrer"
              className="pp-btn-receipt"
            >
              📄 Download PDF Receipt
            </a>
            <button className="pp-btn-new" onClick={handleReset}>
              Make Another Payment
            </button>
          </div>
        )}

        {/* ── FAILED / MISMATCH / TIMEOUT ── */}
        {isFailed && (
          <div className="pp-failed">
            <div className="pp-failed-icon">
              {status === "timeout" ? "⏱" : "✕"}
            </div>
            <h2>
              {status === "timeout"
                ? "Request Timed Out"
                : status === "mismatch"
                  ? "Amount Mismatch"
                  : "Payment Failed"}
            </h2>
            <p className="pp-failed-msg">
              {status === "timeout"
                ? "We didn't receive a confirmation in time. Please check your M-Pesa messages and try again."
                : status === "mismatch"
                  ? `The amount received (KES ${payment?.amountReceived}) does not match the expected amount (KES ${payment?.amount}).`
                  : error || "The payment was not completed. Please try again."}
            </p>
            <button className="pp-btn-retry" onClick={handleReset}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
