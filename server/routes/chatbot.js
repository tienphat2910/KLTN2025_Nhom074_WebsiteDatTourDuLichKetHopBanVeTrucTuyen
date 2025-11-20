const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ChatHistory = require("../models/ChatHistory");
const Tour = require("../models/Tour");
const Destination = require("../models/Destination");
const Activity = require("../models/Activity");
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

// Function để load destinations từ database
async function loadDestinations() {
    const now = Date.now();
    if (destinationsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        return destinationsCache;
    }

    try {
        const destinations = await Destination.find({}).select('name slug').lean();
        destinationsCache = destinations.map(dest => ({
            name: dest.name,
            slug: dest.slug,
            normalizedName: normalizeText(dest.name),
            normalizedSlug: normalizeText(dest.slug)
        }));
        cacheTimestamp = now;
        console.log('🤖 Loaded destinations from DB:', destinationsCache.length);
        return destinationsCache;
    } catch (error) {
        console.error('🤖 Error loading destinations:', error);
        // Fallback về array cứng nếu không load được từ DB
        return [
            'hà nội', 'hanoi', 'sài gòn', 'ho chi minh', 'đà nẵng', 'da nang',
            'phú quốc', 'phu quoc', 'nha trang', 'đà lạt', 'da lat', 'sapa', 'huế', 'hue',
            'hội an', 'hoi an', 'quảng ninh', 'quang ninh', 'hạ long', 'ha long', 'cần thơ', 'can tho',
            'vũng tàu', 'vung tau', 'phan thiết', 'phan thiet', 'mũi né', 'mui ne', 'kon tum', 'kontum',
            'buôn ma thuột', 'buon ma thuot', 'pleiku', 'buôn đôn', 'buon don', 'dak lak', 'daklak',
            'gia lai', 'gialai', 'tây nguyên', 'tay nguyen', 'an giang', 'angiang', 'miền tây', 'mien tay',
            'cà mau', 'ca mau', 'bạc liêu', 'bac lieu', 'sóc trăng', 'soc trang', 'trà vinh', 'tra vinh',
            'bến tre', 'ben tre', 'long xuyên', 'long xuyen', 'đồng tháp', 'dong thap'
        ].map(name => ({
            name: name,
            slug: name,
            normalizedName: normalizeText(name),
            normalizedSlug: normalizeText(name)
        }));
    }
}

// Function để extract destination từ message
async function extractDestination(message) {
    const lowerMessage = message.toLowerCase();
    const normalizedMessage = normalizeText(message);

    // BƯỚC 1: Check alias mapping trước (An Giang → ĐBSCL - Cần Thơ)
    for (const [alias, mainDestination] of Object.entries(DESTINATION_ALIASES)) {
        const normalizedAlias = normalizeText(alias);
        if (normalizedMessage.includes(normalizedAlias) || lowerMessage.includes(alias)) {
            console.log(`🤖 Matched alias: "${alias}" → Main destination: "${mainDestination}"`);
            return mainDestination;
        }
    }

    // BƯỚC 2: Load destinations từ database
    const destinations = await loadDestinations();

    // BƯỚC 3: Exact match với destination trong DB
    for (const dest of destinations) {
        // Check normalized name và slug (exact match)
        if (normalizedMessage === dest.normalizedName ||
            normalizedMessage === dest.normalizedSlug) {
            console.log('🤖 Exact matched destination:', dest.name);
            return dest.name; // Return original name, not normalized
        }
    }

    // BƯỚC 4: Partial match với destination trong DB
    for (const dest of destinations) {
        // Check if message contains destination name/slug
        if (normalizedMessage.includes(dest.normalizedName) ||
            normalizedMessage.includes(dest.normalizedSlug) ||
            lowerMessage.includes(dest.name.toLowerCase()) ||
            lowerMessage.includes(dest.slug.toLowerCase())) {
            console.log('🤖 Partial matched destination:', dest.name);
            return dest.name; // Return original name, not normalized
        }
    }

    return null;
}

