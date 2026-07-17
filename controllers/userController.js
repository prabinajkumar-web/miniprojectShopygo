const { User } = require('../models');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { generateOTP, sendOTPEmail, otpStore } = require('../utils/otp');

// ================================================================
// ✅ VALIDATE OBJECT ID
// ================================================================
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// ================================================================
// REGISTER USER
// ================================================================
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ 
            name, 
            email, 
            password: hashedPassword,
            phone: phone || '',
            address: address || '',
            isActive: true,
            role: 'customer'
        });
        await user.save();
        
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive }
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: error.message });
    }
};

// ================================================================
// LOGIN USER
// ================================================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');
        
        res.json({
            success: true,
            token,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                phone: user.phone,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: error.message });
    }
};

// ================================================================
// GET ALL USERS
// ================================================================
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
};

// ================================================================
// GET USER BY ID
// ================================================================
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid user ID format' 
            });
        }
        
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({ error: error.message });
    }
};

// ================================================================
// UPDATE USER
// ================================================================
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid user ID format' 
            });
        }
        
        const { name, email, phone, password, address, isActive, role } = req.body;
        
        const updateData = {
            name,
            email,
            phone,
            address,
            isActive: isActive !== undefined ? isActive : true,
            role: role || 'customer',
            updatedAt: new Date()
        };
        
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'User updated successfully',
            user: user
        });
        
    } catch (error) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ================================================================
// DELETE USER
// ================================================================
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid user ID format' 
            });
        }
        
        const user = await User.findByIdAndDelete(id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ================================================================
// GET USER STATS (With Orders)
// ================================================================
exports.getUserStats = async (req, res) => {
    try {
        console.log('📊 Fetching user stats...');
        
        const users = await User.find({}).select('-password');
        console.log(`👤 Found ${users.length} users`);
        
        const orders = await Order.find({});
        console.log(`📦 Found ${orders.length} orders`);
        
        const userStats = users.map(user => {
            const userOrders = orders.filter(o => {
                if (!o.userId) return false;
                return o.userId.toString() === user._id.toString();
            });
            
            const totalOrders = userOrders.length;
            const totalSpent = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            
            return {
                ...user.toObject(),
                orderCount: totalOrders,
                totalSpent: totalSpent,
                avgOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
            };
        });
        
        userStats.sort((a, b) => b.totalSpent - a.totalSpent);
        
        console.log(`✅ User stats calculated for ${userStats.length} users`);
        
        res.json({
            success: true,
            users: userStats,
            totalUsers: userStats.length
        });
        
    } catch (error) {
        console.error('❌ Error fetching user stats:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            stack: error.stack
        });
    }
};

// ================================================================
// CHANGE PASSWORD
// ================================================================
exports.changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.updatedAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('❌ Error changing password:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// UPDATE PROFILE PHOTO
// ================================================================
exports.updateProfilePhoto = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No photo uploaded'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const photoPath = `/uploads/profiles/${req.file.filename}`;
        user.photo = photoPath;
        user.updatedAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: 'Profile photo updated successfully',
            photo: photoPath,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                photo: user.photo,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ Error updating photo:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// ✅ GET SETTINGS - FIXED
// ================================================================
exports.getSettings = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        const user = await User.findOne({ _id: id }).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name || 'Admin',
                email: user.email || 'admin@shopygo.com',
                phone: user.phone || 'Not set',
                address: user.address || 'Not set',
                role: user.role || 'admin',
                isActive: user.isActive !== false
            }
        });

    } catch (error) {
        console.error('❌ Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// ✅ UPDATE SETTINGS - FIXED (No 'next' parameter)
// ================================================================
exports.updateSettings = async (req, res) => {
    console.log('📡 updateSettings called');
    
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;

        console.log('📡 ID:', id);
        console.log('📡 Data:', { name, email, phone, address });

        // Validate ID
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        // Validate input
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }

        // Find user - use findOne instead of findById
        const user = await User.findOne({ _id: id });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('✅ User found:', user.name);

        // Update fields
        user.name = name;
        user.email = email;
        user.phone = phone || user.phone;
        user.address = address || user.address;
        user.updatedAt = new Date();

        // Save - use save() instead of findByIdAndUpdate
        await user.save();

        console.log('✅ User saved successfully');

        // Prepare response
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            address: user.address
        };

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: userResponse
        });

    } catch (error) {
        console.error('❌ Error updating settings:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// ================================================================
// GET ALL SETTINGS (Admin)
// ================================================================
exports.getAllSettings = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                storeName: 'ShopyGo',
                storeEmail: 'store@shopygo.com',
                storePhone: '+91 9876543210',
                storeAddress: '123 Main Street, Mumbai, Maharashtra',
                currency: 'INR',
                codEnabled: true,
                upiEnabled: true,
                cardEnabled: true,
                netbankingEnabled: false,
                freeShipping: 500,
                shippingCharge: 49,
                deliveryTime: 3,
                codCharge: 0,
                sessionTimeout: 60,
                maxLoginAttempts: 5
            }
        });
    } catch (error) {
        console.error('❌ Error fetching all settings:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================================
// GET CURRENT USER (from token)
// ================================================================
exports.getCurrentUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = Buffer.from(token, 'base64').toString();
        const userId = decoded.split(':')[0];

        if (!userId || !isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid token'
            });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            address: user.address
        });
    } catch (error) {
        console.error('❌ Error getting current user:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};