import { useState, useRef, useEffect } from "react";
import { Flight } from "@/services/flightService";

interface Props {
  flights: Flight[];
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
  flights,
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
    }
    if (showPassengerPopup || showClassPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPassengerPopup, showClassPopup]);

  // Hạng vé popup options
  const seatClassOptions = [
    { value: "economy", label: "Phổ thông" },
    { value: "premium_economy", label: "Phổ thông đặc biệt" },
    { value: "business", label: "Thương gia" }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl px-6 py-8">
      {/* Loại chuyến và Bay thẳng */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-2">
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
        {/* Hạng vé - popup đẹp */}
        <div
          className="relative flex items-center rounded-xl border border-gray-300 px-4 py-3 min-w-[170px] h-[52px] bg-white flex-1 cursor-pointer"
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
        {/* Số người - popup kiểu hình mẫu */}
        <div
          className="relative flex items-center rounded-xl border border-gray-300 px-4 py-3 min-w-[180px] h-[52px] bg-white flex-1 cursor-pointer"
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
        className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-4"
        style={{ fontFamily: "inherit" }}
      >
        {/* Từ */}
        <div className="flex items-center rounded-xl border border-gray-300 px-4 py-3 min-w-[180px] h-[52px] bg-white flex-1">
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
          <select
            className="bg-transparent outline-none w-full text-base"
            style={{ color: "#1976d2" }}
            value={selectedDeparture}
            onChange={(e) => setSelectedDeparture(e.target.value)}
          >
            <option value="" style={{ color: "#90caf9" }}>
              TP HCM (SGN)
            </option>
            {Array.from(
              new Set(flights.map((f) => f.departureAirport.code))
            ).map((code) => (
              <option key={code} value={code} style={{ color: "#1976d2" }}>
                {
                  flights.find((f) => f.departureAirport.code === code)
                    ?.departureAirport.city
                }
              </option>
            ))}
          </select>
        </div>
        {/* Đến */}
        <div className="flex items-center rounded-xl border border-gray-300 px-4 py-3 min-w-[180px] h-[52px] bg-white flex-1">
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
          <select
            className="bg-transparent outline-none w-full text-base"
            style={{ color: "#1976d2" }}
            value={selectedArrival}
            onChange={(e) => setSelectedArrival(e.target.value)}
          >
            <option value="" style={{ color: "#90caf9" }}>
              Bangkok (BKKA)
            </option>
            {Array.from(new Set(flights.map((f) => f.arrivalAirport.code))).map(
              (code) => (
                <option key={code} value={code} style={{ color: "#1976d2" }}>
                  {
                    flights.find((f) => f.arrivalAirport.code === code)
                      ?.arrivalAirport.city
                  }
                </option>
              )
            )}
          </select>
        </div>
        {/* Ngày khởi hành */}
        <div className="flex items-center rounded-xl border border-gray-300 px-4 py-3 min-w-[150px] h-[52px] bg-white flex-1">
          <span className="mr-2 flex items-center text-sky-600">
            {/* Chỉ 1 icon lịch, căn giữa */}
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
              <path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <input
            type="date"
            className="
            bg-transparent outline-none w-full text-base 
            placeholder:text-blue-200
            appearance-none 
            [&::-webkit-calendar-picker-indicator]:opacity-0 
            [&::-webkit-calendar-picker-indicator]:absolute 
            [&::-webkit-calendar-picker-indicator]:w-full 
            [&::-webkit-calendar-picker-indicator]:h-full 
            [&::-webkit-calendar-picker-indicator]:cursor-pointer
        "
            style={{ color: "#1976d2" }}
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            // Thêm placeholder để hiển thị nn/mm/yyyy khi value rỗng
            placeholder="nn/mm/yyyy"
          />
        </div>

        {/* Ngày về (nếu khứ hồi) */}
        <div
          className={`flex items-center rounded-xl border border-gray-300 px-4 py-3 min-w-[150px] h-[52px] bg-white flex-1 ${
            !isRoundTrip ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {/* Thêm icon lịch cho Ngày về để đồng bộ style */}
          <span className="mr-2 flex items-center text-sky-600">
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
              <path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <input
            type="date"
            className="
            bg-transparent outline-none w-full text-base 
            placeholder:text-blue-200 
            appearance-none 
            [&::-webkit-calendar-picker-indicator]:opacity-0 
            [&::-webkit-calendar-picker-indicator]:absolute 
            [&::-webkit-calendar-picker-indicator]:w-full 
            [&::-webkit-calendar-picker-indicator]:h-full 
            [&::-webkit-calendar-picker-indicator]:cursor-pointer
        "
            style={{ color: "#1976d2" }}
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            disabled={!isRoundTrip}
            // Thêm placeholder để hiển thị nn/mm/yyyy khi value rỗng
            placeholder="nn/mm/yyyy"
          />
        </div>

        {/* Nút tìm kiếm */}
        <button
          type="submit"
          className="flex items-center justify-center bg-gradient-to-r from-sky-500 to-blue-600 hover:from-blue-600 hover:to-sky-500 rounded-full px-8 h-12 transition-all shadow-lg text-white font-bold text-lg"
          style={{ minWidth: 180 }}
        >
          Tìm chuyến bay
        </button>
      </form>
    </div>
  );
}
