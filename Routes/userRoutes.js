const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { 
    register, 
    login, 
    getUsers, 
    getUserById,
    updateUser,
    deleteUser,
    getUserStats,
    changePassword,
    updateProfilePhoto,
    getSettings,
    updateSettings,
    getAllSettings,
    getCurrentUser
} = require('../controllers/userController');

// ===== AUTH ROUTES =====
router.post('/register', register);
router.post('/login', login);

// ===== SETTINGS ROUTES (SPECIFIC - MUST BE BEFORE GENERIC ROUTES) =====
router.get('/settings/all', getAllSettings);
router.get('/:id/settings', getSettings);
router.put('/:id/settings', updateSettings);

// ===== USER CRUD ROUTES (GENERIC) =====
router.get('/', getUsers);
router.get('/me', getCurrentUser);
router.get('/stats/all', getUserStats);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// ===== PROFILE ROUTES =====
router.put('/:id/password', changePassword);
router.put('/:id/photo', upload.single('photo'), updateProfilePhoto);

module.exports = router;