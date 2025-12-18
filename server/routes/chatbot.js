const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ChatHistory = require("../models/ChatHistory");
const Tour = require("../models/Tour");
const Destination = require("../models/Destination");
const Activity = require("../models/Activity");
const chatbotUtils = require('../utils/chatbotUtils');
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cache cho destinations để tránh query nhiều lần
let destinationsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

// Function để normalize text (loại dấu, lowercase)
function normalizeText(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

// Mapping địa danh phụ sang destination chính trong database
const DESTINATION_ALIASES = {
    // Miền Tây / ĐBSCL
    'an giang': 'ĐBSCL - Cần Thơ',
    'angiang': 'ĐBSCL - Cần Thơ',
    'cà mau': 'ĐBSCL - Cần Thơ',
    'ca mau': 'ĐBSCL - Cần Thơ',
    'bạc liêu': 'ĐBSCL - Cần Thơ',
    'bac lieu': 'ĐBSCL - Cần Thơ',
    'sóc trăng': 'ĐBSCL - Cần Thơ',
    'soc trang': 'ĐBSCL - Cần Thơ',
    'trà vinh': 'ĐBSCL - Cần Thơ',
    'tra vinh': 'ĐBSCL - Cần Thơ',
    'bến tre': 'ĐBSCL - Cần Thơ',
    'ben tre': 'ĐBSCL - Cần Thơ',
    'long xuyên': 'ĐBSCL - Cần Thơ',
    'long xuyen': 'ĐBSCL - Cần Thơ',
    'đồng tháp': 'ĐBSCL - Cần Thơ',
    'dong thap': 'ĐBSCL - Cần Thơ',
    'vĩnh long': 'ĐBSCL - Cần Thơ',
    'vinh long': 'ĐBSCL - Cần Thơ',
    'tiền giang': 'ĐBSCL - Cần Thơ',
    'tien giang': 'ĐBSCL - Cần Thơ',
    'hậu giang': 'ĐBSCL - Cần Thơ',
    'hau giang': 'ĐBSCL - Cần Thơ',
    'kiên giang': 'ĐBSCL - Cần Thơ',
    'kien giang': 'ĐBSCL - Cần Thơ',
    'miền tây': 'ĐBSCL - Cần Thơ',
    'mien tay': 'ĐBSCL - Cần Thơ',
    'đồng bằng sông cửu long': 'ĐBSCL - Cần Thơ',
    'dong bang song cuu long': 'ĐBSCL - Cần Thơ',
    'đbscl': 'ĐBSCL - Cần Thơ',
    'dbscl': 'ĐBSCL - Cần Thơ',
    'cần thơ': 'ĐBSCL - Cần Thơ',
    'can tho': 'ĐBSCL - Cần Thơ',

    // Tây Nguyên
    'kon tum': 'Tây Nguyên',
    'kontum': 'Tây Nguyên',
    'gia lai': 'Tây Nguyên',
    'gialai': 'Tây Nguyên',
    'pleiku': 'Tây Nguyên',
    'dak lak': 'Tây Nguyên',
    'daklak': 'Tây Nguyên',
    'đắk lắk': 'Tây Nguyên',
    'dak lak': 'Tây Nguyên',
    'buôn ma thuột': 'Tây Nguyên',
    'buon ma thuot': 'Tây Nguyên',
    'buôn đôn': 'Tây Nguyên',
    'buon don': 'Tây Nguyên',
    'đắk nông': 'Tây Nguyên',
    'dak nong': 'Tây Nguyên',
    'lâm đồng': 'Tây Nguyên',
    'lam dong': 'Tây Nguyên',
    'tây nguyên': 'Tây Nguyên',
    'tay nguyen': 'Tây Nguyên'
};

// Function để load destinations từ database (cached)
async function loadDestinations() {
    const now = Date.now();
    if (destinationsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        return destinationsCache;
    }

    try {
        if (chatbotUtils && typeof chatbotUtils.loadDestinations === 'function') {
            destinationsCache = await chatbotUtils.loadDestinations();
        } else {
            destinationsCache = await Destination.find({}).lean();
        }
        cacheTimestamp = Date.now();
        return destinationsCache;
    } catch (e) {
        console.error('Error loading destinations:', e);
        return [];
    }
}

// Function tạo context từ data
function createDataContext(data) {
    let context = '';

    // PRIORITY 1: FAQ/Knowledge Base (chính xác nhất)
    if (data.faqs && data.faqs.length > 0) {
        context += `\nKIẾN THỨC CƠ SỞ (FAQ/POLICY - ƯU TIÊN TRÍCH DẪN):\n`;
        data.faqs.forEach((faq, idx) => {
            context += `${idx + 1}. [${faq.category.toUpperCase()}] ${faq.question}\n`;
            context += `   Trả lời: ${faq.answer}\n\n`;
        });
    }

    if (data.tours.length > 0) {
        context += `\nTOUR CÓ SẴN (${data.tours.length} tour):\n`;
        data.tours.forEach((tour, idx) => {
            context += `${idx + 1}. ${tour.title}\n`;
            context += `   - Điểm đến: ${tour.destinationId?.name || 'Chưa xác định'}\n`;
            context += `   - Giá: ${tour.price?.toLocaleString()}đ\n`;
            context += `   - Thời gian: ${tour.duration}\n`;
            if (tour.description) {
                context += `   - Mô tả: ${tour.description.substring(0, 100)}...\n`;
            }
            context += '\n';
        });
    } else {
        context += '\nKHÔNG CÓ TOUR PHÙ HỢP TRONG DATABASE\n';
    }

    if (data.destinations.length > 0) {
        context += `\nĐIỂM ĐẾN CÓ SẴN (${data.destinations.length} điểm):\n`;
        data.destinations.forEach((dest, idx) => {
            context += `${idx + 1}. ${dest.name}\n`;
            if (dest.description) {
                context += `   - Mô tả: ${dest.description.substring(0, 100)}...\n`;
            }
            context += '\n';
        });
    }

    if (data.activities.length > 0) {
        context += `\nHOẠT ĐỘNG CÓ SẴN (${data.activities.length} hoạt động):\n`;
        data.activities.forEach((activity, idx) => {
            context += `${idx + 1}. ${activity.name}\n`;
            context += `   - Giá: ${activity.price?.toLocaleString()}đ\n`;
            if (activity.description) {
                context += `   - Mô tả: ${activity.description.substring(0, 100)}...\n`;
            }
            context += '\n';
        });
    }

    return context;
}

// System prompt với thông tin về LuTrip
const SYSTEM_PROMPT = `Bạn là CHUYÊN GIA TƯ VẤN DU LỊCH AI của LuTrip - nền tảng đặt tour & vé du lịch hàng đầu Việt Nam.

═══════════════════════════════════════════════════════════════
📋 THÔNG TIN DOANH NGHIỆP
═══════════════════════════════════════════════════════════════
- Tên: LuTrip (Vietnam Travel Platform)
- Dịch vụ: Tour trong nước & quốc tế | Vé máy bay | Hoạt động giải trí | Khách sạn
- Hotline 24/7: 1900 XXX XXX
- Email: support@lutrip.vn
- Website: lutrip.vn
- Chính sách: Hủy tour linh hoạt, thanh toán đa dạng, bảo hiểm đầy đủ

═══════════════════════════════════════════════════════════════
🎯 VAI TRÒ & NĂNG LỰC CỦA BẠN
═══════════════════════════════════════════════════════════════
✅ BẠN CÓ THỂ:
  • Trả lời MỌI câu hỏi (du lịch, đời sống, kiến thức chung)
  • Tư vấn điểm đến, lịch trình, kinh nghiệm du lịch chi tiết
  • Gợi ý tour/vé phù hợp dựa trên nhu cầu khách hàng
  • Giải thích chính sách booking, thanh toán, hủy tour
  • Hỗ trợ FAQ về giá, giấy tờ, thời gian, điều kiện tour

❌ BẠN KHÔNG ĐƯỢC:
  • Bịa đặt thông tin không có trong database
  • Đưa ra cam kết không chính xác về giá/dịch vụ
  • Tiết lộ thông tin cá nhân khách hàng

═══════════════════════════════════════════════════════════════
🔍 NGUYÊN TẮC RAG (RETRIEVAL-AUGMENTED GENERATION)
═══════════════════════════════════════════════════════════════
1️⃣ ƯU TIÊN KIẾN THỨC CƠ SỞ (FAQ/POLICY):
   • Nếu có "KIẾN THỨC CƠ SỞ" bên dưới → TRÍCH DẪN TRỰC TIẾP, KHÔNG TỰ Ý THÊM BỚT
   • Ví dụ: "Theo chính sách của LuTrip: [trích dẫn answer từ FAQ]"
   • Nếu FAQ không đủ → bổ sung kiến thức chung + gợi ý liên hệ

2️⃣ SỬ DỤNG DỮ LIỆU DATABASE:
   • Nếu có "TOUR CÓ SẴN" → tóm tắt số lượng, điểm nổi bật, đề cập "Xem gợi ý bên dưới"
   • Nếu KHÔNG có tour phù hợp → nói rõ + gợi ý liên hệ hotline
   • TUYỆT ĐỐI KHÔNG bịa tour không có trong database

3️⃣ TƯ VẤN KINH NGHIỆM:
   • BƯỚC 1: Tư vấn chi tiết bằng kiến thức của bạn (điểm tham quan, ẩm thực, văn hóa, tips)
   • BƯỚC 2: Giới thiệu tour trong database (nếu có)
   • BƯỚC 3: Nếu không có tour → vẫn tư vấn hữu ích + đề nghị liên hệ

═══════════════════════════════════════════════════════════════
📝 HƯỚNG DẪN TRẢ LỜI
═══════════════════════════════════════════════════════════════

🔹 Với câu hỏi CHUNG (toán, thời tiết, kiến thức):
   → Trả lời ngắn gọn, chính xác. VD: "1+1=2", "Thủ đô Việt Nam là Hà Nội"

🔹 Với câu hỏi về CHÍNH SÁCH/FAQ:
   → Trích dẫn từ "KIẾN THỨC CƠ SỞ" nếu có
   → Format: "Theo quy định của LuTrip: [nội dung chính xác]"
   → Nếu không có trong KB → trả lời chung + "Vui lòng liên hệ hotline 1900 XXX XXX để biết chi tiết"

🔹 Với câu hỏi về ĐIỂM ĐẾN/KINH NGHIỆM:
   → Tư vấn chi tiết: điểm tham quan, ẩm thực, thời điểm, tips, phương tiện
   → SAU ĐÓ giới thiệu tour (nếu có): "LuTrip có X tour đến [địa điểm]. Xem gợi ý bên dưới!"
   → Nếu không có tour: "Hiện chưa có tour sẵn, liên hệ hotline để được tư vấn đặt tour riêng"

🔹 Với câu hỏi về ĐẶT TOUR:
   → Kiểm tra "TOUR CÓ SẴN"
   → Nếu có: tóm tắt số lượng, giá, điểm nổi bật + "Xem chi tiết các tour bên dưới"
   → Nếu không: "Hiện tại chưa có tour đến [điểm đến] trong hệ thống. Vui lòng liên hệ hotline..."

🔹 LƯU Ý ĐẶC BIỆT:
   • CHỈ đề cập "gợi ý bên dưới" KHI CÓ tour/activity trong database
   • Khi khách hỏi về tỉnh Miền Tây (An Giang, Cà Mau...) → tour hiển thị dưới "ĐBSCL - Cần Thơ" → giải thích: "Tours đến [tên tỉnh] nằm trong chương trình ĐBSCL. Xem gợi ý!"
   • Tương tự Tây Nguyên: Kon Tum, Gia Lai, Đắk Lắk → vùng "Tây Nguyên"

🎨 PHONG CÁCH:
   • Thân thiện, nhiệt tình, chuyên nghiệp
   • Dùng emoji phù hợp: ✈️ 🏖️ 🎉 🌟 ✅ 🍜 🏛️ 💡 📍
   • Trả lời bằng tiếng Việt
   • Cấu trúc rõ ràng (bullet points, numbering khi cần)

═══════════════════════════════════════════════════════════════
💡 VÍ DỤ TRẢ LỜI TỐT
═══════════════════════════════════════════════════════════════

Câu hỏi: "Làm sao để hủy tour?"
Trả lời (có FAQ):
"Chính sách hủy tour của LuTrip như sau:
✅ Hủy trước 15 ngày: hoàn 80% giá trị tour
✅ Hủy trước 7-14 ngày: hoàn 50%
✅ Hủy trong 7 ngày: không hoàn tiền
✅ Trường hợp bất khả kháng (bệnh nặng, thiên tai) có giấy tờ: xét hoàn 70-90%

Để yêu cầu hủy, vui lòng liên hệ hotline 1900 XXX XXX hoặc email support@lutrip.vn. 📞"

Câu hỏi: "Gợi ý kinh nghiệm du lịch Đà Lạt"
Trả lời:
"Đà Lạt - thành phố ngàn hoa tuyệt đẹp! 🌸

📍 Điểm tham quan hot:
  • Hồ Xuân Hương, Thung lũng Tình yêu
  • Đồi chè Cầu Đất, farmstay Mê Linh
  • Chợ đêm Đà Lạt, phố cổ

🍜 Ẩm thực:
  • Bánh tráng nướng, lẩu gà lá é
  • Sữa đậu nành, dâu tây tươi
  • Cafe view đẹp (Mê Linh, Đà Lạt Xưa & Nay)

💡 Thời điểm đẹp: tháng 12-2 (mùa hoa), tháng 11 (hoa dã quỳ)

LuTrip có 4 tour Đà Lạt khởi hành từ TP.HCM với giá từ 2.5 triệu. Xem gợi ý tour bên dưới! ✈️"

═══════════════════════════════════════════════════════════════`;


/**
 * @swagger
 * /api/chatbot/chat:
 *   post:
 *     summary: Chat với AI assistant
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - sessionId
 *             properties:
 *               message:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response từ AI
 */
router.post("/chat", async (req, res) => {
    let relevantData = {
        destinations: [],
        tours: [],
        activities: [],
        intent: 'general'
    };

    const { message, sessionId, userId } = req.body;

    try {
        console.log('\n🤖 ========== NEW CHAT REQUEST ==========');
        console.log('🤖 Message:', message);

        if (!message || !message.trim()) {
            return res.status(400).json({ error: "Tin nhắn không được để trống" });
        }

        if (!sessionId) {
            return res.status(400).json({ error: "Session ID là bắt buộc" });
        }

        // Lấy lịch sử chat từ database
        let chatHistory = await ChatHistory.findOne({ sessionId });

        if (!chatHistory) {
            // Tạo chat history mới
            chatHistory = new ChatHistory({
                userId: userId || null,
                sessionId,
                messages: [],
                metadata: {
                    lastActivity: new Date(),
                },
            });
        }

        // Lấy context từ lịch sử (10 tin nhắn gần nhất)
        const recentMessages = chatHistory.messages.slice(-10);
        const conversationContext = recentMessages
            .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
            .join("\n");

        // Phân tích intent và lấy data phù hợp từ database (delegate to chatbotUtils)
        if (chatbotUtils && typeof chatbotUtils.analyzeIntentAndGetData === 'function') {
            relevantData = await chatbotUtils.analyzeIntentAndGetData(message);
        } else {
            relevantData = { destinations: [], tours: [], activities: [], intent: 'general' };
        }
        console.log('🤖 Intent detected:', relevantData.intent);
        console.log('🤖 Tours found:', relevantData.tours.length);
        console.log('🤖 Destinations found:', relevantData.destinations.length);

        // Debug: Check total tours in database
        const totalTours = await Tour.countDocuments({ isActive: true });
        console.log('🤖 Total active tours in DB:', totalTours);

        // Check if user asked about an alias (An Giang → ĐBSCL)
        let extractedDestination = null;
        if (chatbotUtils && typeof chatbotUtils.extractDestination === 'function') {
            try {
                extractedDestination = await chatbotUtils.extractDestination(message);
            } catch (e) {
                console.error('extractDestination error:', e);
                extractedDestination = null;
            }
        } else {
            // Fallback: try to match known destinations from DB
            const allDests = await loadDestinations();
            const lowerMsg = (message || '').toLowerCase();
            const found = allDests.find(d => (d.name || '').toLowerCase() && lowerMsg.includes((d.name || '').toLowerCase()));
            extractedDestination = found ? found.name : null;
        }
        let aliasNote = '';
        if (extractedDestination) {
            const lowerMsg = message.toLowerCase();
            const normalizedMsg = normalizeText(message);
            for (const [alias, mainDest] of Object.entries(DESTINATION_ALIASES)) {
                if ((normalizedMsg.includes(normalizeText(alias)) || lowerMsg.includes(alias)) &&
                    mainDest === extractedDestination) {
                    aliasNote = `\n⚠️ LƯU Ý: Khách hỏi về "${alias}" nhưng trong hệ thống destination chính là "${mainDest}". Hãy giải thích tours hiển thị là cho khu vực ${mainDest} (bao gồm ${alias}).\n`;
                    console.log('🤖 Alias detected:', alias, '→', mainDest);
                    break;
                }
            }
        }

        const dataContext = createDataContext(relevantData) + aliasNote;

        // Tạo prompt đầy đủ với context
        const fullPrompt = `${SYSTEM_PROMPT}

${dataContext ? `THÔNG TIN PHÙ HỢP TỪ DATABASE:\n${dataContext}\n` : ""}
${conversationContext ? `LỊCH SỬ HỘI THOẠI GẦN ĐÂY:\n${conversationContext}\n` : ""}
User: ${message}
Assistant:`;

        // Khởi tạo Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Gọi Gemini API với retry logic
        let result;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                result = await model.generateContent(fullPrompt);
                break; // Thành công, thoát vòng lặp
            } catch (error) {
                if (error.status === 503 && retryCount < maxRetries - 1) {
                    console.log(`🤖 API overloaded, retrying... (${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Delay tăng dần
                    retryCount++;
                } else {
                    throw error; // Rethrow nếu không phải 503 hoặc đã retry đủ
                }
            }
        }

        const response = await result.response;
        const botReply = response.text();

        // Lưu tin nhắn vào lịch sử
        chatHistory.messages.push(
            {
                role: "user",
                content: message,
                timestamp: new Date(),
            },
            {
                role: "assistant",
                content: botReply,
                timestamp: new Date(),
            }
        );

        chatHistory.metadata.lastActivity = new Date();

        // Giới hạn lịch sử chỉ lưu 50 tin nhắn gần nhất
        if (chatHistory.messages.length > 50) {
            chatHistory.messages = chatHistory.messages.slice(-50);
        }

        await chatHistory.save();

        // Chuẩn bị items để hiển thị - CHỈ hiển thị khi có tours/activities thực sự phù hợp
        const suggestedItems = [];

        console.log('🤖 Creating suggested items...');
        console.log('🤖 relevantData.tours length:', relevantData.tours.length);
        console.log('🤖 relevantData.activities length:', relevantData.activities.length);
        console.log('🤖 relevantData.intent:', relevantData.intent);
        console.log('🤖 First tour title:', relevantData.tours[0]?.title?.substring(0, 50));

        // CHỈ thêm suggested items nếu có tours phù hợp VÀ không phải là destination không tồn tại
        if (relevantData.tours.length > 0 &&
            relevantData.intent !== 'specific_destination_not_found') {
            const tourItems = relevantData.tours.slice(0, 5).map(tour => ({
                type: 'tour',
                id: tour._id,
                slug: tour.slug,
                title: tour.title,
                description: tour.description,
                price: tour.price,
                duration: tour.duration,
                destination: tour.destinationId?.name,
                image: tour.images?.[0] || '/images/tour-default.jpg'
            }));
            suggestedItems.push(...tourItems);
            console.log('🤖 Added tour items:', tourItems.length);
            console.log('🤖 First tour item title:', tourItems[0]?.title?.substring(0, 50));
        } else {
            console.log('🤖 No tour items - no matching tours found or destination not in system');
        }

        // Thêm activities nếu có
        if (relevantData.activities && relevantData.activities.length > 0) {
            const activityItems = relevantData.activities.slice(0, 5).map(activity => ({
                type: 'activity',
                id: activity._id,
                slug: activity.slug,
                title: activity.name,
                description: activity.description,
                price: activity.price,
                destination: activity.destinationId?.name,
                image: activity.images?.[0] || '/images/activity-default.jpg'
            }));
            suggestedItems.push(...activityItems);
            console.log('🤖 Added activity items:', activityItems.length);
        }

        console.log('🤖 Total suggested items:', suggestedItems.length);

        res.json({
            response: botReply,
            sessionId,
            timestamp: new Date(),
            suggestedItems: suggestedItems.length > 0 ? suggestedItems : null
        });
    } catch (error) {
        console.error("Chatbot error:", error);

        // Fallback response khi API không khả dụng
        let fallbackResponse = "Xin chào! Hiện tại hệ thống đang bận. ";
        let fallbackItems = null;

        if (relevantData && (relevantData.tours.length > 0 || relevantData.activities.length > 0)) {
            const tourCount = relevantData.tours.length;
            const activityCount = relevantData.activities.length;

            if (tourCount > 0 && activityCount > 0) {
                fallbackResponse += `Chúng tôi có ${tourCount} tour và ${activityCount} hoạt động phù hợp. Xem gợi ý bên dưới nhé! 🌟`;
            } else if (tourCount > 0) {
                fallbackResponse += `Chúng tôi có ${tourCount} tour phù hợp. Xem gợi ý bên dưới nhé! 🌟`;
            } else {
                fallbackResponse += `Chúng tôi có ${activityCount} hoạt động phù hợp. Xem gợi ý bên dưới nhé! 🌟`;
            }

            // Tạo suggested items từ data đã query
            const items = [];

            if (relevantData.tours.length > 0) {
                items.push(...relevantData.tours.slice(0, 3).map(tour => ({
                    type: 'tour',
                    id: tour._id,
                    slug: tour.slug,
                    title: tour.title,
                    description: tour.description,
                    price: tour.price,
                    duration: tour.duration,
                    destination: tour.destinationId?.name,
                    image: tour.images?.[0] || '/images/tour-default.jpg'
                })));
            }

            if (relevantData.activities.length > 0) {
                items.push(...relevantData.activities.slice(0, 3).map(activity => ({
                    type: 'activity',
                    id: activity._id,
                    slug: activity.slug,
                    title: activity.name,
                    description: activity.description,
                    price: activity.price,
                    destination: activity.destinationId?.name,
                    image: activity.images?.[0] || '/images/activity-default.jpg'
                })));
            }

            fallbackItems = items;
        } else {
            fallbackResponse += "Vui lòng liên hệ hotline 1900 XXX XXX để được tư vấn trực tiếp.";
        }

        return res.json({
            response: fallbackResponse,
            sessionId,
            timestamp: new Date(),
            suggestedItems: fallbackItems,
            isFallback: true // Đánh dấu đây là fallback response
        });
    }
});

/**
 * @swagger
 * /api/chatbot/suggest-tours:
 *   post:
 *     summary: Gợi ý tour dựa trên yêu cầu
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Danh sách tour gợi ý
 */
router.post("/suggest-tours", async (req, res) => {
    try {
        const { query, sessionId } = req.body;

        if (!query || !query.trim()) {
            return res.status(400).json({ error: "Query không được để trống" });
        }

        // Lấy tours từ database - Mới nhất, đang active và chưa hết hạn
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tours = await Tour.find({
            isActive: true,
            startDate: { $gte: today }
        })
            .populate("destinationId")
            .sort({ createdAt: -1 }) // Mới nhất trước
            .limit(20)
            .lean();

        // Tạo context về các tour có sẵn
        const toursContext = tours
            .map(
                (tour, idx) =>
                    `${idx + 1}. ${tour.title} - ${tour.destinationId?.name || "N/A"} - Giá: ${tour.price?.toLocaleString()}đ - ${tour.duration}`
            )
            .join("\n");

        const prompt = `Bạn là chuyên gia tư vấn du lịch của LuTrip.

DANH SÁCH TOUR HIỆN CÓ:
${toursContext}

YÊU CẦU CỦA KHÁCH HÀNG: "${query}"

Hãy phân tích yêu cầu và gợi ý 3-5 tour phù hợp nhất từ danh sách trên. 
Với mỗi tour, giải thích ngắn gọn tại sao phù hợp với yêu cầu.
Format: Số thứ tự. Tên tour - Lý do gợi ý

Nếu không có tour phù hợp, hãy gợi ý khách hàng liên hệ để tư vấn thêm.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Gọi Gemini API với retry logic
        let result;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                result = await model.generateContent(prompt);
                break; // Thành công, thoát vòng lặp
            } catch (error) {
                if (error.status === 503 && retryCount < maxRetries - 1) {
                    console.log(`🤖 Suggest API overloaded, retrying... (${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Delay tăng dần
                    retryCount++;
                } else {
                    throw error; // Rethrow nếu không phải 503 hoặc đã retry đủ
                }
            }
        }

        const response = await result.response;
        const suggestions = response.text();

        // Lưu vào chat history nếu có sessionId
        if (sessionId) {
            const chatHistory = await ChatHistory.findOne({ sessionId });
            if (chatHistory) {
                chatHistory.messages.push(
                    {
                        role: "user",
                        content: `Gợi ý tour: ${query}`,
                        timestamp: new Date(),
                    },
                    {
                        role: "assistant",
                        content: suggestions,
                        timestamp: new Date(),
                    }
                );
                chatHistory.metadata.tourContext = query;
                await chatHistory.save();
            }
        }

        res.json({
            suggestions,
            tours: tours.slice(0, 5), // Trả về top 5 tours để hiển thị
        });
    } catch (error) {
        console.error("Tour suggestion error:", error);
        res.status(500).json({
            error: "Không thể gợi ý tour lúc này. Vui lòng thử lại sau.",
        });
    }
});

/**
 * @swagger
 * /api/chatbot/history/{sessionId}:
 *   get:
 *     summary: Lấy lịch sử chat
 *     tags: [Chatbot]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lịch sử chat
 */
router.get("/history/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;

        const chatHistory = await ChatHistory.findOne({ sessionId }).lean();

        if (!chatHistory) {
            return res.json({ messages: [] });
        }

        res.json({
            messages: chatHistory.messages,
            metadata: chatHistory.metadata,
        });
    } catch (error) {
        console.error("Get history error:", error);
        res.status(500).json({ error: "Không thể lấy lịch sử chat" });
    }
});

/**
 * @swagger
 * /api/chatbot/clear/{sessionId}:
 *   delete:
 *     summary: Xóa lịch sử chat
 *     tags: [Chatbot]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã xóa lịch sử
 */
router.delete("/clear/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;

        await ChatHistory.findOneAndDelete({ sessionId });

        res.json({ message: "Đã xóa lịch sử chat thành công" });
    } catch (error) {
        console.error("Clear history error:", error);
        res.status(500).json({ error: "Không thể xóa lịch sử chat" });
    }
});

module.exports = router;
