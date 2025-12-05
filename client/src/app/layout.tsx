"use client";

import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import PageTransition from "@/components/Loading/PageTransition";
import { Toaster } from "sonner";
import { RouteGuard } from "@/components/Auth";
import Chatbot from "@/components/Chatbot";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins"
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <PageTransition />
      {children}
      <Chatbot />
    </RouteGuard>
  );
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <head>
        <title>LuTrip - Khám phá Việt Nam</title>
        <meta
          name="description"
          content="Đặt tour du lịch, vé máy bay, khách sạn và vé giải trí tại Việt Nam"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://lutrip.vercel.app/" />
        <meta property="og:title" content="LuTrip - Khám phá Việt Nam" />
        <meta
          property="og:description"
          content="Đặt tour du lịch, vé máy bay, khách sạn và vé giải trí tại Việt Nam. Khám phá những địa điểm tuyệt đẹp từ Bắc vào Nam."
        />
        <meta
          property="og:image"
          content="https://res.cloudinary.com/de5rurcwt/image/upload/v1761762361/6_bdb1li.jpg"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="LuTrip - Khám phá Việt Nam" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://lutrip.vercel.app/" />
        <meta property="twitter:title" content="LuTrip - Khám phá Việt Nam" />
        <meta
          property="twitter:description"
          content="Đặt tour du lịch, vé máy bay, khách sạn và vé giải trí tại Việt Nam"
        />
        <meta
          property="twitter:image"
          content="https://res.cloudinary.com/de5rurcwt/image/upload/v1761762361/6_bdb1li.jpg"
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${poppins.variable} font-sans`}
      >
        <LoadingProvider>
          <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
          </AuthProvider>
        </LoadingProvider>
        <Toaster position="top-right" richColors closeButton duration={3000} />
      </body>
    </html>
  );
}
