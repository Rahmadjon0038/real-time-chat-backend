const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
// Import Swagger
const { swaggerUi, specs } = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

// Import models for socket usage
const Message = require('./models/Message');
const Chat = require('./models/Chat');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4444;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Chat API Documentation'
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server ishlayapti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Chat Server ishlamoqda"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Chat Server ishlamoqda',
        timestamp: new Date().toISOString(),
        documentation: `http://localhost:${PORT}/api-docs`
    });
});

// Socket.IO authentication middleware
const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
};

// Apply socket authentication
io.use(authenticateSocket);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.phone} (ID: ${socket.userId})`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join user's chats
    socket.on('join_chats', async () => {
        try {
            const chatIds = await Chat.getUserChatIds(socket.userId);
            
            for (const chatId of chatIds) {
                socket.join(`chat_${chatId}`);
            }

            socket.emit('joined_chats', {
                success: true,
                message: 'Chatlarga ulandi'
            });
        } catch (error) {
            console.error('Join chats error:', error);
            socket.emit('error', {
                success: false,
                message: 'Chatlarga ulanishda xatolik'
            });
        }
    });

    // Join specific chat
    socket.on('join_chat', async (data) => {
        try {
            const { chatId } = data;
            
            // Check if user is participant of this chat
            const isParticipant = await Chat.isParticipant(chatId, socket.userId);
            
            if (!isParticipant) {
                socket.emit('error', {
                    success: false,
                    message: 'Bu chatga kirish huquqingiz yo\'q'
                });
                return;
            }

            socket.join(`chat_${chatId}`);
            
            socket.emit('joined_chat', {
                success: true,
                chatId,
                message: 'Chatga ulandi'
            });

        } catch (error) {
            console.error('Join chat error:', error);
            socket.emit('error', {
                success: false,
                message: 'Chatga ulanishda xatolik'
            });
        }
    });

    // Send message
    socket.on('send_message', async (data) => {
        try {
            const { chatId, content } = data;

            // Validate input
            if (!chatId || !content || content.trim() === '') {
                socket.emit('error', {
                    success: false,
                    message: 'Chat ID va xabar matni kerak'
                });
                return;
            }

            // Check if user is participant of this chat
            const isParticipant = await Chat.isParticipant(chatId, socket.userId);
            
            if (!isParticipant) {
                socket.emit('error', {
                    success: false,
                    message: 'Bu chatga xabar yuborish huquqingiz yo\'q'
                });
                return;
            }

            // Create message
            const message = await Message.create({
                chatId: parseInt(chatId),
                senderId: socket.userId,
                content: content.trim()
            });

            // Send message to all participants in the chat
            io.to(`chat_${chatId}`).emit('new_message', {
                success: true,
                data: {
                    message
                }
            });

        } catch (error) {
            console.error('Send message error:', error);
            socket.emit('error', {
                success: false,
                message: 'Xabar yuborishda xatolik'
            });
        }
    });

    // Delete message (only sender can delete)
    socket.on('delete_message', async (data) => {
        try {
            const { chatId, messageId } = data || {};

            if (!chatId || !messageId) {
                socket.emit('error', {
                    success: false,
                    message: 'Chat ID va message ID kerak'
                });
                return;
            }

            const isParticipant = await Chat.isParticipant(chatId, socket.userId);
            if (!isParticipant) {
                socket.emit('error', {
                    success: false,
                    message: 'Bu chatga kirish huquqingiz yo\'q'
                });
                return;
            }

            const result = await Message.deleteInChat(parseInt(messageId), parseInt(chatId), socket.userId);

            if (result.deleted) {
                io.to(`chat_${chatId}`).emit('message_deleted', {
                    success: true,
                    data: {
                        chatId: parseInt(chatId),
                        messageId: parseInt(messageId)
                    }
                });
            } else {
                socket.emit('error', {
                    success: false,
                    message: 'Xabar o\'chirilmadi'
                });
            }
        } catch (error) {
            const msg = String(error && error.message ? error.message : error);
            if (msg === 'Message not found') {
                socket.emit('error', { success: false, message: 'Xabar topilmadi' });
                return;
            }
            if (msg === 'Unauthorized') {
                socket.emit('error', { success: false, message: 'Bu xabarni o\'chirish huquqingiz yo\'q' });
                return;
            }
            if (msg === 'Message does not belong to this chat') {
                socket.emit('error', { success: false, message: 'Xabar ushbu chatga tegishli emas' });
                return;
            }
            console.error('Delete message error:', error);
            socket.emit('error', {
                success: false,
                message: 'Xabar o\'chirishda xatolik'
            });
        }
    });

    // Create or get chat
    socket.on('create_chat', async (data) => {
        try {
            const { targetPhone } = data;

            if (!targetPhone) {
                socket.emit('error', {
                    success: false,
                    message: 'Target phone kerak'
                });
                return;
            }

            // Find target user
            let targetUser;
            try {
                targetUser = await User.findByPhone(targetPhone);
            } catch (e) {
                if (e && e.code === 'PHONE_NOT_UNIQUE') {
                    socket.emit('error', {
                        success: false,
                        message: 'Bu telefon raqami bir nechta foydalanuvchida bor (DB xatosi)'
                    });
                    return;
                }
                throw e;
            }
            if (!targetUser) {
                socket.emit('error', {
                    success: false,
                    message: 'Foydalanuvchi topilmadi'
                });
                return;
            }

            // Check if trying to chat with self
            if (targetUser.id === socket.userId) {
                socket.emit('error', {
                    success: false,
                    message: 'O\'zingiz bilan chat qila olmaysiz'
                });
                return;
            }

            // Check if private chat already exists
            let existingChat = await Chat.findPrivateChat(socket.userId, targetUser.id);
            
            if (existingChat) {
                // If user previously hid this chat, bring it back
                await Chat.unhideForUser(existingChat.id, socket.userId);

                const chatDetails = await Chat.getById(existingChat.id);
                
                // Join both users to the chat room
                socket.join(`chat_${existingChat.id}`);
                io.to(`user_${targetUser.id}`).socketsJoin(`chat_${existingChat.id}`);

                socket.emit('chat_created', {
                    success: true,
                    message: 'Mavjud chat topildi',
                    data: { chat: chatDetails }
                });

                // Notify target user about new chat (if online)
                io.to(`user_${targetUser.id}`).emit('new_chat', {
                    success: true,
                    data: { chat: chatDetails }
                });

                return;
            }

            // Create new private chat
            const newChat = await Chat.create([socket.userId, targetUser.id]);
            const chatDetails = await Chat.getById(newChat.id);

            // Join both users to the new chat room
            socket.join(`chat_${newChat.id}`);
            io.to(`user_${targetUser.id}`).socketsJoin(`chat_${newChat.id}`);

            socket.emit('chat_created', {
                success: true,
                message: 'Yangi chat yaratildi',
                data: { chat: chatDetails }
            });

            // Notify target user about new chat (if online)
            io.to(`user_${targetUser.id}`).emit('new_chat', {
                success: true,
                data: { chat: chatDetails }
            });

        } catch (error) {
            console.error('Create chat error:', error);
            socket.emit('error', {
                success: false,
                message: 'Chat yaratishda xatolik'
            });
        }
    });

    // User typing indicator
    socket.on('typing', (data) => {
        const { chatId, isTyping } = data;
        socket.to(`chat_${chatId}`).emit('user_typing', {
            userId: socket.userId,
            name: socket.user.name,
            phone: socket.user.phone,
            isTyping
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.phone} (ID: ${socket.userId})`);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server ${PORT} portda ishlamoqda`);
    console.log(`Socket.IO real-time chat server ready`);
});
