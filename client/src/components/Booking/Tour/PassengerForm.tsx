"use client";

import { TourPassenger } from "../Common/validation";

interface TourPassengerFormProps {
  passengers: TourPassenger[];
  updatePassenger: (
    index: number,
    field: keyof TourPassenger,
    value: string
  ) => void;
}

export default function TourPassengerForm({
  passengers,
  updatePassenger
}: TourPassengerFormProps) {
  const getPassengerTypeLabel = (type: "adult" | "child" | "infant") => {
    switch (type) {
      case "adult":
        return "Người lớn";
      case "child":
        return "Trẻ em";
      case "infant":
        return "Em bé";
      default:
        return "";
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Thông tin hành khách
      </h3>

      <div className="space-y-6">
        {passengers.map((passenger, index) => {
          // Count passengers by type up to current index
          const passengersOfSameType = passengers
            .slice(0, index + 1)
            .filter((p) => p.type === passenger.type).length;

          const isContactPerson = index === 0;

          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {getPassengerTypeLabel(passenger.type)} {passengersOfSameType}
                </span>
                {isContactPerson && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Người liên hệ)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Full Name */}
                <div className="lg:col-span-1">
                  <label className="block font-semibold mb-1 text-gray-700">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                    value={passenger.fullName}
                    onChange={(e) =>
                      updatePassenger(index, "fullName", e.target.value)
                    }
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>

                {/* Gender */}
                <div className="lg:col-span-1">
                  <label className="block font-semibold mb-1 text-gray-700">
                    Giới tính *
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={passenger.gender}
                    onChange={(e) =>
                      updatePassenger(index, "gender", e.target.value)
                    }
                    required
                  >
                    <option value="" className="text-gray-400">
                      Chọn giới tính
                    </option>
                    <option value="Nam" className="text-gray-900">
                      Nam
                    </option>
                    <option value="Nữ" className="text-gray-900">
                      Nữ
                    </option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div className="lg:col-span-1">
                  <label className="block font-semibold mb-1 text-gray-700">
                    Ngày sinh *
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={passenger.dateOfBirth}
                    onChange={(e) =>
                      updatePassenger(index, "dateOfBirth", e.target.value)
                    }
                    required
                  />
                </div>

                {/* CCCD */}
                <div className="lg:col-span-1">
                  <label className="block font-semibold mb-1 text-gray-700">
                    CCCD/CMND
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                    value={passenger.cccd || ""}
                    onChange={(e) =>
                      updatePassenger(index, "cccd", e.target.value)
                    }
                    placeholder="Nhập số CCCD/CMND"
                  />
                </div>

                {/* Phone (only for contact person) */}
                {isContactPerson && (
                  <div className="lg:col-span-2">
                    <label className="block font-semibold mb-1 text-gray-700">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                      value={passenger.phone || ""}
                      onChange={(e) =>
                        updatePassenger(index, "phone", e.target.value)
                      }
                      placeholder="Nhập số điện thoại"
                      required
                    />
                  </div>
                )}

                {/* Email (only for contact person) */}
                {isContactPerson && (
                  <div className="lg:col-span-2">
                    <label className="block font-semibold mb-1 text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                      value={passenger.email || ""}
                      onChange={(e) =>
                        updatePassenger(index, "email", e.target.value)
                      }
                      placeholder="Nhập email"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