// Function để phân tích intent và lấy data phù hợp
async function analyzeIntentAndGetData(message) {
    const lowerMessage = message.toLowerCase();

    let relevantData = {
        destinations: [],
        tours: [],
        activities: [],
        intent: 'general'
    };

    // Extract destination từ message - ƯU TIÊN TRƯỚC TIÊN
    const extractedDestination = await extractDestination(message);
    console.log('🤖 Extracted destination:', extractedDestination);

    // Detect intent dựa trên keywords và destination
    // ƯU TIÊN 1: Nếu có destination cụ thể, xử lý trước
    if (extractedDestination) {
        relevantData.intent = 'specific_destination';
        console.log('🤖 Detected specific destination intent');

        // Query tất cả tours active - populate both destinationId and destinationIds
        const allTours = await Tour.find({ isActive: true })
            .populate('destinationId')
            .populate('destinationIds')
            .limit(100)
            .lean();
        console.log('🤖 All tours:', allTours.length);

        // Filter tours theo destination được extract
        relevantData.tours = allTours.filter(tour => {
            const destName = tour.destinationId?.name || '';
            const tourTitle = tour.title || '';
            const tourDesc = tour.description || '';

            // Check destinationIds array (new field)
            const destinationNames = [];
            if (tour.destinationIds && Array.isArray(tour.destinationIds)) {
                tour.destinationIds.forEach(dest => {
                    if (dest && dest.name) {
                        destinationNames.push(dest.name);
                    }
                });
            }

            // Normalize để so sánh tốt hơn
            const normalizedDestName = normalizeText(destName);
            const normalizedTourTitle = normalizeText(tourTitle);
            const normalizedTourDesc = normalizeText(tourDesc);
            const normalizedExtracted = normalizeText(extractedDestination);

            // Tách các phần của destination (vd: "ĐBSCL - Cần Thơ" → ["dbscl", "can tho"])
            const extractedParts = normalizedExtracted.split(/[-\s]+/).filter(p => p.length > 2);
            const destNameParts = normalizedDestName.split(/[-\s]+/).filter(p => p.length > 2);

            // 1. Ưu tiên match destination name chính xác (destinationId)
            // Check exact match
            if (normalizedDestName === normalizedExtracted ||
                destName.toLowerCase() === extractedDestination.toLowerCase()) {
                console.log(`🤖 ✅ EXACT DESTINATION MATCH (destinationId) for "${extractedDestination}"`);
                return true;
            }

            // Check if destination contains any part of extracted
            if (extractedParts.some(part => normalizedDestName.includes(part)) ||
                destNameParts.some(part => normalizedExtracted.includes(part))) {
                console.log(`🤖 ✅ PARTIAL DESTINATION MATCH (destinationId) for "${extractedDestination}" in "${destName}"`);
                return true;
            }

            // 2. Check destinationIds array
            for (const dName of destinationNames) {
                const normalized = normalizeText(dName);
                const dNameParts = normalized.split(/[-\s]+/).filter(p => p.length > 2);

                if (normalized === normalizedExtracted ||
                    dName.toLowerCase() === extractedDestination.toLowerCase()) {
                    console.log(`🤖 ✅ EXACT DESTINATION MATCH (destinationIds) for "${extractedDestination}"`);
                    return true;
                }

                if (extractedParts.some(part => normalized.includes(part)) ||
                    dNameParts.some(part => normalizedExtracted.includes(part))) {
                    console.log(`🤖 ✅ PARTIAL DESTINATION MATCH (destinationIds) for "${extractedDestination}" in "${dName}"`);
                    return true;
                }
            }

            // 3. Match title chứa destination
            if (normalizedTourTitle.includes(normalizedExtracted) ||
                tourTitle.toLowerCase().includes(extractedDestination.toLowerCase())) {
                console.log(`🤖 ✅ TITLE MATCH for "${extractedDestination}"`);
                return true;
            }

            // 4. Cuối cùng match description
            if (normalizedTourDesc.includes(normalizedExtracted) ||
                tourDesc.toLowerCase().includes(extractedDestination.toLowerCase())) {
                console.log(`🤖 ✅ DESCRIPTION MATCH for "${extractedDestination}"`);
                return true;
            }

            return false;
        });

        console.log('🤖 Tours found for destination:', relevantData.tours.length);
        if (relevantData.tours.length === 0) {
            console.log('🤖 ❌ No tours matched!');
            console.log('🤖 Looking for:', extractedDestination);
            console.log('🤖 Normalized:', normalizeText(extractedDestination));
            console.log('🤖 Checking sample tours in DB:');
            allTours.slice(0, 5).forEach((tour, idx) => {
                console.log(`  ${idx + 1}. Title: "${tour.title?.substring(0, 50)}"`);
                console.log(`     destinationId.name: "${tour.destinationId?.name}"`);
                console.log(`     destinationId.name (normalized): "${normalizeText(tour.destinationId?.name || '')}"`);
                if (tour.destinationIds && tour.destinationIds.length > 0) {
                    console.log(`     destinationIds: [${tour.destinationIds.map(d => `"${d?.name}"`).join(', ')}]`);
                }
                console.log('');
            });
        }

        // KHÔNG lấy tours ngẫu nhiên nếu không tìm thấy - để trống
        // User sẽ thấy message "không có tour" từ AI

    } else if (lowerMessage.includes('phú quốc') || lowerMessage.includes('biển') || lowerMessage.includes('đi biển') ||
        lowerMessage.includes('du lịch biển') || lowerMessage.includes('nghỉ dưỡng biển')) {
        relevantData.intent = 'beach';
        console.log('🤖 Detected beach intent');

        // Query tất cả tours active trước
        const allTours = await Tour.find({ isActive: true }).populate('destinationId').limit(20).lean();
        console.log('🤖 All tours:', allTours.length);

        // Filter tours có destination chứa Phú Quốc hoặc các từ khóa biển
        relevantData.tours = allTours.filter(tour =>
            tour.destinationId?.name?.toLowerCase().includes('phú quốc') ||
            tour.title?.toLowerCase().includes('phú quốc') ||
            tour.destinationId?.name?.toLowerCase().includes('biển') ||
            tour.title?.toLowerCase().includes('biển') ||
            tour.description?.toLowerCase().includes('biển')
        );
        console.log('🤖 Beach tours found:', relevantData.tours.length);

        // Nếu không có tours biển cụ thể, lấy tours đến các điểm biển khác
        if (relevantData.tours.length === 0) {
            relevantData.tours = allTours.filter(tour =>
                tour.destinationId?.name?.toLowerCase().includes('nha trang') ||
                tour.destinationId?.name?.toLowerCase().includes('đà nẵng') ||
                tour.destinationId?.name?.toLowerCase().includes('đà lạt') ||
                tour.title?.toLowerCase().includes('nha trang') ||
                tour.title?.toLowerCase().includes('đà nẵng')
            );
            console.log('🤖 Alternative beach tours found:', relevantData.tours.length);
        }

    } else if (lowerMessage.includes('tour') || lowerMessage.includes('du lịch') || lowerMessage.includes('đi') ||
        lowerMessage.includes('đi chơi') || lowerMessage.includes('kỳ nghỉ')) {

        // KIỂM TRA: Nếu message có format "tour [tên địa điểm]" nhưng không extract được destination
        // → Có thể user hỏi về destination không có trong hệ thống
        // → KHÔNG nên show random tours
        const possibleLocationQuery = lowerMessage.match(/tour\s+([a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ\s]+)/i);

        if (possibleLocationQuery && possibleLocationQuery[1]) {
            const locationName = possibleLocationQuery[1].trim();
            console.log('🤖 Detected potential location query:', locationName);
            console.log('🤖 But no destination matched - user asking about unavailable destination');

            // Không có destination match → Không có tours cho địa điểm này
            relevantData.intent = 'specific_destination_not_found';
            relevantData.tours = []; // Để trống, không show random tours
            console.log('🤖 No tours - destination not in system');
        } else {
            // Câu hỏi general về tour, không specify địa điểm cụ thể
            relevantData.intent = 'tour';
            console.log('🤖 Detected general tour intent');

            // Lấy tất cả tours active
            relevantData.tours = await Tour.find({ isActive: true })
                .populate('destinationId')
                .limit(15)
                .lean();
            console.log('🤖 General tours found:', relevantData.tours.length);
        }

    } else if (lowerMessage.includes('hoạt động') || lowerMessage.includes('giải trí') || lowerMessage.includes('vui chơi') ||
        lowerMessage.includes('trải nghiệm') || lowerMessage.includes('thể thao')) {
        relevantData.intent = 'activity';
        relevantData.activities = await Activity.find({ isActive: true })
            .limit(10)
            .lean();
        console.log('🤖 Activities found:', relevantData.activities.length);
    } else {
        // Default: lấy một số tours ngẫu nhiên để gợi ý
        relevantData.intent = 'general';
        console.log('🤖 General intent - getting random tours');

        relevantData.tours = await Tour.find({ isActive: true })
            .populate('destinationId')
            .limit(8)
            .lean();
        console.log('🤖 Random tours found:', relevantData.tours.length);
    }

    return relevantData;
}

