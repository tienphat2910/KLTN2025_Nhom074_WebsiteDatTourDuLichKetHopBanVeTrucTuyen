"use client";

import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import PageTransition from "@/components/Loading/PageTransition";
import { Toaster } from "sonner";
import { RouteGuard } from "@/components/Auth";

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
