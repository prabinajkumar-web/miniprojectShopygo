const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendOTPEmail } = require('../config/email');
const { 
    generateAdminOTP, 
    storeAdminOTP, 
    verifyAdminOTP 
} = require('../utils/adminotp');

// ================================================================
// SEND OTP FOR ADMIN LOGIN
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
        
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email'
            });
        }
        
        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized as admin'
            });
        }
        
        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account is deactivated'
            });
        }
        
        // Generate OTP
        const otp = generateAdminOTP(6);
        console.log(`🔐 Admin Login OTP for ${email}: ${otp}`);
        
        // Store OTP
        storeAdminOTP(email, otp);
        
        // Send OTP via email
        const result = await sendOTPEmail(email, otp, 'login', true);
        
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
        console.error('❌ Error sending OTP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// ✅ VERIFY OTP AND LOGIN ADMIN - FIXED (Added 'id' field)
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
        
        // Verify OTP
        const verification = verifyAdminOTP(email, otp);
        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                message: verification.message
            });
        }
        
        // Get user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Generate token
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
        console.error('❌ Error verifying OTP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// ADMIN LOGOUT
// ================================================================
exports.adminLogout = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// CHECK ADMIN STATUS
// ================================================================
exports.checkAdminStatus = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.json({
                success: false,
                message: 'Not authenticated'
            });
        }
        
        const decoded = Buffer.from(token, 'base64').toString();
        const userId = decoded.split(':')[0];
        
        const user = await User.findById(userId).select('-password');
        if (!user || user.role !== 'admin') {
            return res.json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        res.json({
            success: true,
            user: user
        });
        
    } catch (error) {
        console.error('❌ Error checking admin:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};