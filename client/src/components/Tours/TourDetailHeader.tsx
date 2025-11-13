import Link from "next/link";

interface TourDetailHeaderProps {
  title: string;
}

export default function TourDetailHeader({ title }: TourDetailHeaderProps) {
  return (
    <>
      {/* Breadcrumb */}
      <div className="pt-24 pb-2 md:pb-4">
        <div className="container mx-auto px-4">
          <nav className="text-xs md:text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-blue-600">
              Trang chủ
            </Link>
            <span className="mx-2">›</span>
            <Link href="/destinations" className="hover:text-blue-600">
              VIỆT NAM
            </Link>
            <span className="mx-2">›</span>
            <Link href="/tours" className="hover:text-blue-600">
              Tours
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-800 font-medium">
              {title || "Loading..."}
            </span>
          </nav>
        </div>
      </div>
    </>
  );
}
