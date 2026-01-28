"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { WardSidebar } from "@/components/layouts/ward-sidebar";

export default function WardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, isInitialized, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/login");
    } else if (isInitialized && user && user.role !== "ward_admin" && user.role !== "super_admin") {
      router.push("/voter");
    }
  }, [isInitialized, isAuthenticated, user, router]);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "ward_admin" && user?.role !== "super_admin")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WardSidebar />
      <main className="md:ml-64 p-6 pt-16 md:pt-6">{children}</main>
    </div>
  );
}
