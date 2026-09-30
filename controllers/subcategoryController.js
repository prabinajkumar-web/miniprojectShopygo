const Subcategory = require('../models/subcategory');
const Category = require('../models/category');

// Get all subcategories
exports.getSubcategories = async (req, res) => {
    try {
        console.log('📂 Fetching all subcategories...');
        const subcategories = await Subcategory.find({})
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 });
        console.log(`📂 Found ${subcategories.length} subcategories`);
        res.json(subcategories);
    } catch (error) {
        console.error('❌ Error fetching subcategories:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get subcategories by category
exports.getSubcategoriesByCategory = async (req, res) => {
    try {
        console.log('📂 Fetching subcategories for category:', req.params.categoryId);
        const subcategories = await Subcategory.find({ categoryId: req.params.categoryId });
        console.log(`📂 Found ${subcategories.length} subcategories`);
        res.json(subcategories);
    } catch (error) {
        console.error('❌ Error fetching subcategories:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get subcategory by ID
exports.getSubcategoryById = async (req, res) => {
    try {
        console.log('🔍 Fetching subcategory by ID:', req.params.id);
        const subcategory = await Subcategory.findById(req.params.id);
        if (!subcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }
        console.log('✅ Subcategory found:', subcategory.name);
        res.json(subcategory);
    } catch (error) {
        console.error('❌ Error fetching subcategory:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create subcategory
exports.createSubcategory = async (req, res) => {
    try {
        const { name, slug, description, image, status, categoryId } = req.body;
        console.log('📝 Creating new subcategory:', name);
        
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Parent category not found' });
        }
        
        const existingSub = await Subcategory.findOne({ name, categoryId });
        if (existingSub) {
            return res.status(400).json({ message: 'Subcategory already exists in this category' });
        }
        
        const subcategory = new Subcategory({
            name,
            slug: slug || name.toLowerCase().replace(/ /g, '-'),
            description: description || '',
            image: image || '',
            status: status || 'Active',
            categoryId
        });
        
        await subcategory.save();
        console.log('✅ Subcategory created:', subcategory._id);
        res.status(201).json({ message: 'Subcategory created successfully', subcategory });
    } catch (error) {
        console.error('❌ Error creating subcategory:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update subcategory
exports.updateSubcategory = async (req, res) => {
    try {
        const { name, slug, description, image, status, categoryId } = req.body;
        console.log('🔄 Updating subcategory:', req.params.id);
        
        const subcategory = await Subcategory.findByIdAndUpdate(
            req.params.id,
            { name, slug, description, image, status, categoryId },
            { new: true, runValidators: true }
        );
        
        if (!subcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }
        console.log('✅ Subcategory updated:', subcategory.name);
        res.json({ message: 'Subcategory updated successfully', subcategory });
    } catch (error) {
        console.error('❌ Error updating subcategory:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete subcategory
exports.deleteSubcategory = async (req, res) => {
    try {
        console.log('🗑️ Deleting subcategory:', req.params.id);
        const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
        if (!subcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }
        console.log('✅ Subcategory deleted:', subcategory.name);
        res.json({ message: 'Subcategory deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting subcategory:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};