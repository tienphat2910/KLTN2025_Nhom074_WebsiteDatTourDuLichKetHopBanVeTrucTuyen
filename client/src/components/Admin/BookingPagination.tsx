import { Button } from "@/components/ui/button";

interface BookingPaginationProps {
  currentPage: number;
  totalPages: number;
  totalBookings: number;
  onPageChange: (page: number) => void;
}

export function BookingPagination({
  currentPage,
  totalPages,
  totalBookings,
  onPageChange
}: BookingPaginationProps) {
  if (totalBookings === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <div className="text-sm text-gray-600">
        Hiển thị {(currentPage - 1) * 10 + 1} -{" "}
        {Math.min(currentPage * 10, totalBookings)} trong tổng số{" "}
        {totalBookings} booking
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Trước
        </Button>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page and 2 pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page}>...</span>;
              }
              return null;
            })}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}
