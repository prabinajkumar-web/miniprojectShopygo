const express = require('express');
const router = express.Router();
const {
    sendRegisterOTP,
    verifyRegisterOTP,
    sendLoginOTP,
    verifyLoginOTP,
    sendForgotPasswordOTP,
    resetPassword
} = require('../controllers/authController');

// ================================================================
// ✅ REGISTER ROUTES (Matches frontend)
// ================================================================
router.post('/send-register-otp', sendRegisterOTP);
router.post('/verify-register-otp', verifyRegisterOTP);

// ================================================================
// ✅ LOGIN ROUTES (Matches frontend)
// ================================================================
router.post('/send-login-otp', sendLoginOTP);
router.post('/verify-login-otp', verifyLoginOTP);

// ================================================================
// ✅ FORGOT PASSWORD ROUTES
// ================================================================
router.post('/send-forgot-otp', sendForgotPasswordOTP);
router.post('/reset-password', resetPassword);

// ================================================================
// ✅ CHECK EMAIL
// ================================================================
router.post('/check-email', async (req, res) => {
    const { User } = require('../models');
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        res.json({ exists: !!user });
    } catch (error) {
        res.status(500).json({ message: 'Error checking email' });
    }
});

module.exports = router;