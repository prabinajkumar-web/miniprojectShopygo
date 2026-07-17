const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subcategory: { type: String, default: '' },
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
    price: { type: Number, required: true },
    salePrice: { type: Number, default: null },
    stock: { type: Number, default: 0 },
    sku: { type: String, default: '' },
    shortDesc: { type: String, default: '' },
    fullDesc: { type: String, default: '' },
    colors: { type: Array, default: [] },
    sizes: { type: Array, default: [] },
    mainImage: { type: String, default: '' },
    subImages: { type: Array, default: [] },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    brand: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);