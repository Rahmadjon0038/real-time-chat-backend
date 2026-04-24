const db = require('../config/db');
const { decorateUzTime } = require('../utils/time');

class Message {
    // Create a new message
    static async create(messageData) {
        const { chatId, senderId, content } = messageData;
        
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)`;
            
            db.run(sql, [chatId, senderId, content], function(err) {
                if (err) {
                    reject(err);
                } else {
                    // If chat was hidden for any participant, bring it back on new messages
                    db.run(
                        `UPDATE chat_participants SET hidden_at = NULL WHERE chat_id = ? AND hidden_at IS NOT NULL`,
                        [chatId],
                        () => {
                            // Ignore unhide errors here; message creation already succeeded
                        }
                    );

                    // Get the created message with sender info
                    Message.getById(this.lastID)
                        .then(message => resolve(message))
                        .catch(err => reject(err));
                }
            });
        });
    }

    // Get message by ID with sender info
    static async getById(messageId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    m.*,
                    u.name as sender_name,
                    u.phone as sender_phone
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.id = ?
            `;
            
            db.get(sql, [messageId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decorateUzTime(row, ['sent_at']));
                }
            });
        });
    }

    // Get messages for a chat
    static async getChatMessages(chatId, limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    m.*,
                    u.name as sender_name,
                    u.phone as sender_phone
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.chat_id = ?
                ORDER BY m.sent_at ASC
                LIMIT ? OFFSET ?
            `;
            
            db.all(sql, [chatId, limit, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map((r) => decorateUzTime(r, ['sent_at'])));
                }
            });
        });
    }

    // Delete message (optional feature)
    static async delete(messageId, userId) {
        return new Promise((resolve, reject) => {
            // Check if user owns the message
            const checkSql = `SELECT sender_id FROM messages WHERE id = ?`;
            
            db.get(checkSql, [messageId], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    reject(new Error('Message not found'));
                } else if (row.sender_id !== userId) {
                    reject(new Error('Unauthorized'));
                } else {
                    // Delete message
                    const deleteSql = `DELETE FROM messages WHERE id = ?`;
                    db.run(deleteSql, [messageId], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({ deleted: this.changes > 0 });
                        }
                    });
                }
            });
        });
    }

    // Delete message inside a specific chat (safer for APIs)
    static async deleteInChat(messageId, chatId, userId) {
        return new Promise((resolve, reject) => {
            const checkSql = `SELECT sender_id, chat_id FROM messages WHERE id = ?`;

            db.get(checkSql, [messageId], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    reject(new Error('Message not found'));
                } else if (parseInt(row.chat_id) !== parseInt(chatId)) {
                    reject(new Error('Message does not belong to this chat'));
                } else if (row.sender_id !== userId) {
                    reject(new Error('Unauthorized'));
                } else {
                    const deleteSql = `DELETE FROM messages WHERE id = ?`;
                    db.run(deleteSql, [messageId], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({ deleted: this.changes > 0 });
                        }
                    });
                }
            });
        });
    }
}

module.exports = Message;
