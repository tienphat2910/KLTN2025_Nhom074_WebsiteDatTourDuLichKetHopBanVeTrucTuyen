const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Different upload configurations
const uploadSingle = upload.single('avatar');
const uploadMultiple = upload.array('images', 10);
const uploadFields = upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]);

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    uploadFields
};
