const { sendOTPEmail } = require('../config/email');

// User OTP Store
const otpStore = new Map();

function generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

async function sendOTPEmailUser(email, otp, type = 'login') {
    return await sendOTPEmail(email, otp, type, false);
}

function storeOTP(email, otp) {
    otpStore.set(email, {
        otp: otp,
        expires: Date.now() + 5 * 60 * 1000
    });
    
    setTimeout(() => {
        if (otpStore.has(email) && otpStore.get(email).otp === otp) {
            otpStore.delete(email);
        }
    }, 5 * 60 * 1000);
}

function verifyOTP(email, otp) {
    if (!otpStore.has(email)) {
        return { valid: false, message: 'OTP expired or not found' };
    }
    
    const stored = otpStore.get(email);
    if (stored.otp !== otp) {
        return { valid: false, message: 'Invalid OTP' };
    }
    
    if (Date.now() > stored.expires) {
        otpStore.delete(email);
        return { valid: false, message: 'OTP expired' };
    }
    
    otpStore.delete(email);
    return { valid: true, message: 'OTP verified successfully' };
}

module.exports = {
    generateOTP,
    sendOTPEmailUser,
    storeOTP,
    verifyOTP,
    otpStore
};