const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// ================================================================
// EMAIL CONFIGURATION
// ================================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'jayakumarprabina@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Store OTPs temporarily
const otpStore = {};

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ================================================================
// SEND OTP EMAIL
// ================================================================
async function sendOTPEmail(email, otp, name = 'User', type = 'register') {
    try {
        const subject = type === 'register' 
            ? '🔐 ShopyGo - OTP for Registration' 
            : '🔐 ShopyGo - OTP for Password Reset';

        const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #2563eb; font-size: 28px;">🛒 ShopyGo</h1>
                    <p style="color: #64748b; font-size: 14px;">${type === 'register' ? 'Registration Verification' : 'Password Reset Verification'}</p>
                </div>
                <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 10px;">Hello ${name} 👋</h2>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                        ${type === 'register' 
                            ? 'You are registering as a ShopyGo user. Use the OTP below to complete your registration.'
                            : 'You have requested to reset your password. Use the OTP below to reset your password.'
                        }
                    </p>
                    <div style="text-align: center; padding: 20px 0;">
                        <div style="background: #eff6ff; padding: 16px; border-radius: 8px; display: inline-block;">
                            <span style="font-size: 36px; font-weight: 800; color: #2563eb; letter-spacing: 8px;">${otp}</span>
                        </div>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
                        ⏱️ This OTP is valid for 5 minutes. Do not share this with anyone.
                    </p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                    <p>© 2025 ShopyGo. All rights reserved.</p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: `"ShopyGo" <${process.env.EMAIL_USER || 'jayakumarprabina@gmail.com'}>`,
            to: email,
            subject: subject,
            html: html
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        return false;
    }
}

// ================================================================
// ✅ USER LOGIN - NO OTP REQUIRED
// ================================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 User login attempt:', email);

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found with this email' 
            });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({ 
                success: false, 
                message: 'Your account has been blocked' 
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid password' 
            });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                role: user.role || 'user' 
            },
            process.env.JWT_SECRET || 'shopygo_super_secret_key_2025',
            { expiresIn: '7d' }
        );

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || 'user',
            phone: user.phone || '',
            address: user.address || ''
        };

        console.log(`✅ User logged in: ${user.email}`);
        
        res.cookie('token', token, { 
            httpOnly: true, 
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: '/'
        });
        
        res.json({
            success: true,
            message: 'Login successful!',
            token: token,
            user: userData
        });

    } catch (error) {
        console.error('❌ Error during login:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// ✅ USER REGISTER - SEND OTP
// ================================================================
router.post('/send-register-otp', async (req, res) => {
    try {
        const { email, name } = req.body;
        console.log('📧 Register OTP requested for:', email);

        if (!email || !name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and Name are required' 
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }

        const otp = generateOTP();
        const expiryTime = Date.now() + 5 * 60 * 1000;

        otpStore[email] = {
            otp: otp,
            expiry: expiryTime,
            name: name,
            type: 'register'
        };

        // Send email with OTP
        const emailSent = await sendOTPEmail(email, otp, name, 'register');
        
        if (!emailSent) {
            console.log(`⚠️ Email failed. OTP for ${email}: ${otp}`);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send OTP email. Please check email configuration.',
                devOTP: otp
            });
        }

        console.log(`📧 Register OTP for ${email}: ${otp}`);

        res.json({ 
            success: true, 
            message: 'OTP sent successfully to your email',
            devOTP: process.env.NODE_ENV === 'development' ? otp : undefined
        });

    } catch (error) {
        console.error('❌ Error sending register OTP:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// ✅ USER REGISTER - VERIFY OTP
// ================================================================
router.post('/verify-register-otp', async (req, res) => {
    try {
        const { email, otp, name, password, phone } = req.body;
        console.log('🔐 Verifying register OTP for:', email);

        if (!email || !otp || !name || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        const storedData = otpStore[email];
        
        if (!storedData) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP not found. Please request a new OTP.' 
            });
        }

        if (Date.now() > storedData.expiry) {
            delete otpStore[email];
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired. Please request a new OTP.' 
            });
        }

        if (storedData.otp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP. Please try again.' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'user',
            phone: phone || '',
            isVerified: true,
            createdAt: new Date()
        });

        await newUser.save();
        delete otpStore[email];

        console.log(`✅ New user registered: ${email}`);
        
        res.json({
            success: true,
            message: 'Account created successfully! Please login.',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('❌ Error verifying register OTP:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// ✅ SEND FORGOT PASSWORD OTP
// ================================================================
router.post('/send-forgot-otp', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('📧 Forgot password OTP requested for:', email);

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found with this email' 
            });
        }

        const otp = generateOTP();
        const expiryTime = Date.now() + 5 * 60 * 1000;

        otpStore[email] = {
            otp: otp,
            expiry: expiryTime,
            name: user.name,
            type: 'forgot'
        };

        const emailSent = await sendOTPEmail(email, otp, user.name, 'forgot');
        
        if (!emailSent) {
            console.log(`⚠️ Email failed. OTP for ${email}: ${otp}`);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send OTP email.',
                devOTP: otp
            });
        }

        console.log(`📧 Forgot password OTP for ${email}: ${otp}`);

        res.json({ 
            success: true, 
            message: 'OTP sent successfully to your email',
            devOTP: process.env.NODE_ENV === 'development' ? otp : undefined
        });

    } catch (error) {
        console.error('❌ Error sending forgot password OTP:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// ✅ RESET PASSWORD
// ================================================================
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        console.log('🔐 Resetting password for:', email);

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

        const storedData = otpStore[email];
        
        if (!storedData) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP not found. Please request a new OTP.' 
            });
        }

        if (Date.now() > storedData.expiry) {
            delete otpStore[email];
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired. Please request a new OTP.' 
            });
        }

        if (storedData.otp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP. Please try again.' 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { password: hashedPassword }
        );

        delete otpStore[email];

        console.log(`✅ Password reset for: ${email}`);
        
        res.json({
            success: true,
            message: 'Password reset successfully! Please login.'
        });

    } catch (error) {
        console.error('❌ Error resetting password:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// ✅ CHECK USER STATUS
// ================================================================
router.get('/check-status', async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1] || req.cookies?.token;
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authenticated' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopygo_super_secret_key_2025');
        
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || 'user'
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

// ================================================================
// ✅ LOGOUT
// ================================================================
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
});

// ================================================================
// ✅ CHECK EMAIL
// ================================================================
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        res.json({ exists: !!user });
    } catch (error) {
        res.status(500).json({ message: 'Error checking email' });
    }
});

module.exports = router;