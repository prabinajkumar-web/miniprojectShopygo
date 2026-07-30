const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: String,
        quantity: Number,
        price: Number,
        category: String,
        size: String,
        color: String,
        image: String,
        subtotal: Number
    }],
    subtotal: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'online', 'card', 'upi', 'netbanking'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    shippingAddress: {
        name: String,
        email: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
        phone: String
    },
    orderNote: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// ✅ NO pre('save') middleware - completely removed

module.exports = mongoose.model('Order', orderSchema);