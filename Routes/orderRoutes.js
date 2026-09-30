const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// ✅ CREATE NEW ORDER
router.post('/', async (req, res) => {
    try {
        console.log('📦 Creating new order...');
        console.log('📦 Order Data:', req.body);
        
        const { 
            orderNumber, 
            userId, 
            items, 
            subtotal, 
            shippingCharge, 
            tax, 
            totalAmount, 
            paymentMethod, 
            shippingAddress,
            status,
            paymentStatus
        } = req.body;
        
        // Validate required fields
        if (!items || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Order must have at least one item' 
            });
        }
        
        if (!shippingAddress || !shippingAddress.address) {
            return res.status(400).json({ 
                success: false, 
                message: 'Shipping address is required' 
            });
        }
        
        // Create new order
        const order = new Order({
            orderNumber: orderNumber || 'ORD' + Date.now(),
            userId: userId || null,
            items: items.map(item => ({
                productId: item.productId,
                productName: item.productName || item.name || 'Product',
                quantity: Number(item.quantity) || 1,
                price: Number(item.price) || 0,
                category: item.category || 'Uncategorized',
                size: item.size || null,
                color: item.color || null,
                image: item.image || null,
                subtotal: (Number(item.quantity) || 1) * (Number(item.price) || 0)
            })),
            subtotal: Number(subtotal) || 0,
            shippingCharge: Number(shippingCharge) || 0,
            tax: Number(tax) || 0,
            totalAmount: Number(totalAmount) || 0,
            status: status || 'pending',
            paymentMethod: paymentMethod || 'cod',
            paymentStatus: paymentStatus || 'pending',
            shippingAddress: {
                name: shippingAddress.name || '',
                email: shippingAddress.email || '',
                address: shippingAddress.address || '',
                city: shippingAddress.city || '',
                state: shippingAddress.state || 'N/A',
                pincode: shippingAddress.pincode || shippingAddress.zip || '',
                phone: shippingAddress.phone || ''
            },
            createdAt: new Date()
        });
        
        await order.save();
        
        console.log('✅ Order saved successfully:', order._id);
        
        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            orderId: order.orderNumber,
            _id: order._id,
            order: order
        });
        
    } catch (error) {
        console.error('❌ Error creating order:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
});

// ✅ GET ALL ORDERS
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (error) {
        console.error('❌ Error fetching orders:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ✅ GET USER ORDERS
router.get('/my-orders', async (req, res) => {
    try {
        // Get userId from query or header
        const userId = req.headers['user-id'] || req.query.userId;
        
        // If no userId provided, try to get from token (you can implement auth middleware)
        // For now, return all orders if no userId (for testing)
        let query = {};
        if (userId) {
            query.userId = userId;
        }
        
        const orders = await Order.find(query)
            .populate('items.productId', 'name price images')
            .sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (error) {
        console.error('❌ Error fetching user orders:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ✅ GET SINGLE ORDER
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('items.productId', 'name price category images');
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }
        
        res.json(order);
    } catch (error) {
        console.error('❌ Error fetching order:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ✅ UPDATE ORDER STATUS
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: status, updatedAt: new Date() },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Order status updated',
            order: order
        });
    } catch (error) {
        console.error('❌ Error updating order:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ✅ CANCEL ORDER
router.put('/:id/cancel', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'cancelled', 
                updatedAt: new Date() 
            },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order: order
        });
    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ✅ CHECK IF ORDER EXISTS
router.post('/check', async (req, res) => {
    try {
        const { orderNumber } = req.body;
        const order = await Order.findOne({ orderNumber: orderNumber });
        res.json({ exists: !!order });
    } catch (error) {
        console.error('❌ Error checking order:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;