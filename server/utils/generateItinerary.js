const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// List of models to try in order (fallback strategy)
const MODELS_TO_TRY = [
  "gemini-2.5-flash",      // Same as chatbot - try first
  "gemini-1.5-flash",      // Stable fallback
  "gemini-1.5-pro"         // Backup option
];

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Try to generate content with retry and model fallback
 */
async function generateWithRetry(prompt, modelIndex = 0, retryCount = 0) {
  if (modelIndex >= MODELS_TO_TRY.length) {
    throw new Error('All models failed or are unavailable');
  }

  const modelName = MODELS_TO_TRY[modelIndex];
  
  try {
    console.log(`🔄 Trying model: ${modelName} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ Success with model: ${modelName}`);
    return text;
    
  } catch (error) {
    // Check if it's a 503 or rate limit error
    if (error.status === 503 || error.status === 429) {
      console.warn(`⚠️ Model ${modelName} is overloaded (${error.status})`);
      
      // Try retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_DELAY * Math.pow(2, retryCount);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await sleep(delay);
        return generateWithRetry(prompt, modelIndex, retryCount + 1);
      }
      
      // Max retries reached, try next model
      console.log(`🔀 Switching to next model...`);
      return generateWithRetry(prompt, modelIndex + 1, 0);
    }
    
    // Other errors, throw immediately
    throw error;
  }
}

/**
 * Generate tour itinerary using Gemini AI
 * @param {Object} tourInfo - Tour information
 * @param {string} tourInfo.title - Tour title
 * @param {string} tourInfo.description - Tour description
 * @param {string} tourInfo.departureLocation - Departure location name
 * @param {string} tourInfo.destination - Destination name
 * @param {string} tourInfo.duration - Duration (e.g., "5 ngày 4 đêm")
 * @param {number} tourInfo.adultPrice - Adult price
 * @returns {Promise<Object>} Itinerary object { day1: {title, description}, day2: ... }
 */
async function generateTourItinerary(tourInfo) {
  try {
    const { title, description, departureLocation, destination, duration, adultPrice } = tourInfo;

    // Extract number of days from duration
    const daysMatch = duration.match(/(\d+)\s*[Nn]g[àa]y/);
    const numDays = daysMatch ? parseInt(daysMatch[1]) : 3;

    console.log(`🤖 Generating itinerary for ${numDays} days tour: ${title}`);

    const prompt = `
Bạn là **chuyên gia lập lịch trình du lịch chuyên nghiệp tại Việt Nam**, am hiểu thời gian, địa lý, di chuyển, ẩm thực và các hoạt động theo từng vùng miền.

INPUT TOUR:
- Tên tour: ${title}
- Mô tả tour: ${description}
- Khởi hành từ: ${departureLocation}
- Điểm đến chính: ${destination}
- Số ngày: ${numDays}
- Thời lượng tour: ${duration}
- Giá người lớn: ${adultPrice?.toLocaleString('vi-VN')} đ

YÊU CẦU TẠO LỊCH TRÌNH:
1. Tạo lịch trình **chi tiết từng ngày** cho tour này.
2. Mỗi ngày cần có:
   - **title**: tiêu đề ngắn, hấp dẫn (ví dụ: "Ngày 1: Khởi hành & Khám phá Thành phố")
   - **description**: mô tả chi tiết các hoạt động theo timeline (sáng/trưa/chiều/tối), gồm:
     * thời gian cụ thể từng hoạt động (ví dụ: 08:00 – 09:30),
     * điểm đến/điểm tham quan,
     * di chuyển, ăn uống, nghỉ ngơi,
     * gợi ý địa phương, ẩm thực đặc trưng nếu phù hợp,
     * đảm bảo tính **thực tế**, hợp lý về mặt địa lý & thời gian.
3. Lịch trình phải logic, tuân theo trình tự thời gian trong ngày.
4. Không tạo các hoạt động vô nghĩa hoặc không liên quan.

OUTPUT PHẢI LÀ **JSON 100%** theo cấu trúc:
{
  "day1": {
    "title": "Tiêu đề ngày 1",
    "description": "Chi tiết hoạt động ngày 1"
  },
  "day2": {
    "title": "Tiêu đề ngày 2",
    "description": "Chi tiết hoạt động ngày 2"
  },
  ...
}

**QUY TẮC & CONSTRAINTS:**
- Chỉ trả về **JSON**, KHÔNG kèm bất kỳ text mô tả hay giải thích ngoài object JSON.
- Không có key thừa, không có comment, không có chú thích.
- Sử dụng ngôn ngữ tiếng Việt trong nội dung title & description.
- Mỗi mô tả ngày cần tối thiểu **180 – 250 từ** để đảm bảo chi tiết.
- Cố gắng dùng thời gian phù hợp với các hoạt động thực tế (ví dụ: ăn sáng 07:00 - 08:00; tham quan 09:00 - 12:00; ăn trưa…).
- Mỗi ngày phải có các phần rõ ràng: Sáng – Trưa – Chiều – Tối, càng rõ ràng càng tốt.
- Định dạng mô tả theo logic timeline (ví dụ: “Sáng: 08:00 – 10:00 …”).

**MẪU MIỄN LỜI GIẢN TỐT CHO MÔ TẢ:**
"Sáng: 06:30 - Ăn sáng tại nhà hàng địa phương với món đặc sản. 08:00 - Khởi hành tham quan di tích lịch sử. Trưa: 12:00 - Dùng cơm trưa tại quán nổi tiếng. Chiều: 14:00 - Tham quan khu vườn thú. Tối: 19:00 - Dùng buffet hải sản, tự do khám phá chợ đêm..."  

CHỈ TRẢ VỀ **JSON** THEO CẤU TRÚC YÊU CẦU Ở TRÊN.
`;


    // Use retry mechanism with model fallback
    let text = await generateWithRetry(prompt);

    // Clean response - remove markdown code blocks if present
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Parse JSON
    const itinerary = JSON.parse(text);

    // Validate structure
    if (!itinerary || typeof itinerary !== 'object') {
      throw new Error('Invalid itinerary format');
    }

    // Ensure we have the right number of days
    const generatedDays = Object.keys(itinerary).length;
    if (generatedDays < numDays) {
      console.warn(`⚠️ Generated only ${generatedDays} days instead of ${numDays}`);
    }

    console.log(`✅ Generated itinerary with ${generatedDays} days`);
    return itinerary;

  } catch (error) {
    console.error('❌ Generate itinerary error:', error);
    
    // Fallback: generate simple structure.message || error);
    
    // Log detailed error for 503/429
    if (error.status === 503) {
      console.error('💥 All AI models are currently overloaded. Using fallback structure.');
    } else if (error.status === 429) {
      console.error('💥 Rate limit exceeded. Using fallback structure.');
    }
    const daysMatch = tourInfo.duration.match(/(\d+)\s*[Nn]g[àa]y/);
    const numDays = daysMatch ? parseInt(daysMatch[1]) : 3;
    
    const fallbackItinerary = {};
    for (let i = 1; i <= numDays; i++) {
      fallbackItinerary[`day${i}`] = {
        title: `Ngày ${i}: ${i === 1 ? 'Khởi hành' : i === numDays ? 'Kết thúc chuyến đi' : 'Tham quan'}`,
        description: `Lịch trình ngày ${i} sẽ được cập nhật chi tiết sau. Vui lòng điền thông tin hoặc thử generate lại.`
      };
    }
    
    return fallbackItinerary;
  }
}

module.exports = {
  generateTourItinerary
};
