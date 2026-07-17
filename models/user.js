const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String, 
        default: '' 
    },
    photo: {
        type: String, 
        default: '' 
    },
    address: { 
        type: String, 
        default: '' 
    },
    role: { 
        type: String, 
        enum: ['user', 'admin', 'customer'], 
        default: 'customer' 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    isVerified: { 
        type: Boolean, 
        default: false 
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

// ✅ FIXED: Pre-save middleware without 'next' parameter
userSchema.pre('save', function() {
    this.updatedAt = new Date();
});

module.exports = mongoose.model('User', userSchema);