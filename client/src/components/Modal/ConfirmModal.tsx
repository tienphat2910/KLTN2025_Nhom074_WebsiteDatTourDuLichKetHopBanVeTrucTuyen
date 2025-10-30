"use client";

import { useEffect } from "react";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "warning" | "danger" | "info";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "warning"
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: AlertCircle,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          confirmBtn: "bg-red-600 hover:bg-red-700"
        };
      case "info":
        return {
          icon: Info,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          confirmBtn: "bg-blue-600 hover:bg-blue-700"
        };
      default:
        return {
          icon: AlertTriangle,
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          confirmBtn: "bg-yellow-600 hover:bg-yellow-700"
        };
    }
  };

  const styles = getTypeStyles();
  const IconComponent = styles.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-6">
        {/* Backdrop - Very light gray overlay */}
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-40 transition-opacity cursor-pointer"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all w-full max-w-xs sm:max-w-lg mx-4 animate-modal-fade-in">
          <div className="bg-white px-6 py-6 sm:p-6 sm:pb-4">
            <div className="flex flex-col items-center text-center space-y-4 sm:flex-row sm:items-start sm:text-left sm:space-y-0">
              <div
                className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg} sm:h-10 sm:w-10`}
              >
                <IconComponent className={`h-6 w-6 ${styles.iconColor}`} />
              </div>
              <div className="sm:ml-4">
                <h3 className="text-xl font-semibold leading-6 text-gray-900 sm:text-base">
                  {title}
                </h3>
                <div className="mt-3 sm:mt-2">
                  <p className="text-base text-gray-600 sm:text-sm">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex flex-col space-y-3 sm:flex-row-reverse sm:space-y-0 sm:space-x-reverse sm:space-x-3 sm:px-6 sm:py-3">
            <button
              type="button"
              className={`w-full justify-center rounded-lg px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors cursor-pointer sm:py-2.5 sm:text-sm ${styles.confirmBtn}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="w-full justify-center rounded-lg bg-white px-4 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors cursor-pointer sm:py-2.5 sm:text-sm"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
