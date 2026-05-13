import { getReceiptUrl } from "../services/api";

function LinkList({ links }) {
  if (links.length === 0) {
    return (
      <p style={{ color: "#999", fontSize: 14 }}>
        No payment links yet. Create your first one above.
      </p>
    );
  }

  return (
    <div style={styles.list}>
      {links.map((link) => (
        <div key={link.id} style={styles.card}>
          <div style={styles.cardTop}>
            <div>
              <p style={styles.clientName}>{link.client_name}</p>
              <p style={styles.description}>
                {link.description || "No description"}
              </p>
            </div>
            <div style={styles.right}>
              <p style={styles.amount}>
                KES {Number(link.amount).toLocaleString()}
              </p>
              <span
                style={{
                  ...styles.badge,
                  background: link.status === "paid" ? "#D1FAE5" : "#FEF3C7",
                  color: link.status === "paid" ? "#065F46" : "#92400E",
                }}
              >
                {link.status}
              </span>
            </div>
          </div>
          <div style={styles.cardBottom}>
            <span style={styles.date}>
              {new Date(link.created_at).toLocaleDateString()}
            </span>
            {link.status === "paid" && (
              <a
                href={getReceiptUrl(link.id)}
                style={styles.receiptLink}
                target="_blank"
                rel="noreferrer"
              >
                Download Receipt
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    background: "white",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 16,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  clientName: { fontSize: 15, fontWeight: 600, color: "#111", margin: 0 },
  description: { fontSize: 13, color: "#888", margin: "4px 0 0" },
  right: { textAlign: "right" },
  amount: { fontSize: 16, fontWeight: 700, color: "#153564", margin: 0 },
  badge: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
    marginTop: 6,
    textTransform: "uppercase",
  },
  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid #F3F4F6",
  },
  date: { fontSize: 12, color: "#AAA" },
  receiptLink: {
    fontSize: 13,
    color: "#FF6600",
    fontWeight: 600,
    textDecoration: "none",
  },
};

export default LinkList;
