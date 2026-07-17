const express = require('express');
const router = express.Router();
const { 
    // ❌ REMOVED: registerAdmin,
    sendLoginOTP,
    // ❌ REMOVED: sendRegisterOTP,
    verifyLoginOTP,
    adminLogout,
    checkAdminStatus
    // ❌ REMOVED: getAdminOTPStatus
} = require('../controllers/adminAuthController');

// ===== ADMIN AUTH ROUTES (LOGIN ONLY) =====

// ❌ REMOVED: Register routes
// router.post('/register', registerAdmin);
// router.post('/send-register-otp', sendRegisterOTP);

// ✅ KEPT: Login routes
router.post('/send-login-otp', sendLoginOTP);
router.post('/verify-login-otp', verifyLoginOTP);

// ✅ KEPT: Logout & Status
router.post('/logout', adminLogout);
router.get('/check-status', checkAdminStatus);

// ❌ REMOVED: Debug OTP status
// router.get('/otp-status', getAdminOTPStatus);

module.exports = router;