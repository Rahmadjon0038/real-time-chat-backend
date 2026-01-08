const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    // Create a new user
    static async create(userData) {
        const { username, name, phone, password } = userData;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO users (username, name, phone, password) VALUES (?, ?, ?, ?)`;
            
            db.run(sql, [username, name, phone, hashedPassword], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        username,
                        name,
                        phone
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