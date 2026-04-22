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
    // Users table (username removed; phone-based auth)
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Lightweight migration: if old schema had "username", recreate users table without it.
    db.serialize(() => {
        db.all(`PRAGMA table_info(users)`, [], (err, columns) => {
            if (err || !Array.isArray(columns)) return;

            const hasUsername = columns.some((c) => c && c.name === 'username');
            if (!hasUsername) return;

            db.run('PRAGMA foreign_keys = OFF');
            db.run('BEGIN TRANSACTION');

            db.run(
                `
                CREATE TABLE IF NOT EXISTS users_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    password TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
                `,
                [],
                (createErr) => {
                    if (createErr) {
                        console.warn('Users table migration failed (create users_new):', createErr.message);
                        db.run('ROLLBACK');
                        db.run('PRAGMA foreign_keys = ON');
                        return;
                    }

                    db.run(
                        `
                        INSERT INTO users_new (id, name, phone, password, created_at)
                        SELECT id, name, phone, password, created_at FROM users
                        `,
                        [],
                        (copyErr) => {
                            if (copyErr) {
                                console.warn('Users table migration failed (copy data):', copyErr.message);
                                db.run('ROLLBACK');
                                db.run('PRAGMA foreign_keys = ON');
                                return;
                            }

                            db.run(`DROP TABLE users`, [], (dropErr) => {
                                if (dropErr) {
                                    console.warn('Users table migration failed (drop old users):', dropErr.message);
                                    db.run('ROLLBACK');
                                    db.run('PRAGMA foreign_keys = ON');
                                    return;
                                }

                                db.run(`ALTER TABLE users_new RENAME TO users`, [], (renameErr) => {
                                    if (renameErr) {
                                        console.warn('Users table migration failed (rename users_new):', renameErr.message);
                                        db.run('ROLLBACK');
                                        db.run('PRAGMA foreign_keys = ON');
                                        return;
                                    }

                                    db.run('COMMIT', [], () => {
                                        db.run('PRAGMA foreign_keys = ON');
                                    });
                                });
                            });
                        }
                    );
                }
            );
        });
    });

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
