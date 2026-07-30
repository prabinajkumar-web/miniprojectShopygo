// config/razorpay.js
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Check if keys are configured
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('⚠️ WARNING: Razorpay keys are not configured in .env file');
    console.warn('Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
} else {
    console.log('💰 Razorpay configured with Key ID:', process.env.RAZORPAY_KEY_ID);
}

module.exports = razorpay;