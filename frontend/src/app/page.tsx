"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getRoleHomePath } from "@/utils/role.util";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace(getRoleHomePath(user.role));
    } else {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // Show spinner while auth resolves
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}