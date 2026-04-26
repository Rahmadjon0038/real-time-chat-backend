const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { normalizePhone } = require('../utils/phone');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const AVATAR_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const toAbsoluteUrl = (req, maybePath) => {
    if (!maybePath) return null;
    if (typeof maybePath !== 'string') return null;
    if (maybePath.startsWith('http://') || maybePath.startsWith('https://')) return maybePath;
    const host = req.get('host');
    if (!host) return maybePath;
    const p = maybePath.startsWith('/') ? maybePath : `/${maybePath}`;
    return `${req.protocol}://${host}${p}`;
};

const decorateUser = (req, user) => {
    if (!user) return user;
    return {
        ...user,
        profile_image_url: toAbsoluteUrl(req, user.profile_image || null)
    };
};

const parseImageDataUrl = (dataUrl) => {
    if (typeof dataUrl !== 'string') return null;
    const m = dataUrl.match(/^data:(image\/png|image\/jpeg|image\/webp);base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!m) return null;
    const mime = m[1].toLowerCase();
    const b64 = m[2].replace(/\s/g, '');
    const buffer = Buffer.from(b64, 'base64');
    if (!buffer || buffer.length === 0) return null;
    if (buffer.length > MAX_AVATAR_BYTES) return null;
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    return { ext, buffer };
};

const safeUnlink = async (filePath) => {
    try {
        await fs.promises.unlink(filePath);
    } catch (e) {
        // ignore
    }
};

// Register new user
const register = async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        const normalizedPhone = normalizePhone(phone);

        // Validate input
        if (!name || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Barcha maydonlar to\'ldirilishi kerak'
            });
        }

        // Check if phone already exists
        try {
            const existingPhoneUser = await User.findByPhone(normalizedPhone || phone);
            if (existingPhoneUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu telefon raqami allaqachon mavjud'
                });
            }
        } catch (e) {
            if (e && e.code === 'PHONE_NOT_UNIQUE') {
                return res.status(409).json({
                    success: false,
                    message: 'Bu telefon raqami bir nechta foydalanuvchida bor (DB xatosi)'
                });
            }
            throw e;
        }

        // Create new user
        const user = await User.create({ name, phone: normalizedPhone || phone, password });

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            message: 'Foydalanuvchi muvaffaqiyatli ro\'yxatdan o\'tdi',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    profile_image: user.profile_image || null,
                    profile_image_url: null
                },
                token
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Validate input
        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam va parol kiritilishi kerak'
            });
        }

        // Find user
        let user;
        try {
            user = await User.findByPhone(phone);
        } catch (e) {
            if (e && e.code === 'PHONE_NOT_UNIQUE') {
                return res.status(409).json({
                    success: false,
                    message: 'Bu telefon raqami bir nechta foydalanuvchida bor (DB xatosi)'
                });
            }
            throw e;
        }
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Noto\'g\'ri telefon raqam yoki parol'
            });
        }

        // Verify password
        const isValidPassword = await User.verifyPassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Noto\'g\'ri telefon raqam yoki parol'
            });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            message: 'Muvaffaqiyatli tizimga kirildi',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    profile_image: user.profile_image || null,
                    profile_image_url: toAbsoluteUrl(req, user.profile_image || null)
                },
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        res.json({
            success: true,
            data: {
                user: decorateUser(req, user)
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Update current user profile (name + profile image)
const updateProfile = async (req, res) => {
    try {
        const { name, profile_image_base64, profile_image_remove } = req.body || {};

        if (name === undefined && profile_image_base64 === undefined && !profile_image_remove) {
            return res.status(400).json({
                success: false,
                message: 'Hech bo\'lmaganda bitta maydon yuboring: name, profile_image_base64 yoki profile_image_remove'
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        const updates = {};

        if (name !== undefined) {
            const trimmed = String(name).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: 'Ism bo\'sh bo\'lishi mumkin emas'
                });
            }
            updates.name = trimmed;
        }

        if (profile_image_remove) {
            updates.profile_image = null;
        } else if (profile_image_base64 !== undefined) {
            const parsed = parseImageDataUrl(profile_image_base64);
            if (!parsed) {
                return res.status(400).json({
                    success: false,
                    message: 'profile_image_base64 noto\'g\'ri (faqat data URL: png/jpeg/webp, max 5MB)'
                });
            }

            await fs.promises.mkdir(AVATAR_DIR, { recursive: true });
            const filename = `user_${req.userId}_${Date.now()}.${parsed.ext}`;
            const relPath = `/uploads/avatars/${filename}`;
            const absPath = path.join(AVATAR_DIR, filename);
            await fs.promises.writeFile(absPath, parsed.buffer);
            updates.profile_image = relPath;
        }

        await User.updateProfile(req.userId, updates);

        // Best-effort: remove old avatar if it was replaced/removed and points to our uploads dir
        if ((updates.profile_image !== undefined) && user.profile_image && typeof user.profile_image === 'string') {
            if (user.profile_image.startsWith('/uploads/avatars/')) {
                const oldName = user.profile_image.replace('/uploads/avatars/', '');
                await safeUnlink(path.join(AVATAR_DIR, oldName));
            }
        }

        const updatedUser = await User.findById(req.userId);

        return res.json({
            success: true,
            message: 'Profil yangilandi',
            data: {
                user: decorateUser(req, updatedUser)
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Get all users (for finding users to chat with)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        
        // Remove current user from list
        const filteredUsers = users.filter(user => user.id !== req.userId);

        res.json({
            success: true,
            data: {
                users: filteredUsers.map((u) => decorateUser(req, u))
            }
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    getAllUsers
};
