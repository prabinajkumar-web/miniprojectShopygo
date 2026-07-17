const express = require('express');
const router = express.Router();
const {
    getSubcategories,
    getSubcategoriesByCategory,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory
} = require('../controllers/subcategoryController');

router.get('/', getSubcategories);
router.get('/category/:categoryId', getSubcategoriesByCategory);
router.get('/:id', getSubcategoryById);
router.post('/', createSubcategory);
router.put('/:id', updateSubcategory);
router.delete('/:id', deleteSubcategory);

module.exports = router;