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
                    GROUP_CONCAT(u.profile_image) as participant_profile_images,
                    (SELECT content FROM messages WHERE chat_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message,
                    (SELECT sent_at FROM messages WHERE chat_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message_time,
                    (
                        SELECT COUNT(*)
                        FROM messages m
                        WHERE m.chat_id = c.id
                          AND m.sender_id != ?
                          AND m.id > COALESCE(cp.last_read_message_id, 0)
                    ) as unread_count,
                    COALESCE(cp.last_read_message_id, 0) as my_last_read_message_id,
                    cp.last_read_at as my_last_read_at
                FROM chats c
                JOIN chat_participants cp ON c.id = cp.chat_id
                LEFT JOIN chat_participants cp2 ON c.id = cp2.chat_id
                LEFT JOIN users u ON cp2.user_id = u.id
                WHERE cp.user_id = ? AND cp.hidden_at IS NULL
                GROUP BY c.id
                ORDER BY last_message_time DESC
            `;

            db.all(sql, [userId, userId], (err, rows) => {
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
                    GROUP_CONCAT(u.name) as participant_names,
                    GROUP_CONCAT(u.profile_image) as participant_profile_images
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

    static async getParticipants(chatId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    u.id,
                    u.name,
                    u.phone,
                    u.profile_image,
                    cp.joined_at
                FROM chat_participants cp
                JOIN users u ON cp.user_id = u.id
                WHERE cp.chat_id = ?
                ORDER BY u.id ASC
            `;

            db.all(sql, [chatId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // Get read state for a chat (per participant)
    static async getReadState(chatId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    cp.user_id,
                    u.name as user_name,
                    u.phone as user_phone,
                    u.profile_image as user_profile_image,
                    COALESCE(cp.last_read_message_id, 0) as last_read_message_id,
                    cp.last_read_at
                FROM chat_participants cp
                JOIN users u ON cp.user_id = u.id
                WHERE cp.chat_id = ?
                ORDER BY cp.user_id ASC
            `;

            db.all(sql, [chatId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    static async getLatestMessageId(chatId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT 1`;
            db.get(sql, [chatId], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.id : null);
            });
        });
    }

    // Mark chat read up to a messageId for a user
    static async markRead(chatId, userId, messageId) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE chat_participants
                SET
                    last_read_message_id = CASE
                        WHEN last_read_message_id IS NULL OR last_read_message_id < ? THEN ?
                        ELSE last_read_message_id
                    END,
                    last_read_at = CURRENT_TIMESTAMP
                WHERE chat_id = ? AND user_id = ?
            `;

            db.run(sql, [messageId, messageId, chatId, userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ updated: this.changes > 0 });
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
