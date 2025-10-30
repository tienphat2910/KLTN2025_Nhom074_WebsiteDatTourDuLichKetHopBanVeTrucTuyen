"use client";

import { ActivityParticipant } from "../Common/validation";

interface ActivityParticipantFormProps {
  participants: ActivityParticipant[];
  updateParticipant: (
    index: number,
    field: keyof ActivityParticipant,
    value: string
  ) => void;
}

export default function ActivityParticipantForm({
  participants,
  updateParticipant
}: ActivityParticipantFormProps) {
  const getParticipantTypeLabel = (
    type: "adult" | "child" | "baby" | "senior"
  ) => {
    switch (type) {
      case "adult":
        return "Người lớn";
      case "child":
        return "Trẻ em";
      case "baby":
        return "Em bé";
      case "senior":
        return "Người cao tuổi";
      default:
        return "";
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        Thông tin người tham gia
      </h2>

      {participants.map((participant, index) => (
        <div
          key={index}
          className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          <h3 className="font-medium text-gray-700 mb-3">
            {getParticipantTypeLabel(participant.type)} #{index + 1}
            {index === 0 && " (Người liên hệ)"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                value={participant.fullName}
                onChange={(e) =>
                  updateParticipant(index, "fullName", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                placeholder="Nhập họ và tên"
              />
            </div>

            {index === 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    value={participant.phone || ""}
                    onChange={(e) =>
                      updateParticipant(index, "phone", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={participant.email || ""}
                    onChange={(e) =>
                      updateParticipant(index, "email", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                    placeholder="Nhập email"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giới tính *
              </label>
              <select
                value={participant.gender}
                onChange={(e) =>
                  updateParticipant(index, "gender", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày sinh *
              </label>
              <input
                type="date"
                value={participant.dateOfBirth}
                onChange={(e) =>
                  updateParticipant(index, "dateOfBirth", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CCCD/CMND
              </label>
              <input
                type="text"
                value={participant.cccd || ""}
                onChange={(e) =>
                  updateParticipant(index, "cccd", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nhập số CCCD/CMND (tùy chọn)"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
