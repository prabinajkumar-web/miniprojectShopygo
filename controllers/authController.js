const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { generateOTP, storeOTP, verifyOTP } = require('../utils/otp');
const { sendOTPEmail } = require('../config/email');

// ================================================================
// SEND REGISTER OTP
// ================================================================
exports.sendRegisterOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const otp = generateOTP(6);
        console.log(`📝 Registration OTP for ${email}: ${otp}`);

        storeOTP(email, otp);

        const result = await sendOTPEmail(email, otp, 'register', false);

        if (!result.success) {
            return res.json({
                success: true,
                message: 'OTP generated successfully (Check console)',
                devOTP: otp,
                email: email
            });
        }

        res.json({
            success: true,
            message: 'OTP sent to your email successfully',
            email: email
        });

    } catch (error) {
        console.error('❌ Error sending register OTP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// VERIFY REGISTER OTP
// ================================================================
exports.verifyRegisterOTP = async (req, res) => {
    try {
        const { email, otp, name, password, phone } = req.body;

        if (!email || !otp || !name || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP, name and password are required'
            });
        }

        const verification = verifyOTP(email, otp);
        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                message: verification.message
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone: phone || '',
            role: 'customer',
            isActive: true,
            isVerified: true
        });

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: userResponse
        });

    } catch (error) {
        console.error('❌ Error verifying register OTP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// SEND LOGIN OTP
// ================================================================
exports.sendLoginOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please register first.'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        const otp = generateOTP(6);
        console.log(`🔐 Login OTP for ${email}: ${otp}`);

        storeOTP(email, otp);

        const result = await sendOTPEmail(email, otp, 'login', false);

        if (!result.success) {
            return res.json({
                success: true,
                message: 'OTP generated successfully (Check console)',
                devOTP: otp,
                email: email
            });
        }

        res.json({
            success: true,
            message: 'OTP sent to your email successfully',
            email: email
        });

    } catch (error) {
        console.error('❌ Error sending login OTP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// ✅ VERIFY LOGIN OTP - FIXED (Added 'id' field)
// ================================================================
exports.verifyLoginOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        const verification = verifyOTP(email, otp);
        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                message: verification.message
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');

        // ✅ FIX: Include both '_id' and 'id' in response
        const userResponse = {
            _id: user._id,
            id: user._id,              // ✅ Added 'id' field
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            isActive: user.isActive,
            address: user.address || '',
            photo: user.photo || '',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: userResponse
        });

    } catch (error) {
        console.error('❌ Error verifying login OTP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// SEND FORGOT PASSWORD OTP
// ================================================================
exports.sendForgotPasswordOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const otp = generateOTP(6);
        console.log(`🔑 Password Reset OTP for ${email}: ${otp}`);

        storeOTP(email, otp);

        const result = await sendOTPEmail(email, otp, 'reset', false);

        if (!result.success) {
            return res.json({
                success: true,
                message: 'OTP generated successfully (Check console)',
                devOTP: otp,
                email: email
            });
        }

        res.json({
            success: true,
            message: 'OTP sent to your email successfully',
            email: email
        });

    } catch (error) {
        console.error('❌ Error sending forgot password OTP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// RESET PASSWORD
// ================================================================
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const verification = verifyOTP(email, otp);
        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                message: verification.message
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.updatedAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('❌ Error resetting password:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};