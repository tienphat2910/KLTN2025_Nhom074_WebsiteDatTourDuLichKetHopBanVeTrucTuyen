"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail
} from "lucide-react";

export default function Help() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const categories = [
    { id: "all", name: "Tất cả", count: 24 },
    { id: "booking", name: "Đặt chỗ", count: 8 },
    { id: "payment", name: "Thanh toán", count: 6 },
    { id: "account", name: "Tài khoản", count: 4 },
    { id: "technical", name: "Kỹ thuật", count: 6 }
  ];

  const faqs = [
    {
      id: "booking-1",
      category: "booking",
      question: "Làm thế nào để tìm và đặt vé máy bay?",
      answer:
        "Để đặt vé máy bay: 1) Truy cập trang Vé máy bay, 2) Nhập điểm đi và điểm đến, 3) Chọn ngày đi và số hành khách, 4) So sánh giá và chọn chuyến phù hợp, 5) Điền thông tin hành khách và thanh toán."
    },
    {
      id: "booking-2",
      category: "booking",
      question: "Tôi có thể đặt khách sạn như thế nào?",
      answer:
        "Đặt khách sạn: 1) Vào trang Khách sạn, 2) Nhập địa điểm và ngày lưu trú, 3) Lọc theo giá, tiện nghi, 4) Chọn phòng phù hợp, 5) Điền thông tin và thanh toán. Bạn có thể hủy miễn phí theo chính sách của khách sạn."
    },
    {
      id: "booking-3",
      category: "booking",
      question: "Tour du lịch được đặt như thế nào?",
      answer:
        "Đặt tour: 1) Truy cập trang Tour, 2) Chọn điểm đến và ngày khởi hành, 3) Xem chi tiết lịch trình và giá, 4) Chọn tour phù hợp, 5) Điền thông tin đoàn và thanh toán. Tour thường có chính sách hủy riêng."
    },
    {
      id: "payment-1",
      category: "payment",
      question: "Phương thức thanh toán nào được chấp nhận?",
      answer:
        "LuTrip chấp nhận: 1) Thẻ tín dụng/ghi nợ (Visa, Mastercard, JCB), 2) Ví điện tử (MoMo, ZaloPay, ViettelPay), 3) Chuyển khoản ngân hàng, 4) Thanh toán khi nhận tại một số dịch vụ."
    },
    {
      id: "payment-2",
      category: "payment",
      question: "Thanh toán có an toàn không?",
      answer:
        "Hoàn toàn an toàn! Chúng tôi sử dụng mã hóa SSL 256-bit, tuân thủ chuẩn PCI DSS, và không lưu trữ thông tin thẻ tín dụng của bạn. Tất cả giao dịch được bảo mật tối đa."
    },
    {
      id: "payment-3",
      category: "payment",
      question: "Tôi có thể thanh toán bằng tiền mặt không?",
      answer:
        "Có, một số dịch vụ cho phép thanh toán khi nhận (COD). Tuy nhiên, khuyến nghị thanh toán online để đảm bảo chỗ và nhận ưu đãi tốt hơn."
    },
    {
      id: "account-1",
      category: "account",
      question: "Làm thế nào để tạo tài khoản LuTrip?",
      answer:
        "Tạo tài khoản: 1) Click 'Đăng ký' trên website, 2) Điền email và mật khẩu, 3) Xác nhận email, 4) Điền thông tin cá nhân. Tài khoản giúp bạn theo dõi đặt chỗ và nhận ưu đãi."
    },
    {
      id: "account-2",
      category: "account",
      question: "Tôi quên mật khẩu, phải làm sao?",
      answer:
        "Click 'Quên mật khẩu' trên trang đăng nhập, nhập email đã đăng ký, kiểm tra email để nhận link đặt lại mật khẩu, làm theo hướng dẫn."
    },
    {
      id: "technical-1",
      category: "technical",
      question: "Ứng dụng LuTrip có trên nền tảng nào?",
      answer:
        "Ứng dụng LuTrip có trên: 1) Google Play Store (Android), 2) Apple App Store (iOS). Tải miễn phí và cập nhật thường xuyên với tính năng mới."
    },
    {
      id: "technical-2",
      category: "technical",
      question: "Website không tải được, phải làm sao?",
      answer:
        "Thử: 1) Làm mới trang (F5), 2) Xóa cache trình duyệt, 3) Thử trình duyệt khác, 4) Kiểm tra kết nối internet, 5) Tắt VPN nếu đang dùng. Nếu vẫn không được, liên hệ hỗ trợ."
    },
    {
      id: "booking-4",
      category: "booking",
      question: "Tôi có thể thay đổi thông tin đặt chỗ không?",
      answer:
        "Có thể thay đổi tùy dịch vụ. Vào 'Đặt chỗ của tôi', chọn đặt chỗ cần sửa, click 'Thay đổi'. Một số thay đổi có thể mất phí theo chính sách nhà cung cấp."
    },
    {
      id: "booking-5",
      category: "booking",
      question: "Làm thế nào để hủy đặt chỗ?",
      answer:
        "Hủy đặt chỗ: 1) Đăng nhập tài khoản, 2) Vào 'Đặt chỗ của tôi', 3) Chọn đặt chỗ cần hủy, 4) Click 'Hủy đặt chỗ', 5) Xác nhận. Hoàn tiền theo chính sách từng dịch vụ."
    },
    {
      id: "payment-4",
      category: "payment",
      question: "Khi nào tôi nhận được hóa đơn?",
      answer:
        "Hóa đơn điện tử được gửi ngay sau thanh toán thành công qua email. Bạn cũng có thể tải hóa đơn từ trang 'Đặt chỗ của tôi' bất cứ lúc nào."
    },
    {
      id: "payment-5",
      category: "payment",
      question: "Thanh toán không thành công, phải làm sao?",
      answer:
        "Kiểm tra: 1) Thông tin thẻ chính xác, 2) Đủ hạn mức, 3) Kết nối internet ổn định. Thử lại hoặc dùng phương thức khác. Liên hệ ngân hàng nếu cần."
    },
    {
      id: "account-3",
      category: "account",
      question: "Làm thế nào để cập nhật thông tin cá nhân?",
      answer:
        "Đăng nhập tài khoản, vào 'Hồ sơ' > 'Chỉnh sửa thông tin', cập nhật các trường cần thiết và lưu thay đổi. Một số thông tin cần xác minh."
    },
    {
      id: "account-4",
      category: "account",
      question: "Tôi có thể xóa tài khoản không?",
      answer:
        "Có, liên hệ bộ phận hỗ trợ để yêu cầu xóa tài khoản. Chúng tôi sẽ xử lý trong vòng 7-10 ngày làm việc sau khi xác minh danh tính."
    },
    {
      id: "technical-3",
      category: "technical",
      question: "Tại sao tôi không nhận được email xác nhận?",
      answer:
        "Kiểm tra: 1) Thư mục Spam/Junk, 2) Đúng địa chỉ email, 3) Cài đặt bộ lọc email. Nếu không có, liên hệ hỗ trợ để gửi lại."
    },
    {
      id: "technical-4",
      category: "technical",
      question: "Ứng dụng bị crash, phải làm sao?",
      answer:
        "Thử: 1) Đóng và mở lại ứng dụng, 2) Khởi động lại điện thoại, 3) Cập nhật phiên bản mới nhất, 4) Gỡ và cài lại ứng dụng. Báo cáo nếu tiếp tục crash."
    },
    {
      id: "booking-6",
      category: "booking",
      question: "Tôi có thể đặt cho người khác không?",
      answer:
        "Có, khi đặt chỗ bạn có thể điền thông tin của người khác. Người nhận sẽ được gửi email xác nhận và hướng dẫn sử dụng dịch vụ."
    },
    {
      id: "booking-7",
      category: "booking",
      question: "Đặt chỗ cho nhóm lớn có ưu đãi không?",
      answer:
        "Có, liên hệ bộ phận kinh doanh cho đặt chỗ nhóm (từ 10 người). Có thể nhận ưu đãi giá tốt hơn và dịch vụ đặc biệt."
    },
    {
      id: "payment-6",
      category: "payment",
      question: "Tôi có thể yêu cầu hoàn tiền không?",
      answer:
        "Hoàn tiền theo chính sách từng dịch vụ. Liên hệ hỗ trợ để được hướng dẫn thủ tục hoàn tiền. Thời gian xử lý thường 7-30 ngày."
    },
    {
      id: "technical-5",
      category: "technical",
      question: "Làm thế nào để đánh giá dịch vụ?",
      answer:
        "Sau khi sử dụng dịch vụ, bạn sẽ nhận được email mời đánh giá. Hoặc vào 'Đặt chỗ của tôi' > 'Đánh giá' để chia sẻ trải nghiệm."
    },
    {
      id: "technical-6",
      category: "technical",
      question: "Tôi gặp lỗi khi đăng nhập?",
      answer:
        "Thử: 1) Kiểm tra email/mật khẩu, 2) Đặt lại mật khẩu, 3) Xóa cache trình duyệt, 4) Thử thiết bị khác. Liên hệ hỗ trợ nếu cần."
    },
    {
      id: "booking-8",
      category: "booking",
      question: "Tôi có thể đặt chỗ cho trẻ em không?",
      answer:
        "Có, trẻ em được tính giá riêng (thường 50-75% giá người lớn). Cần cung cấp ngày sinh chính xác để tính giá phù hợp."
    }
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trung Tâm Trợ Giúp
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Tìm câu trả lời cho mọi câu hỏi về LuTrip. Nếu không tìm thấy, đội
              ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ.
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar - Categories */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Danh mục
                </h2>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedCategory === category.id
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{category.name}</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                          {category.count}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Contact Support */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Cần hỗ trợ thêm?
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Phone className="w-4 h-4" />
                      <span>1900 XXX XXX</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-800">
                      <Mail className="w-4 h-4" />
                      <span>support@lutrip.vn</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-800">
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat trực tuyến</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Content */}
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {filteredFaqs.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                    <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Không tìm thấy kết quả
                    </h3>
                    <p className="text-gray-600">
                      Thử tìm kiếm với từ khóa khác hoặc liên hệ bộ phận hỗ trợ.
                    </p>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="bg-white rounded-lg shadow-sm border"
                    >
                      <button
                        onClick={() => toggleSection(faq.id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="text-lg font-medium text-gray-900 pr-4">
                          {faq.question}
                        </h3>
                        {openSections.includes(faq.id) ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>

                      {openSections.includes(faq.id) && (
                        <div className="px-6 pb-4 border-t border-gray-100">
                          <p className="text-gray-700 leading-relaxed pt-4">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Contact CTA */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white text-center mt-8">
                <h3 className="text-2xl font-bold mb-4">Vẫn cần hỗ trợ?</h3>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                  Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7.
                  Liên hệ ngay để được giải đáp nhanh nhất.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/contact"
                    className="bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Liên hệ hỗ trợ
                  </a>
                  <a
                    href="tel:1900XXXXXX"
                    className="border-2 border-white text-white font-semibold py-3 px-6 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Gọi ngay: 1900 XXX XXX
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
