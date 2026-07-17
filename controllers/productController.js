const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const mongoose = require('mongoose'); // ✅ இது MUST!

// Get all products with filters
exports.getProducts = async (req, res) => {
    try {
        let filter = {};
        
        console.log('📥 Received query params:', req.query);
        
        // Subcategory filter - BOTH ID and NAME
        if (req.query.subcategory) {
            const subValue = req.query.subcategory;
            
            // Check if it's a valid ObjectId
            if (mongoose.Types.ObjectId.isValid(subValue)) {
                // Search by subcategoryId
                filter.subcategoryId = new mongoose.Types.ObjectId(subValue);
                console.log('✅ Filtering by subcategory ID:', subValue);
            } else {
                // Search by subcategory name (string)
                filter.subcategory = subValue;
                console.log('✅ Filtering by subcategory name:', subValue);
            }
        }
        
        // Category filter
        if (req.query.category) {
            if (mongoose.Types.ObjectId.isValid(req.query.category)) {
                filter.categoryId = new mongoose.Types.ObjectId(req.query.category);
            } else {
                filter.category = req.query.category;
            }
            console.log('✅ Filtering by category:', req.query.category);
        }
        
        // Search filter
        if (req.query.search && req.query.search.trim() !== '') {
            const searchRegex = new RegExp(req.query.search.trim(), 'i');
            filter.$or = [
                { name: { $regex: searchRegex } },
                { category: { $regex: searchRegex } },
                { subcategory: { $regex: searchRegex } },
                { shortDesc: { $regex: searchRegex } },
                { fullDesc: { $regex: searchRegex } },
                { brand: { $regex: searchRegex } }
            ];
            console.log('✅ Filtering by search:', req.query.search);
        }
        
        // Price filter
        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
        }
        
        // Rating filter
        if (req.query.rating) {
            filter.rating = { $gte: Number(req.query.rating) };
        }
        
        console.log('🔍 Final filter:', JSON.stringify(filter, null, 2));
        
        // Sort
        let sort = {};
        if (req.query.sort) {
            const [field, order] = req.query.sort.split('_');
            sort[field] = order === 'asc' ? 1 : -1;
        } else {
            sort.createdAt = -1;
        }
        
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);
        
        const total = await Product.countDocuments(filter);
        
        console.log(`📦 Found ${products.length} products out of ${total}`);
        
        res.json({
            products: products,
            total: total,
            page: page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        console.log('🔍 Fetching product by ID:', req.params.id);
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        console.log('✅ Product found:', product.name);
        res.json(product);
    } catch (error) {
        console.error('❌ Error fetching product:', error);
        res.status(500).json({ error: error.message });
    }
};

// Create product
exports.createProduct = async (req, res) => {
    try {
        console.log('📦 Received product data:', req.body.name);
        const product = new Product(req.body);
        await product.save();
        console.log('✅ Product saved successfully:', product._id);
        res.status(201).json(product);
    } catch (error) {
        console.error('❌ Error saving product:', error);
        res.status(400).json({ error: error.message });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        console.log('🔄 Updating product:', req.params.id);
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        console.log('✅ Product updated:', product.name);
        res.json(product);
    } catch (error) {
        console.error('❌ Error updating product:', error);
        res.status(400).json({ error: error.message });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        console.log('🗑️ Deleting product:', req.params.id);
        await Product.findByIdAndDelete(req.params.id);
        console.log('✅ Product deleted');
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        res.status(500).json({ error: error.message });
    }
};