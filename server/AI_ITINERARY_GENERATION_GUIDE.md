# AI Itinerary Generation Guide

## Tổng quan

Chức năng tự động tạo lịch trình tour bằng AI sử dụng Google Gemini 2.0 Flash Experimental để sinh ra lịch trình chi tiết theo ngày dựa trên thông tin tour cơ bản.

### Lợi ích
- ⏱️ **Tiết kiệm thời gian**: Admin không cần viết lịch trình thủ công
- 🎯 **Chất lượng cao**: AI tạo nội dung chi tiết, logic theo địa điểm
- ✏️ **Linh hoạt**: Admin vẫn có thể chỉnh sửa sau khi AI tạo
- 🚀 **Nhanh chóng**: Chỉ cần nhập thông tin cơ bản và click "Tạo bằng AI"

---

## Kiến trúc hệ thống

### 1. Backend Components

#### File: `server/utils/generateItinerary.js`
```javascript
async function generateTourItinerary(tourInfo)
```

**Input:**
```javascript
{
  title: "Tour Phong Nha - Huế - Đà Nẵng - Hội An",
  description: "Khám phá di sản miền Trung",
  departure: "Hồ Chí Minh",
  destination: "Đà Nẵng",
  duration: "5 Ngày 4 đêm",
  adultPrice: 6989000
}
```

**Output:**
```javascript
{
  day1: {
    title: "Ngày 1: TP.HCM - Đồng Hới - Động Phong Nha",
    description: "Sáng: Khởi hành từ TP.HCM... (chi tiết đầy đủ)"
  },
  day2: { ... },
  // ... theo số ngày tour
}
```

**Cơ chế hoạt động:**
1. Extract số ngày từ duration string (VD: "5 Ngày 4 đêm" → 5 ngày)
2. Build prompt chi tiết cho Gemini AI với context tour
3. Gọi Gemini 2.0 Flash Experimental API
4. Parse JSON response và validate cấu trúc
5. Fallback: Nếu AI fail, tạo cấu trúc placeholder đơn giản

**Fallback Structure:**
```javascript
{
  day1: {
    title: `Ngày 1: ${departure} - ${destination}`,
    description: "Khởi hành và khám phá điểm đến đầu tiên..."
  }
}
```

---

#### File: `server/routes/admin/tours.js`
```javascript
POST /api/admin/tours/generate-itinerary
```

**Authorization:** Requires admin role + valid JWT token

**Request Body:**
```json
{
  "title": "Tour Phong Nha - Huế - Đà Nẵng",
  "description": "Khám phá di sản miền Trung Việt Nam",
  "departure": "Hồ Chí Minh",
  "destination": "Đà Nẵng",
  "duration": "5 Ngày 4 đêm",
  "adultPrice": 6989000
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Tạo lịch trình thành công",
  "data": {
    "day1": {
      "title": "Ngày 1: TP.HCM - Đồng Hới - Động Phong Nha",
      "description": "Sáng: Khởi hành từ TP.HCM đi Đồng Hới bằng máy bay..."
    },
    "day2": { ... }
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Thiếu thông tin title hoặc duration"
}
```

**Validation:**
- ✅ Kiểm tra auth token
- ✅ Verify admin role
- ✅ Validate `title` (required)
- ✅ Validate `duration` (required)

---

### 2. Frontend Components

#### File: `client/src/services/tourService.ts`
```typescript
async generateItinerary(tourData): Promise<ApiResponse<ItineraryObject>>
```

**Usage:**
```typescript
const result = await tourService.generateItinerary({
  title: formData.title,
  description: formData.description,
  departure: departureName,
  destination: destinationName,
  duration: formData.duration,
  adultPrice: formData.pricingByAge.adult
});

if (result.success && result.data) {
  setFormData(prev => ({ ...prev, itinerary: result.data }));
}
```

---

#### File: `client/src/components/Admin/AddTourModal.tsx`

**New State:**
```typescript
const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
```

