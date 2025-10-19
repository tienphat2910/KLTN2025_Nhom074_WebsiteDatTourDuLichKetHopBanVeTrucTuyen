# ✅ Fixed: Tour Image Upload - Multer Configuration

## 🐛 Lỗi đã sửa

```
TypeError: upload.single is not a function
```

## 🔧 Nguyên nhân

File `upload.js` export:

```javascript
module.exports = {
  uploadSingle, // ✅ Exported
  handleUploadError
};
```

Nhưng trong `tours.js` đã import sai:

```javascript
const upload = require("../middleware/upload"); // ❌ Wrong
upload.single("image"); // ❌ upload is an object, not a function
```

## ✅ Giải pháp

### Option đã chọn: Inline Multer Config

Tạo multer upload trực tiếp trong route (giống destinations.js):

```javascript
router.post("/upload-image", auth, admin, (req, res, next) => {
  const multer = require("multer");
  const path = require("path");

  // Configure storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
      );
    }
  });

  // File filter
  const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP"), false);
    }
  };

  // Create upload instance
  const uploadImage = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  }).single("image"); // Field name: 'image'

  // Handle upload
  uploadImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn ảnh để tải lên"
        });
      }

      const tourId = req.body.tourId || "temp";
      const uploadResult = await uploadTourImage(req.file, tourId);

      res.status(200).json({
        success: true,
        message: "Tải ảnh lên thành công",
        data: {
          url: uploadResult.url,
          public_id: uploadResult.public_id
        }
      });
    } catch (error) {
      console.error("Upload tour image error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải ảnh lên",
        error: error.message
      });
    }
  });
});
```

## 🎯 Tại sao dùng inline config?

### ❌ Vấn đề với uploadSingle từ middleware:

```javascript
// upload.js exports uploadSingle for field 'avatar'
const uploadSingle = upload.single("avatar");
```

Tour cần field name là **`image`**, không phải `avatar`.

### ✅ Giải pháp:

1. **Inline config** - Tạo multer instance riêng cho 'image' field
2. **Consistent** - Giống destinations.js đã làm
3. **Flexible** - Có thể customize cho từng route

## 📝 Alternative Options (không dùng)

### Option 1: Export thêm uploadImage từ middleware

```javascript
// upload.js
const uploadImage = upload.single("image");

module.exports = {
  uploadSingle, // for 'avatar'
  uploadImage, // for 'image'
  handleUploadError
};
```

### Option 2: Export base upload instance

```javascript
// upload.js
const upload = multer({ ... });

module.exports = {
    upload,              // Base instance
    uploadSingle,
    handleUploadError
};

// tours.js
const { upload } = require('../middleware/upload');
router.post('/upload-image', auth, admin, upload.single('image'), ...);
```

## ✅ Kết quả

- ✅ Server start thành công
- ✅ Route `/api/tours/upload-image` hoạt động
- ✅ Accept field name: `image`
- ✅ File size limit: 5MB
- ✅ File types: JPG, PNG, WEBP
- ✅ Upload to Cloudinary folder: `LuTrip/tours`

## 🧪 Test

```bash
curl -X POST http://localhost:5000/api/tours/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg" \
  -F "tourId=temp"
```

Expected response:

```json
{
  "success": true,
  "message": "Tải ảnh lên thành công",
  "data": {
    "url": "https://res.cloudinary.com/de5rurcwt/image/upload/v1234567890/LuTrip/tours/tour_temp_1234567890.jpg",
    "public_id": "LuTrip/tours/tour_temp_1234567890"
  }
}
```

## 📚 Related Files

- ✅ `server/routes/tours.js` - Upload route với inline multer
- ✅ `server/utils/cloudinaryUpload.js` - uploadTourImage function
- ✅ `client/src/components/Admin/AddTourModal.tsx` - Client upload logic
- 📋 `server/middleware/upload.js` - Base upload middleware (for avatar)

## 🎉 Done!

Server should start successfully now! 🚀
