const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Create profiles sub-directory
const profileDir = path.join(uploadDir, 'profiles');
if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // ✅ Save to profiles folder
        cb(null, 'uploads/profiles/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 // ✅ Increased to 5MB
    },
    fileFilter: fileFilter
});

// ✅ Export single file upload for profile photo
module.exports = upload;