"use client";

import { FlightPassenger } from "../Common/validation";

interface FlightPassengerFormProps {
  passengers: FlightPassenger[];
  adults: number;
  children: number;
  infants: number;
  updatePassenger: (
    index: number,
    field: keyof FlightPassenger,
    value: string
  ) => void;
}

export default function FlightPassengerForm({
  passengers,
  adults,
  children,
  infants,
  updatePassenger
}: FlightPassengerFormProps) {
  const getPassengerLabel = (index: number) => {
    if (index < adults) {
      return `Người lớn ${index + 1}`;
    } else if (index < adults + children) {
      return `Trẻ em ${index - adults + 1}`;
    } else {
      return `Em bé ${index - adults - children + 1}`;
    }
  };

  const isAdult = (index: number) => index < adults;
  const isContactPerson = (index: number) => index === 0;

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Thông tin hành khách
      </h3>

      <div className="space-y-6">
        {passengers.map((passenger, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm font-medium">
                {getPassengerLabel(index)}
              </span>
              {isContactPerson(index) && (
                <span className="ml-2 text-xs text-gray-500">
                  (Người liên hệ)
                </span>
              )}
              {passenger.seatNumber && (
                <span className="ml-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  Ghế: {passenger.seatNumber}
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 placeholder-gray-400"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900"
                  value={passenger.dateOfBirth}
                  onChange={(e) =>
                    updatePassenger(index, "dateOfBirth", e.target.value)
                  }
                  required
                />
              </div>

              {/* Identity Number - Only for adults */}
              {isAdult(index) && (
                <div className="lg:col-span-1">
                  <label className="block font-semibold mb-1 text-gray-700">
                    CCCD/CMND *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 placeholder-gray-400"
                    value={passenger.identityNumber || ""}
                    onChange={(e) =>
                      updatePassenger(index, "identityNumber", e.target.value)
                    }
                    placeholder="Nhập số CCCD/CMND"
                    required
                  />
                </div>
              )}

              {/* Nationality */}
              <div className="lg:col-span-1">
                <label className="block font-semibold mb-1 text-gray-700">
                  Quốc tịch *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 placeholder-gray-400"
                  value={passenger.nationality}
                  onChange={(e) =>
                    updatePassenger(index, "nationality", e.target.value)
                  }
                  placeholder="Nhập quốc tịch"
                  required
                />
              </div>

              {/* Phone (only for contact person) */}
              {isContactPerson(index) && (
                <div className="lg:col-span-2">
                  <label className="block font-semibold mb-1 text-gray-700">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 placeholder-gray-400"
                    value={passenger.phoneNumber || ""}
                    onChange={(e) =>
                      updatePassenger(index, "phoneNumber", e.target.value)
                    }
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>
              )}

              {/* Email (only for contact person) */}
              {isContactPerson(index) && (
                <div className="lg:col-span-2">
                  <label className="block font-semibold mb-1 text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 placeholder-gray-400"
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
        ))}
      </div>
    </div>
  );
}
