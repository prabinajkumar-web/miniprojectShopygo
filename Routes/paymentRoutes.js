// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const Order = require('../models/order');  // ✅ Import at top

// ============================================================
// GET RAZORPAY KEY
// ============================================================
router.get('/get-key', async (req, res) => {
    try {
        res.json({ 
            keyId: process.env.RAZORPAY_KEY_ID,
            message: 'Key fetched successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// ============================================================
// CREATE RAZORPAY ORDER
// ============================================================
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid amount' 
            });
        }

        console.log(`💰 Creating Razorpay order for ₹${amount}`);

        const options = {
            amount: Math.round(amount * 100),
            currency: currency,
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);
        
        console.log(`✅ Razorpay Order Created: ${order.id}`);
        
        res.json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error('❌ Razorpay Order Error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// ============================================================
// VERIFY PAYMENT
// ============================================================
router.post('/verify', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId
        } = req.body;

        console.log(`🔍 Verifying payment: ${razorpay_payment_id}`);

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            console.log(`✅ Payment Verified`);
            
            if (orderId) {
                await Order.findByIdAndUpdate(orderId, {
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    paymentStatus: 'paid',
                    status: 'confirmed'
                });
                console.log(`📦 Order ${orderId} updated to paid`);
            }

            res.json({
                success: true,
                message: 'Payment verified successfully',
                paymentId: razorpay_payment_id,
                orderId: orderId
            });
        } else {
            console.error(`❌ Payment Verification Failed`);
            res.status(400).json({
                success: false,
                message: 'Payment verification failed - Invalid signature'
            });
        }

    } catch (error) {
        console.error('❌ Verification Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================================
// SAVE ORDER BEFORE PAYMENT
// ============================================================
router.post('/save-order', async (req, res) => {
    try {
        const { 
            items, 
            shippingAddress, 
            subtotal, 
            shippingCharge, 
            tax, 
            totalAmount, 
            orderNote,
            paymentMethod = 'online'
        } = req.body;
        
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderNumber = 'ORD' + timestamp + random;
        
        console.log(`📦 Creating order: ${orderNumber}`);
        console.log(`💳 Payment Method: ${paymentMethod}`);

        const order = new Order({
            orderNumber,
            userId: req.user?._id || null,
            items: items || [],
            subtotal: subtotal || 0,
            shippingCharge: shippingCharge || 0,
            tax: tax || 0,
            totalAmount: totalAmount || 0,
            shippingAddress: shippingAddress || {},
            orderNote: orderNote || '',
            paymentStatus: 'pending',
            paymentMethod: paymentMethod,
            status: 'pending'
        });

        await order.save();
        console.log(`✅ Order Saved: ${orderNumber} (ID: ${order._id})`);

        res.json({
            success: true,
            orderId: order._id,
            orderNumber: order.orderNumber
        });

    } catch (error) {
        console.error('❌ Save Order Error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

module.exports = router;