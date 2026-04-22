const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, '..', 'chat.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Initialize database tables
const initDB = () => {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Ensure phone is unique (needed for finding users by phone)
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`, (err) => {
        if (err) {
            // Don't crash on existing bad data; just log for visibility.
            console.warn('Could not create unique index on users.phone:', err.message);
            db.all(
                `SELECT phone, COUNT(*) as count FROM users GROUP BY phone HAVING count > 1`,
                [],
                (dupErr, rows) => {
                    if (dupErr) return;
                    if (rows && rows.length > 0) {
                        console.warn('Duplicate phone values detected in users table:', rows);
                    }
                }
            );
        }
    });

    // Chats table
    db.run(`
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            type TEXT DEFAULT 'private',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Chat participants table
    db.run(`
        CREATE TABLE IF NOT EXISTS chat_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER,
            user_id INTEGER,
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chats (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // Messages table
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER,
            sender_id INTEGER,
            content TEXT NOT NULL,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chats (id),
            FOREIGN KEY (sender_id) REFERENCES users (id)
        )
    `);
};

// Initialize database when module is loaded
initDB();

module.exports = db;
