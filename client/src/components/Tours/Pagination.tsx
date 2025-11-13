"use client";

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-12">
      <div className="flex space-x-2">
        {currentPage > 1 && (
          <button
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
            aria-label="Previous page"
          >
            ←
          </button>
        )}

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (page) =>
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
          )
          .map((page, i, arr) => (
            <React.Fragment key={page}>
              {i > 0 && arr[i - 1] !== page - 1 && (
                <span className="px-3 py-2">...</span>
              )}
              <button
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 rounded-lg transition-all ${
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:shadow-md"
                }`}
              >
                {page}
              </button>
            </React.Fragment>
          ))}

        {currentPage < totalPages && (
          <button
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
            aria-label="Next page"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;
