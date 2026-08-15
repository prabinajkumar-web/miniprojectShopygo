const express = require('express');
const router = express.Router();
const { getStars, formatPrice } = require('../utils/helpers');
const { Product, Category, Subcategory, Order } = require('../models');
const mongoose = require('mongoose');

// Home page
router.get('/', (req, res) => {
    console.log('🏠 Home page requested');
    res.render('user/home');
});

// Product detail page
router.get('/product-detail', (req, res) => {
    console.log('📄 Product detail page requested, ID:', req.query.id);
    res.render('user/product-detail');
});

// Shop page
router.get('/shop', (req, res) => {
    console.log('🛍️ Shop page requested');
    res.render('user/shop');
});

// Cart page
router.get('/cart', (req, res) => {
    console.log('🛒 Cart page requested');
    res.render('user/cart');
});

// Checkout page
router.get('/checkout', (req, res) => {
    console.log('💳 Checkout page requested');
    res.render('user/checkout');
});

// Login page
router.get('/login', (req, res) => {
    console.log('🔑 Login page requested');
    res.render('user/login');
});

// Register page
router.get('/register', (req, res) => {
    console.log('📝 Register page requested');
    res.render('user/register');
});
router.get('/user-profile', (req, res) => {
    console.log('📝 User profile page requested');
    res.render('user/user-profile');
});

// ✅ FIXED: My orders page with data
router.get('/my-orders', async (req, res) => {
    console.log('📦 My orders page requested');
    
    try {
        // Get user from token (you might need to implement this)
        // For now, we'll render the page and let frontend fetch data
        res.render('user/my-orders', {
            user: req.user || null,
            orders: []
        });
    } catch (error) {
        console.error('❌ Error loading my orders:', error);
        res.render('user/my-orders', {
            user: req.user || null,
            orders: [],
            error: error.message
        });
    }
});

// Search page
router.get('/search', async (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        console.log('🔍 Search request for:', searchTerm);
        
        let products = [];
        let error = null;
        
        if (searchTerm && searchTerm.trim() !== '') {
            const searchRegex = new RegExp(searchTerm.trim(), 'i');
            
            products = await Product.find({
                $or: [
                    { name: { $regex: searchRegex } },
                    { category: { $regex: searchRegex } },
                    { subcategory: { $regex: searchRegex } },
                    { shortDesc: { $regex: searchRegex } },
                    { fullDesc: { $regex: searchRegex } },
                    { brand: { $regex: searchRegex } }
                ]
            }).sort({ createdAt: -1 }).limit(100);
            
            if (products.length === 0 && searchTerm.includes(' ')) {
                const words = searchTerm.trim().split(' ');
                const wordConditions = words.map(word => ({
                    $or: [
                        { name: { $regex: new RegExp(word, 'i') } },
                        { category: { $regex: new RegExp(word, 'i') } },
                        { subcategory: { $regex: new RegExp(word, 'i') } }
                    ]
                }));
                
                products = await Product.find({
                    $or: wordConditions
                }).sort({ createdAt: -1 }).limit(100);
            }
        }
        
        const categories = await Category.find({}).sort({ createdAt: -1 });
        const categoriesWithSubs = await Promise.all(
            categories.map(async (category) => {
                const subcategories = await Subcategory.find({ 
                    categoryId: category._id 
                }).sort({ createdAt: -1 });
                return {
                    ...category.toObject(),
                    subcategories
                };
            })
        );
        
        res.render('user/search', {
            searchTerm: searchTerm,
            products: products,
            categories: categoriesWithSubs,
            getStars: getStars,
            formatPrice: formatPrice,
            totalResults: products.length,
            error: error
        });
    } catch (error) {
        console.error('❌ Search error:', error);
        res.render('user/search', {
            searchTerm: req.query.q || '',
            products: [],
            categories: [],
            getStars: getStars,
            formatPrice: formatPrice,
            totalResults: 0,
            error: error.message
        });
    }
});

// Admin routes
router.get('/admin-dashboard', (req, res) => {
    console.log('📊 Admin Dashboard page requested');
    res.render('admin/dashboard');
});

router.get('/admin-products', (req, res) => {
    console.log('📦 Admin Products page requested');
    res.render('admin/products');
});

router.get('/admin-categories', (req, res) => {
    console.log('📂 Admin Categories page requested');
    res.render('admin/categories');
});

router.get('/admin-analytics', (req, res) => {
    console.log('📊 Admin Analytics page requested');
    res.render('admin/analytics');
});
router.get('/admin-customers', (req, res) => {
    console.log('📂 Admin customer page requested');
    res.render('admin/customers');
});
router.get('/admin-orders', (req, res) => {
    console.log('📋 Admin Orders page requested');
    res.render('admin/orders');
});
router.get('/admin/profile', (req, res) => {
    console.log('📋 Admin profile page requested');
    res.render('admin/profile');
});
router.get('/admin-login', (req, res) => {
    console.log('📋 Admin login page requested');
    res.render('admin/login');
});
router.get('/admin/change-password', (req, res) => {
    console.log('🔑 Change Password page requested');
    res.render('admin/change-password');
});
router.get('/admin/settings', (req, res) => {
    res.render('admin/settings', { currentPage: 'settings' });
});
// Static pages
router.get('/help', (req, res) => {
    console.log('📄 Help Center page requested');
    res.render('user/help');
});

router.get('/returns', (req, res) => {
    console.log('📄 Returns Policy page requested');
    res.render('user/returns');
});

router.get('/privacy', (req, res) => {
    console.log('📄 Privacy Policy page requested');
    res.render('user/privacy');
});

router.get('/terms', (req, res) => {
    console.log('📄 Terms of Service page requested');
    res.render('user/terms');
});

router.get('/about', (req, res) => {
    console.log('📄 About page requested');
    res.render('user/about');
});

router.get('/careers', (req, res) => {
    console.log('📄 Careers page requested');
    res.render('user/careers');
});
router.get('/profile', (req, res) => {
    console.log('📄 profile page requested');
    res.render('user/profile');
});

router.get('/orders-help', (req, res) => {
    res.redirect('/help');
});

router.get('/payments-help', (req, res) => {
    res.redirect('/help');
});

// Test endpoint
router.get('/test', (req, res) => {
    console.log('🧪 Test endpoint called');
    res.json({ message: 'Server is working! API is at /api/products' });
});

// Debug routes
router.get('/api/debug/subcategory/:id', async (req, res) => {
    try {
        const subId = req.params.id;
        console.log('🔍 Debugging subcategory:', subId);
        
        const sub = await Subcategory.findById(subId);
        const products = await Product.find({ subcategoryId: new mongoose.Types.ObjectId(subId) });
        
        res.json({
            subcategory: sub,
            products: products,
            count: products.length
        });
    } catch (error) {
        console.error('❌ Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/api/debug/search', async (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        console.log('🔍 Debug search for:', searchTerm);
        
        if (!searchTerm) {
            return res.json({ 
                message: 'Please provide a search term',
                allCategories: await Product.distinct('category'),
                allSubcategories: await Product.distinct('subcategory')
            });
        }
        
        const searchRegex = new RegExp(searchTerm, 'i');
        const products = await Product.find({
            $or: [
                { name: { $regex: searchRegex } },
                { category: { $regex: searchRegex } },
                { subcategory: { $regex: searchRegex } }
            ]
        });
        
        const allCategories = await Product.distinct('category');
        const allSubcategories = await Product.distinct('subcategory');
        
        res.json({
            searchTerm: searchTerm,
            found: products.length,
            products: products,
            allCategories: allCategories,
            allSubcategories: allSubcategories
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;