const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    status: { type: String, default: 'Active' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subcategory', subcategorySchema);