**Handler Function:**
```typescript
const handleGenerateItinerary = async () => {
  // 1. Validate required fields
  if (!formData.title.trim() || !formData.duration) {
    toast.error("Vui lòng nhập tên tour và thời gian");
    return;
  }

  // 2. Call AI API
  setIsGeneratingItinerary(true);
  const result = await tourService.generateItinerary({ ... });

  // 3. Update formData with result
  if (result.success) {
    setFormData(prev => ({ ...prev, itinerary: result.data }));
    toast.success("Tạo lịch trình thành công!");
  }

  setIsGeneratingItinerary(false);
};
```

**UI Button:**
```tsx
<Button
  type="button"
  variant="outline"
  onClick={handleGenerateItinerary}
  disabled={isGeneratingItinerary}
  className="gap-2"
>
  <Sparkles className="h-4 w-4" />
  {isGeneratingItinerary ? "Đang tạo..." : "Tạo bằng AI"}
</Button>
```

---

## Quy trình sử dụng

### User Flow (Admin Panel)

1. **Mở modal thêm tour mới** trong trang Admin Tours
2. **Tab "Thông tin cơ bản":**
   - Nhập tên tour (VD: "Tour Phong Nha - Huế - Đà Nẵng")
   - Nhập mô tả
   - Chọn điểm khởi hành và điểm đến
3. **Tab "Lịch trình & Giá":**
   - Chọn ngày khởi hành
   - Chọn thời gian tour (VD: "5 Ngày 4 đêm")
   - Nhập giá tour
4. **Tab "Chi tiết hành trình":**
   - **Click nút "Tạo bằng AI"** (có icon Sparkles ✨)
   - Đợi 5-10 giây để AI sinh lịch trình
   - Kiểm tra nội dung AI tạo ra
   - **Chỉnh sửa nếu cần** (thay đổi tiêu đề, mô tả từng ngày)
5. **Tab "Hình ảnh":**
   - Upload ảnh tour
6. **Click "Lưu tour"** để hoàn tất

---

## Ví dụ thực tế

### Input
```json
{
  "title": "Tour Phong Nha - Thiên Đường - Huế - Đà Nẵng - Hội An - Bà Nà Hills",
  "description": "Khám phá di sản thiên nhiên và văn hóa miền Trung Việt Nam trong 5 ngày 4 đêm",
  "departure": "Hồ Chí Minh",
  "destination": "Đà Nẵng",
  "duration": "5 Ngày 4 đêm",
  "adultPrice": 6989000
}
```

### Output (AI Generated)
```json
{
  "day1": {
    "title": "Ngày 1: TP.HCM - Đồng Hới - Động Phong Nha",
    "description": "Sáng: Khởi hành từ sân bay Tân Sơn Nhất đi Đồng Hới. Trưa: Ăn trưa tại nhà hàng địa phương. Chiều: Tham quan Động Phong Nha - Di sản thiên nhiên thế giới với hệ thống thạch nhũ kỳ vĩ. Tối: Ăn tối và nghỉ đêm tại Phong Nha."
  },
  "day2": {
    "title": "Ngày 2: Động Thiên Đường - Huế",
    "description": "Sáng: Khám phá Động Thiên Đường - hang động đẹp nhất thế giới với chiều dài 31.4km. Trưa: Ăn trưa và di chuyển về Huế. Chiều: Tham quan Đại Nội Huế - quần thể di tích cố đô. Tối: Thưởng thức ẩm thực cung đình Huế và nghỉ đêm."
  },
  "day3": {
    "title": "Ngày 3: Huế - Đà Nẵng - Bà Nà Hills",
    "description": "Sáng: Tham quan chùa Thiên Mụ và lăng Khải Định. Trưa: Di chuyển về Đà Nẵng qua đèo Hải Vân. Chiều: Trải nghiệm Bà Nà Hills với cáp treo dài nhất thế giới, Cầu Vàng nổi tiếng. Tối: Nghỉ đêm tại Đà Nẵng."
  },
  "day4": {
    "title": "Ngày 4: Ngũ Hành Sơn - Hội An",
    "description": "Sáng: Tham quan Ngũ Hành Sơn với hệ thống động, chùa linh thiêng. Trưa: Di chuyển về Hội An - phố cổ được UNESCO công nhận. Chiều: Dạo bộ phố cổ, tham quan hội quán, chùa cầu Nhật Bản. Tối: Thả đèn hoa đăng trên sông Hoài và nghỉ đêm."
  },
  "day5": {
    "title": "Ngày 5: Hội An - Đà Nẵng - TP.HCM",
    "description": "Sáng: Tự do mua sắm đặc sản Hội An (cao lầu, bánh mì, đèn lồng). Trưa: Di chuyển ra sân bay Đà Nẵng. Chiều: Bay về TP.HCM, kết thúc hành trình khám phá miền Trung đầy ấn tượng."
  }
}
```

