const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

// All chat routes are protected
router.use(authMiddleware);

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Foydalanuvchining chatlar ro'yxati
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chatlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     chats:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Token noto'g'ri yoki yo'q
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', chatController.getUserChats);

/**
 * @swagger
 * /api/chats/create:
 *   post:
 *     summary: Yangi chat yaratish yoki mavjudini topish
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateChatRequest'
 *     responses:
 *       200:
 *         description: Mavjud chat topildi
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
 *                   example: "Mavjud chat topildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     chat:
 *                       $ref: '#/components/schemas/Chat'
 *       201:
 *         description: Yangi chat yaratildi
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
 *                   example: "Yangi chat yaratildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     chat:
 *                       $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Foydalanuvchi topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token noto'g'ri yoki yo'q
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/create', chatController.createOrGetChat);

/**
 * @swagger
 * /api/chats/{chatId}:
 *   get:
 *     summary: Chat ma'lumotlarini olish
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     chat:
 *                       $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Token noto'g'ri yoki yo'q
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Bu chatga kirish huquqingiz yo'q
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chat topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:chatId', chatController.getChatDetails);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   get:
 *     summary: Chat xabarlarini olish
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Nechta xabar olish
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Qayerdan boshlash
 *     responses:
 *       200:
 *         description: Chat xabarlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *       401:
 *         description: Token noto'g'ri yoki yo'q
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Bu chatga kirish huquqingiz yo'q
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:chatId/messages', chatController.getChatMessages);

/**
 * @swagger
 * /api/chats/{chatId}/read:
 *   post:
 *     summary: Chatdagi xabarlarni o'qildi deb belgilash
 *     description: `messageId` berilsa shu xabargacha (inclusive) o'qildi deb belgilanadi, berilmasa chatdagi oxirgi xabargacha belgilanadi.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: integer
 *                 description: O'qildi deb belgilash uchun message ID
 *     responses:
 *       200:
 *         description: O'qildi deb belgilandi
 *       401:
 *         description: Token noto'g'ri yoki yo'q
 *       403:
 *         description: Bu chatga kirish huquqingiz yo'q
 *       500:
 *         description: Server xatosi
 */
router.post('/:chatId/read', chatController.markChatRead);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   post:
 *     summary: Chat'ga xabar yuborish
 *     description: REST API orqali xabar yuborish (Socket.IO'dan tashqari)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       201:
 *         description: Xabar yuborildi
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
 *                   example: "Xabar yuborildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       $ref: '#/components/schemas/Message'
 *       400:
 *         description: Xabar matni bo'sh
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token noto'g'ri yoki yo'q
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Bu chatga xabar yuborish huquqingiz yo'q
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:chatId/messages', chatController.sendMessage);

/**
 * @swagger
 * /api/chats/{chatId}:
 *   delete:
 *     summary: Chatni ro'yxatdan o'chirish (hide)
 *     description: Chatni faqat joriy foydalanuvchi chatlar ro'yxatidan olib tashlaydi (boshqa participantlarda qoladi). Yangi xabar kelsa chat qaytib chiqadi.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat ro'yxatdan o'chirildi
 *       401:
 *         description: Token noto'g'ri yoki yo'q
 *       403:
 *         description: Bu chatga kirish huquqingiz yo'q
 *       500:
 *         description: Server xatosi
 */
router.delete('/:chatId', chatController.hideChat);

/**
 * @swagger
 * /api/chats/{chatId}/messages/{messageId}:
 *   delete:
 *     summary: Chatdagi xabarni o'chirish
 *     description: Faqat xabar yuborgan foydalanuvchi o'chira oladi
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Xabar o'chirildi
 *       400:
 *         description: Xabar ushbu chatga tegishli emas
 *       403:
 *         description: Ruxsat yo'q yoki bu xabar sizniki emas
 *       404:
 *         description: Xabar topilmadi
 *       401:
 *         description: Token noto'g'ri yoki yo'q
 *       500:
 *         description: Server xatosi
 */
router.delete('/:chatId/messages/:messageId', chatController.deleteMessage);

module.exports = router;
