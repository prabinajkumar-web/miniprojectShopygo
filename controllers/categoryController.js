const Category = require('../models/category');
const Subcategory = require('../models/subcategory');

// Get all categories with subcategories
exports.getCategories = async (req, res) => {
    try {
        console.log('📂 Fetching all categories...');
        const categories = await Category.find({}).sort({ createdAt: -1 });
        console.log(`📂 Found ${categories.length} categories`);
        
        const categoriesWithSubs = await Promise.all(
            categories.map(async (category) => {
                const subcategories = await Subcategory.find({ 
                    categoryId: category._id 
                }).sort({ createdAt: -1 });
                return {
                    ...category.toObject(),
                    subcategories
                };
            })
        );
        
        console.log('✅ Categories with subcategories sent successfully');
        res.json(categoriesWithSubs);
    } catch (error) {
        console.error('❌ Error fetching categories:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
    try {
        console.log('🔍 Fetching category by ID:', req.params.id);
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        console.log('✅ Category found:', category.name);
        res.json(category);
    } catch (error) {
        console.error('❌ Error fetching category:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create category
exports.createCategory = async (req, res) => {
    try {
        const { name, slug, description, icon, image, status } = req.body;
        console.log('📝 Creating new category:', name);
        
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        
        const category = new Category({
            name,
            slug: slug || name.toLowerCase().replace(/ /g, '-'),
            description: description || '',
            icon: icon || 'bi-folder-fill',
            image: image || '',
            status: status || 'Active'
        });
        
        await category.save();
        console.log('✅ Category created:', category._id);
        res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
        console.error('❌ Error creating category:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const { name, slug, description, icon, image, status } = req.body;
        console.log('🔄 Updating category:', req.params.id);
        
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, slug, description, icon, image, status },
            { new: true, runValidators: true }
        );
        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        console.log('✅ Category updated:', category.name);
        res.json({ message: 'Category updated successfully', category });
    } catch (error) {
        console.error('❌ Error updating category:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        console.log('🗑️ Deleting category:', req.params.id);
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        const deletedSubs = await Subcategory.deleteMany({ categoryId: req.params.id });
        console.log(`✅ Category deleted. Also deleted ${deletedSubs.deletedCount} subcategories`);
        res.json({ message: 'Category and its subcategories deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting category:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};