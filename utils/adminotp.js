const { sendOTPEmail } = require('../config/email');

// Admin OTP Store (in-memory cache)
const adminOTPStore = new Map();

// ================================================================
// GENERATE ADMIN OTP
// ================================================================
function generateAdminOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

// ================================================================
// SEND ADMIN OTP VIA EMAIL
// ================================================================
async function sendAdminOTPEmail(email, otp, type = 'login') {
    return await sendOTPEmail(email, otp, type, true);
}

// ================================================================
// STORE ADMIN OTP (Valid for 5 minutes)
// ================================================================
function storeAdminOTP(email, otp) {
    adminOTPStore.set(email, {
        otp: otp,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    
    // Auto cleanup after 5 minutes
    setTimeout(() => {
        if (adminOTPStore.has(email) && adminOTPStore.get(email).otp === otp) {
            adminOTPStore.delete(email);
            console.log(`🧹 Admin OTP cleaned up for ${email}`);
        }
    }, 5 * 60 * 1000);
}

// ================================================================
// VERIFY ADMIN OTP
// ================================================================
function verifyAdminOTP(email, otp) {
    if (!adminOTPStore.has(email)) {
        return { valid: false, message: 'OTP expired or not found' };
    }
    
    const stored = adminOTPStore.get(email);
    if (stored.otp !== otp) {
        return { valid: false, message: 'Invalid OTP' };
    }
    
    if (Date.now() > stored.expires) {
        adminOTPStore.delete(email);
        return { valid: false, message: 'OTP expired' };
    }
    
    // OTP is valid, remove it
    adminOTPStore.delete(email);
    return { valid: true, message: 'OTP verified successfully' };
}

// ================================================================
// CHECK IF ADMIN OTP EXISTS
// ================================================================
function hasAdminOTP(email) {
    return adminOTPStore.has(email);
}

// ================================================================
// GET ADMIN OTP EXPIRY TIME
// ================================================================
function getAdminOTPExpiry(email) {
    if (!adminOTPStore.has(email)) return null;
    return adminOTPStore.get(email).expires;
}

// ================================================================
// CLEAR ADMIN OTP
// ================================================================
function clearAdminOTP(email) {
    if (adminOTPStore.has(email)) {
        adminOTPStore.delete(email);
        return true;
    }
    return false;
}

module.exports = {
    generateAdminOTP,
    sendAdminOTPEmail,
    storeAdminOTP,
    verifyAdminOTP,
    hasAdminOTP,
    getAdminOTPExpiry,
    clearAdminOTP,
    adminOTPStore
};