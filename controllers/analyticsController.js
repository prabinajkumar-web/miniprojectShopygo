const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// ================================================================
// GET ANALYTICS - COMPLETE FIX
// ================================================================
exports.getAnalytics = async (req, res) => {
    try {
        console.log('📊 Analytics API Called');
        
        // ✅ Get ALL orders with populated user data
        const orders = await Order.find({})
            .populate('userId', 'name email phone')
            .populate('items.productId', 'name price salePrice category mainImage');
        
        console.log(`📊 Found ${orders.length} orders`);

        // ✅ Get counts
        const totalProducts = await Product.countDocuments();
        const totalUsers = await User.countDocuments();

        // If no orders, return empty
        if (orders.length === 0) {
            return res.json({
                success: true,
                data: {
                    overview: {
                        totalOrders: 0,
                        totalRevenue: 0,
                        totalProducts: totalProducts,
                        totalUsers: totalUsers,
                        pendingOrders: 0,
                        completedOrders: 0,
                        cancelledOrders: 0
                    },
                    chartData: {
                        dailySales: [],
                        categorySales: [],
                        monthlyTrend: [],
                        statusDistribution: { pending: 0, completed: 0, cancelled: 0 }
                    },
                    topProducts: [],
                    recentOrders: [],
                    customerData: {
                        total: totalUsers,
                        newCustomers: 0,
                        returningCustomers: 0
                    },
                    customers: []
                }
            });
        }

        // ✅ Calculate totals
        let totalRevenue = 0;
        let pendingOrders = 0;
        let completedOrders = 0;
        let cancelledOrders = 0;
        const categoryMap = {};
        const productMap = {};
        const customerMap = {};

        for (let order of orders) {
            // ✅ Get total amount
            const orderTotal = Number(order.totalAmount) || 0;
            totalRevenue += orderTotal;
            
            // ✅ Count status
            const status = (order.status || '').toLowerCase();
            if (status === 'pending' || status === 'processing') {
                pendingOrders++;
            } else if (status === 'completed' || status === 'delivered' || status === 'shipped') {
                completedOrders++;
            } else if (status === 'cancelled') {
                cancelledOrders++;
            }
            
            // ✅ Process customer data
            if (order.userId) {
                const userId = order.userId._id ? order.userId._id.toString() : order.userId.toString();
                if (!customerMap[userId]) {
                    customerMap[userId] = {
                        id: userId,
                        name: order.userId.name || 'Guest',
                        email: order.userId.email || 'No Email',
                        phone: order.userId.phone || 'No Phone',
                        orders: 0,
                        totalSpent: 0
                    };
                }
                customerMap[userId].orders += 1;
                customerMap[userId].totalSpent += orderTotal;
            } else {
                // Guest user
                const guestId = 'guest_' + order._id.toString();
                if (!customerMap[guestId]) {
                    customerMap[guestId] = {
                        id: guestId,
                        name: order.shippingAddress?.name || 'Guest',
                        email: order.shippingAddress?.email || 'guest@email.com',
                        phone: order.shippingAddress?.phone || 'No Phone',
                        orders: 0,
                        totalSpent: 0
                    };
                }
                customerMap[guestId].orders += 1;
                customerMap[guestId].totalSpent += orderTotal;
            }
            
            // ✅ Process items for categories and products
            if (order.items && order.items.length > 0) {
                for (let item of order.items) {
                    // Get price from product or item
                    let price = Number(item.price) || 0;
                    let productName = item.productName || 'Product';
                    let categoryName = 'Uncategorized';
                    
                    // If product is populated
                    if (item.productId && typeof item.productId === 'object') {
                        productName = item.productId.name || productName;
                        categoryName = item.productId.category || categoryName;
                        if (typeof categoryName === 'object') {
                            categoryName = categoryName.name || 'Uncategorized';
                        }
                        if (price === 0) {
                            price = Number(item.productId.salePrice) || Number(item.productId.price) || 0;
                        }
                    } else if (item.category) {
                        categoryName = item.category;
                    }
                    
                    const quantity = Number(item.quantity) || 1;
                    const subtotal = price * quantity;
                    
                    // Category sales
                    if (!categoryMap[categoryName]) {
                        categoryMap[categoryName] = 0;
                    }
                    categoryMap[categoryName] += subtotal;
                    
                    // Product sales
                    if (!productMap[productName]) {
                        productMap[productName] = { 
                            name: productName, 
                            category: categoryName,
                            totalSold: 0, 
                            totalRevenue: 0,
                            price: price
                        };
                    }
                    productMap[productName].totalSold += quantity;
                    productMap[productName].totalRevenue += subtotal;
                }
            }
        }

        // ✅ Category sales
        const categorySales = Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // ✅ Top products
        const topProducts = Object.values(productMap)
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 10);

        // ✅ Customers list
        const customers = Object.values(customerMap)
            .sort((a, b) => b.totalSpent - a.totalSpent);

        // ✅ Recent orders with customer names
        const recentOrders = orders.slice(0, 10).map(o => ({
            _id: o._id,
            orderNumber: o.orderNumber || o._id.toString().slice(-8),
            status: o.status || 'pending',
            totalAmount: o.totalAmount || 0,
            createdAt: o.createdAt,
            userId: o.userId || null,
            shippingAddress: o.shippingAddress || {},
            items: o.items || []
        }));

        console.log(`📊 Total Revenue: ₹${totalRevenue}`);
        console.log(`📊 Total Orders: ${orders.length}`);
        console.log(`📊 Customers: ${customers.length}`);

        // ✅ Send response
        res.json({
            success: true,
            data: {
                overview: {
                    totalOrders: orders.length,
                    totalRevenue: Math.round(totalRevenue),
                    totalProducts: totalProducts,
                    totalUsers: totalUsers,
                    pendingOrders: pendingOrders,
                    completedOrders: completedOrders,
                    cancelledOrders: cancelledOrders
                },
                chartData: {
                    dailySales: [],
                    categorySales: categorySales,
                    monthlyTrend: [],
                    statusDistribution: {
                        pending: pendingOrders,
                        completed: completedOrders,
                        cancelled: cancelledOrders
                    }
                },
                topProducts: topProducts,
                recentOrders: recentOrders,
                customerData: {
                    total: totalUsers,
                    newCustomers: 0,
                    returningCustomers: 0
                },
                customers: customers
            }
        });

    } catch (error) {
        console.error('❌ Analytics Error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// ================================================================
// GET ORDERS ANALYTICS
// ================================================================
exports.getOrdersAnalytics = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('userId', 'name email phone')
            .populate('items.productId', 'name price category images')
            .sort({ createdAt: -1 });

        const formattedOrders = orders.map(order => ({
            id: order._id,
            orderNumber: order.orderNumber || order._id.toString().slice(-8),
            customer: order.userId ? order.userId.name : (order.shippingAddress?.name || 'Guest'),
            email: order.userId ? order.userId.email : (order.shippingAddress?.email || 'guest@email.com'),
            items: order.items.map(item => ({
                name: item.productId?.name || item.productName || 'Product',
                category: item.productId?.category || item.category || 'Uncategorized',
                quantity: item.quantity || 1,
                price: item.price || 0,
                total: (item.quantity || 1) * (item.price || 0)
            })),
            total: order.totalAmount || 0,
            status: order.status || 'pending',
            paymentMethod: order.paymentMethod || 'Not specified',
            createdAt: order.createdAt
        }));

        res.json({
            success: true,
            orders: formattedOrders
        });

    } catch (error) {
        console.error('❌ Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// GET DAILY SUMMARY
// ================================================================
exports.getDailySummary = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const orders = await Order.find({
            createdAt: { $gte: today, $lt: tomorrow }
        }).populate('userId', 'name email');

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        res.json({
            success: true,
            data: {
                date: today.toISOString().split('T')[0],
                totalOrders,
                totalRevenue: Math.round(totalRevenue),
                pending: orders.filter(o => (o.status || '').toLowerCase() === 'pending').length,
                completed: orders.filter(o => ['completed', 'delivered', 'shipped'].includes((o.status || '').toLowerCase())).length,
                cancelled: orders.filter(o => (o.status || '').toLowerCase() === 'cancelled').length
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};