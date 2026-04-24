const db = require('../config/db');
const { decorateUzTime } = require('../utils/time');

class Chat {
    // Create a new chat between users
    static async create(participantIds, chatName = null) {
        return new Promise((resolve, reject) => {
            // Start transaction
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                // Create chat
                const chatSql = `INSERT INTO chats (name, type) VALUES (?, ?)`;
                const type = participantIds.length > 2 ? 'group' : 'private';
                
                db.run(chatSql, [chatName, type], function(err) {
                    if (err) {
                        db.run("ROLLBACK");
                        reject(err);
                        return;
                    }

                    const chatId = this.lastID;

                    // Add participants
                    const participantSql = `INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)`;
                    let completed = 0;
                    let error = null;

                    for (const userId of participantIds) {
                        db.run(participantSql, [chatId, userId], function(err) {
                            completed++;
                            if (err && !error) error = err;

                            if (completed === participantIds.length) {
                                if (error) {
                                    db.run("ROLLBACK");
                                    reject(error);
                                } else {
                                    db.run("COMMIT");
                                    resolve({ 
                                        id: chatId, 
                                        name: chatName, 
                                        type,
                                        participants: participantIds 
                                    });
                                }
                            }
                        });
                    }
                });
            });
        });
    }

    // Get user's chats
    static async getUserChats(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    c.*,
                    GROUP_CONCAT(u.phone) as participant_phones,
                    GROUP_CONCAT(u.name) as participant_names,
                    (SELECT content FROM messages WHERE chat_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message,
                    (SELECT sent_at FROM messages WHERE chat_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message_time
                FROM chats c
                JOIN chat_participants cp ON c.id = cp.chat_id
                LEFT JOIN chat_participants cp2 ON c.id = cp2.chat_id
                LEFT JOIN users u ON cp2.user_id = u.id
                WHERE cp.user_id = ? AND cp.hidden_at IS NULL
                GROUP BY c.id
                ORDER BY last_message_time DESC
            `;

            db.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map((r) => decorateUzTime(r, ['last_message_time', 'created_at'])));
                }
            });
        });
    }

    // Find existing private chat between two users
    static async findPrivateChat(userId1, userId2) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.* FROM chats c
                JOIN chat_participants cp1 ON c.id = cp1.chat_id
                JOIN chat_participants cp2 ON c.id = cp2.chat_id
                WHERE c.type = 'private' 
                AND cp1.user_id = ? 
                AND cp2.user_id = ?
            `;

            db.get(sql, [userId1, userId2], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Get user's chat IDs (includes hidden chats; useful for Socket.IO room join)
    static async getUserChatIds(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT chat_id FROM chat_participants WHERE user_id = ?`;
            db.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve((rows || []).map((r) => r.chat_id));
                }
            });
        });
    }

    // Get chat by ID with participants
    static async getById(chatId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    c.*,
                    GROUP_CONCAT(u.id) as participant_ids,
                    GROUP_CONCAT(u.phone) as participant_phones,
                    GROUP_CONCAT(u.name) as participant_names
                FROM chats c
                JOIN chat_participants cp ON c.id = cp.chat_id
                JOIN users u ON cp.user_id = u.id
                WHERE c.id = ?
                GROUP BY c.id
            `;

            db.get(sql, [chatId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decorateUzTime(row, ['created_at']));
                }
            });
        });
    }

    // Check if user is participant of chat
    static async isParticipant(chatId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT COUNT(*) as count FROM chat_participants WHERE chat_id = ? AND user_id = ?`;
            
            db.get(sql, [chatId, userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count > 0);
                }
            });
        });
    }

    // Hide chat from user's chat list (soft-delete for that user)
    static async hideForUser(chatId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE chat_participants
                SET hidden_at = CURRENT_TIMESTAMP
                WHERE chat_id = ? AND user_id = ? AND hidden_at IS NULL
            `;

            db.run(sql, [chatId, userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ hidden: this.changes > 0 });
                }
            });
        });
    }

    // Unhide chat for user (bring back to chat list)
    static async unhideForUser(chatId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE chat_participants
                SET hidden_at = NULL
                WHERE chat_id = ? AND user_id = ? AND hidden_at IS NOT NULL
            `;

            db.run(sql, [chatId, userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ unhidden: this.changes > 0 });
                }
            });
        });
    }
}

module.exports = Chat;
