const Database = require("better-sqlite3");
const path = require("path");

// Create (or open) a database file called paylink.db in the server folder
const db = new Database(path.join(__dirname, "paylink.db"));

// Enable WAL mode for better performance when reading and writing at the same time
db.pragma("journal_mode = WAL");

// Create our two tables if they don't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id TEXT NOT NULL,
    mpesa_receipt TEXT,
    transaction_date TEXT,
    phone_number TEXT,
    amount REAL,
    status TEXT DEFAULT 'pending',
    raw_callback TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (link_id) REFERENCES links(id)
  );
`);

module.exports = db;
