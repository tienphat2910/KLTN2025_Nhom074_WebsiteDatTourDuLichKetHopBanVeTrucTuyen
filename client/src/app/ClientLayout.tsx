"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { Toaster } from "sonner";
import { RouteGuard } from "@/components/Auth";
import Chatbot from "@/components/Chatbot";
import PageTransition from "@/components/Loading/PageTransition";

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <PageTransition />
      {children}
      <Chatbot />
    </RouteGuard>
  );
}

export default function ClientLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <LoadingProvider>
      <AuthProvider>
        <LayoutContent>{children}</LayoutContent>
        <Toaster position="top-right" richColors closeButton duration={3000} />
      </AuthProvider>
    </LoadingProvider>
  );
}