---

## Configuration

### Environment Variables

File: `server/.env`
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Lấy API Key:**
1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Đăng nhập bằng Google Account
3. Click "Create API Key"
4. Copy key và paste vào `.env`

### AI Model Configuration

```javascript
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.7,        // Độ sáng tạo (0-1)
    topK: 40,               // Top K sampling
    topP: 0.95,             // Nucleus sampling
    maxOutputTokens: 8192,  // Max length
    responseMimeType: "application/json" // JSON output
  }
});
```

**Tuning Parameters:**
- `temperature: 0.7`: Cân bằng giữa sáng tạo và chính xác
- `topK: 40`: Giới hạn top 40 token có xác suất cao nhất
- `topP: 0.95`: Cumulative probability threshold
- `maxOutputTokens: 8192`: Đủ dài cho 10 ngày tour chi tiết

---

## Error Handling

### Server-side Errors

```javascript
// generateItinerary.js
try {
  const result = await model.generateContent(prompt);
  const jsonText = result.response.text();
  const itinerary = JSON.parse(jsonText);
  
  // Validate structure
  const dayKeys = Object.keys(itinerary);
  if (dayKeys.length === 0) throw new Error("Empty itinerary");
  
  return itinerary;
} catch (error) {
  console.error("AI generation failed:", error);
  // Return fallback structure
  return generateFallbackItinerary(tourInfo);
}
```

### Client-side Errors

```typescript
// AddTourModal.tsx
try {
  const result = await tourService.generateItinerary(tourData);
  
  if (!result.success) {
    toast.error(result.message || "Không thể tạo lịch trình");
    return;
  }
  
  toast.success("Tạo lịch trình thành công!");
} catch (error) {
  console.error("Generate error:", error);
  toast.error("Lỗi khi tạo lịch trình. Vui lòng thử lại!");
}
```

---

## Testing

### Test Cases

#### 1. Test thành công với tour 5 ngày
```bash
POST /api/admin/tours/generate-itinerary
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Tour Phong Nha - Huế - Đà Nẵng",
  "duration": "5 Ngày 4 đêm",
  "departure": "Hồ Chí Minh",
  "destination": "Đà Nẵng"
}

Expected: 200 OK với 5 ngày lịch trình chi tiết
```

#### 2. Test thiếu title
```bash
POST /api/admin/tours/generate-itinerary
{
  "duration": "3 Ngày 2 đêm"
}

Expected: 400 Bad Request
Message: "Thiếu thông tin title hoặc duration"
```

#### 3. Test không có quyền admin
```bash
POST /api/admin/tours/generate-itinerary
Authorization: Bearer <user_token>

Expected: 403 Forbidden
Message: "Không có quyền truy cập"
```

#### 4. Test AI fallback
- Tắt internet hoặc API key sai
- Expected: Vẫn trả về lịch trình placeholder
- Không crash server

---

### Manual Testing

**Frontend Testing:**
1. Login với tài khoản admin
2. Vào Admin Panel → Tours → Thêm tour
3. Nhập thông tin cơ bản (tên, mô tả, điểm đến)
4. Chọn thời gian tour: "5 Ngày 4 đêm"
5. Vào tab "Chi tiết hành trình"
6. Click "Tạo bằng AI"
7. Verify:
   - ✅ Button hiện "Đang tạo..." và disabled
   - ✅ Sau 5-10s có toast "Tạo lịch trình thành công"
   - ✅ Lịch trình 5 ngày xuất hiện với nội dung chi tiết
   - ✅ Có thể edit từng ngày
   - ✅ Lưu tour thành công với lịch trình AI

---

## Troubleshooting

