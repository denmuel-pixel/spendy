"use client";

import { useAuth } from "@/hooks/useAuth";
import DashboardPage from "@/components/dashboard/dashboard-page";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-emerald-600 text-lg">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Middleware will redirect
  }

  return <DashboardPage user={user} />;
}
