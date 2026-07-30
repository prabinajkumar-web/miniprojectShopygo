const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const viewRoutes = require('./routes/viewRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const connectDB = require('./config/database');

const app = express();

// ================================================================
// ===== MIDDLEWARE =====
// ================================================================
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname)));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

console.log('🚀 Server configuration loaded!');
console.log(`💰 Razorpay Key ID: ${process.env.RAZORPAY_KEY_ID ? '✅ Configured' : '❌ Missing'}`);

// ================================================================
// ===== AUTHENTICATION MIDDLEWARE =====
// ================================================================
const checkAdmin = (req, res, next) => {
    console.log('🔍 checkAdmin middleware called');
    
    // Get token from cookie or header
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
    
    console.log('📌 Token present:', !!token);
    
    if (!token) {
        console.log('❌ No token found, redirecting to login');
        // For API requests, return JSON
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }
        return res.redirect('/admin/login');
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopygo_super_secret_key_2025');
        
        if (decoded.role !== 'admin') {
            console.log('❌ Not admin role, redirecting to login');
            if (req.path.startsWith('/api/')) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Admin access required' 
                });
            }
            return res.redirect('/admin/login');
        }
        
        req.user = decoded;
        console.log('✅ Admin authenticated:', decoded.email);
        next(); // ✅ IMPORTANT: Call next() to continue
    } catch (error) {
        console.log('❌ Token verification failed:', error.message);
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        return res.redirect('/admin/login');
    }
};

// ================================================================
// ===== ADMIN VIEW ROUTES =====
// ================================================================

// PUBLIC ROUTES - NO AUTH REQUIRED
app.get('/admin/login', (req, res) => {
    console.log('📋 Admin login page requested');
    res.render('admin/login', { 
        title: 'Admin Login - ShopyGo',
        error: null 
    });
});

app.get('/admin/register', (req, res) => {
    console.log('📋 Admin register page requested');
    res.render('admin/register', { 
        title: 'Admin Register - ShopyGo' 
    });
});

// PROTECTED ADMIN ROUTES
app.get('/admin/dashboard', checkAdmin, (req, res) => {
    console.log('📊 Admin Dashboard page requested');
    res.render('admin/dashboard', { 
        title: 'Dashboard - ShopyGo Admin',
        user: req.user 
    });
});

app.get('/admin/products', checkAdmin, (req, res) => {
    console.log('📦 Admin Products page requested');
    res.render('admin/products', { 
        title: 'Products - ShopyGo Admin',
        user: req.user 
    });
});

app.get('/admin/categories', checkAdmin, (req, res) => {
    console.log('📂 Admin Categories page requested');
    res.render('admin/categories', { 
        title: 'Categories - ShopyGo Admin',
        user: req.user 
    });
});

app.get('/admin/orders', checkAdmin, (req, res) => {
    console.log('📋 Admin Orders page requested');
    res.render('admin/orders', { 
        title: 'Orders - ShopyGo Admin',
        user: req.user 
    });
});

app.get('/admin/customers', checkAdmin, (req, res) => {
    console.log('👥 Admin Customers page requested');
    res.render('admin/customers', { 
        title: 'Customers - ShopyGo Admin',
        user: req.user 
    });
});

app.get('/admin/analytics', checkAdmin, (req, res) => {
    console.log('📊 Admin Analytics page requested');
    res.render('admin/analytics', { 
        title: 'Analytics - ShopyGo Admin',
        user: req.user 
    });
});

app.get('/admin/profile', checkAdmin, (req, res) => {
    console.log('👤 Admin Profile page requested');
    res.render('admin/profile', { 
        title: 'Profile - ShopyGo Admin',
        user: req.user 
    });
});

app.get('/admin/settings', checkAdmin, (req, res) => {
    console.log('⚙️ Admin Settings page requested');
    res.render('admin/settings', { 
        title: 'Settings - ShopyGo Admin',
        user: req.user 
    });
});

app.get('/admin/change-password', checkAdmin, (req, res) => {
    console.log('🔑 Change Password page requested');
    res.render('admin/change-password', { 
        title: 'Change Password - ShopyGo Admin',
        user: req.user 
    });
});

// Admin Logout
app.get('/admin/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin/login');
});

// Redirect old admin routes
app.get('/admin-dashboard', (req, res) => res.redirect('/admin/dashboard'));
app.get('/admin-products', (req, res) => res.redirect('/admin/products'));
app.get('/admin-categories', (req, res) => res.redirect('/admin/categories'));
app.get('/admin-orders', (req, res) => res.redirect('/admin/orders'));
app.get('/admin-customers', (req, res) => res.redirect('/admin/customers'));
app.get('/admin-analytics', (req, res) => res.redirect('/admin/analytics'));

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
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/payment', paymentRoutes);

// ================================================================
// ===== VIEW ROUTES (User pages - MUST COME LAST) =====
// ================================================================
app.use('/', viewRoutes);

// ================================================================
// ===== ERROR HANDLING =====
// ================================================================

// 404 Handler
app.use((req, res) => {
    console.log('❌ 404 Not Found:', req.url);
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ 
            success: false, 
            message: 'API endpoint not found' 
        });
    }
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 - Page Not Found</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8fafc; }
                h1 { font-size: 3rem; color: #f59e0b; }
                a { color: #2563eb; text-decoration: none; }
            </style>
        </head>
        <body>
            <h1>🔍 404</h1>
            <h2>Page Not Found</h2>
            <p>The page you are looking for does not exist.</p>
            <a href="/">Go to Home</a>
        </body>
        </html>
    `);
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    console.error('Stack:', err.stack);
    if (req.path.startsWith('/api/')) {
        return res.status(500).json({ 
            success: false, 
            message: err.message || 'Internal server error' 
        });
    }
    res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>500 - Server Error</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8fafc; }
                h1 { font-size: 3rem; color: #ef4444; }
                a { color: #2563eb; text-decoration: none; }
                .error-detail { color: #64748b; font-size: 0.9rem; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h1>⚠️ 500</h1>
            <h2>Server Error</h2>
            <p>Something went wrong on our end. Please try again later.</p>
            <p class="error-detail">${err.message || 'Internal server error'}</p>
            <a href="/">Go to Home</a>
        </body>
        </html>
    `);
});

// ================================================================
// ===== DATABASE CONNECTION & START SERVER =====
// ================================================================
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('\n🚀 ==================================');
    console.log('   🚀 Server running on http://localhost:' + PORT);
    console.log('   🔐 Admin Login: http://localhost:' + PORT + '/admin/login');
    console.log('   💳 Checkout: http://localhost:' + PORT + '/checkout');
    console.log('   💳 Payment API: http://localhost:' + PORT + '/api/payment/*');
    console.log('   💰 Razorpay: ' + (process.env.RAZORPAY_KEY_ID ? '✅ Configured' : '❌ Missing'));
    console.log('==================================\n');
});

module.exports = app;