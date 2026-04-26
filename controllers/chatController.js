const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// Get user's chats
const getUserChats = async (req, res) => {
    try {
        const chats = await Chat.getUserChats(req.userId);

        res.json({
            success: true,
            data: {
                chats
            }
        });

    } catch (error) {
        console.error('Get user chats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Create new chat or get existing private chat
const createOrGetChat = async (req, res) => {
    try {
        const { targetPhone } = req.body;

        // Validate input
        if (!targetPhone) {
            return res.status(400).json({
                success: false,
                message: 'Target phone kiritilishi kerak'
            });
        }

        // Find target user
        let targetUser;
        try {
            targetUser = await User.findByPhone(targetPhone);
        } catch (e) {
            if (e && e.code === 'PHONE_NOT_UNIQUE') {
                return res.status(409).json({
                    success: false,
                    message: 'Bu telefon raqami bir nechta foydalanuvchida bor (DB xatosi)'
                });
            }
            throw e;
        }

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        // Check if trying to chat with self
        if (targetUser.id === req.userId) {
            return res.status(400).json({
                success: false,
                message: 'O\'zingiz bilan chat qila olmaysiz'
            });
        }

        // Check if private chat already exists
        let existingChat = await Chat.findPrivateChat(req.userId, targetUser.id);
        
        if (existingChat) {
            // If user previously hid this chat, bring it back
            await Chat.unhideForUser(existingChat.id, req.userId);

            // Get chat details with participants
            const chatDetails = await Chat.getById(existingChat.id);
            return res.json({
                success: true,
                message: 'Mavjud chat topildi',
                data: {
                    chat: chatDetails
                }
            });
        }

        // Create new private chat
        const newChat = await Chat.create([req.userId, targetUser.id]);
        const chatDetails = await Chat.getById(newChat.id);

        res.status(201).json({
            success: true,
            message: 'Yangi chat yaratildi',
            data: {
                chat: chatDetails
            }
        });

    } catch (error) {
        console.error('Create or get chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Get chat messages
const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Check if user is participant of this chat
        const isParticipant = await Chat.isParticipant(chatId, req.userId);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Bu chatga kirish huquqingiz yo\'q'
            });
        }

        const messages = await Message.getChatMessages(chatId, parseInt(limit), parseInt(offset));
        const readState = await Chat.getReadState(chatId);
        const myRead = (readState || []).find((r) => parseInt(r.user_id) === parseInt(req.userId));

        res.json({
            success: true,
            data: {
                messages,
                readState,
                myLastReadMessageId: myRead ? myRead.last_read_message_id : 0,
                myLastReadAt: myRead ? myRead.last_read_at : null
            }
        });

    } catch (error) {
        console.error('Get chat messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Mark chat as read up to messageId (or latest if not provided)
const markChatRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { messageId } = req.body || {};

        const isParticipant = await Chat.isParticipant(chatId, req.userId);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Bu chatga kirish huquqingiz yo\'q'
            });
        }

        let targetMessageId = messageId ? parseInt(messageId) : null;
        if (!targetMessageId || Number.isNaN(targetMessageId)) {
            targetMessageId = await Chat.getLatestMessageId(parseInt(chatId));
        }

        if (!targetMessageId) {
            return res.json({
                success: true,
                message: 'Chatda xabar yo\'q',
                data: {
                    chatId: parseInt(chatId),
                    marked: false
                }
            });
        }

        await Chat.markRead(parseInt(chatId), req.userId, targetMessageId);

        const io = req.app.get('io');
        if (io) {
            io.to(`chat_${chatId}`).emit('chat_read', {
                success: true,
                data: {
                    chatId: parseInt(chatId),
                    userId: req.userId,
                    messageId: targetMessageId,
                    readAt: new Date().toISOString()
                }
            });
        }

        return res.json({
            success: true,
            message: 'O\'qildi deb belgilandi',
            data: {
                chatId: parseInt(chatId),
                messageId: targetMessageId,
                marked: true
            }
        });
    } catch (error) {
        console.error('Mark chat read error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Send message (this will be mainly used via socket, but keeping REST endpoint)
const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;

        // Validate input
        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Xabar matni bo\'sh bo\'lishi mumkin emas'
            });
        }

        // Check if user is participant of this chat
        const isParticipant = await Chat.isParticipant(chatId, req.userId);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Bu chatga xabar yuborish huquqingiz yo\'q'
            });
        }

        // Create message
        const message = await Message.create({
            chatId: parseInt(chatId),
            senderId: req.userId,
            content: content.trim()
        });

        res.status(201).json({
            success: true,
            message: 'Xabar yuborildi',
            data: {
                message
            }
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Get chat details
const getChatDetails = async (req, res) => {
    try {
        const { chatId } = req.params;

        // Check if user is participant of this chat
        const isParticipant = await Chat.isParticipant(chatId, req.userId);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Bu chatga kirish huquqingiz yo\'q'
            });
        }

        const chat = await Chat.getById(chatId);
        
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat topilmadi'
            });
        }

        res.json({
            success: true,
            data: {
                chat
            }
        });

    } catch (error) {
        console.error('Get chat details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Hide chat from current user's chat list
const hideChat = async (req, res) => {
    try {
        const { chatId } = req.params;

        const isParticipant = await Chat.isParticipant(chatId, req.userId);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Bu chatga kirish huquqingiz yo\'q'
            });
        }

        const result = await Chat.hideForUser(parseInt(chatId), req.userId);
        return res.json({
            success: true,
            message: 'Chat ro\'yxatdan o\'chirildi',
            data: {
                chatId: parseInt(chatId),
                hidden: result.hidden
            }
        });
    } catch (error) {
        console.error('Hide chat error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Delete a message (only sender can delete)
const deleteMessage = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;

        // Check if user is participant of this chat
        const isParticipant = await Chat.isParticipant(chatId, req.userId);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Bu chatga kirish huquqingiz yo\'q'
            });
        }

        const result = await Message.deleteInChat(parseInt(messageId), parseInt(chatId), req.userId);
        return res.json({
            success: true,
            message: 'Xabar o\'chirildi',
            data: {
                messageId: parseInt(messageId),
                chatId: parseInt(chatId),
                deleted: result.deleted
            }
        });
    } catch (error) {
        const msg = String(error && error.message ? error.message : error);
        if (msg === 'Message not found') {
            return res.status(404).json({ success: false, message: 'Xabar topilmadi' });
        }
        if (msg === 'Unauthorized') {
            return res.status(403).json({ success: false, message: 'Bu xabarni o\'chirish huquqingiz yo\'q' });
        }
        if (msg === 'Message does not belong to this chat') {
            return res.status(400).json({ success: false, message: 'Xabar ushbu chatga tegishli emas' });
        }
        console.error('Delete message error:', error);
        return res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};

module.exports = {
    getUserChats,
    createOrGetChat,
    getChatMessages,
    markChatRead,
    sendMessage,
    getChatDetails,
    hideChat,
    deleteMessage
};
