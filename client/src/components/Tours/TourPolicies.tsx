import { useState } from "react";

interface TourPoliciesProps {
  isVisible: boolean;
}

export default function TourPolicies({ isVisible }: TourPoliciesProps) {
  // Collapsible policy sections (default closed)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="container mx-auto px-4 pb-10">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
          Chính sách giá
        </h2>

        {/* Giá tour bao gồm */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection("include")}
            className="w-full flex items-center justify-between py-3 md:py-4"
          >
            <span className="text-base md:text-lg font-semibold text-gray-800">
              Giá tour bao gồm
            </span>
            <span className="text-gray-500">
              {openSections.include ? "−" : "+"}
            </span>
          </button>
          {openSections.include && (
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Vé máy bay khứ hồi.</li>
              <li>Chi phí xe máy lạnh theo chương trình.</li>
              <li>Chi phí khách sạn: 2-3 khách/phòng.</li>
              <li>Chi phí ăn - uống theo chương trình.</li>
              <li>Chi phí tham quan theo chương trình.</li>
              <li>Chi phí Hướng dẫn viên tiếng Việt.</li>
              <li>Quà tặng: Nón, nước suối, khăn lạnh.</li>
            </ul>
          )}
        </div>

        {/* Giá tour không bao gồm */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection("exclude")}
            className="w-full flex items-center justify-between py-3 md:py-4"
          >
            <span className="text-base md:text-lg font-semibold text-gray-800">
              Giá tour không bao gồm
            </span>
            <span className="text-gray-500">
              {openSections.exclude ? "−" : "+"}
            </span>
          </button>
          {openSections.exclude && (
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>
                Chi phí tham quan - ăn uống ngoài chương trình, giặt ủi, điện
                thoại và các chi phí cá nhân.
              </li>
            </ul>
          )}
        </div>

        {/* Giá trẻ em */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection("children")}
            className="w-full flex items-center justify-between py-3 md:py-4"
          >
            <span className="text-base md:text-lg font-semibold text-gray-800">
              Giá trẻ em
            </span>
            <span className="text-gray-500">
              {openSections.children ? "−" : "+"}
            </span>
          </button>
          {openSections.children && (
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Trẻ em dưới 2 tuổi: thu 400.000đ/trẻ. Gia đình tự lo cho bé ăn
                ngủ.
              </li>
              <li>
                Trẻ em từ 2 đến dưới 6 tuổi: tiêu chuẩn gồm vé máy bay. Gia đình
                tự lo cho bé ăn ngủ và phí tham quan (nếu có).
              </li>
              <li>
                Hai người lớn chỉ được kèm một trẻ em dưới 6 tuổi. Từ trẻ thứ 2
                trở lên, mỗi em phải đóng bằng giá trẻ em từ 6-11 tuổi.
              </li>
              <li>
                Trẻ em từ 6 - 11 tuổi: tiêu chuẩn gồm vé máy bay, ăn uống và
                tham quan theo chương trình, ngủ chung giường với phụ huynh.
              </li>
              <li>
                Trẻ em trên 11 tuổi: áp dụng giá và các tiêu chuẩn dịch vụ như
                người lớn.
              </li>
            </ul>
          )}
        </div>

        {/* Chính sách hủy / phạt */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection("cancellation")}
            className="w-full flex items-center justify-between py-3 md:py-4"
          >
            <span className="text-base md:text-lg font-semibold text-gray-800">
              Chính sách hủy / phạt
            </span>
            <span className="text-gray-500">
              {openSections.cancellation ? "−" : "+"}
            </span>
          </button>
          {openSections.cancellation && (
            <div className="space-y-3 text-gray-700">
              <div>
                <p className="font-medium mb-2">
                  Lưu ý về chuyển hoặc hủy tour
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Quy định vé máy bay: Chương trình hợp tác với hãng hàng
                    không Vietnam Airlines nên có một số lưu ý:
                  </li>
                  <li>
                    Giá vé máy bay không bao gồm suất ăn/uống trên máy bay
                  </li>
                  <li>
                    Không được hoàn hoặc hủy vé máy bay. Nếu hủy, vui lòng chịu
                    phạt 100% chi phí vé máy bay
                  </li>
                  <li>
                    Khi đăng ký vé máy bay, quý khách cung cấp họ và tên, ngày
                    tháng năm sinh (đúng từng ký tự ghi trong hộ chiếu hoặc
                    CMND/CCCD)
                  </li>
                  <li>
                    Không được thay đổi thông tin đặt chỗ: họ tên hành khách,
                    chuyến bay, ngày bay, chặng bay, tách đoàn, gia hạn vé
                  </li>
                  <li>
                    Số lượng khách tối thiểu để tổ chức tour: 10 khách/đoàn
                  </li>
                  <li>
                    Du khách được miễn cước 1 kiện (23 kg) hành lý ký gởi và 1
                    kiện (10 kg) hành lý xách tay
                  </li>
                  <li>
                    Trường hợp hủy tour do sự cố khách quan như thiên tai, dịch
                    bệnh hoặc do máy bay hoãn - hủy chuyến, Lutrip sẽ không chịu
                    trách nhiệm bồi thường thêm bất kỳ chi phí nào khác ngoài
                    việc hoàn trả chi phí những dịch vụ chưa được sử dụng của
                    tour đó (ngoại trừ chi phí vé máy bay)
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">
                  Trường hợp hủy vé landtour, quý khách vui lòng thanh toán các
                  khoản sau:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Chuyển đổi tour sang ngày khác và báo trước ngày khởi hành
                    trước 30 ngày (trừ thứ 7, chủ nhật, lễ, tết) sẽ không chịu
                    phí (không áp dụng tour KS 4-5 sao). Nếu trễ hơn sẽ căn cứ
                    theo quy định hủy phạt phía dưới và chỉ được chuyển ngày
                    khởi hành tour 1 lần.
                  </li>
                  <li>
                    Hủy vé trước ngày khởi hành từ 15 ngày trở lên (trừ thứ 7,
                    chủ nhật, lễ, tết), chịu phạt 50% tiền tour hoặc 100% tiền
                    cọc.
                  </li>
                  <li>
                    Hủy vé trước ngày khởi hành từ 8 - 14 ngày (trừ thứ 7, chủ
                    nhật, lễ, tết), chịu phạt 80% tiền tour hoặc 100% tiền cọc.
                  </li>
                  <li>
                    Hủy vé trong vòng 7 ngày hoặc ngay ngày khởi hành, chịu phạt
                    100% tiền tour.
                  </li>
                  <li>
                    Sau khi hủy tour, du khách vui lòng đến nhận tiền trong vòng
                    15 ngày kể từ ngày kết thúc tour. Chúng tôi chỉ thanh toán
                    trong khoảng thời gian nói trên.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Thông tin về bảo hiểm du lịch */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection("insurance")}
            className="w-full flex items-center justify-between py-3 md:py-4"
          >
            <span className="text-base md:text-lg font-semibold text-gray-800">
              Thông tin về bảo hiểm du lịch
            </span>
            <span className="text-gray-500">
              {openSections.insurance ? "−" : "+"}
            </span>
          </button>
          {openSections.insurance && (
            <div className="space-y-2 text-gray-700">
              <p>
                Công ty TNHH Một Thành Viên Dịch vụ Lữ hành Lutrip thực hiện
                chương trình TẶNG MIỄN PHÍ BẢO HIỂM DU LỊCH NỘI ĐỊA dành cho tất
                cả du khách tham gia tour trọn gói trên tất cả các tuyến du lịch
                nội địa, khởi hành trên toàn quốc, với mức bảo hiểm tối đa lên
                đến 150.000.000 VNĐ/khách/vụ.
              </p>
              <p>
                Toàn bộ phí bảo hiểm được tặng miễn phí cho khách hàng của
                Lutrip với chương trình, giá và chất lượng dịch vụ tour không
                đổi.
              </p>
              <p>
                Thông tin chi tiết, vui lòng liên hệ các văn phòng thuộc Hệ
                thống Lutrip trên toàn quốc.
              </p>
            </div>
          )}
        </div>

        {/* Thông tin khác */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection("others")}
            className="w-full flex items-center justify-between py-3 md:py-4"
          >
            <span className="text-base md:text-lg font-semibold text-gray-800">
              Thông tin khác
            </span>
            <span className="text-gray-500">
              {openSections.others ? "−" : "+"}
            </span>
          </button>
          {openSections.others && (
            <div className="space-y-3 text-gray-700">
              <p className="font-medium">Giấy tờ tùy thân</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Du khách mang theo giấy tờ tùy thân còn thời hạn sử dụng: CMND
                  / CCCD hoặc Hộ chiếu. Đối với du khách là Việt kiều, Quốc tế
                  nhập cảnh Việt Nam bằng visa rời, vui lòng mang theo visa khi
                  đăng ký và khi đi tour.
                </li>
                <li>
                  Khách lớn tuổi (từ 70 tuổi trở lên), khách tàn tật tham gia
                  tour, phải có thân nhân đi kèm và cam kết đảm bảo đủ sức khỏe.
                </li>
                <li>
                  Trẻ em dưới 14 tuổi khi đi tour phải mang theo giấy khai sinh
                  hoặc hộ chiếu. Trẻ em từ 14 tuổi trở lên phải mang theo
                  CMND/CCCD.
                </li>
                <li>Tất cả giấy tờ tùy thân mang theo đều phải bản chính.</li>
                <li>
                  Du khách mang theo hành lý gọn nhẹ và tự bảo quản hành lý,
                  tiền bạc, tư trang trong suốt thời gian đi du lịch.
                </li>
                <li>
                  Khách Việt Nam ở cùng phòng với khách Quốc tế hoặc Việt kiều
                  yêu cầu phải có giấy hôn thú.
                </li>
                <li>
                  Quý khách có mặt tại sân bay trước 2 tiếng so với giờ khởi
                  hành.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Liên hệ */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection("contact")}
            className="w-full flex items-center justify-between py-3 md:py-4"
          >
            <span className="text-base md:text-lg font-semibold text-gray-800">
              Liên hệ
            </span>
            <span className="text-gray-500">
              {openSections.contact ? "−" : "+"}
            </span>
          </button>
          {openSections.contact && (
            <div className="space-y-1 text-gray-700">
              <p>
                Công ty TNHH LuTrip - Địa chỉ: 12 Nguyễn Văn Bảo, phường Hạnh
                Thông, Thành phố Hồ Chí Minh{" "}
              </p>
              <p>Đường dây nóng: 0818220319 </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
