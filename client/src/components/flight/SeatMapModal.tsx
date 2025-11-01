"use client";

import { Armchair, X, Plane } from "lucide-react";

interface SeatMapModalProps {
  show: boolean;
  onClose: () => void;
  flight: any;
  selectedClass: string;
  selectedSeats: string[];
  onSeatSelect: (seat: string) => void;
  onConfirm: () => void;
  onClearSelection: () => void;
  getSeatPrice: (seat: string) => number;
  isSeatOccupied: (seat: string) => boolean;
  maxSeats: number;
}

export default function SeatMapModal({
  show,
  onClose,
  flight,
  selectedClass,
  selectedSeats,
  onSeatSelect,
  onConfirm,
  onClearSelection,
  getSeatPrice,
  isSeatOccupied,
  maxSeats
}: SeatMapModalProps) {
  if (!show) return null;

  const airline = flight?.airlineId?.name || "";
  const isVietnamOrBamboo =
    airline.toLowerCase().includes("vietnam") ||
    airline.toLowerCase().includes("bamboo");

  // Get the current class info to calculate available seats
  const getCurrentClassInfo = () => {
    if (!flight?.classes) return null;
    return flight.classes.find(
      (c: any) => c.className.toLowerCase() === selectedClass.toLowerCase()
    );
  };

  const currentClassInfo = getCurrentClassInfo();
  const totalSeatsForClass = currentClassInfo?.availableSeats || 0;

  // Seat configuration based on class and airline
  const getSeatConfiguration = () => {
    const classLower = selectedClass.toLowerCase();

    if (classLower === "business") {
      // Business class configuration
      const seatsPerRow = isVietnamOrBamboo ? 4 : 6; // 1-2-1 = 4 seats, 3-3 = 6 seats
      const calculatedRows = Math.ceil(totalSeatsForClass / seatsPerRow);

      if (isVietnamOrBamboo) {
        // Vietnam Airlines & Bamboo: 3 columns (1-2-1)
        return {
          rows: calculatedRows,
          columns: [["A"], ["D", "E"], ["K"]],
          layout: "1-2-1",
          startRow: 1,
          seatsPerRow: 4
        };
      } else {
        // Other airlines: 2 columns × 3 seats each (3-3)
        return {
          rows: calculatedRows,
          columns: [
            ["A", "C", "D"],
            ["H", "J", "K"]
          ],
          layout: "3-3",
          startRow: 1,
          seatsPerRow: 6
        };
      }
    } else if (classLower === "premium economy" || classLower === "premium") {
      // Premium Economy: 6 seats per row (3-3)
      const seatsPerRow = 6;
      const calculatedRows = Math.ceil(totalSeatsForClass / seatsPerRow);
      const businessRows =
        flight?.classes?.find(
          (c: any) => c.className.toLowerCase() === "business"
        )?.availableSeats || 0;
      const businessRowCount = isVietnamOrBamboo
        ? Math.ceil(businessRows / 4)
        : Math.ceil(businessRows / 6);

      return {
        rows: calculatedRows,
        columns: [
          ["A", "B", "C"],
          ["D", "E", "F"]
        ],
        layout: "3-3",
        startRow: businessRowCount + 1,
        seatsPerRow: 6
      };
    } else {
      // Economy: 6 seats per row (3-3)
      const seatsPerRow = 6;
      const calculatedRows = Math.ceil(totalSeatsForClass / seatsPerRow);

      // Calculate start row based on previous classes
      let startRow = 1;
      if (flight?.classes) {
        const businessClass = flight.classes.find(
          (c: any) => c.className.toLowerCase() === "business"
        );
        const premiumClass = flight.classes.find(
          (c: any) =>
            c.className.toLowerCase() === "premium economy" ||
            c.className.toLowerCase() === "premium"
        );

        if (businessClass) {
          const businessSeatsPerRow = isVietnamOrBamboo ? 4 : 6;
          startRow += Math.ceil(
            businessClass.availableSeats / businessSeatsPerRow
          );
        }
        if (premiumClass) {
          startRow += Math.ceil(premiumClass.availableSeats / 6);
        }
      }

      return {
        rows: calculatedRows,
        columns: [
          ["A", "B", "C"],
          ["D", "E", "F"]
        ],
        layout: "3-3",
        startRow: startRow,
        seatsPerRow: 6
      };
    }
  };

  const config = getSeatConfiguration();
  const emergencyExitRows = [1, 12, 13];

  const totalPrice = selectedSeats.reduce(
    (total, seat) => total + getSeatPrice(seat),
    0
  );

  const renderSeatButton = (seatCode: string, rowNum: number) => {
    const isSelected = selectedSeats.includes(seatCode);
    const isOccupied = isSeatOccupied(seatCode);
    const price = getSeatPrice(seatCode);
    const isEmergencyExit = emergencyExitRows.includes(rowNum);
    const isFrontRow = rowNum <= 5;
    const isBusiness = selectedClass.toLowerCase() === "business";

    return (
      <button
        key={seatCode}
        onClick={() => !isOccupied && onSeatSelect(seatCode)}
        disabled={isOccupied}
        className={`
          ${isBusiness ? "w-14 h-14" : "w-10 h-10"} 
          rounded-lg text-xs font-semibold border-2 transition-all relative group
          ${
            isSelected
              ? "bg-sky-500 border-sky-600 text-white scale-110 shadow-lg"
              : isOccupied
              ? "bg-red-100 border-red-300 text-red-400 cursor-not-allowed"
              : isEmergencyExit
              ? "bg-green-100 border-green-400 hover:bg-green-200 hover:scale-105"
              : isFrontRow || isBusiness
              ? "bg-yellow-100 border-yellow-400 hover:bg-yellow-200 hover:scale-105"
              : "bg-gray-100 border-gray-300 hover:bg-gray-200 hover:scale-105"
          }
        `}
        title={`${seatCode} - ${price.toLocaleString("vi-VN")} đ`}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <Armchair
            className={`${isBusiness ? "w-6 h-6" : "w-4 h-4"} ${
              isSelected
                ? "text-white"
                : isOccupied
                ? "text-red-400"
                : "text-gray-600"
            }`}
          />
          <span className={`${isBusiness ? "text-xs" : "text-[10px]"} mt-0.5`}>
            {isSelected ? "✓" : isOccupied ? "×" : seatCode.slice(-1)}
          </span>
        </div>

        {/* Tooltip */}
        {!isOccupied && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
            <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              {seatCode}: {price.toLocaleString("vi-VN")} đ
            </div>
          </div>
        )}
      </button>
    );
  };

  const renderSeatRow = (rowNum: number) => {
    const isEmergencyExit = emergencyExitRows.includes(rowNum);
    const isBusiness = selectedClass.toLowerCase() === "business";

    return (
      <div key={rowNum}>
        {/* Emergency exit label */}
        {isEmergencyExit && (
          <div className="text-xs text-green-700 font-semibold mb-1 text-center bg-green-50 py-1 rounded flex items-center justify-center gap-1">
            <Plane className="w-3 h-3" />
            LỐI THOÁT KHẨN CẤP
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          {/* Row number */}
          <div className="w-8 text-center text-sm font-semibold text-gray-600">
            {rowNum}
          </div>

          {/* Left column(s) */}
          <div className="flex gap-1">
            {config.columns[0].map((letter) => {
              const seatCode = `${rowNum}${letter}`;
              return renderSeatButton(seatCode, rowNum);
            })}
          </div>

          {/* Aisle */}
          <div
            className={`${
              isBusiness ? "w-12" : "w-8"
            } border-l-2 border-r-2 border-dashed border-gray-300 ${
              isBusiness ? "h-14" : "h-10"
            } flex items-center justify-center`}
          >
            <div className="text-gray-400 text-xs">|</div>
          </div>

          {/* Middle column (if exists) */}
          {config.columns.length === 3 && (
            <>
              <div className="flex gap-1">
                {config.columns[1].map((letter) => {
                  const seatCode = `${rowNum}${letter}`;
                  return renderSeatButton(seatCode, rowNum);
                })}
              </div>
              <div
                className={`${
                  isBusiness ? "w-12" : "w-8"
                } border-l-2 border-r-2 border-dashed border-gray-300 ${
                  isBusiness ? "h-14" : "h-10"
                } flex items-center justify-center`}
              >
                <div className="text-gray-400 text-xs">|</div>
              </div>
            </>
          )}

          {/* Right column */}
          <div className="flex gap-1">
            {config.columns[config.columns.length === 3 ? 2 : 1].map(
              (letter) => {
                const seatCode = `${rowNum}${letter}`;
                return renderSeatButton(seatCode, rowNum);
              }
            )}
          </div>

          {/* Row number */}
          <div className="w-8 text-center text-sm font-semibold text-gray-600">
            {rowNum}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <Armchair className="w-6 h-6" />
                Chọn chỗ ngồi
              </h3>
              <p className="text-sky-100 text-sm">
                {flight?.aircraft?.model || "Airbus A321"} •{" "}
                {flight?.flightCode} •{" "}
                <span className="font-semibold">
                  {selectedClass === "business"
                    ? "Thương gia"
                    : selectedClass === "premium economy" ||
                      selectedClass === "premium"
                    ? "Phổ thông đặc biệt"
                    : "Phổ thông"}
                </span>
                {totalSeatsForClass > 0 && (
                  <span className="ml-2">• Tổng {totalSeatsForClass} ghế</span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div>
              Đã chọn: <span className="font-bold">{selectedSeats.length}</span>{" "}
              / {maxSeats} ghế
            </div>
            <div className="font-bold">
              Tổng: {totalPrice.toLocaleString("vi-VN")} đ
            </div>
          </div>
        </div>

        {/* Modal Body - Seat Map */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Legend */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                <Armchair className="w-4 h-4 text-gray-600" />
              </div>
              <span>Trống</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-500 rounded border border-sky-600 text-white flex items-center justify-center">
                <Armchair className="w-4 h-4" />
              </div>
              <span>Đã chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded border border-red-300 flex items-center justify-center">
                <Armchair className="w-4 h-4 text-red-400" />
              </div>
              <span>Đã đặt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded border border-green-400 flex items-center justify-center">
                <Armchair className="w-4 h-4 text-green-600" />
              </div>
              <span>Lối thoát</span>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-900 space-y-1">
              <div className="font-semibold mb-2 flex items-center gap-1">
                <Armchair className="w-4 h-4" />
                Bảng giá ghế:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  • Lối thoát (hàng 1, 12, 13): <strong>300,000 đ</strong>
                </div>
                <div>
                  • Hàng đầu (1-5): <strong>200,000 đ</strong>
                </div>
                <div>
                  • Cửa sổ (A, F, K): <strong>150,000 đ</strong>
                </div>
                <div>
                  • Lối đi (C, D, H, J): <strong>120,000 đ</strong>
                </div>
                <div>
                  • Giữa (B, E): <strong>100,000 đ</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Airplane Front */}
          <div className="text-center mb-4">
            <div className="inline-flex bg-gray-300 rounded-t-full px-8 py-2 text-sm font-semibold text-gray-700 items-center gap-2">
              <Plane className="w-4 h-4" />
              Đầu máy bay
            </div>
          </div>

          {/* Seat Grid */}
          <div className="space-y-2">
            {Array.from({ length: config.rows }, (_, index) => {
              const rowNum = config.startRow + index;
              return renderSeatRow(rowNum);
            })}
          </div>

          {/* Airplane Back */}
          <div className="text-center mt-4">
            <div className="inline-flex bg-gray-300 rounded-b-full px-8 py-2 text-sm font-semibold text-gray-700 items-center gap-2">
              <Plane className="w-4 h-4 rotate-180" />
              Đuôi máy bay
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedSeats.length > 0 ? (
                <span>
                  Ghế đã chọn:{" "}
                  <strong className="text-sky-600">
                    {selectedSeats.join(", ")}
                  </strong>
                </span>
              ) : (
                <span>Vui lòng chọn ghế ngồi</span>
              )}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={onClearSelection}
                className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Xóa chọn
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Armchair className="w-4 h-4" />
                Xác nhận ({totalPrice.toLocaleString("vi-VN")} đ)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
