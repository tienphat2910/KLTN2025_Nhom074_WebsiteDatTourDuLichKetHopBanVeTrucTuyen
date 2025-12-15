"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Users,
  Award,
  Heart,
  Target,
  Globe,
  Star,
  CheckCircle,
  TrendingUp
} from "lucide-react";

export default function About() {
  const [activeSection, setActiveSection] = useState("");

  const sections = useMemo(() => [
    { id: "story", title: "Câu chuyện của chúng tôi" },
    { id: "mission", title: "Sứ mệnh & Tầm nhìn" },
    { id: "values", title: "Giá trị cốt lõi" },
    { id: "team", title: "Đội ngũ" },
    { id: "achievements", title: "Thành tựu" },
    { id: "partners", title: "Đối tác" },
    { id: "future", title: "Tương lai" }
  ], []);

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
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const stats = [
    { number: "500K+", label: "Khách hàng hài lòng", icon: Users },
    { number: "10K+", label: "Đặt chỗ thành công", icon: CheckCircle },
    { number: "50+", label: "Đối tác chiến lược", icon: Award },
    { number: "4.8/5", label: "Đánh giá trung bình", icon: Star }
  ];

  const values = [
    {
      icon: Heart,
      title: "Khách hàng là trung tâm",
      description:
        "Mọi quyết định của chúng tôi đều xuất phát từ việc đặt lợi ích khách hàng lên hàng đầu."
    },
    {
      icon: Target,
      title: "Đổi mới liên tục",
      description:
        "Chúng tôi không ngừng cải tiến công nghệ và dịch vụ để mang đến trải nghiệm tốt nhất."
    },
    {
      icon: Users,
      title: "Đội ngũ gắn kết",
      description:
        "Xây dựng môi trường làm việc thân thiện, hỗ trợ nhau phát triển và cống hiến."
    },
    {
      icon: Globe,
      title: "Trách nhiệm xã hội",
      description:
        "Cam kết phát triển bền vững, bảo vệ môi trường và đóng góp cho cộng đồng."
    }
  ];

  const achievements = [
    {
      year: "2020",
      title: "Ra mắt nền tảng LuTrip",
      description:
        "Khởi đầu với dịch vụ đặt vé máy bay và khách sạn tại Việt Nam"
    },
    {
      year: "2021",
      title: "Mở rộng sang Đông Nam Á",
      description:
        "Hợp tác với 20+ hãng hàng không và 1000+ khách sạn trong khu vực"
    },
    {
      year: "2022",
      title: "Ra mắt ứng dụng mobile",
      description:
        "Trên 100,000 lượt tải, đạt 4.7 sao trên App Store & Google Play"
    },
    {
      year: "2023",
      title: "Đạt 500,000 khách hàng",
      description: "Mở rộng sang tour du lịch trọn gói và hoạt động vui chơi"
    },
    {
      year: "2024",
      title: "Đầu tư công nghệ AI",
      description:
        "Tích hợp trí tuệ nhân tạo để cá nhân hóa trải nghiệm khách hàng"
    },
    {
      year: "2025",
      title: "Mở rộng toàn cầu",
      description: "Hợp tác với đối tác quốc tế, hướng tới thị trường châu Á"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-10">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Về LuTrip</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 leading-relaxed">
              Đồng hành cùng bạn khám phá vẻ đẹp Việt Nam và Đông Nam Á
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-lg">
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
                🚀 Đổi mới
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
                ❤️ Khách hàng
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
                🌍 Bền vững
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
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
              <div className="bg-white rounded-lg shadow-sm border p-6 md:p-8 space-y-12">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <stat.icon className="w-8 h-8" />
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                        {stat.number}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Câu chuyện của chúng tôi */}
                <section id="story">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Câu chuyện của chúng tôi
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed text-lg mb-6">
                      LuTrip được thành lập với sứ mệnh đơn giản nhưng đầy tham
                      vọng:
                      <strong>
                        {" "}
                        &quot;Khiến việc du lịch trở nên dễ dàng và đáng nhớ hơn cho
                        mọi người&quot;
                      </strong>
                    </p>

                    <p className="text-gray-700 leading-relaxed mb-6">
                      Bắt đầu từ năm 2020, khi đại dịch COVID-19 khiến ngành du
                      lịch toàn cầu lao đao, chúng tôi nhận ra rằng công nghệ có
                      thể thay đổi cách mọi người trải nghiệm du lịch. Thay vì
                      chỉ là một nền tảng đặt chỗ, chúng tôi muốn tạo ra một
                      cộng đồng những người yêu du lịch, nơi mọi người có thể
                      chia sẻ, khám phá và tạo nên những kỷ niệm đáng nhớ.
                    </p>

                    <div className="bg-blue-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">
                        Tại sao chọn tên &quot;LuTrip&quot;?
                      </h3>
                      <p className="text-blue-800">
                        &quot;Lu&quot; trong tiếng Việt có nghĩa là &quot;lữ&quot; - đi du lịch,
                        đồng thời cũng là tên của một trong những thành viên
                        sáng lập. &quot;Trip&quot; đại diện cho hành trình. LuTrip = Lữ +
                        Trip = Hành trình du lịch. Một cái tên đơn giản nhưng
                        chứa đựng cả tâm huyết của chúng tôi.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Sứ mệnh & Tầm nhìn */}
                <section id="mission">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Sứ mệnh & Tầm nhìn
                  </h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                      <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <Target className="w-6 h-6" />
                        Sứ mệnh
                      </h3>
                      <p className="text-blue-800 leading-relaxed">
                        LuTrip cam kết cung cấp nền tảng du lịch toàn diện, đáng
                        tin cậy và dễ sử dụng, giúp mọi người khám phá thế giới
                        một cách thuận tiện và tiết kiệm nhất. Chúng tôi không
                        chỉ bán dịch vụ, mà còn tạo nên những trải nghiệm đáng
                        nhớ.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                      <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                        <Globe className="w-6 h-6" />
                        Tầm nhìn
                      </h3>
                      <p className="text-purple-800 leading-relaxed">
                        Trở thành nền tảng du lịch hàng đầu Đông Nam Á, nơi mọi
                        người có thể dễ dàng lên kế hoạch và trải nghiệm những
                        chuyến đi tuyệt vời. Chúng tôi hướng tới việc kết nối 1
                        triệu khách hàng với hàng nghìn điểm đến vào năm 2030.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Giá trị cốt lõi */}
                <section id="values">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Giá trị cốt lõi
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {values.map((value, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                          <value.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          {value.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {value.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Đội ngũ */}
                <section id="team">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Đội ngũ của chúng tôi
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-6">
                      LuTrip được xây dựng bởi một đội ngũ trẻ trung, đam mê và
                      giàu kinh nghiệm. Chúng tôi có hơn 50 thành viên đến từ
                      các lĩnh vực khác nhau: công nghệ, marketing, dịch vụ
                      khách hàng và quản lý sản phẩm.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-white text-2xl font-bold">
                            L
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">LuTeam</h4>
                        <p className="text-sm text-gray-600">Founder & CEO</p>
                      </div>

                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-white text-2xl font-bold">
                            T
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">
                          Tech Team
                        </h4>
                        <p className="text-sm text-gray-600">Engineering</p>
                      </div>

                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-white text-2xl font-bold">
                            C
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">
                          Care Team
                        </h4>
                        <p className="text-sm text-gray-600">
                          Customer Service
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Văn hóa làm việc
                      </h3>
                      <ul className="text-gray-700 space-y-2">
                        <li>
                          • <strong>Đổi mới:</strong> Khuyến khích thử nghiệm và
                          sáng tạo
                        </li>
                        <li>
                          • <strong>Học hỏi:</strong> Đầu tư vào phát triển cá
                          nhân
                        </li>
                        <li>
                          • <strong>Hợp tác:</strong> Làm việc nhóm hiệu quả
                        </li>
                        <li>
                          • <strong>Trách nhiệm:</strong> Cam kết với mục tiêu
                          chung
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Thành tựu */}
                <section id="achievements">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Hành trình phát triển
                  </h2>
                  <div className="space-y-6">
                    {achievements.map((achievement, index) => (
                      <div key={index} className="flex gap-6">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                            {achievement.year}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {achievement.title}
                          </h3>
                          <p className="text-gray-600">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Đối tác */}
                <section id="partners">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Đối tác chiến lược
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-6">
                      LuTrip tự hào hợp tác với các đối tác hàng đầu trong ngành
                      du lịch để mang đến dịch vụ tốt nhất cho khách hàng.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div className="bg-white border border-gray-200 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                        <div className="text-2xl mb-2">✈️</div>
                        <div className="font-semibold text-gray-900">
                          Vietnam Airlines
                        </div>
                        <div className="text-sm text-gray-600">
                          Hãng hàng không
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                        <div className="text-2xl mb-2">🏨</div>
                        <div className="font-semibold text-gray-900">
                          Vinpearl
                        </div>
                        <div className="text-sm text-gray-600">
                          Khách sạn & Resort
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                        <div className="text-2xl mb-2">🚗</div>
                        <div className="font-semibold text-gray-900">
                          Sapa Tourist
                        </div>
                        <div className="text-sm text-gray-600">Vận chuyển</div>
                      </div>

                      <div className="bg-white border border-gray-200 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                        <div className="text-2xl mb-2">💳</div>
                        <div className="font-semibold text-gray-900">MoMo</div>
                        <div className="text-sm text-gray-600">Thanh toán</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Tương lai */}
                <section id="future">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Tương lai của LuTrip
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-6">
                      LuTrip đang không ngừng phát triển để trở thành người bạn
                      đồng hành hoàn hảo cho mọi chuyến đi của bạn.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Công nghệ tiên tiến
                        </h3>
                        <ul className="text-green-800 space-y-1">
                          <li>• AI cá nhân hóa trải nghiệm</li>
                          <li>• Ứng dụng thực tế ảo</li>
                          <li>• Chatbot thông minh 24/7</li>
                          <li>• Dự đoán nhu cầu khách hàng</li>
                        </ul>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          Mở rộng toàn cầu
                        </h3>
                        <ul className="text-orange-800 space-y-1">
                          <li>• Thị trường Đông Nam Á</li>
                          <li>• Hợp tác quốc tế</li>
                          <li>• Đa ngôn ngữ</li>
                          <li>• Tiền tệ đa dạng</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-lg mt-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">
                        Cam kết của chúng tôi
                      </h3>
                      <p className="text-blue-800 leading-relaxed">
                        LuTrip cam kết sẽ luôn đổi mới, cải thiện và phát triển
                        để mang đến những trải nghiệm du lịch tốt nhất cho khách
                        hàng. Chúng tôi tin rằng du lịch không chỉ là việc di
                        chuyển, mà còn là cơ hội để kết nối, học hỏi và tạo nên
                        những kỷ niệm đáng nhớ.
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
