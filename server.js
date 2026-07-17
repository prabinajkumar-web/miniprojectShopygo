const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
// const seedRoutes = require('./routes/seedRoutes'); // ❌ COMMENT THIS OUT
const viewRoutes = require('./routes/viewRoutes');

// ✅ Add this line - Admin Auth Routes
const adminAuthRoutes = require('./routes/adminAuthRoutes');

// Import database connection
const connectDB = require('./config/database');

const app = express();

// ================================================================
// ===== MIDDLEWARE =====
// ================================================================
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname)));

// ===== SET VIEW ENGINE =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

console.log('🚀 Server configuration loaded!');

// ================================================================
// ===== API ROUTES =====
// ================================================================
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/analytics', analyticsRoutes);

// ✅ Add this line - Admin Auth API routes
app.use('/api/admin/auth', adminAuthRoutes);

// app.use('/api/seed', seedRoutes); // ❌ COMMENT THIS OUT

// ================================================================
// ===== VIEW ROUTES =====
// ================================================================

// Analytics Page View
app.get('/admin-analytics', (req, res) => {
    console.log('📊 Analytics page requested');
    res.render('admin/analytics');
});

// All other view routes
app.use('/', viewRoutes);

// ================================================================
// ===== ERROR HANDLING =====
// ================================================================

// 404 Handler
app.use((req, res) => {
    console.log('❌ 404 Not Found:', req.url);
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({ 
        success: false, 
        message: err.message || 'Internal server error' 
    });
});

// ================================================================
// ===== DATABASE CONNECTION =====
// ================================================================
connectDB();

// ================================================================
// ===== START SERVER =====
// ================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('\n🚀 ==================================');
    console.log('   🚀 Server running on http://localhost:' + PORT);
    console.log('   📁 Home Page: http://localhost:' + PORT + '/');
    console.log('   📁 Search Page: http://localhost:' + PORT + '/search?q=footwear');
    console.log('   📁 Shop Page: http://localhost:' + PORT + '/shop');
    console.log('   📁 Cart: http://localhost:' + PORT + '/cart');
    console.log('   📁 Checkout: http://localhost:' + PORT + '/checkout');
    console.log('   📁 Login: http://localhost:' + PORT + '/login');
    console.log('   📁 Register: http://localhost:' + PORT + '/register');
    console.log('   📁 My Orders: http://localhost:' + PORT + '/my-orders');
    console.log('   📊 Admin Dashboard: http://localhost:' + PORT + '/admin-dashboard');
    console.log('   📦 Admin Products: http://localhost:' + PORT + '/admin-products');
    console.log('   📂 Admin Categories: http://localhost:' + PORT + '/admin-categories');
    console.log('   📋 Admin Orders: http://localhost:' + PORT + '/admin-orders');
    console.log('   📊 Analytics Page: http://localhost:' + PORT + '/admin-analytics');
    console.log('   📊 Analytics API: http://localhost:' + PORT + '/api/admin/analytics');
    console.log('   🔐 Admin Login: http://localhost:' + PORT + '/admin/login');
    console.log('   🔐 Admin Register: http://localhost:' + PORT + '/admin/register');
    console.log('   🔐 Admin Auth API: http://localhost:' + PORT + '/api/admin/auth/*');
    // console.log('   🌱 Seed API: http://localhost:' + PORT + '/api/seed/all'); // ❌ COMMENT THIS OUT
    // console.log('   🌱 Seed Products: http://localhost:' + PORT + '/api/seed/products'); // ❌ COMMENT THIS OUT
    // console.log('   🌱 Seed Orders: http://localhost:' + PORT + '/api/seed/orders'); // ❌ COMMENT THIS OUT
    console.log('   🔌 Products API: http://localhost:' + PORT + '/api/products');
    console.log('   🔌 Categories API: http://localhost:' + PORT + '/api/categories');
    console.log('   🔌 Subcategories API: http://localhost:' + PORT + '/api/subcategories');
    console.log('   🔌 Users API: http://localhost:' + PORT + '/api/users');
    console.log('   🔌 Orders API: http://localhost:' + PORT + '/api/orders');
    console.log('   🔌 OTP Auth API: http://localhost:' + PORT + '/api/auth/*');
    console.log('   🧪 Test API: http://localhost:' + PORT + '/test');
    console.log('==================================\n');
    console.log('💡 Console logs enabled for all routes!');
    console.log('📝 Check terminal for detailed logs.\n');
    console.log('📧 Email/OTP System Enabled:');
    console.log('   - User Registration OTP');
    console.log('   - User Login OTP');
    console.log('   - User Forgot Password OTP');
    console.log('   - User Password Reset');
    console.log('   - 🔐 Admin Login OTP');
    console.log('   - 🔐 Admin Registration OTP');
    console.log('==================================\n');
});

module.exports = app;