import { useState, useRef, useEffect } from "react";
import { Flight } from "@/services/flightService";
import { airportService, Airport } from "@/services/airportService";
import { addDays, format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface Props {
  isRoundTrip: boolean;
  setIsRoundTrip: (v: boolean) => void;
  selectedDeparture: string;
  setSelectedDeparture: (v: string) => void;
  selectedArrival: string;
  setSelectedArrival: (v: string) => void;
  departureDate: string;
  setDepartureDate: (v: string) => void;
  returnDate: string;
  setReturnDate: (v: string) => void;
  passengerCount: number;
  setPassengerCount: (v: number) => void;
  seatClass: string;
  setSeatClass: (v: string) => void;
  handleSearch: (e: React.FormEvent) => void;
}

export default function FlightSearchForm({
  isRoundTrip,
  setIsRoundTrip,
  selectedDeparture,
  setSelectedDeparture,
  selectedArrival,
  setSelectedArrival,
  departureDate,
  setDepartureDate,
  returnDate,
  setReturnDate,
  passengerCount,
  setPassengerCount,
  seatClass,
  setSeatClass,
  handleSearch
}: Props) {
  const [directOnly, setDirectOnly] = useState(false);

  // Popup chọn số lượng hành khách
  const [showPassengerPopup, setShowPassengerPopup] = useState(false);
  const [adult, setAdult] = useState(1);
  const [child, setChild] = useState(0);
  const [infant, setInfant] = useState(0);
  const passengerPopupRef = useRef<HTMLDivElement>(null);

  // Popup chọn hạng vé
  const [showClassPopup, setShowClassPopup] = useState(false);
  const classPopupRef = useRef<HTMLDivElement>(null);
  const [seatClassLabel, setSeatClassLabel] = useState("Phổ thông");

  // State để track responsive
  const [isMobile, setIsMobile] = useState(false);

  // Popup chọn ngày
  const [showDepartureDatePicker, setShowDepartureDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const departureDatePickerRef = useRef<HTMLDivElement>(null);
  const returnDatePickerRef = useRef<HTMLDivElement>(null);

  // Detect mobile screen
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Đóng popup khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        passengerPopupRef.current &&
        !passengerPopupRef.current.contains(event.target as Node)
      ) {
        setShowPassengerPopup(false);
      }
      if (
        classPopupRef.current &&
        !classPopupRef.current.contains(event.target as Node)
      ) {
        setShowClassPopup(false);
      }
      // Đóng dropdown sân bay khi click ngoài
      if (
        (event.target as HTMLElement)?.closest(".airport-dropdown") === null
      ) {
        setShowDepartureDropdown(false);
        setShowArrivalDropdown(false);
      }
      if (
        departureDatePickerRef.current &&
        !departureDatePickerRef.current.contains(event.target as Node)
      ) {
        setShowDepartureDatePicker(false);
      }
      if (
        returnDatePickerRef.current &&
        !returnDatePickerRef.current.contains(event.target as Node)
      ) {
        setShowReturnDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Hạng vé popup options
  const seatClassOptions = [
    { value: "economy", label: "Phổ thông" },
    { value: "premium_economy", label: "Phổ thông đặc biệt" },
    { value: "business", label: "Thương gia" }
  ];

  // State cho sân bay
  const [airportOptions, setAirportOptions] = useState<Airport[]>([]);
  const [airportLoading, setAirportLoading] = useState(false);

  // Tìm kiếm sân bay
  const [departureSearch, setDepartureSearch] = useState("");
  const [arrivalSearch, setArrivalSearch] = useState("");
  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false);
  const [showArrivalDropdown, setShowArrivalDropdown] = useState(false);

  // Sử dụng API search khi nhập từ khóa
  useEffect(() => {
    if (departureSearch.trim()) {
      setAirportLoading(true);
      airportService
        .searchAirports(departureSearch.trim())
        .then((data) => setAirportOptions(Array.isArray(data) ? data : []))
        .catch(() => setAirportOptions([]))
        .finally(() => setAirportLoading(false));
    } else {
      setAirportOptions([]);
    }
  }, [departureSearch]);

  useEffect(() => {
    if (arrivalSearch.trim()) {
      setAirportLoading(true);
      airportService
        .searchAirports(arrivalSearch.trim())
        .then((data) => setAirportOptions(Array.isArray(data) ? data : []))
        .catch(() => setAirportOptions([]))
        .finally(() => setAirportLoading(false));
    } else {
      setAirportOptions([]);
    }
  }, [arrivalSearch]);

  // Đặt ngày mặc định là hôm nay nếu chưa có giá trị
  useEffect(() => {
    if (!departureDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setDepartureDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [departureDate, setDepartureDate]);

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl px-2 py-4 md:px-6 md:py-8">
      {/* Loại chuyến và Bay thẳng */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-6 gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            className={`px-6 py-2 rounded-full font-semibold text-base shadow transition-all ${
              !isRoundTrip
                ? "bg-sky-600 text-white"
                : "bg-white text-sky-600 border border-sky-600"
            }`}
            onClick={() => setIsRoundTrip(false)}
          >
            Một chiều
          </button>
          <button
            type="button"
            className={`px-6 py-2 rounded-full font-semibold text-base shadow transition-all ${
              isRoundTrip
                ? "bg-sky-600 text-white"
                : "bg-white text-sky-600 border border-sky-600"
            }`}
            onClick={() => setIsRoundTrip(true)}
          >
            Khứ hồi
          </button>
        </div>
        {/* Hạng vé - popup đẹp, style giống số người */}
        <div
          className="relative flex items-center rounded-xl border border-gray-300 px-4 py-3 h-[52px] bg-white flex-1 cursor-pointer transition-shadow hover:shadow-md w-full md:w-[170px]"
          style={{ fontWeight: 500, fontSize: 16 }}
          onClick={() => setShowClassPopup(true)}
        >
          <span className="mr-2 flex items-center text-sky-600">
            {/* Icon ghế ngồi thay cho svg cũ */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 35 27"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="7"
                y="3"
                width="14"
                height="14"
                rx="4"
                stroke="#1976d2"
                strokeWidth="2"
              />
              <rect
                x="5"
                y="17"
                width="18"
                height="6"
                rx="3"
                stroke="#1976d2"
                strokeWidth="2"
              />
              <rect
                x="23"
                y="7"
                width="6"
                height="16"
                rx="3"
                stroke="#1976d2"
                strokeWidth="2"
              />
            </svg>
          </span>
          <span className="w-full text-base" style={{ color: "#1976d2" }}>
            {seatClassLabel}
          </span>
          {/* Popup chọn hạng vé */}
          {showClassPopup && (
            <div
              ref={classPopupRef}
              className="absolute z-50 top-[60px] left-0 w-[220px] bg-white rounded-2xl shadow-xl border border-gray-200 py-2"
            >
              {seatClassOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`w-full text-left px-5 py-3 text-base font-semibold rounded-xl transition-all
                    ${
                      seatClass === opt.value
                        ? "bg-[#e3f2fd] text-[#1976d2]"
                        : "text-gray-700 hover:bg-[#e3f2fd] hover:text-[#1976d2]"
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSeatClass(opt.value);
                    setSeatClassLabel(opt.label);
                    setShowClassPopup(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Số người - popup kiểu hình mẫu, style giống hạng vé */}
        <div
          className="relative flex items-center rounded-xl border border-gray-300 px-4 py-3 h-[52px] bg-white flex-1 cursor-pointer transition-shadow hover:shadow-md w-full md:w-[170px]"
          style={{ fontWeight: 500, fontSize: 16 }}
          onClick={() => setShowPassengerPopup(true)}
        >
          <span className="mr-2 flex items-center text-sky-600">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 12a4 4 0 100-8 4 4 0 000 8zM6 20v-2a4 4 0 018 0v2"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </span>
          <span className="w-full text-base" style={{ color: "#1976d2" }}>
            {adult} Người lớn, {child} Trẻ em, {infant} Em bé
          </span>
          {/* Popup */}
          {showPassengerPopup && (
            <div
              ref={passengerPopupRef}
              className="absolute z-50 top-[60px] left-0 w-[320px] bg-white rounded-2xl shadow-xl border border-gray-200 p-4"
            >
              {/* Người lớn */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M12 12a4 4 0 100-8 4 4 0 000 8zM6 20v-2a4 4 0 018 0v2"
                        stroke="#1976d2"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                  <span className="font-semibold text-[#1976d2]">
                    Người lớn
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-[#e3f2fd] text-[#1976d2] text-xl flex items-center justify-center"
                    disabled={adult <= 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdult((a) => Math.max(1, a - 1));
                    }}
                  >
                    –
                  </button>
                  <span className="w-6 text-center font-bold text-[#1976d2]">
                    {adult}
                  </span>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-[#e3f2fd] text-[#1976d2] text-xl flex items-center justify-center"
                    disabled={adult >= 9}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdult((a) => Math.min(9, a + 1));
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              {/* Trẻ em */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M8 12a4 4 0 108 0 4 4 0 00-8 0zM4 20v-2a4 4 0 018 0v2"
                        stroke="#1976d2"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                  <span className="font-semibold text-[#1976d2]">Trẻ em</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-[#e3f2fd] text-[#1976d2] text-xl flex items-center justify-center"
                    disabled={child <= 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setChild((c) => Math.max(0, c - 1));
                    }}
                  >
                    –
                  </button>
                  <span className="w-6 text-center font-bold text-[#1976d2]">
                    {child}
                  </span>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-[#e3f2fd] text-[#1976d2] text-xl flex items-center justify-center"
                    disabled={child >= 8}
                    onClick={(e) => {
                      e.stopPropagation();
                      setChild((c) => Math.min(8, c + 1));
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              {/* Em bé */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="8"
                        r="4"
                        stroke="#1976d2"
                        strokeWidth="2"
                      />
                      <path
                        d="M6 20v-2a4 4 0 018 0v2"
                        stroke="#1976d2"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                  <span className="font-semibold text-[#1976d2]">Em bé</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-[#e3f2fd] text-[#1976d2] text-xl flex items-center justify-center"
                    disabled={infant <= 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfant((i) => Math.max(0, i - 1));
                    }}
                  >
                    –
                  </button>
                  <span className="w-6 text-center font-bold text-[#1976d2]">
                    {infant}
                  </span>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-[#e3f2fd] text-[#1976d2] text-xl flex items-center justify-center"
                    disabled={infant >= 4}
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfant((i) => Math.min(4, i + 1));
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="bg-[#e3f2fd] text-[#1976d2] px-6 py-2 rounded-full font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPassengerPopup(false);
                    setPassengerCount(adult);
                  }}
                >
                  Xong
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Form search */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-4 items-center justify-center w-full"
        style={{ fontFamily: "inherit" }}
      >
        {/* Container tổng cho các input */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 w-full max-w-5xl bg-[#f5faff] rounded-2xl py-4 px-2 md:py-6 md:px-4 shadow">
          {/* Từ - search sân bay */}
          <div className="flex items-center rounded-xl border border-gray-300 px-3 py-2 md:px-4 md:py-3 w-full md:w-[220px] h-[48px] md:h-[52px] bg-white flex-shrink-0 relative mb-2 md:mb-0">
            <span className="mr-2 flex items-center text-sky-600">
              {/* Icon máy bay cất cánh mới */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 14H14"
                  stroke="#1976d2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8 6L10.1283 5.29057C11.5447 4.81845 13.1042 5.30562 14 6.5L4.96342 9.37528C3.91084 9.71019 2.78607 9.12841 2.45116 8.07583C2.44514 8.05693 2.43941 8.03794 2.43396 8.01887L2 6.5L3.5 7.25L6 6.5L3 2H3.5L8 6Z"
                  stroke="#1976d2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input
              type="text"
              className="bg-transparent outline-none w-full text-base"
              style={{ color: "#1976d2" }}
              value={departureSearch}
              onChange={(e) => {
                setDepartureSearch(e.target.value);
                setShowDepartureDropdown(true);
              }}
              onFocus={() => setShowDepartureDropdown(true)}
              onBlur={() => {
                /* bỏ setTimeout, dropdown sẽ đóng khi click ngoài qua useEffect */
              }}
              placeholder="Tìm sân bay đi..."
              autoComplete="off"
            />
            {showDepartureDropdown && departureSearch.trim() && (
              <div className="airport-dropdown absolute left-0 top-[110%] w-[380px] bg-white rounded-xl shadow-lg z-10 max-h-96 overflow-auto border border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b">
                  Kết quả tìm kiếm
                </div>
                {airportLoading ? (
                  <div className="px-4 py-2 text-gray-400">Đang tải...</div>
                ) : (
                  airportOptions.slice(0, 10).map((a) => (
                    <button
                      key={a._id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-[#e3f2fd] text-[#1976d2] flex flex-col gap-1"
                      onMouseDown={() => {
                        setSelectedDeparture(a.iata);
                        setDepartureSearch(`${a.city} (${a.iata})`);
                        setShowDepartureDropdown(false);
                      }}
                    >
                      <span className="font-semibold text-base">{a.name}</span>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-gray-500 min-w-[60px]">
                          {" "}
                          <span className="font-bold text-[#1976d2]">
                            {a.iata}
                          </span>
                        </span>
                        <span className="text-xs text-gray-400 min-w-[120px]">
                          {a.city}
                        </span>
                      </div>
                    </button>
                  ))
                )}
                {!airportLoading && airportOptions.length === 0 && (
                  <div className="px-4 py-2 text-gray-400">
                    Không tìm thấy sân bay
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Nút hoán đổi */}
          <button
            type="button"
            className="flex items-center justify-center bg-[#e3f2fd] hover:bg-[#bbdefb] rounded-full w-9 h-9 md:w-10 md:h-10 mx-0 md:mx-2 shadow transition-all border border-[#90caf9] flex-shrink-0 mb-2 md:mb-0"
            style={{ marginTop: 0 }}
            aria-label="Hoán đổi sân bay"
            onClick={() => {
              const tempIata = selectedDeparture;
              const tempText = departureSearch;
              setSelectedDeparture(selectedArrival);
              setDepartureSearch(arrivalSearch);
              setSelectedArrival(tempIata);
              setArrivalSearch(tempText);
            }}
          >
            {/* Mobile: icon bình thường */}
            <span className="md:hidden rotate-90">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="11"
                  fill="#e3f2fd"
                  stroke="#90caf9"
                  strokeWidth="1"
                />
                <path
                  d="M15 8l4 4-4 4"
                  stroke="#1976d2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 15l-4-4 4-4"
                  stroke="#1976d2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {/* Desktop: icon xoay 90 độ */}
            <span className="hidden md:inline-block transform">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="11"
                  fill="#e3f2fd"
                  stroke="#90caf9"
                  strokeWidth="1"
                />
                <path
                  d="M15 8l4 4-4 4"
                  stroke="#1976d2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 15l-4-4 4-4"
                  stroke="#1976d2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
          {/* Đến - search sân bay */}
          <div className="flex items-center rounded-xl border border-gray-300 px-3 py-2 md:px-4 md:py-3 w-full md:w-[220px] h-[48px] md:h-[52px] bg-white flex-shrink-0 relative mb-2 md:mb-0">
            <span className="mr-2 flex items-center text-sky-600">
              {/* Icon máy bay hạ cánh mới */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 14H14"
                  stroke="#1976d2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M14 10L4.75086 9.22924C3.19599 9.09967 2 7.79987 2 6.2396V5L3 7H6L5 2H5.4L8 7L11.5612 7.71225C12.469 7.89381 13.2422 8.48431 13.6562 9.31235L14 10ZM11 11.75L11.25 11.5L11.5 11.75L11.25 12L11 11.75Z"
                  stroke="#1976d2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input
              type="text"
              className="bg-transparent outline-none w-full text-base"
              style={{ color: "#1976d2" }}
              value={arrivalSearch}
              onChange={(e) => {
                setArrivalSearch(e.target.value);
                setShowArrivalDropdown(true);
              }}
              onFocus={() => setShowArrivalDropdown(true)}
              onBlur={() => {
                /* bỏ setTimeout, dropdown sẽ đóng khi click ngoài qua useEffect */
              }}
              placeholder="Tìm sân bay đến..."
              autoComplete="off"
            />
            {showArrivalDropdown && arrivalSearch.trim() && (
              <div className="airport-dropdown absolute left-0 top-[110%] w-[380px] bg-white rounded-xl shadow-lg z-10 max-h-96 overflow-auto border border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b">
                  Kết quả tìm kiếm
                </div>
                {airportLoading ? (
                  <div className="px-4 py-2 text-gray-400">Đang tải...</div>
                ) : (
                  airportOptions.slice(0, 10).map((a) => (
                    <button
                      key={a._id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-[#e3f2fd] text-[#1976d2] flex flex-col gap-1"
                      onMouseDown={() => {
                        setSelectedArrival(a.iata);
                        setArrivalSearch(`${a.city} (${a.iata})`);
                        setShowArrivalDropdown(false);
                      }}
                    >
                      <span className="font-semibold text-base">{a.name}</span>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-gray-500 min-w-[60px]">
                          {" "}
                          <span className="font-bold text-[#1976d2]">
                            {a.iata}
                          </span>
                        </span>
                        <span className="text-xs text-gray-400 min-w-[120px]">
                          {a.city}
                        </span>
                      </div>
                    </button>
                  ))
                )}
                {!airportLoading && airportOptions.length === 0 && (
                  <div className="px-4 py-2 text-gray-400">
                    Không tìm thấy sân bay
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Ngày khởi hành */}
          <div
            className="flex flex-col items-start justify-center rounded-xl border border-sky-200 bg-white px-3 py-2 md:px-4 md:py-2 w-full md:w-[180px] h-[48px] md:h-[52px] flex-shrink-0 relative cursor-pointer transition-shadow hover:shadow-lg mb-2 md:mb-0"
            onClick={() => setShowDepartureDatePicker(true)}
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center text-sky-600">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 3v4M8 3v4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <span
                className="text-base font-semibold"
                style={{ color: "#1976d2" }}
              >
                {departureDate
                  ? format(new Date(departureDate), "dd/MM/yyyy", {
                      locale: vi
                    })
                  : "Chọn ngày đi"}
              </span>
            </div>
            {showDepartureDatePicker && (
              <div
                ref={departureDatePickerRef}
                className="fixed md:absolute left-1/2 md:left-0 top-1/2 md:top-[110%] transform -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 z-[9999] bg-white rounded-2xl border-2 border-sky-400 shadow-2xl p-4 text-black max-w-[95vw] md:max-w-none overflow-auto max-h-[80vh]"
                style={{ width: "min(420px, 95vw)", background: "#fff" }}
              >
                <DayPicker
                  mode="single"
                  selected={departureDate ? new Date(departureDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setDepartureDate(format(date, "yyyy-MM-dd"));
                      setShowDepartureDatePicker(false);
                    }
                  }}
                  locale={vi}
                  numberOfMonths={isMobile ? 1 : 2}
                  fromDate={new Date()}
                  disabled={{ before: new Date() }}
                  modifiersClassNames={{
                    today: "bg-orange-500 text-white font-bold"
                  }}
                  modifiers={{ today: new Date() }}
                />
              </div>
            )}
          </div>
          {/* Ngày về (nếu khứ hồi) */}
          <div
            className={`flex flex-col items-start justify-center rounded-xl border border-sky-200 bg-white px-3 py-2 md:px-4 md:py-2 w-full md:w-[180px] h-[48px] md:h-[52px] flex-shrink-0 relative cursor-pointer transition-shadow hover:shadow-lg ml-0 md:ml-2 ${
              !isRoundTrip ? "opacity-50 pointer-events-none" : ""
            } mb-2 md:mb-0`}
            onClick={() => isRoundTrip && setShowReturnDatePicker(true)}
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center text-sky-600">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 3v4M8 3v4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <span
                className="text-base font-semibold"
                style={{ color: "#1976d2" }}
              >
                {returnDate
                  ? format(new Date(returnDate), "dd/MM/yyyy", { locale: vi })
                  : "Chọn ngày về"}
              </span>
            </div>
            {showReturnDatePicker && (
              <div
                ref={returnDatePickerRef}
                className="fixed md:absolute left-1/2 md:left-0 top-1/2 md:top-[90%] transform -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 z-[9999] bg-white rounded-2xl border-2 border-sky-400 shadow-2xl p-3 text-black max-w-[95vw] md:max-w-none overflow-auto max-h-[80vh]"
                style={{ width: "min(420px, 95vw)", background: "#fff" }}
              >
                <DayPicker
                  mode="single"
                  selected={returnDate ? new Date(returnDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setReturnDate(format(date, "yyyy-MM-dd"));
                      setShowReturnDatePicker(false);
                    }
                  }}
                  locale={vi}
                  numberOfMonths={isMobile ? 1 : 2}
                  fromDate={
                    departureDate
                      ? addDays(new Date(departureDate), 0)
                      : new Date()
                  }
                  disabled={{ before: new Date() }}
                  modifiersClassNames={{
                    today: "bg-orange-500 text-white font-bold"
                  }}
                  modifiers={{ today: new Date() }}
                />
              </div>
            )}
          </div>
        </div>
        {/* Nút tìm kiếm nằm hàng dưới */}
        <button
          type="submit"
          className="flex items-center justify-center bg-gradient-to-r from-sky-500 to-blue-600 hover:from-blue-600 hover:to-sky-500 rounded-full px-6 md:px-8 h-11 md:h-12 transition-all shadow-lg text-white font-bold text-base md:text-lg mt-2 w-full md:w-auto"
          style={{ minWidth: 0 }}
        >
          Tìm chuyến bay
        </button>
      </form>
    </div>
  );
}
