"use client";

interface SpecialRequestProps {
  note: string;
  setNote: (note: string) => void;
  placeholder?: string;
}

export default function SpecialRequest({
  note,
  setNote,
  placeholder = "Nhập yêu cầu đặc biệt của bạn..."
}: SpecialRequestProps) {
  return (
    <div className="mb-6">
      <label className="block font-semibold mb-2 text-gray-700">
        Yêu cầu đặc biệt (không bắt buộc)
      </label>
      <textarea
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
