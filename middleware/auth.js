// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required. Please login.' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopygo_super_secret_key_2025');
        
        // Find user
        const user = await User.findById(decoded.id || decoded.userId).select('-password');
        
        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({ 
                success: false,
                message: 'User not found. Please login again.' 
            });
        }

        // Attach user to request
        req.user = user;
        req.token = token;
        
        console.log(`✅ Auth successful: ${user.email}`);
        next();
        
    } catch (error) {
        console.error('❌ Auth error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token. Please login again.' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token expired. Please login again.' 
            });
        }
        
        res.status(401).json({ 
            success: false,
            message: 'Authentication failed. Please login.' 
        });
    }
};

module.exports = auth;