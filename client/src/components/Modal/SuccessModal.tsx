"use client";

import { useEffect } from "react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  autoClose = true,
  autoCloseDelay = 2000
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";

      if (autoClose) {
        const timer = setTimeout(() => {
          onClose();
        }, autoCloseDelay);

        return () => {
          clearTimeout(timer);
          document.body.style.overflow = "unset";
        };
      }
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-6">
        {/* Backdrop - Very light gray overlay */}
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-40 transition-opacity cursor-pointer"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all w-full max-w-xs sm:max-w-md mx-4 animate-modal-fade-in">
          <div className="bg-white px-6 py-6 sm:p-6">
            <div className="flex flex-col items-center text-center space-y-4 sm:flex-row sm:items-start sm:text-left sm:space-y-0">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:h-10 sm:w-10">
                <svg
                  className="h-8 w-8 text-green-600 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
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

            {!autoClose && (
              <div className="mt-6 sm:mt-4">
                <button
                  type="button"
                  className="w-full justify-center rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-500 transition-colors cursor-pointer sm:py-2.5 sm:text-sm"
                  onClick={onClose}
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
