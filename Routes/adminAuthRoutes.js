const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// ================================================================
// ✅ EMAIL CONFIGURATION - Using .env variables
// ================================================================
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify email configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email configuration error:', error);
        console.error('❌ Please check EMAIL_USER and EMAIL_PASS in .env file');
    } else {
        console.log('✅ Email configured successfully!');
        console.log('📧 Sending emails from:', process.env.EMAIL_USER);
    }
});

// ================================================================
// STORE OTPs TEMPORARILY
// ================================================================
const otpStore = {};

// ================================================================
// GENERATE OTP
// ================================================================
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ================================================================
// ✅ SEND OTP EMAIL
// ================================================================
async function sendOTPEmail(email, otp, name = 'Admin', type = 'register') {
    try {
        const subject = type === 'login' 
            ? '🔐 ShopyGo Admin - OTP for Login' 
            : '🔐 ShopyGo Admin - OTP for Registration';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc;">
                <div style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🛒</div>
                        <h1 style="color: #2563eb; font-size: 32px; margin: 0; font-weight: 800;">ShopyGo</h1>
                        <p style="color: #64748b; font-size: 14px; margin: 5px 0 0;">${type === 'login' ? 'Admin Login Verification' : 'Admin Registration Verification'}</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 10px;">Hello ${name} 👋</h2>
                        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                            ${type === 'login' 
                                ? 'You are attempting to login to your ShopyGo admin panel. Use the OTP below to complete your login.'
                                : 'You are registering as a ShopyGo admin. Use the OTP below to complete your registration.'
                            }
                        </p>
                        
                        <!-- OTP Box -->
                        <div style="text-align: center; padding: 25px 0; background: #eff6ff; border-radius: 12px; margin: 20px 0;">
                            <div style="font-size: 40px; font-weight: 800; color: #2563eb; letter-spacing: 10px; font-family: monospace;">
                                ${otp}
                            </div>
                        </div>
                        
                        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                            ⏱️ This OTP is valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.
                            <br>Do not share this OTP with anyone.
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                        <p style="margin: 0;">© 2025 ShopyGo. All rights reserved.</p>
                        <p style="margin: 5px 0 0;">
                            <a href="mailto:${process.env.EMAIL_USER}" style="color: #2563eb; text-decoration: none;">Contact Support</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"ShopyGo Admin" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent to ${email}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        console.error('❌ Error details:', error.message);
        return false;
    }
}

// ================================================================
// ✅ ADMIN LOGIN - NO OTP REQUIRED
// ================================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Admin login attempt for:', email);

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin account not found with this email' 
            });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin privileges required.' 
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials. Please check your password.' 
            });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'shopygo_super_secret_key_2025',
            { expiresIn: '7d' }
        );

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone || '',
            address: user.address || ''
        };

        console.log(`✅ Admin logged in: ${user.email}`);
        
        // Set cookie
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
        console.error('❌ Error during admin login:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// ✅ ADMIN REGISTER - SEND OTP
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

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiryTime = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000;

        // Store OTP
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
// ✅ ADMIN REGISTER - VERIFY OTP & CREATE ACCOUNT
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

        // Check OTP in store
        const storedData = otpStore[email];
        
        if (!storedData) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP not found. Please request a new OTP.' 
            });
        }

        // Check OTP expiry
        if (Date.now() > storedData.expiry) {
            delete otpStore[email];
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired. Please request a new OTP.' 
            });
        }

        // Verify OTP
        if (storedData.otp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP. Please try again.' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin user
        const newUser = new User({
            name: name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'admin',
            phone: phone || '',
            isVerified: true,
            createdAt: new Date()
        });

        await newUser.save();

        // Remove OTP from store
        delete otpStore[email];

        console.log(`✅ New admin registered: ${email}`);
        
        res.json({
            success: true,
            message: 'Admin account created successfully! Please login.',
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
// ✅ ADMIN LOGOUT
// ================================================================
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
});

// ================================================================
// ✅ CHECK ADMIN STATUS
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
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Not admin' 
            });
        }

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
                role: user.role
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

module.exports = router;