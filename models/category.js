const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'bi-folder-fill' },
    image: { type: String, default: '' },
    status: { type: String, default: 'Active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Category', categorySchema);