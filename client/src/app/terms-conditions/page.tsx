"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsConditions() {
  const [activeSection, setActiveSection] = useState("");

  const sections = [
    { id: "acceptance", title: "Chấp nhận điều khoản" },
    { id: "description", title: "Mô tả dịch vụ" },
    { id: "user-accounts", title: "Tài khoản người dùng" },
    { id: "booking-payments", title: "Đặt chỗ và thanh toán" },
    { id: "cancellation", title: "Hủy và thay đổi" },
    { id: "user-conduct", title: "Hành vi người dùng" },
    { id: "intellectual-property", title: "Quyền sở hữu trí tuệ" },
    { id: "liability", title: "Giới hạn trách nhiệm" },
    { id: "indemnification", title: "Bồi thường" },
    { id: "termination", title: "Chấm dứt dịch vụ" },
    { id: "governing-law", title: "Luật áp dụng" },
    { id: "contact", title: "Liên hệ" }
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
    handleScroll(); // Check initial position

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
              Điều Khoản & Điều Kiện
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Các điều khoản và điều kiện sử dụng dịch vụ LuTrip. Vui lòng đọc
              kỹ trước khi sử dụng dịch vụ của chúng tôi.
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
                {/* Chấp nhận điều khoản */}
                <section id="acceptance">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    1. Chấp nhận điều khoản
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Bằng việc truy cập và sử dụng dịch vụ LuTrip, bạn đồng ý
                      tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện
                      được nêu trong tài liệu này. Nếu bạn không đồng ý với bất
                      kỳ điều khoản nào, vui lòng không sử dụng dịch vụ của
                      chúng tôi.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Các điều khoản này áp dụng cho tất cả người dùng, bao gồm
                      nhưng không giới hạn ở khách du lịch, đối tác kinh doanh
                      và khách hàng doanh nghiệp.
                    </p>
                  </div>
                </section>

                {/* Mô tả dịch vụ */}
                <section id="description">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    2. Mô tả dịch vụ
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      LuTrip là nền tảng đặt chỗ du lịch trực tuyến cung cấp các
                      dịch vụ sau:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>Đặt chỗ vé máy bay nội địa và quốc tế</li>
                      <li>Đặt phòng khách sạn và resort</li>
                      <li>Tour du lịch trọn gói</li>
                      <li>Hoạt động vui chơi và giải trí</li>
                      <li>Dịch vụ vận chuyển và đưa đón</li>
                    </ul>
                  </div>
                </section>

                {/* Tài khoản người dùng */}
                <section id="user-accounts">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    3. Tài khoản người dùng
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Đăng ký tài khoản:
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                      <li>Bạn phải cung cấp thông tin chính xác và đầy đủ</li>
                      <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập</li>
                      <li>Một người chỉ được tạo một tài khoản</li>
                      <li>Tuổi tối thiểu để sử dụng dịch vụ là 18 tuổi</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Trách nhiệm của bạn:
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>Cập nhật thông tin cá nhân khi có thay đổi</li>
                      <li>
                        Thông báo ngay cho chúng tôi nếu phát hiện việc sử dụng
                        trái phép
                      </li>
                      <li>Không chia sẻ thông tin đăng nhập với người khác</li>
                    </ul>
                  </div>
                </section>

                {/* Đặt chỗ và thanh toán */}
                <section id="booking-payments">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    4. Đặt chỗ và thanh toán
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Quy trình đặt chỗ:
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                      <li>Đặt chỗ trực tuyến qua website hoặc ứng dụng</li>
                      <li>Xác nhận đặt chỗ qua email và SMS</li>
                      <li>Thanh toán trực tuyến hoặc tại quầy</li>
                      <li>Nhận voucher điện tử hoặc vé giấy</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Chính sách thanh toán:
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>
                        Chấp nhận thanh toán bằng thẻ tín dụng, chuyển khoản
                      </li>
                      <li>Đảm bảo an toàn và bảo mật giao dịch</li>
                      <li>Hoàn tiền theo chính sách của từng dịch vụ</li>
                      <li>Phí giao dịch được thông báo rõ ràng</li>
                    </ul>
                  </div>
                </section>

                {/* Hủy và thay đổi */}
                <section id="cancellation">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    5. Hủy và thay đổi
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Chính sách hủy và thay đổi phụ thuộc vào từng loại dịch vụ
                      và nhà cung cấp. Thông tin chi tiết sẽ được hiển thị tại
                      trang đặt chỗ.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-blue-800 mb-2">
                        Lưu ý quan trọng:
                      </h4>
                      <ul className="text-blue-700 space-y-1">
                        <li>
                          • Vé máy bay thường không được hoàn tiền sau khi xuất
                          vé
                        </li>
                        <li>
                          • Khách sạn có thể tính phí hủy tùy theo chính sách
                        </li>
                        <li>• Tour du lịch có điều kiện hủy riêng biệt</li>
                        <li>• Thay đổi tên người sử dụng có thể bị hạn chế</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Hành vi người dùng */}
                <section id="user-conduct">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    6. Hành vi người dùng
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Bạn cam kết không thực hiện các hành vi sau khi sử dụng
                      dịch vụ LuTrip:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>Vi phạm pháp luật hoặc quy định của Việt Nam</li>
                      <li>Cung cấp thông tin sai lệch hoặc lừa đảo</li>
                      <li>Lạm dụng hệ thống đặt chỗ</li>
                      <li>Phát tán virus hoặc mã độc</li>
                      <li>Spam hoặc gửi thông tin không mong muốn</li>
                      <li>Vi phạm quyền sở hữu trí tuệ</li>
                      <li>Gây thiệt hại cho uy tín của LuTrip</li>
                    </ul>
                  </div>
                </section>

                {/* Quyền sở hữu trí tuệ */}
                <section id="intellectual-property">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    7. Quyền sở hữu trí tuệ
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Tất cả nội dung trên LuTrip bao gồm nhưng không giới hạn
                      ở:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>Logo, thương hiệu và tên thương mại</li>
                      <li>Nội dung văn bản, hình ảnh, video</li>
                      <li>Phần mềm và mã nguồn</li>
                      <li>Cơ sở dữ liệu và công nghệ</li>
                    </ul>
                    <p className="text-gray-700 leading-relaxed mt-4">
                      Tất cả các quyền này đều thuộc về LuTrip hoặc các bên được
                      cấp phép. Bạn không được sao chép, phân phối hoặc sử dụng
                      mà không có sự cho phép bằng văn bản.
                    </p>
                  </div>
                </section>

                {/* Giới hạn trách nhiệm */}
                <section id="liability">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    8. Giới hạn trách nhiệm
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      LuTrip cung cấp dịch vụ "như hiện tại" và "theo tình trạng
                      có sẵn". Chúng tôi không đảm bảo:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>Dịch vụ sẽ luôn khả dụng, không gián đoạn</li>
                      <li>Thông tin trên website luôn chính xác, đầy đủ</li>
                      <li>Dịch vụ đáp ứng hoàn toàn nhu cầu của bạn</li>
                      <li>Không có virus hoặc thành phần có hại</li>
                    </ul>
                    <p className="text-gray-700 leading-relaxed mt-4">
                      Chúng tôi không chịu trách nhiệm về thiệt hại gián tiếp,
                      đặc biệt hoặc do hậu quả phát sinh từ việc sử dụng dịch vụ
                      của chúng tôi.
                    </p>
                  </div>
                </section>

                {/* Bồi thường */}
                <section id="indemnification">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    9. Bồi thường
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      Bạn đồng ý bồi thường và giữ cho LuTrip, các công ty liên
                      kết và nhân viên không bị thiệt hại từ bất kỳ khiếu nại,
                      yêu cầu, mất mát, chi phí hoặc thiệt hại nào phát sinh từ
                      việc vi phạm các điều khoản này hoặc vi phạm pháp luật.
                    </p>
                  </div>
                </section>

                {/* Chấm dứt dịch vụ */}
                <section id="termination">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    10. Chấm dứt dịch vụ
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Chúng tôi có quyền tạm ngừng hoặc chấm dứt tài khoản của
                      bạn bất cứ lúc nào nếu bạn vi phạm các điều khoản này.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Sau khi chấm dứt, bạn vẫn chịu trách nhiệm về các giao
                      dịch đã thực hiện trước thời điểm chấm dứt.
                    </p>
                  </div>
                </section>

                {/* Luật áp dụng */}
                <section id="governing-law">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    11. Luật áp dụng
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam.
                      Mọi tranh chấp phát sinh sẽ được giải quyết tại tòa án có
                      thẩm quyền tại Việt Nam.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Chúng tôi cam kết tuân thủ tất cả các quy định pháp luật
                      về bảo vệ người tiêu dùng và quyền lợi của khách hàng.
                    </p>
                  </div>
                </section>

                {/* Liên hệ */}
                <section id="contact">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    12. Liên hệ
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Nếu bạn có bất kỳ câu hỏi nào về các điều khoản này, vui
                      lòng liên hệ với chúng tôi:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">
                        <strong>Email:</strong> tienphat29102003@gmail.com
                        <br />
                        <strong>Điện thoại:</strong> 0376 549 230
                        <br />
                        <strong>Địa chỉ:</strong> 12 Nguyễn Văn Bảo, phường Hạnh
                        Thông, Thành phố Hồ Chí Minh
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
