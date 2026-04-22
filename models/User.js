const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { normalizePhone } = require('../utils/phone');

class User {
    // Create a new user
    static async create(userData) {
        const { username, name, phone, password } = userData;
        const normalizedPhone = normalizePhone(phone);
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO users (username, name, phone, password) VALUES (?, ?, ?, ?)`;
            
            db.run(sql, [username, name, normalizedPhone || phone, hashedPassword], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        username,
                        name,
                        phone: normalizedPhone || phone
                    });
                }
            });
        });
    }

    // Find user by username
    static async findByUsername(username) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE username = ?`;
            
            db.get(sql, [username], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Find user by phone (expects normalized phone)
    static async findByPhone(phone) {
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone) return null;

        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE phone = ?`;

            db.all(sql, [normalizedPhone], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    if (!rows || rows.length === 0) return resolve(null);
                    if (rows.length === 1) return resolve(rows[0]);

                    const e = new Error('Phone number is not unique');
                    e.code = 'PHONE_NOT_UNIQUE';
                    e.phone = normalizedPhone;
                    reject(e);
                }
            });
        });
    }

    // Find user by ID
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id, username, name, phone, created_at FROM users WHERE id = ?`;
            
            db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Verify password
    static async verifyPassword(inputPassword, hashedPassword) {
        return await bcrypt.compare(inputPassword, hashedPassword);
    }

    // Get all users (for finding users to chat with)
    static async getAll() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id, username, name, phone FROM users ORDER BY name`;
            
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = User;