### Vấn đề 1: API trả về lỗi 401
**Nguyên nhân:** Token hết hạn hoặc không hợp lệ

**Giải pháp:**
```javascript
// Check localStorage token
const token = localStorage.getItem('token');
console.log('Token:', token);

// Re-login to get new token
```

### Vấn đề 2: AI không tạo được lịch trình
**Nguyên nhân:** GEMINI_API_KEY không hợp lệ

**Giải pháp:**
```bash
# Check .env file
cat server/.env | grep GEMINI_API_KEY

# Test API key manually
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY
```

### Vấn đề 3: Lịch trình bị lỗi format
**Nguyên nhân:** AI trả về JSON không đúng cấu trúc

**Debug:**
```javascript
// In generateItinerary.js, thêm log:
console.log('AI Response:', result.response.text());
console.log('Parsed JSON:', itinerary);
console.log('Day keys:', Object.keys(itinerary));
```

**Giải pháp:** Fallback sẽ tự động kick in, hoặc retry request

### Vấn đề 4: Button "Tạo bằng AI" không click được
**Nguyên nhân:** Thiếu title hoặc duration

**Giải pháp:**
```javascript
// Check formData in console
console.log('Title:', formData.title);
console.log('Duration:', formData.duration);

// Toast sẽ hiện lỗi validation
```

---

## Performance Optimization

### 1. Caching Strategy
```javascript
// TODO: Cache AI responses for similar tours
const cacheKey = `${title}-${duration}-${destination}`;
const cachedItinerary = cache.get(cacheKey);

if (cachedItinerary) {
  return cachedItinerary;
}

// Generate new, then cache
const itinerary = await generateTourItinerary(tourInfo);
cache.set(cacheKey, itinerary, 3600); // 1 hour TTL
```

### 2. Request Debouncing
```typescript
// In AddTourModal.tsx
const debouncedGenerate = useMemo(
  () => debounce(handleGenerateItinerary, 1000),
  []
);
```

### 3. Loading States
```tsx
{isGeneratingItinerary && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>AI đang phân tích và tạo lịch trình...</span>
  </div>
)}
```

---

## Best Practices

### ✅ DO
- Validate input trước khi gọi AI
- Hiển thị loading state rõ ràng
- Cho phép user edit AI output
- Log errors để debug
- Có fallback khi AI fail
- Cache responses khi có thể

### ❌ DON'T
- Auto-save AI output without user review
- Disable edit capability sau khi generate
- Bỏ qua error handling
- Hardcode API keys trong code
- Gọi AI API quá nhiều lần liên tiếp
- Block UI khi đang generate

---

## Future Enhancements

### 1. Multi-language Support
```javascript
const prompt = `Create a ${language} tour itinerary for...`;
// Support: Vietnamese, English, Chinese, Korean
```

### 2. Template Selection
```typescript
const templates = {
  adventure: "Focus on outdoor activities and sports",
  cultural: "Emphasize historical sites and museums",
  family: "Include kid-friendly activities"
};
```

### 3. AI Image Suggestions
```javascript
// Suggest images based on locations in itinerary
const suggestedImages = await searchUnsplash(destinations);
```

### 4. Cost Breakdown
```javascript
// AI calculates estimated costs per day
{
  day1: {
    title: "...",
    description: "...",
    estimatedCost: {
      transport: 500000,
      meals: 300000,
      tickets: 200000
    }
  }
}
```

---

## Support & Resources

- **Gemini AI Documentation**: https://ai.google.dev/gemini-api/docs
- **API Pricing**: https://ai.google.dev/pricing
- **Rate Limits**: 60 requests/minute (free tier)
- **Model Info**: https://ai.google.dev/gemini-api/docs/models/gemini

---

## Changelog

### Version 1.0.0 (2024)
- ✅ Initial release
- ✅ Basic AI itinerary generation
- ✅ Admin UI integration
- ✅ Error handling & fallback
- ✅ Vietnamese language support

### Planned for v1.1.0
- 🔄 Response caching
- 🔄 Multi-language support
- 🔄 Template selection
- 🔄 Image suggestions

---

**Developed by:** KLTN 2025 - Nhóm 074
**Last Updated:** 2024
