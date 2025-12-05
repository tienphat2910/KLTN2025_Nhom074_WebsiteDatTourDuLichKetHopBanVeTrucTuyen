import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins"
});

export const metadata: Metadata = {
  title: "LuTrip - Khám phá Việt Nam",
  description:
    "Đặt tour du lịch, vé máy bay, khách sạn và vé giải trí tại Việt Nam. Khám phá những địa điểm tuyệt đẹp từ Bắc vào Nam.",
  openGraph: {
    type: "website",
    url: "https://lutrip.id.vn/",
    title: "LuTrip - Khám phá Việt Nam",
    description:
      "Đặt tour du lịch, vé máy bay, khách sạn và vé giải trí tại Việt Nam. Khám phá những địa điểm tuyệt đẹp từ Bắc vào Nam.",
    images: [
      {
        url: "https://res.cloudinary.com/de5rurcwt/image/upload/v1761762361/6_bdb1li.jpg",
        width: 1200,
        height: 630,
        alt: "LuTrip - Khám phá Việt Nam"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "LuTrip - Khám phá Việt Nam",
    description:
      "Đặt tour du lịch, vé máy bay, khách sạn và vé giải trí tại Việt Nam",
    images: [
      "https://res.cloudinary.com/de5rurcwt/image/upload/v1761762361/6_bdb1li.jpg"
    ]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${poppins.variable} font-sans`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
