# ✅ Fix Tour Image Upload - Upload qua Server

## 🎯 Vấn đề đã được giải quyết

### ❌ Lỗi trước đây:

```
POST https://api.cloudinary.com/v1_1/de5rurcwt/image/upload 400 (Bad Request)
Upload preset not found
```

### ✅ Giải pháp:

Upload ảnh qua **Server API** thay vì upload trực tiếp từ client lên Cloudinary.

---

## 📋 Files đã thay đổi

### 1. **server/utils/cloudinaryUpload.js** ✅

Thêm 2 functions mới cho tour images:

```javascript
// Upload tour image to Cloudinary
const uploadTourImage = async (file, tourId) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: "LuTrip/tours",
    public_id: `tour_${tourId}_${Date.now()}`,
    transformation: [
      { width: 1200, height: 800, crop: "fill" },
      { quality: "auto", fetch_format: "auto" }
    ],
    overwrite: true
  });

  // Clean up temporary file
  await fs.unlink(file.path);

  return {
    url: result.secure_url,
    public_id: result.public_id
  };
};

// Delete tour image from Cloudinary
const deleteTourImage = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};
```

### 2. **server/routes/tours.js** ✅

Thêm route upload image:

```javascript
const { uploadTourImage } = require("../utils/cloudinaryUpload");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

/**
 * POST /api/tours/upload-image
 * Upload tour image
 */
router.post(
  "/upload-image",
  auth,
  admin,
  upload.single("image"),
  async (req, res) => {
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
  }
);
```

### 3. **client/src/components/Admin/AddTourModal.tsx** ✅

Cập nhật `handleImageUpload` để upload qua server:

```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // Get files
  const filesArray = Array.from(e.target.files);

  // Get auth token
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Vui lòng đăng nhập để tải ảnh lên");
    return;
  }

  // Upload each file
  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    setUploadProgress({ current: i + 1, total: filesArray.length });

    // Create FormData
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);
    formDataUpload.append("tourId", "temp");

    // Upload via server API
    const response = await fetch(`${API_BASE_URL}/tours/upload-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formDataUpload
    });

    const data = await response.json();
    if (data.success && data.data?.url) {
      uploadedUrls.push(data.data.url);
    }
  }

  // Update form data
  setFormData((prev) => ({
    ...prev,
    images: [...prev.images, ...uploadedUrls]
  }));
};
```

---

## 🔄 Flow mới

### Before (❌ Broken):

```
Client → Cloudinary API (Direct)
   ↓
❌ 400 Error: Upload preset not found
```

### After (✅ Fixed):

```
Client → Server API (/api/tours/upload-image)
   ↓
Server → Cloudinary (với credentials)
   ↓
Server ← Cloudinary (URL)
   ↓
Client ← Server (URL)
```

---

## 🎨 Architecture giống UserModal & DestinationModal

| Feature               | UserModal | DestinationModal | **TourModal** ✅    |
| --------------------- | --------- | ---------------- | ------------------- |
| **Upload via Server** | ✅        | ✅               | ✅                  |
| **Auth required**     | ✅        | ✅               | ✅                  |
| **Admin only**        | ✅        | ✅               | ✅                  |
| **Multer middleware** | ✅        | ✅               | ✅                  |
| **Cloudinary util**   | ✅        | ✅               | ✅                  |
| **Progress tracking** | ❌        | ❌               | ✅ (Multiple files) |

---

## ✨ Ưu điểm của cách này

### 🔐 Bảo mật:

- ✅ API Secret không expose ra client
- ✅ Chỉ admin mới upload được
- ✅ Validate file trên server

### 📊 Control:

- ✅ Kiểm soát file size/type
- ✅ Track upload activity
- ✅ Có thể thêm watermark, resize...

### 🚀 Performance:

- ✅ Server có bandwidth tốt hơn
- ✅ Có thể compress trước khi upload
- ✅ Multiple file upload với progress

### 🛠️ Maintainability:

- ✅ Consistent với UserModal & DestinationModal
- ✅ Dễ debug (logs trên server)
- ✅ Dễ update Cloudinary config

---

## 📝 API Endpoint Documentation

### **POST** `/api/tours/upload-image`

Upload single tour image to Cloudinary.

#### Request:

```http
POST /api/tours/upload-image
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

{
    "image": <File>,
    "tourId": "temp" (or actual tour ID)
}
```

#### Response Success (200):

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

#### Response Error (400):

```json
{
  "success": false,
  "message": "Vui lòng chọn ảnh để tải lên"
}
```

#### Response Error (401):

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

#### Response Error (403):

```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

## 🧪 Testing

### 1. Test upload single image:

```bash
curl -X POST http://localhost:5000/api/tours/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg" \
  -F "tourId=temp"
```

### 2. Test upload multiple images:

- Mở AddTourModal
- Chọn tab "Hình ảnh"
- Click "Chọn hình ảnh"
- Select multiple files
- Xem progress bar
- Check images hiển thị

### 3. Test validation:

- Try upload without login → Error "Vui lòng đăng nhập"
- Try upload as non-admin → Error "Admin access required"
- Try upload without file → Error "Vui lòng chọn ảnh"

---

## 🔧 Environment Variables

Đảm bảo server có config Cloudinary:

```env
CLOUDINARY_CLOUD_NAME=de5rurcwt
CLOUDINARY_API_KEY=381544433937633
CLOUDINARY_API_SECRET=your_secret_here
```

---

## 📚 Related Files

### Similar patterns:

- `server/routes/auth.js` - Avatar upload
- `server/routes/destinations.js` - Destination image upload
- `client/src/components/Admin/UserModal.tsx` - Avatar upload UI
- `client/src/components/Admin/DestinationModal.tsx` - Image upload UI

### Dependencies:

- `server/middleware/auth.js` - JWT authentication
- `server/middleware/admin.js` - Admin role check
- `server/middleware/upload.js` - Multer file upload
- `server/utils/cloudinaryUpload.js` - Cloudinary utilities

---

## 🎯 Summary

| Aspect       | Before                     | After                        |
| ------------ | -------------------------- | ---------------------------- |
| **Method**   | Direct client → Cloudinary | Client → Server → Cloudinary |
| **Security** | ❌ API exposed             | ✅ Secure                    |
| **Auth**     | ❌ None                    | ✅ JWT + Admin               |
| **Status**   | ❌ Broken                  | ✅ Working                   |
| **Pattern**  | ❌ Different               | ✅ Consistent                |

---

## ✅ Done!

Giờ AddTourModal upload images giống như UserModal và DestinationModal:

- ✅ Upload qua server API
- ✅ Secure với JWT authentication
- ✅ Admin only access
- ✅ Multi-file support
- ✅ Progress tracking
- ✅ Consistent architecture

🎉 **No more "Upload preset not found" errors!**
