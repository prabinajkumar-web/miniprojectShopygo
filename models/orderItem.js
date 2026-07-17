const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        default: 'Uncategorized'
    },
    size: {
        type: String,
        default: null
    },
    color: {
        type: String,
        default: null
    },
    image: {
        type: String,
        default: null
    },
    subtotal: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to calculate subtotal
orderItemSchema.pre('save', function(next) {
    this.subtotal = this.quantity * this.price;
    this.updatedAt = new Date();
    next();
});

// Static method to get total for an order
orderItemSchema.statics.getOrderTotal = async function(orderId) {
    const result = await this.aggregate([
        { $match: { orderId: orderId } },
        { $group: { _id: null, total: { $sum: '$subtotal' } } }
    ]);
    return result.length > 0 ? result[0].total : 0;
};

// Static method to get top selling products
orderItemSchema.statics.getTopProducts = async function(limit = 10) {
    return await this.aggregate([
        {
            $group: {
                _id: '$productId',
                productName: { $first: '$productName' },
                totalSold: { $sum: '$quantity' },
                totalRevenue: { $sum: '$subtotal' },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { totalSold: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } }
    ]);
};

// Static method to get sales by category
orderItemSchema.statics.getSalesByCategory = async function() {
    return await this.aggregate([
        {
            $group: {
                _id: '$category',
                totalRevenue: { $sum: '$subtotal' },
                totalSold: { $sum: '$quantity' },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { totalRevenue: -1 } }
    ]);
};

// Static method to get daily sales
orderItemSchema.statics.getDailySales = async function(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                totalRevenue: { $sum: '$subtotal' },
                totalSold: { $sum: '$quantity' },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

module.exports = mongoose.model('OrderItem', orderItemSchema);