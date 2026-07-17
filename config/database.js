const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/shopygo');
        console.log('✅ MongoDB Connected Successfully');
        console.log('📀 Database: shopygo');
        console.log('📊 Collections: products, categories, subcategories, users');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('⚠️ Please make sure MongoDB is running');
        console.log('💡 To start MongoDB:');
        console.log('   Windows: net start MongoDB');
        console.log('   Mac/Linux: sudo systemctl start mongod');
        process.exit(1);
    }
};

module.exports = connectDB;