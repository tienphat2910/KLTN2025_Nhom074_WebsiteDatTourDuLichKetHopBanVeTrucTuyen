"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/Loading";
import { usePageLoading } from "@/hooks/usePageLoading";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoading, progress } = usePageLoading();

  return (
    <>
      <PageLoader
        isLoading={isLoading}
        type="fullscreen"
        progress={progress}
        showProgress={true}
        message="Chào mừng bạn đến với LuTrip"
      />
      {children}
    </>
  );
}

export default function ClientLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}
