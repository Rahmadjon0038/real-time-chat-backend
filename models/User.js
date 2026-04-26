const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { normalizePhone } = require('../utils/phone');

class User {
    // Create a new user
    static async create(userData) {
        const { name, phone, password } = userData;
        const normalizedPhone = normalizePhone(phone);
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO users (name, phone, password) VALUES (?, ?, ?)`;
            
            db.run(sql, [name, normalizedPhone || phone, hashedPassword], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        name,
                        phone: normalizedPhone || phone,
                        profile_image: null
                    });
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
            const sql = `SELECT id, name, phone, profile_image, created_at FROM users WHERE id = ?`;
            
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
            const sql = `SELECT id, name, phone, profile_image FROM users ORDER BY name`;
            
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async updateProfile(userId, updates) {
        const { name, profile_image } = updates || {};

        const fields = [];
        const values = [];

        if (typeof name === 'string') {
            fields.push('name = ?');
            values.push(name);
        }

        if (typeof profile_image === 'string' || profile_image === null) {
            fields.push('profile_image = ?');
            values.push(profile_image);
        }

        if (fields.length === 0) {
            return { updated: false };
        }

        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            db.run(sql, [...values, userId], function(err) {
                if (err) reject(err);
                else resolve({ updated: this.changes > 0 });
            });
        });
    }
}

module.exports = User;