// Function tạo context từ data
function createDataContext(data) {
    let context = '';

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
const SYSTEM_PROMPT = `Bạn là trợ lý AI thông minh của LuTrip - nền tảng du lịch hàng đầu Việt Nam.

THÔNG TIN VỀ LUTRIP:
- LuTrip là nền tảng đặt chỗ du lịch trực tuyến
- Cung cấp: Tour du lịch trong nước và quốc tế, Vé máy bay, Hoạt động giải trí, Đặt phòng khách sạn
- Hotline hỗ trợ 24/7: 1900 XXX XXX
- Email: support@lutrip.vn
- Website: lutrip.vn

VAI TRÒ CỦA BẠN:
1. Tư vấn và hướng dẫn khách hàng tìm tour, vé máy bay, khách sạn phù hợp
2. Phân tích dữ liệu thực từ database để đưa ra câu trả lời chính xác
3. KHÔNG sử dụng câu trả lời mẫu cứng - luôn dựa vào thông tin có sẵn
4. Nếu không có dữ liệu phù hợp, hãy nói rõ và gợi ý khách hàng liên hệ tư vấn thêm
5. Khuyến khích khách hàng click vào các gợi ý để xem chi tiết

NGUYÊN TẮC HOẠT ĐỘNG:
- Trả lời dựa trên dữ liệu thực tế từ database
- Nếu có tours phù hợp, tóm tắt ngắn gọn số lượng và điểm nổi bật, đề cập "Xem các tour bên dưới"
- Nếu KHÔNG có tours phù hợp (KHÔNG CÓ TOUR PHÙ HỢP TRONG DATABASE), nói rõ "Hiện tại chưa có tour đến [tên điểm đến] trong hệ thống" và gợi ý liên hệ hotline 1900 XXX XXX hoặc email support@lutrip.vn
- TUYỆT ĐỐI KHÔNG đề cập đến "gợi ý bên dưới" hoặc "click vào gợi ý" khi KHÔNG có tour phù hợp
- Sử dụng emoji phù hợp (✈️ 🏖️ 🎉 🌟)
- Trả lời bằng tiếng Việt
- CHỈ đề cập đến các gợi ý/items bên dưới khi CÓ tours trong database

LƯU Ý VỀ ĐỊA DANH:
- Khi khách hỏi về các tỉnh Miền Tây (An Giang, Cà Mau, Bạc Liêu, Sóc Trăng, v.v.), tours sẽ được hiển thị dưới tên chung "ĐBSCL - Cần Thơ"
- Hãy giải thích: "Tours đến [tên tỉnh khách hỏi] nằm trong chương trình du lịch ĐBSCL (Đồng bằng sông Cửu Long). Xem các tour Miền Tây bên dưới!"
- Tương tự cho Tây Nguyên: Kon Tum, Gia Lai, Đắk Lắk đều thuộc vùng "Tây Nguyên"

QUAN TRỌNG: 
1. KHÔNG sử dụng các câu trả lời mẫu như "Phú Quốc có nhiều tour hấp dẫn". Hãy phân tích dữ liệu thực và trả lời dựa trên số lượng tours có sẵn.
2. Khi KHÔNG có tours, ĐỪNG nói về "gợi ý" hay "tour bên dưới" - chỉ nói không có và hướng dẫn liên hệ tư vấn.
3. Khi khách hỏi về tỉnh cụ thể nhưng tours hiển thị destination tổng hợp (ĐBSCL, Tây Nguyên), hãy giải thích rõ ràng.`;

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

        // Phân tích intent và lấy data phù hợp từ database
        relevantData = await analyzeIntentAndGetData(message);
        console.log('🤖 Intent detected:', relevantData.intent);
        console.log('🤖 Tours found:', relevantData.tours.length);
        console.log('🤖 Destinations found:', relevantData.destinations.length);

        // Debug: Check total tours in database
        const totalTours = await Tour.countDocuments({ isActive: true });
        console.log('🤖 Total active tours in DB:', totalTours);

        // Check if user asked about an alias (An Giang → ĐBSCL)
        const extractedDestination = await extractDestination(message);
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

        // Chuẩn bị items để hiển thị - CHỈ hiển thị khi có tours thực sự phù hợp
        const suggestedItems = [];

        console.log('🤖 Creating suggested items...');
        console.log('🤖 relevantData.tours length:', relevantData.tours.length);
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
            console.log('🤖 No suggested items - no matching tours found or destination not in system');
        }

        // KHÔNG thêm destinations hay activities nếu không có tours
        // User chỉ muốn thấy tours liên quan đến destination họ hỏi

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

        if (relevantData && relevantData.tours.length > 0) {
            const tourCount = relevantData.tours.length;
            const firstTour = relevantData.tours[0];
            fallbackResponse += `Chúng tôi có ${tourCount} tour phù hợp. Xem gợi ý bên dưới nhé! 🌟`;

            // Tạo suggested items từ data đã query
            fallbackItems = relevantData.tours.slice(0, 3).map(tour => ({
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

        // Lấy tours từ database
        const tours = await Tour.find({ isActive: true })
            .populate("destinationId")
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
