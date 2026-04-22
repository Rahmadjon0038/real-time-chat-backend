const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizePhone } = require('../utils/phone');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

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
                    phone: user.phone
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
                    phone: user.phone
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
                user
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

// Get all users (for finding users to chat with)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        
        // Remove current user from list
        const filteredUsers = users.filter(user => user.id !== req.userId);

        res.json({
            success: true,
            data: {
                users: filteredUsers
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
    getAllUsers
};
