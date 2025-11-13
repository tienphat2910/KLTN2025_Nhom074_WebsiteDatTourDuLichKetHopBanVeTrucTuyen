"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  CheckCircle,
  CreditCard,
  MapPin,
  Phone,
  Search,
  User
} from "lucide-react";

export default function HowToBook() {
  const [activeSection, setActiveSection] = useState("");

  const sections = [
    { id: "overview", title: "Tổng quan quy trình" },
    { id: "account", title: "Tạo tài khoản" },
    { id: "search", title: "Tìm kiếm dịch vụ" },
    { id: "select", title: "Chọn và đặt chỗ" },
    { id: "payment", title: "Thanh toán" },
    { id: "confirmation", title: "Xác nhận đặt chỗ" },
    { id: "modify", title: "Thay đổi/Cancel" },
    { id: "support", title: "Hỗ trợ khách hàng" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map((section) => ({
        id: section.id,
        element: document.getElementById(section.id)
      }));

      const currentSection = sectionElements.find(({ element }) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cách Đặt Chỗ Trên LuTrip
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Hướng dẫn chi tiết từng bước để đặt chỗ dịch vụ du lịch trên
              LuTrip một cách dễ dàng và nhanh chóng.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Cập nhật lần cuối: 14 tháng 11, 2025
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Table of Contents */}
            <div className="lg:w-1/4">
              <div className="sticky top-24 bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Mục lục
                </h2>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        activeSection === section.id
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              <div className="bg-white rounded-lg shadow-sm border p-6 md:p-8 space-y-8">
                {/* Tổng quan quy trình */}
                <section id="overview">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    1. Tổng quan quy trình đặt chỗ
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Đặt chỗ trên LuTrip rất đơn giản với chỉ 6 bước cơ bản.
                      Toàn bộ quy trình có thể hoàn thành trong vòng 5-10 phút.
                    </p>

                    {/* Process Steps */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                          <User className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          1. Tạo tài khoản
                        </h3>
                        <p className="text-sm text-gray-600">
                          Đăng ký tài khoản LuTrip
                        </p>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                          <Search className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          2. Tìm kiếm
                        </h3>
                        <p className="text-sm text-gray-600">
                          Tìm dịch vụ phù hợp
                        </p>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          3. Chọn dịch vụ
                        </h3>
                        <p className="text-sm text-gray-600">
                          Chọn và tùy chỉnh
                        </p>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          4. Thanh toán
                        </h3>
                        <p className="text-sm text-gray-600">
                          Thanh toán an toàn
                        </p>
                      </div>

                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          5. Xác nhận
                        </h3>
                        <p className="text-sm text-gray-600">Nhận voucher</p>
                      </div>

                      <div className="bg-indigo-50 p-4 rounded-lg text-center">
                        <div className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                          <Phone className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          6. Hỗ trợ
                        </h3>
                        <p className="text-sm text-gray-600">Liên hệ khi cần</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Tạo tài khoản */}
                <section id="account">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    2. Tạo tài khoản
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <div className="bg-blue-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">
                        Bước 1: Đăng ký tài khoản
                      </h3>
                      <ol className="list-decimal list-inside text-blue-800 space-y-2">
                        <li>Truy cập website hoặc ứng dụng LuTrip</li>
                        <li>Click "Đăng ký" ở góc trên bên phải</li>
                        <li>Điền thông tin: Họ tên, email, số điện thoại</li>
                        <li>Tạo mật khẩu mạnh (tối thiểu 8 ký tự)</li>
                        <li>Xác nhận email để kích hoạt tài khoản</li>
                      </ol>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        💡 Mẹo:
                      </h4>
                      <p className="text-green-700 text-sm">
                        Tài khoản LuTrip cho phép bạn theo dõi đặt chỗ, nhận ưu
                        đãi và tích điểm thưởng.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Tìm kiếm dịch vụ */}
                <section id="search">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    3. Tìm kiếm dịch vụ
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <div className="bg-green-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-3">
                        Bước 2: Tìm kiếm dịch vụ phù hợp
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">
                            Vé máy bay:
                          </h4>
                          <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                            <li>Chọn điểm đi và điểm đến</li>
                            <li>Chọn ngày đi và ngày về</li>
                            <li>Chọn số lượng hành khách</li>
                            <li>Lọc theo hãng hàng không, giá</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">
                            Khách sạn:
                          </h4>
                          <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                            <li>Nhập địa điểm lưu trú</li>
                            <li>Chọn ngày check-in/out</li>
                            <li>Chọn số phòng và khách</li>
                            <li>Lọc theo giá, tiện nghi</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Chọn và đặt chỗ */}
                <section id="select">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    4. Chọn và đặt chỗ
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <div className="bg-purple-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-purple-900 mb-3">
                        Bước 3: Chọn dịch vụ và tùy chỉnh
                      </h3>
                      <ul className="list-disc list-inside text-purple-800 space-y-2">
                        <li>So sánh giá và tiện nghi của các lựa chọn</li>
                        <li>Đọc kỹ mô tả và điều kiện dịch vụ</li>
                        <li>Chọn hạng phòng, loại vé phù hợp</li>
                        <li>Kiểm tra chính sách hủy và thay đổi</li>
                        <li>Thêm dịch vụ bổ sung nếu cần</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">
                        ⚠️ Lưu ý quan trọng:
                      </h4>
                      <p className="text-yellow-700 text-sm">
                        LuTrip chỉ là nền tảng kết nối. Vui lòng đọc kỹ điều
                        kiện của nhà cung cấp dịch vụ.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Thanh toán */}
                <section id="payment">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    5. Thanh toán
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <div className="bg-orange-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-orange-900 mb-3">
                        Bước 4: Thanh toán an toàn
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-orange-800 mb-2">
                            Phương thức thanh toán:
                          </h4>
                          <ul className="list-disc list-inside text-orange-700 text-sm space-y-1">
                            <li>Thẻ tín dụng/ghi nợ (Visa, Mastercard)</li>
                            <li>Ví điện tử (MoMo, ZaloPay)</li>
                            <li>Chuyển khoản ngân hàng</li>
                            <li>Thanh toán khi nhận phòng/vé</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-orange-800 mb-2">
                            Bảo mật:
                          </h4>
                          <ul className="list-disc list-inside text-orange-700 text-sm space-y-1">
                            <li>Mã hóa SSL 256-bit</li>
                            <li>Tuân thủ PCI DSS</li>
                            <li>Không lưu thông tin thẻ</li>
                            <li>Xác thực 3D Secure</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Xác nhận đặt chỗ */}
                <section id="confirmation">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    6. Xác nhận đặt chỗ
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <div className="bg-red-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-red-900 mb-3">
                        Bước 5: Nhận xác nhận
                      </h3>
                      <ul className="list-disc list-inside text-red-800 space-y-2">
                        <li>Email xác nhận với mã đặt chỗ</li>
                        <li>SMS thông tin chi tiết</li>
                        <li>Voucher điện tử trong tài khoản</li>
                        <li>Hướng dẫn sử dụng dịch vụ</li>
                        <li>Thông tin liên hệ hỗ trợ</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        ✅ Hoàn thành!
                      </h4>
                      <p className="text-green-700 text-sm">
                        Đặt chỗ thành công! Bạn sẽ nhận được tất cả thông tin
                        cần thiết qua email và SMS.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Thay đổi/Cancel */}
                <section id="modify">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    7. Thay đổi hoặc hủy đặt chỗ
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <div className="bg-indigo-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-indigo-900 mb-3">
                        Cách thay đổi/hủy đặt chỗ:
                      </h3>
                      <ol className="list-decimal list-inside text-indigo-800 space-y-2">
                        <li>Đăng nhập vào tài khoản LuTrip</li>
                        <li>Vào phần "Đặt chỗ của tôi"</li>
                        <li>Chọn đặt chỗ cần thay đổi</li>
                        <li>Click "Thay đổi" hoặc "Hủy"</li>
                        <li>Làm theo hướng dẫn trên màn hình</li>
                      </ol>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">
                        ⚠️ Lưu ý:
                      </h4>
                      <p className="text-yellow-700 text-sm">
                        Chính sách hủy phụ thuộc vào từng dịch vụ. Một số dịch
                        vụ không được hoàn tiền.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Hỗ trợ khách hàng */}
                <section id="support">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    8. Hỗ trợ khách hàng
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Nếu bạn gặp vấn đề trong quá trình đặt chỗ, hãy liên hệ
                      với chúng tôi:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          📞 Hotline:
                        </h4>
                        <p className="text-blue-800">1900 XXX XXX (24/7)</p>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">
                          💬 Chat trực tuyến:
                        </h4>
                        <p className="text-green-800">Website và ứng dụng</p>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900 mb-2">
                          📧 Email:
                        </h4>
                        <p className="text-purple-800">support@lutrip.vn</p>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-orange-900 mb-2">
                          📱 Zalo OA:
                        </h4>
                        <p className="text-orange-800">@LuTrip</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Thời gian hỗ trợ:
                      </h4>
                      <p className="text-gray-700 text-sm">
                        • Hotline: 24/7
                        <br />
                        • Chat: 8:00 - 22:00 hàng ngày
                        <br />• Email: Trả lời trong 24 giờ
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
