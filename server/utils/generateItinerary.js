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

    const prompt = `Bạn là chuyên gia lập lịch trình du lịch chuyên nghiệp tại Việt Nam.

THÔNG TIN TOUR:
- Tên: ${title}
- Mô tả: ${description}
- Khởi hành từ: ${departureLocation}
- Điểm đến: ${destination}
- Thời gian: ${duration}
- Giá người lớn: ${adultPrice?.toLocaleString('vi-VN')} đ

YÊU CẦU:
Hãy tạo lịch trình chi tiết cho tour ${numDays} ngày này. Mỗi ngày cần có:
1. Tiêu đề ngắn gọn, hấp dẫn (VD: "Ngày 1: TP.HCM - Động Phong Nha")
2. Mô tả chi tiết các hoạt động theo timeline (sáng/trưa/chiều/tối)
3. Bao gồm: di chuyển, tham quan, ăn uống, nghỉ ngơi
4. Phù hợp với điểm đến và thời gian tour
5. Thực tế, hợp lý về mặt địa lý và thời gian

FORMAT TRẢ VỀ (JSON):
{
  "day1": {
    "title": "Tiêu đề ngày 1",
    "description": "Mô tả chi tiết hoạt động ngày 1 (200-300 từ)"
  },
  "day2": {
    "title": "Tiêu đề ngày 2",
    "description": "Mô tả chi tiết hoạt động ngày 2"
  },
  ...
}

VÍ DỤ MÔ TẢ TỐT:
"Sáng: 06:00 - Khởi hành từ TP.HCM đi Quảng Bình. Điểm dừng chân ăn trưa tại Nha Trang.
Chiều: Tiếp tục hành trình Bắc Trung Bộ, ngắm cảnh ven đường đèo Hải Vân.
Tối: 20:00 - Đến Đồng Hới, nhận phòng khách sạn. Dùng bữa tối tại nhà hàng. Tự do khám phá chợ đêm Đồng Hới."

CHỈ TRẢ VỀ JSON, KHÔNG KÈM TEXT THỪA.`;

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
