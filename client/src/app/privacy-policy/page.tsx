"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("");

  const sections = [
    { id: "introduction", title: "Giới thiệu" },
    { id: "information-collect", title: "Thông tin chúng tôi thu thập" },
    { id: "how-we-use", title: "Cách chúng tôi sử dụng thông tin" },
    { id: "information-sharing", title: "Chia sẻ thông tin" },
    { id: "data-security", title: "Bảo mật dữ liệu" },
    { id: "user-rights", title: "Quyền của người dùng" },
    { id: "cookies", title: "Cookies và công nghệ theo dõi" },
    { id: "third-party", title: "Dịch vụ bên thứ ba" },
    { id: "children-privacy", title: "Quyền riêng tư của trẻ em" },
    { id: "changes", title: "Thay đổi chính sách" },
    { id: "contact", title: "Liên hệ với chúng tôi" }
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
              Chính Sách Quyền Riêng Tư
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              LuTrip cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn.
              Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo
              vệ thông tin của bạn.
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
                {/* Giới thiệu */}
                <section id="introduction">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    1. Giới thiệu
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Chào mừng bạn đến với LuTrip! Chúng tôi cam kết bảo vệ
                      quyền riêng tư và thông tin cá nhân của bạn. Chính sách
                      quyền riêng tư này mô tả cách chúng tôi thu thập, sử dụng,
                      chia sẻ và bảo vệ thông tin của bạn khi bạn sử dụng dịch
                      vụ của chúng tôi.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Bằng việc sử dụng ứng dụng và website LuTrip, bạn đồng ý
                      với các thực hành được mô tả trong chính sách này. Nếu bạn
                      không đồng ý với chính sách này, vui lòng không sử dụng
                      dịch vụ của chúng tôi.
                    </p>
                  </div>
                </section>

                {/* Thông tin chúng tôi thu thập */}
                <section id="information-collect">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    2. Thông tin chúng tôi thu thập
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Thông tin bạn cung cấp trực tiếp:
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                      <li>
                        Thông tin đăng ký tài khoản (tên, email, số điện thoại)
                      </li>
                      <li>
                        Thông tin thanh toán (thông tin thẻ tín dụng, tài khoản
                        ngân hàng)
                      </li>
                      <li>
                        Thông tin đặt chỗ (điểm đến, ngày đi, số lượng người)
                      </li>
                      <li>Phản hồi và đánh giá dịch vụ</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Thông tin chúng tôi thu thập tự động:
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                      <li>Địa chỉ IP và thông tin thiết bị</li>
                      <li>Dữ liệu sử dụng ứng dụng và website</li>
                      <li>Cookies và công nghệ theo dõi tương tự</li>
                      <li>Vị trí địa lý (với sự cho phép của bạn)</li>
                    </ul>
                  </div>
                </section>

                {/* Cách chúng tôi sử dụng thông tin */}
                <section id="how-we-use">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    3. Cách chúng tôi sử dụng thông tin
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Chúng tôi sử dụng thông tin của bạn để:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>Cung cấp và cải thiện dịch vụ đặt chỗ du lịch</li>
                      <li>Xử lý thanh toán và xác nhận đặt chỗ</li>
                      <li>Gửi thông tin quan trọng về đặt chỗ của bạn</li>
                      <li>Cá nhân hóa trải nghiệm sử dụng</li>
                      <li>Gửi thông tin marketing (với sự đồng ý của bạn)</li>
                      <li>Phân tích và cải thiện hiệu suất dịch vụ</li>
                      <li>Tuân thủ các yêu cầu pháp lý</li>
                    </ul>
                  </div>
                </section>

                {/* Chia sẻ thông tin */}
                <section id="information-sharing">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    4. Chia sẻ thông tin
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Chúng tôi có thể chia sẻ thông tin của bạn trong các
                      trường hợp sau:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>
                        Với các đối tác cung cấp dịch vụ (khách sạn, hãng hàng
                        không, công ty du lịch)
                      </li>
                      <li>Với nhà cung cấp thanh toán để xử lý giao dịch</li>
                      <li>Khi được yêu cầu bởi pháp luật hoặc lệnh tòa án</li>
                      <li>
                        Để bảo vệ quyền lợi và an toàn của chúng tôi và người
                        dùng khác
                      </li>
                      <li>Với sự đồng ý rõ ràng của bạn</li>
                    </ul>
                  </div>
                </section>

                {/* Bảo mật dữ liệu */}
                <section id="data-security">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    5. Bảo mật dữ liệu
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ
                      chức phù hợp để bảo vệ thông tin cá nhân của bạn:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>
                        Mã hóa dữ liệu trong quá trình truyền tải và lưu trữ
                      </li>
                      <li>Kiểm soát truy cập nghiêm ngặt vào hệ thống</li>
                      <li>Định kỳ kiểm tra và cập nhật hệ thống bảo mật</li>
                      <li>Đào tạo nhân viên về bảo mật thông tin</li>
                      <li>Sao lưu dữ liệu thường xuyên</li>
                    </ul>
                  </div>
                </section>

                {/* Quyền của người dùng */}
                <section id="user-rights">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    6. Quyền của người dùng
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Bạn có các quyền sau đối với thông tin cá nhân của mình:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>Quyền truy cập thông tin cá nhân của bạn</li>
                      <li>Quyền chỉnh sửa thông tin không chính xác</li>
                      <li>Quyền xóa thông tin cá nhân</li>
                      <li>Quyền hạn chế xử lý thông tin</li>
                      <li>Quyền phản đối việc xử lý thông tin</li>
                      <li>Quyền di chuyển dữ liệu</li>
                    </ul>
                  </div>
                </section>

                {/* Cookies và công nghệ theo dõi */}
                <section id="cookies">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    7. Cookies và công nghệ theo dõi
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Chúng tôi sử dụng cookies và công nghệ theo dõi tương tự
                      để cải thiện trải nghiệm của bạn:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>Cookies cần thiết cho hoạt động của website</li>
                      <li>
                        Cookies phân tích để hiểu cách bạn sử dụng dịch vụ
                      </li>
                      <li>Cookies marketing để hiển thị quảng cáo phù hợp</li>
                      <li>Cookies chức năng để ghi nhớ tùy chọn của bạn</li>
                    </ul>
                    <p className="text-gray-700 leading-relaxed mt-4">
                      Bạn có thể quản lý cài đặt cookies thông qua trình duyệt
                      của mình.
                    </p>
                  </div>
                </section>

                {/* Dịch vụ bên thứ ba */}
                <section id="third-party">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    8. Dịch vụ bên thứ ba
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Dịch vụ của chúng tôi có thể chứa liên kết đến các website
                      và dịch vụ của bên thứ ba. Chúng tôi không chịu trách
                      nhiệm về chính sách quyền riêng tư của các bên thứ ba này.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Khi bạn sử dụng các dịch vụ thanh toán hoặc đăng nhập qua
                      bên thứ ba, thông tin của bạn sẽ được chia sẻ theo chính
                      sách của họ.
                    </p>
                  </div>
                </section>

                {/* Quyền riêng tư của trẻ em */}
                <section id="children-privacy">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    9. Quyền riêng tư của trẻ em
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Dịch vụ của chúng tôi không nhắm đến trẻ em dưới 13 tuổi.
                      Chúng tôi không cố ý thu thập thông tin cá nhân từ trẻ em
                      dưới 13 tuổi.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Nếu chúng tôi phát hiện đã thu thập thông tin từ trẻ em
                      dưới 13 tuổi, chúng tôi sẽ xóa thông tin đó ngay lập tức.
                    </p>
                  </div>
                </section>

                {/* Thay đổi chính sách */}
                <section id="changes">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    10. Thay đổi chính sách
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Chúng tôi có thể cập nhật chính sách quyền riêng tư này
                      theo thời gian. Khi có thay đổi quan trọng, chúng tôi sẽ
                      thông báo cho bạn qua email hoặc thông báo trong ứng dụng.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng
                      nghĩa với việc bạn chấp nhận chính sách mới.
                    </p>
                  </div>
                </section>

                {/* Liên hệ với chúng tôi */}
                <section id="contact">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    11. Liên hệ với chúng tôi
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Nếu bạn có bất kỳ câu hỏi nào về chính sách quyền riêng tư
                      này, vui lòng liên hệ với chúng tôi:
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
